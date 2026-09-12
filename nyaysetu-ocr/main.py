import logging
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from app.metadata_extractor import extract_metadata
from app.ocr_engine import extract_text, is_tesseract_available
from app.schemas import OCRResponse, HealthResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nyaya_setu_ocr")

app = FastAPI(
    title="Nyaya Setu OCR Service",
    description="OCR and metadata extraction microservice for FIRs and other case documents.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPPORTED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
}

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

@app.get("/")
def home():
    return {"message": "Nyaya Setu OCR Service is running"}

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        tesseract_available=is_tesseract_available(),
    )

@app.post("/ocr/extract", response_model=OCRResponse)
async def extract_document(file: UploadFile = File(...)):
    if file.content_type not in SUPPORTED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Supported types: {', '.join(sorted(SUPPORTED_CONTENT_TYPES))}",
        )

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="File exceeds 20MB limit.",
        )

    if not is_tesseract_available():
        raise HTTPException(
            status_code=503,
            detail="Tesseract OCR engine is not available on this server.",
        )

    try:
        page_texts = extract_text(
            file_bytes,
            file.content_type,
        )
    except Exception as exc:
        logger.exception("OCR extraction failed")
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed: {exc}",
        )

    full_text = "\n\n".join(page_texts)

    (
        fields,
        confidence,
        overall_confidence,
        needs_review,
        review_reasons,
    ) = extract_metadata(full_text)

    return OCRResponse(
        raw_text=full_text,
        extracted_fields=fields,
        field_confidence=confidence,
        overall_confidence=overall_confidence,
        needs_review=needs_review,
        review_reasons=review_reasons,
        page_count=len(page_texts),
    )