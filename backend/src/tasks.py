"""
Celery task definitions for asynchronous document analysis processing.

Defines a Celery task that handles document extraction and AI analysis
in a background worker when Redis is available. Includes a synchronous
fallback function for environments where Redis/Celery is unavailable.
"""

import os
import base64
import logging

from celery import Celery

logger = logging.getLogger(__name__)

# Redis connection URL for Celery broker and result backend
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Real Celery app — used when Redis is available
celery_app = Celery(
    "document_analysis",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.task_track_started = True


@celery_app.task(name="analyze_document")
def analyze_document_task(file_bytes_b64: str, file_type: str, file_name: str) -> dict:
    """
    Celery task: extract text and run AI analysis on a document.

    Accepts base64 string because Celery serializes payloads to JSON.
    Decodes the base64 string back to bytes, extracts text using the
    appropriate extractor based on file type, and runs all three AI
    analysis functions (summary, entities, sentiment).

    Args:
        file_bytes_b64: Base64-encoded string of the file bytes.
        file_type: Type of document ('pdf', 'docx', or 'image').
        file_name: Original filename for the response.

    Returns:
        Dictionary containing the full analysis response with status,
        fileName, summary, entities, and sentiment.
    """
    from src.extractor import extract_pdf, extract_docx, extract_image
    from src.ai_engine import generate_summary, extract_entities, analyze_sentiment

    logger.info("Celery task started for file: %s (type: %s)", file_name, file_type)

    file_bytes = base64.b64decode(file_bytes_b64)

    if file_type == "pdf":
        text = extract_pdf(file_bytes)
    elif file_type == "docx":
        text = extract_docx(file_bytes)
    else:
        text = extract_image(file_bytes)

    logger.info("Text extracted: %d characters from %s", len(text), file_name)

    summary = generate_summary(text)
    entities = extract_entities(text)
    sentiment = analyze_sentiment(text)

    logger.info("Celery task completed for file: %s", file_name)

    return {
        "status": "success",
        "fileName": file_name,
        "summary": summary,
        "entities": entities,
        "sentiment": sentiment
    }


def run_analysis_sync(file_bytes: bytes, file_type: str, file_name: str) -> dict:
    """
    Synchronous fallback used when Redis/Celery is unavailable.

    Called directly from the API route without a task queue. Performs
    the same extraction and AI analysis as the Celery task but runs
    in the request thread. This ensures the API remains functional
    even without a Redis instance.

    Args:
        file_bytes: Raw bytes of the uploaded file.
        file_type: Type of document ('pdf', 'docx', or 'image').
        file_name: Original filename for the response.

    Returns:
        Dictionary containing the full analysis response with status,
        fileName, summary, entities, and sentiment.
    """
    from src.extractor import extract_pdf, extract_docx, extract_image
    from src.ai_engine import generate_summary, extract_entities, analyze_sentiment

    logger.info("Sync fallback processing file: %s (type: %s)", file_name, file_type)

    if file_type == "pdf":
        text = extract_pdf(file_bytes)
    elif file_type == "docx":
        text = extract_docx(file_bytes)
    else:
        text = extract_image(file_bytes)

    logger.info("Text extracted: %d characters from %s", len(text), file_name)

    summary = generate_summary(text)
    entities = extract_entities(text)
    sentiment = analyze_sentiment(text)

    logger.info("Sync analysis completed for file: %s", file_name)

    return {
        "status": "success",
        "fileName": file_name,
        "summary": summary,
        "entities": entities,
        "sentiment": sentiment
    }
