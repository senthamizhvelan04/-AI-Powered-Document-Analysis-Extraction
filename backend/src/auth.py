"""
API key authentication module for the Document Analysis API.

Provides a FastAPI dependency that validates the x-api-key header
against the API_KEY environment variable. Used to secure the
document analysis endpoint from unauthorized access.
"""

import os
import logging

from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)


def validate_api_key(request: Request) -> str:
    """
    FastAPI dependency that validates the x-api-key request header.

    Extracts the x-api-key header directly from the request object
    to avoid FastAPI's automatic 422 validation when the header is
    missing. Compares against the API_KEY environment variable.

    Args:
        request: The incoming FastAPI Request object.

    Returns:
        The validated API key string.

    Raises:
        HTTPException: 401 if the API key is missing or does not match.
    """
    x_api_key = request.headers.get("x-api-key")
    expected_key = os.getenv("API_KEY")

    if not expected_key:
        logger.error("API_KEY environment variable is not set on the server.")
        raise HTTPException(
            status_code=401,
            detail={"status": "error", "message": "Unauthorized"}
        )

    if not x_api_key or x_api_key != expected_key:
        logger.warning("Unauthorized access attempt with missing or invalid API key.")
        raise HTTPException(
            status_code=401,
            detail={"status": "error", "message": "Unauthorized"}
        )

    return x_api_key
