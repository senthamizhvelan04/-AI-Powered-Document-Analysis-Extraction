"""
AI analysis engine powered by Google Gemini.

Provides three core analysis functions:
- generate_summary: Creates a concise 2-4 sentence document summary
- extract_entities: Extracts named entities across 5 categories
- analyze_sentiment: Classifies document sentiment as Positive/Neutral/Negative

All analysis is performed dynamically per request - no hardcoded responses.
Includes automatic retry with exponential backoff and model fallback.
"""

import os
import json
import re
import time
import logging

import google.generativeai as genai

logger = logging.getLogger(__name__)

# Configure Gemini SDK at module level
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Models to try in order - uses first one that works
MODELS_TO_TRY = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]


def _call_gemini_with_retry(prompt: str, max_retries: int = 3) -> str:
    """
    Call Gemini API with automatic retry across multiple models.
    On 429 rate limit, waits with exponential backoff before retrying.
    On 404 unavailable model, moves to next model immediately.

    Args:
        prompt: The prompt string to send to Gemini.
        max_retries: Number of retries per model before moving to next.

    Returns:
        The response text string from Gemini.

    Raises:
        Exception if all models and retries are exhausted.
    """
    last_error = None

    for model_name in MODELS_TO_TRY:
        model = genai.GenerativeModel(model_name)
        for attempt in range(max_retries):
            try:
                logger.info("Trying model: %s (attempt %d)", model_name, attempt + 1)
                response = model.generate_content(prompt)
                logger.info("Success with model: %s", model_name)
                return response.text.strip()
            except Exception as exc:
                last_error = exc
                error_msg = str(exc).lower()

                if "429" in error_msg or "resource_exhausted" in error_msg or "too many requests" in error_msg:
                    wait_time = (2 ** attempt) * 2  # 2s, 4s, 8s
                    logger.warning(
                        "Rate limit on %s (attempt %d/%d). Waiting %ds...",
                        model_name, attempt + 1, max_retries, wait_time
                    )
                    time.sleep(wait_time)
                    continue
                elif "404" in error_msg or "not found" in error_msg:
                    logger.warning("Model %s not available, trying next.", model_name)
                    break
                else:
                    logger.error("Unexpected error on %s: %s", model_name, str(exc))
                    break

    raise Exception(f"All Gemini models exhausted. Last error: {last_error}")


def generate_summary(text: str) -> str:
    """
    Generate a concise 2-4 sentence summary of the document text using Gemini.

    Args:
        text: The extracted document text to summarize.

    Returns:
        A 2-4 sentence summary string, or fallback message if generation fails.
    """
    if not text or not text.strip():
        logger.warning("Empty text provided for summary generation.")
        return "Summary could not be generated due to empty document content."

    prompt = f"""You are an expert document analyst. Read the following document text carefully
and write a concise, accurate summary in 2 to 4 sentences.

Your summary must:
- Identify the main topic or purpose of the document
- Highlight the most important findings, facts, or conclusions
- Be specific to this document - avoid generic phrases like "this document discusses"
- Be written in clear, professional English

Do NOT include any preamble. Return only the summary text.

Document text:
{text}"""

    try:
        summary = _call_gemini_with_retry(prompt)
        logger.info("Summary generated successfully: %d characters", len(summary))
        return summary
    except Exception as exc:
        logger.error("Summary generation failed: %s", str(exc), exc_info=True)
        return "Summary could not be generated."


def extract_entities(text: str) -> dict:
    """
    Extract named entities from document text using Gemini.

    Extracts entities across five categories:
    names, dates, organizations, locations, amounts.

    Args:
        text: The extracted document text to analyze.

    Returns:
        Dictionary with five entity category keys, each a list of strings.
        Returns all empty lists if extraction fails.
    """
    default_entities = {
        "names": [], "dates": [], "organizations": [],
        "locations": [], "amounts": []
    }

    if not text or not text.strip():
        logger.warning("Empty text provided for entity extraction.")
        return default_entities

    prompt = f"""You are a named entity recognition (NER) expert. Extract all named entities
from the following document text.

Return ONLY a raw JSON object (no markdown, no code blocks, no explanation)
with these exact keys:
- "names": list of all person/individual names found
- "dates": list of all dates, years, time references found
- "organizations": list of all company, institution, agency, brand names found
- "locations": list of all cities, countries, regions, addresses found
- "amounts": list of all monetary values with their currency symbols found

If no entities are found for a category, return an empty list [].
Return ONLY the JSON object. Example:
{{"names": ["John Smith"], "dates": ["March 2026"], "organizations": ["Google"], "locations": ["New York"], "amounts": ["$10,000"]}}

Document text:
{text}"""

    raw_response = ""
    try:
        raw_response = _call_gemini_with_retry(prompt)
        cleaned = re.sub(r"^```(?:json)?\s*\n?", "", raw_response)
        cleaned = re.sub(r"\n?```\s*$", "", cleaned)
        cleaned = cleaned.strip()

        entities = json.loads(cleaned)

        for key in default_entities:
            if key not in entities or not isinstance(entities[key], list):
                entities[key] = []

        logger.info(
            "Entities: %d names, %d dates, %d orgs, %d locations, %d amounts",
            len(entities["names"]), len(entities["dates"]),
            len(entities["organizations"]), len(entities["locations"]),
            len(entities["amounts"])
        )
        return entities

    except json.JSONDecodeError as exc:
        logger.error("JSON parse failed: %s | Raw: %s", str(exc), raw_response[:300])
        return default_entities
    except Exception as exc:
        logger.error("Entity extraction failed: %s", str(exc), exc_info=True)
        return default_entities


def analyze_sentiment(text: str) -> str:
    """
    Classify the overall sentiment of the document text using Gemini.

    Args:
        text: The extracted document text to analyze.

    Returns:
        Exactly one of: "Positive", "Neutral", or "Negative".
        Defaults to "Neutral" if classification fails.
    """
    if not text or not text.strip():
        logger.warning("Empty text provided for sentiment analysis.")
        return "Neutral"

    prompt = f"""Analyze the overall sentiment of the following document text.
Classify as exactly ONE word: Positive, Neutral, or Negative.

- Positive: optimistic, favorable, growth-focused, uplifting tone
- Negative: alarming, critical, concerning, crisis-related tone
- Neutral: informational, factual, balanced, report-style tone

Reply with ONLY one word. No explanation, no punctuation.

Document text:
{text}"""

    try:
        sentiment = _call_gemini_with_retry(prompt).strip().capitalize()
        if sentiment not in ["Positive", "Neutral", "Negative"]:
            logger.warning("Invalid sentiment '%s', defaulting to Neutral", sentiment)
            return "Neutral"
        logger.info("Sentiment: %s", sentiment)
        return sentiment
    except Exception as exc:
        logger.error("Sentiment analysis failed: %s", str(exc), exc_info=True)
        return "Neutral"
