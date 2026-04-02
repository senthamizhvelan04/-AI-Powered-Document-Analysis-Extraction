"""
Pydantic v2 request and response models for the Document Analysis API.

Defines the data contracts for incoming document analysis requests
and outgoing structured responses including entities and sentiment.
"""

from typing import List, Literal
from pydantic import BaseModel


class DocumentRequest(BaseModel):
    """
    Incoming request model for document analysis.

    Attributes:
        fileName: Original name of the uploaded file.
        fileType: Type of document - must be 'pdf', 'docx', or 'image'.
        fileBase64: Base64-encoded string of the file contents.
    """
    fileName: str
    fileType: Literal["pdf", "docx", "image"]
    fileBase64: str


class EntitiesResponse(BaseModel):
    """
    Structured named entity extraction results.

    Contains five categories of entities extracted from the document.
    All arrays default to empty lists if no entities are found.
    """
    names: List[str] = []
    dates: List[str] = []
    organizations: List[str] = []
    locations: List[str] = []
    amounts: List[str] = []


class DocumentResponse(BaseModel):
    """
    Successful document analysis response.

    Returned when the document has been successfully processed,
    containing the AI-generated summary, extracted entities,
    and sentiment classification.
    """
    status: str = "success"
    fileName: str
    summary: str
    entities: EntitiesResponse
    sentiment: str


class ErrorResponse(BaseModel):
    """
    Error response model for failed requests.

    Returned when the request fails due to validation errors,
    authentication failures, or internal processing errors.
    """
    status: str = "error"
    message: str
