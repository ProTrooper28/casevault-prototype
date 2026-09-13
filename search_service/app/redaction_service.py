import re
from typing import List
import spacy
from app.supabase_client import supabase

_nlp = spacy.load("en_core_web_sm")

_SPACY_LABEL_MAP = {
    "PERSON": "person_name",
    "GPE": "location",
    "LOC": "location",
    "ORG": "organization",
}

_REGEX_PATTERNS = {
    "phone_number": re.compile(r"(?:\+91[\-\s]?)?[6-9]\d{9}\b"),
    "aadhaar_number": re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b"),
    "pan_number": re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b"),
    "email": re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"),
}

def detect_redactions(document_id: str, requesting_officer_id: str) -> dict:
    """
    Run NER + regex detection on one document's OCR text, and write
    the results into redaction_spans as pending_review. Nothing is
    actually redacted here — this only flags candidates for an
    officer to confirm, same as extracted_fields.
    """
    doc_result = (
        supabase.table("documents")
        .select("id, case_id, ocr_extracted_text")
        .eq("id", document_id)
        .single()
        .execute()
    )
    doc = doc_result.data
    if doc is None:
        raise ValueError(f"No document found with id={document_id}")

    case_id = doc["case_id"]

    access_check = supabase.rpc(
        "has_case_access",
        {"check_case_id": case_id, "check_officer_id": requesting_officer_id},
    ).execute()
    if not access_check.data:
        raise PermissionError(
            f"Officer {requesting_officer_id} does not have access to case {case_id}"
        )

    text = doc.get("ocr_extracted_text")
    if not text or not text.strip():
        raise ValueError(
            f"documents.ocr_extracted_text is empty for document_id={document_id} — nothing to scan."
        )

    spans: List[dict] = []

    # --- NER pass ---
    spacy_doc = _nlp(text)
    for ent in spacy_doc.ents:
        entity_type = _SPACY_LABEL_MAP.get(ent.label_)
        if entity_type is None:
            continue  # skip entity types we don't care about redacting (DATE, MONEY, etc.)
        spans.append(
            {
                "entity_type": entity_type,
                "entity_text": ent.text,
                "start_offset": ent.start_char,
                "end_offset": ent.end_char,
                "confidence_score": 0.75,
                "detection_method": "ner_model",
            }
        )

    for entity_type, pattern in _REGEX_PATTERNS.items():
        for match in pattern.finditer(text):
            spans.append(
                {
                    "entity_type": entity_type,
                    "entity_text": match.group(),
                    "start_offset": match.start(),
                    "end_offset": match.end(),
                    "confidence_score": 0.95,
                    "detection_method": "regex_pattern",
                }
            )

    supabase.table("redaction_spans").delete().eq("document_id", document_id).execute()

    if spans:
        rows = [{**s, "document_id": document_id, "case_id": case_id} for s in spans]
        supabase.table("redaction_spans").insert(rows).execute()

    return {
        "document_id": document_id,
        "case_id": case_id,
        "spans_detected": len(spans),
    }