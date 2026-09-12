"""
OCR Engine
----------
Wraps Tesseract OCR with lightweight preprocessing for scanned government
documents such as FIRs, charge sheets, and photographed forms.
Supports single images and multi-page PDFs.
"""
import io
import logging
from typing import List
import numpy as np
import pytesseract
from PIL import Image, ImageOps, ImageFilter

logger = logging.getLogger("ocr_engine")

TESSERACT_CONFIGS = [
    "--oem 3 --psm 6",
    "--oem 3 --psm 4",
    "--oem 3 --psm 11",
]

def is_tesseract_available() -> bool:
    try:
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False

def _prepare_variants(image: Image.Image) -> List[Image.Image]:
    image = image.convert("RGB")
    width, height = image.size
    if width < 1600:
        scale = 1600 / width
        image = image.resize((int(width * scale), int(height * scale)), Image.Resampling.LANCZOS)
    gray = ImageOps.grayscale(image)
    gray = ImageOps.autocontrast(gray, cutoff=1)
    gray = gray.filter(ImageFilter.SHARPEN)
    arr = np.array(gray)
    mean = float(arr.mean())
    binary = Image.fromarray(np.where(arr > mean * 0.9, 255, 0).astype("uint8"))
    return [gray, binary]

def _score_ocr_text(text: str) -> int:
    if not text:
        return 0
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    score = len(text)
    score += len(lines) * 20
    keywords = [
        "FIR",
        "Police",
        "Station",
        "Date",
        "Complaint",
        "Incident",
        "Complainant",
        "Description",
        "Occurrence",
        "Name",
        "Location",
        "Property",
        "Sections",
    ]
    lower = text.lower()
    for keyword in keywords:
        if keyword.lower() in lower:
            score += 100
    return score

def extract_text_from_image_bytes(image_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(image_bytes))
    variants = _prepare_variants(image)
    candidates = []
    for variant in variants:
        for config in TESSERACT_CONFIGS:
            try:
                text = pytesseract.image_to_string(variant, config=config)
                candidates.append(text)
            except Exception:
                logger.exception("Tesseract OCR attempt failed")
    if not candidates:
        return ""
    return max(candidates, key=_score_ocr_text)

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> List[str]:
    from pdf2image import convert_from_bytes
    pages = convert_from_bytes(pdf_bytes, dpi=300)
    page_texts = []
    for page_image in pages:
        variants = _prepare_variants(page_image)
        candidates = []
        for variant in variants:
            for config in TESSERACT_CONFIGS:
                try:
                    text = pytesseract.image_to_string(variant, config=config)
                    candidates.append(text)
                except Exception:
                    logger.exception("Tesseract OCR attempt failed")
        page_texts.append(max(candidates, key=_score_ocr_text) if candidates else "")
    return page_texts

def extract_text(file_bytes: bytes, content_type: str) -> List[str]:
    if content_type == "application/pdf":
        return extract_text_from_pdf_bytes(file_bytes)
    return [extract_text_from_image_bytes(file_bytes)]