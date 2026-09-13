# CaseVault AI — Document Intelligence Service (FastAPI)

Real document processing for the CaseVault AI prototype. No fake results: the
service parses the actual uploaded file, extracts text (with Tesseract OCR for
scanned pages), runs spaCy NER, classifies the document from its content, and
builds a deterministic extractive summary.

## What performs what

| Task | Performed by |
|---|---|
| PDF text (text layer) | `pdfminer.six`, page-wise via PyMuPDF |
| Scanned/image pages & images | **Tesseract OCR** (`pytesseract`, pages rasterised at 200 dpi) |
| Person / Location / Date / Org entities | **spaCy** `en_core_web_sm` NER |
| FIR numbers, Police Stations, Sections/Acts, Dates | Regex rules over the real text |
| Document classification | Keyword scoring from the actual content |
| Summary | Deterministic extractive ranking (no LLM) |

## Run locally

```bash
# 1. System dependency for OCR (once)
sudo apt-get install -y tesseract-ocr        # Debian/Ubuntu
# brew install tesseract                      # macOS

# 2. Python env
cd ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# 3. Start
uvicorn app.main:app --port 8000
# health check: curl http://localhost:8000/health
```

The Node backend expects the service at `AI_SERVICE_URL` (default
`http://localhost:8000`). See `src/server/ai-processing.ts`.
