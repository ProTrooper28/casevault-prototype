"""
CaseVault AI — document intelligence service (FastAPI).

Real processing only:
  • PDF text extraction (pdfminer.six) with PyMuPDF rasterisation + Tesseract
    OCR fallback for scanned/image pages
  • plain-text / image files supported directly
  • spaCy NER for PERSON / LOC / GPE / DATE / ORG entities
  • rule-based extraction of FIR numbers, police stations, sections/acts
  • rule-based document classification from actual content
  • deterministic extractive summary (no LLM unless one is configured)

Run:
    cd ai-service
    python -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    python -m spacy download en_core_web_sm
    uvicorn app.main:app --port 8000
"""

from __future__ import annotations

import io
import os
import re
from typing import Any

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# --------------------------------------------------------------------------- #
# Extraction
# --------------------------------------------------------------------------- #

IMAGE_MIMES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/tiff"}
TEXT_EXTENSIONS = (".txt", ".md", ".csv")

SECTION_RE = re.compile(
    r"\b(?:S\.?\s?|Section\s+|Sections?\s+|IPC\s+|CrPC\s+|BNS\s+|BNSS\s+|IT\s+Act\s*)"
    r"(\d{1,4}[A-Z]?(?:\([a-z0-9]{1,3}\))?)",
    re.IGNORECASE,
)
ACT_RE = re.compile(
    r"\b((?:The\s+)?[A-Z][A-Za-z&]+(?:\s+[A-Z][A-Za-z&]+){0,4}\s+Act,?\s*\d{4})\b"
)
FIR_RE = re.compile(r"\b(?:FIR|Case|E\.?C\.?R\.?)[\s\-/No.:]*([A-Z]{0,4}-?\d{2,6}[-/]\d{2,6})\b", re.IGNORECASE)
PS_RE = re.compile(
    r"\b((?:[A-Z][A-Za-z&.-]+(?:\s+[A-Z][A-Za-z&.-]+){0,3})\s+(?:Police Station|P\.S\.))\b"
)
DATE_RE = re.compile(
    r"\b(\d{1,2}[-/. ](?:0?[1-9]|1[0-2])[-/. ]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4}-\d{2}-\d{2})\b",
    re.IGNORECASE,
)

CLASSIFIER_RULES: list[tuple[str, list[str]]] = [
    (
        "Charge Sheet",
        ["charge sheet", "chargesheet", "final report", "police report u/s", "section 173"],
    ),
    (
        "Forensic Report",
        ["forensic", "fsl", "fingerprints", "dna profile", "chemical analysis", "ballistics", "exhibit"],
    ),
    (
        "Witness Statement",
        ["statement of", "witness statement", "i state that", "witness deposed", "my statement"],
    ),
    (
        "Court Filing",
        ["court", "hon'ble", "honorable", "judicial magistrate", "summons", "petition", "affidavit", "verdict"],
    ),
    (
        "Legal Notice",
        ["legal notice", "take notice", "demand notice", "cease and desist", "advocate for"],
    ),
    (
        "Police Report",
        ["police report", "progress report", "seizure memo", "panchanama", "mahazar", "case diary"],
    ),
    (
        "FIR",
        ["first information report", "fir", "complaint", "informant", "complainant"],
    ),
]


def extract_pdf(data: bytes) -> tuple[str, int, int]:
    """Return (text, pages, ocr_pages). OCR runs only when a page yields no text layer."""
    from pdfminer.high_level import extract_text as pdfminer_extract

    text = pdfminer_extract(io.BytesIO(data)) or ""
    ocr_pages = 0

    # Find pages with no text layer and rasterise them through Tesseract.
    try:
        import fitz  # PyMuPDF
        import pytesseract
        from PIL import Image

        doc = fitz.open(stream=data, filetype="pdf")
        page_texts: list[str | None] = [None] * doc.page_count
        for i, page in enumerate(doc):
            page_text = page.get_text("text") or ""
            if page_text.strip():
                page_texts[i] = page_text
            else:
                pix = page.get_pixmap(dpi=200)
                img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
                page_texts[i] = pytesseract.image_to_string(img)
                if page_texts[i].strip():
                    ocr_pages += 1
        doc.close()

        rastered = "\n\n".join((t or "") for t in page_texts)
        # Prefer the page-wise result; fall back to pdfminer if rasterisation failed.
        if rastered.strip() and (ocr_pages > 0 or len(rastered.strip()) > len(text.strip()) // 2):
            text = rastered
        pages = len(page_texts)
    except Exception:
        pages = max(1, text.count("\f") + 1) if text else 0

    return text, pages, ocr_pages


def extract_content(data: bytes, content_type: str, filename: str) -> dict[str, Any]:
    lowered = filename.lower()
    ocr_pages = 0

    if content_type == "application/pdf" or lowered.endswith(".pdf"):
        text, pages, ocr_pages = extract_pdf(data)
    elif content_type in IMAGE_MIMES or lowered.endswith((".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff")):
        import pytesseract
        from PIL import Image

        img = Image.open(io.BytesIO(data))
        text = pytesseract.image_to_string(img)
        pages, ocr_pages = 1, 1
    elif lowered.endswith(TEXT_EXTENSIONS) or content_type.startswith("text/"):
        text = data.decode("utf-8", errors="replace")
        pages = 1
    elif lowered.endswith((".doc", ".docx")):
        import docx2txt

        text = docx2txt.process(io.BytesIO(data))
        pages = max(1, text.count("\f") + 1)
    else:
        # Last resort: try UTF-8; binary formats will fail loudly, not fake.
        text = data.decode("utf-8", errors="replace")
        pages = 1

    return {"text": text, "pages": pages, "ocr_pages": ocr_pages}


# --------------------------------------------------------------------------- #
# NER + rule-based extraction
# --------------------------------------------------------------------------- #

def run_ner(text: str) -> list[dict[str, str]]:
    try:
        import spacy

        nlp = run_ner._nlp  # type: ignore[attr-defined]
    except AttributeError:
        import spacy

        model = os.environ.get("SPACY_MODEL", "en_core_web_sm")
        nlp = spacy.load(model)
        run_ner._nlp = nlp  # type: ignore[attr-defined]

    # Long FIRs overwhelm the small model — process the first ~20k chars in slices.
    slice_size = 4000
    entities: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for start in range(0, min(len(text), 20000), slice_size):
        doc = nlp(text[start : start + slice_size])
        for ent in doc.ents:
            if ent.label_ not in ("PERSON", "GPE", "LOC", "DATE", "ORG"):
                continue
            value = ent.text.strip()
            if not value or len(value) < 3:
                continue
            key = (value.lower(), ent.label_)
            if key in seen:
                continue
            seen.add(key)
            entities.append({"value": value, "label": ent.label_})
    return entities


def rule_fir_numbers(text: str) -> list[str]:
    return dedupe(FIR_RE.findall(text or ""))


def rule_police_stations(text: str) -> list[str]:
    raw = dedupe(PS_RE.findall(text or ""))
    return [re.sub(r"\s*P\.S\.$", " Police Station", v.strip()) for v in raw]


def rule_sections(text: str) -> list[str]:
    sections = [f"IPC {s}" if not s.lower().startswith(("ipc", "bns")) else s for s in SECTION_RE.findall(text or "")]
    acts = [a.rstrip(",") for a in ACT_RE.findall(text or "")]
    return dedupe(sections + acts)[:20]


def rule_dates(text: str) -> list[str]:
    return dedupe(DATE_RE.findall(text or ""))[:15]


def dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for v in values:
        v = v.strip()
        if v and v.lower() not in seen:
            seen.add(v.lower())
            out.append(v)
    return out


def classify(text: str) -> tuple[str, dict[str, int]]:
    haystack = (text or "").lower()
    scores = {label: sum(haystack.count(kw) for kw in keywords) for label, keywords in CLASSIFIER_RULES}
    best = max(scores.items(), key=lambda kv: kv[1], default=("Other", 0))
    label = best[0] if best[1] > 0 else "Other"
    return label, scores


def summarize(text: str, entities: list[dict[str]], max_sentences: int = 5) -> str:
    """Deterministic extractive summary — no LLM unless OPENAI_API_KEY is set later."""
    clean = re.sub(r"\s+", " ", text or "").strip()
    if not clean:
        return ""
    sentences = re.split(r"(?<=[.!?])\s+", clean)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 30]
    if not sentences:
        return clean[:500]

    people = [e["value"] for e in entities if e["label"] == "PERSON"]
    places = [e["value"] for e in entities if e["label"] in ("GPE", "LOC")]

    scored: list[tuple[float, int, str]] = []
    for idx, s in enumerate(sentences[:120]):
        lower = s.lower()
        score = 0.0
        for p in people[:10]:
            if p.lower() in lower:
                score += 2.0
        for pl in places[:10]:
            if pl.lower() in lower:
                score += 1.5
        for kw in ("fir", "complainant", "accused", "section", "police station", "stolen", "offence", "reported"):
            if kw in lower:
                score += 0.5
        score -= idx * 0.02  # slight preference for earlier context
        scored.append((score, -idx, s))

    scored.sort(reverse=True)
    top = [s for _, _, s in scored[:max_sentences]]
    top.sort(key=lambda s: clean.find(s[:40]))
    return " ".join(top)


# --------------------------------------------------------------------------- #
# API
# --------------------------------------------------------------------------- #

app = FastAPI(title="CaseVault AI — document intelligence", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, Any]:
    spacy_ok = True
    try:
        import spacy  # noqa: F401
    except Exception:
        spacy_ok = False
    return {
        "ok": True,
        "spacy_installed": spacy_ok,
        "spacy_model": os.environ.get("SPACY_MODEL", "en_core_web_sm"),
    }


@app.post("/process")
async def process(file: UploadFile = File(...)) -> dict[str, Any]:
    data = await file.read()
    if not data:
        return {"ok": False, "error": "Empty file"}

    try:
        extracted = extract_content(data, file.content_type or "", file.filename or "")
    except Exception as exc:  # real failures bubble up honestly
        return {"ok": False, "error": f"Text extraction failed: {exc}"}

    text = extracted["text"]
    if not text.strip():
        return {"ok": False, "error": "No extractable text found (scanned document without OCR text layer and OCR unavailable?)."}

    entities = run_ner(text)
    label, scores = classify(text)

    persons = dedupe([e["value"] for e in entities if e["label"] == "PERSON"])
    orgs = dedupe([e["value"] for e in entities if e["label"] == "ORG"])
    locations = dedupe(
        [e["value"] for e in entities if e["label"] in ("GPE", "LOC")]
        + re.findall(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:Road|Street|Nagar|Colony|District|City)\b", text)
    )[:12]
    dates = rule_dates(text)

    return {
        "ok": True,
        "document_type": label,
        "classification_scores": scores,
        "pages": extracted["pages"],
        "ocr_pages": extracted["ocr_pages"],
        "text_chars": len(text),
        "extracted": {
            "persons": persons[:12],
            "organizations": orgs[:8],
            "locations": locations,
            "dates": dates,
            "fir_numbers": rule_fir_numbers(text),
            "police_stations": rule_police_stations(text),
            "sections": rule_sections(text),
            "entities": entities[:40],
        },
        "summary": summarize(text, entities),
        "text_preview": text[:2000],
    }
