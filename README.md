# AI-Powered Document Analysis & Extraction API

Intelligent document processing system that extracts, analyses, and summarises content from PDF, DOCX, and image files. Uses Tesseract OCR for image text extraction and Google Gemini 1.5 Flash for AI-powered summarisation, named entity extraction, and sentiment analysis.

## Tech Stack

| Component | Technology |
|---|---|
| **Framework** | FastAPI (Python 3.11) |
| **AI Model** | Google Gemini 1.5 Flash (`google-generativeai` SDK) |
| **OCR** | Tesseract OCR via `pytesseract` + Pillow image preprocessing |
| **PDF Extraction** | PyMuPDF (`fitz`) with layout-preserving block extraction |
| **DOCX Extraction** | `python-docx` |
| **Async Processing** | Celery 5.x + Redis (with synchronous fallback) |
| **Frontend** | React 18 + Vite 5 + Tailwind CSS v3 |
| **Deployment** | Render (backend, Docker) + Vercel (frontend) |

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- Tesseract OCR installed on your system

### 1. Clone the Repository

```bash
git clone <repo-url>
cd document-analysis-api
```

### 2. Install Tesseract OCR

- **Linux:** `sudo apt-get install tesseract-ocr tesseract-ocr-eng`
- **Mac:** `brew install tesseract`
- **Windows:** Download from https://github.com/UB-Mannheim/tesseract/wiki

### 3. Set Up Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API_KEY and GEMINI_API_KEY
uvicorn src.main:app --reload --port 8000
```

### 4. Set Up Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000
npm run dev
```

## Architecture Overview

```
┌──────────┐     ┌──────────────┐     ┌─────────────────────────┐
│          │     │              │     │       Backend API        │
│  Client  │────▶│   Frontend   │────▶│    (FastAPI + Uvicorn)   │
│ (Browser)│     │ (React+Vite) │     │                         │
└──────────┘     └──────────────┘     └────────┬────────────────┘
                                               │
                              ┌────────────────┼────────────────┐
                              ▼                ▼                ▼
                      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                      │  PDF Extract │ │ DOCX Extract │ │ Image OCR    │
                      │  (PyMuPDF)   │ │ (python-docx)│ │ (Tesseract)  │
                      └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
                             └────────────────┼────────────────┘
                                              ▼
                                    ┌──────────────────┐
                                    │   AI Engine      │
                                    │ (Google Gemini    │
                                    │  1.5 Flash)      │
                                    └────────┬─────────┘
                                             ▼
                                    ┌──────────────────┐
                                    │  JSON Response   │
                                    │  (Summary +      │
                                    │   Entities +     │
                                    │   Sentiment)     │
                                    └──────────────────┘
```

## API Usage

### Endpoint

```
POST /api/document-analyze
```

### Headers

```
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

### Request Body

```json
{
  "fileName": "sample1.pdf",
  "fileType": "pdf",
  "fileBase64": "<base64_encoded_string>"
}
```

### Success Response (HTTP 200)

```json
{
  "status": "success",
  "fileName": "sample1.pdf",
  "summary": "AI-generated 2-4 sentence summary.",
  "entities": {
    "names": ["Person Name"],
    "dates": ["10 March 2026"],
    "organizations": ["Company A"],
    "locations": ["New York"],
    "amounts": ["$10,000"]
  },
  "sentiment": "Positive"
}
```

### cURL Example

```bash
curl -X POST https://your-domain.com/api/document-analyze \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_track2_987654321" \
  -d '{
    "fileName": "sample1.pdf",
    "fileType": "pdf",
    "fileBase64": "JVBERi0xLjQK..."
  }'
```

## Approach

### Text Extraction Strategy

- **PDF:** PyMuPDF extracts text block-by-block, sorted by vertical position to preserve the original reading order across multi-column layouts
- **DOCX:** python-docx reads all paragraphs and iterates table rows/cells to capture complete document content
- **Images:** Pillow converts to grayscale, enhances contrast (2×), sharpens edges, then pytesseract extracts text using PSM 6 (uniform block of text)

### AI Analysis Strategy

All AI analysis is performed dynamically per request using Google Gemini 1.5 Flash:

- **Summary:** Prompted to produce a specific 2–4 sentence summary focusing on main topic, key findings, and conclusions — never generic filler
- **Entity Extraction:** Prompted to return structured JSON with 5 entity categories: names, dates, organizations, locations, amounts
- **Sentiment Analysis:** Prompted with precise Positive/Neutral/Negative definitions to ensure correct classification of tone vs topic

## AI Tools Used

- **Google Gemini 1.5 Flash** — document summarisation, named entity extraction, sentiment analysis (all inference done at request time, no hardcoded outputs)
- **Google Antigravity** — AI-assisted development IDE used to scaffold and build this project

## Known Limitations

- Free-tier Render deployment may cold-start (first request ~30s delay)
- Very large files (>10MB) may timeout on free tier infrastructure
- Handwritten text in images has lower OCR accuracy than printed text
- Scanned PDFs without embedded text layer require image-based OCR fallback
- Google Cloud Vision API is available as an alternative OCR engine by setting `GOOGLE_CLOUD_VISION=true` in environment variables

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `API_KEY` | Secret key for x-api-key header authentication | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `REDIS_URL` | Redis connection string for Celery | No (has fallback) |
| `GOOGLE_CLOUD_VISION` | Use GCV instead of Tesseract (`true`/`false`) | No |
