"""
FastAPI application entry point for the Document Analysis API.

Configures the application with CORS middleware, startup validation,
health check endpoint, and the main document analysis route. Uses
Celery for async processing with a synchronous fallback when Redis
is unavailable.
"""

import os
import base64
import logging

from dotenv import load_dotenv

# Load environment variables from .env file before any other imports
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from src.auth import validate_api_key
from src.models import DocumentRequest, DocumentResponse, EntitiesResponse, ErrorResponse
from src.tasks import analyze_document_task, run_analysis_sync

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Document Analysis API",
    version="1.0.0",
    description="AI-powered document analysis and extraction API using Google Gemini"
)

# Add CORS middleware — allow all origins, methods, and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_validation():
    """
    Validate required environment variables on application startup.

    Checks that API_KEY and GEMINI_API_KEY are set in the environment.
    Logs a warning if either is missing — does not raise to allow
    health checks to work even with partial configuration.
    """
    api_key = os.getenv("API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        logger.warning(
            "API_KEY environment variable is not set. "
            "Authentication will reject all requests."
        )

    if not gemini_key:
        logger.warning(
            "GEMINI_API_KEY environment variable is not set. "
            "AI analysis will fail."
        )

    logger.info("Document Analysis API v1.0.0 starting up...")
    logger.info("API_KEY configured: %s", "Yes" if api_key else "No")
    logger.info("GEMINI_API_KEY configured: %s", "Yes" if gemini_key else "No")
    logger.info("REDIS_URL: %s", os.getenv("REDIS_URL", "not set (sync mode)"))


@app.get("/health")
async def health_check():
    """
    Health check endpoint used by deployment platforms and evaluators
    to confirm the API is live and responding.

    Returns:
        JSON with status 'ok' and the current API version.
    """
    return {"status": "ok", "version": "1.0.0"}


@app.post("/api/document-analyze", response_model=DocumentResponse)
async def analyze_document(
    request: DocumentRequest,
    api_key: str = Depends(validate_api_key)
):
    """
    Main document analysis endpoint.

    Accepts a base64-encoded document file, extracts text based on file type,
    and runs AI analysis (summary, entity extraction, sentiment) using
    Google Gemini. Attempts async processing via Celery first, falling
    back to synchronous processing if Redis is unavailable.

    Args:
        request: DocumentRequest containing fileName, fileType, and fileBase64.
        api_key: Validated API key from the x-api-key header.

    Returns:
        DocumentResponse with summary, entities, and sentiment analysis.

    Raises:
        HTTPException: 400 for invalid base64 or unsupported file type.
        HTTPException: 500 for internal processing errors.
    """
    logger.info(
        "Document analysis request received: file=%s, type=%s",
        request.fileName, request.fileType
    )

    # Decode the base64 file content
    try:
        file_bytes = base64.b64decode(request.fileBase64)
        logger.info("Base64 decoded successfully: %d bytes", len(file_bytes))
    except Exception as exc:
        logger.error("Base64 decoding failed: %s", str(exc))
        raise HTTPException(
            status_code=400,
            detail={"status": "error", "message": "Invalid base64 encoding"}
        )

    # Validate file type
    valid_types = ["pdf", "docx", "image"]
    if request.fileType not in valid_types:
        logger.error("Unsupported file type: %s", request.fileType)
        raise HTTPException(
            status_code=400,
            detail={
                "status": "error",
                "message": "Unsupported file type. Use: pdf, docx, image"
            }
        )

    try:
        # Attempt Celery async processing first
        try:
            logger.info("Attempting Celery task submission...")
            file_bytes_b64 = base64.b64encode(file_bytes).decode("utf-8")
            task = analyze_document_task.delay(
                file_bytes_b64, request.fileType, request.fileName
            )
            result = task.get(timeout=120)
            logger.info("Celery task completed successfully for: %s", request.fileName)
        except Exception as celery_exc:
            # Fallback to synchronous processing
            logger.warning(
                "Celery unavailable (%s), using sync fallback for: %s",
                str(celery_exc)[:100], request.fileName
            )
            result = run_analysis_sync(
                file_bytes, request.fileType, request.fileName
            )

        # Build the response from the result dictionary
        entities = EntitiesResponse(
            names=result.get("entities", {}).get("names", []),
            dates=result.get("entities", {}).get("dates", []),
            organizations=result.get("entities", {}).get("organizations", []),
            locations=result.get("entities", {}).get("locations", []),
            amounts=result.get("entities", {}).get("amounts", [])
        )

        response = DocumentResponse(
            status="success",
            fileName=result.get("fileName", request.fileName),
            summary=result.get("summary", ""),
            entities=entities,
            sentiment=result.get("sentiment", "Neutral")
        )

        logger.info("Analysis complete for %s: sentiment=%s", request.fileName, response.sentiment)
        return response

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(
            "Unhandled error during document analysis: %s",
            str(exc), exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": f"Internal server error: {str(exc)}"
            }
        )
