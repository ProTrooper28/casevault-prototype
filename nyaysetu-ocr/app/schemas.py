from typing import List, Optional
from pydantic import BaseModel, Field


class ExtractedFields(BaseModel):
    fir_number: Optional[str] = None
    date_of_fir: Optional[str] = None
    occurrence_date: Optional[str] = None
    police_station: Optional[str] = None
    district: Optional[str] = None
    fir_state: Optional[str] = None
    sections_of_law: List[str] = Field(default_factory=list)
    complainant_name: Optional[str] = None
    accused_name: Optional[str] = None
    occurrence_place: Optional[str] = None
    description: Optional[str] = None
    fir_year: Optional[int] = None
    fir_date_iso: Optional[str] = None
    occurrence_date_iso: Optional[str] = None


class FieldConfidence(BaseModel):
    fir_number: float = 0.0
    date_of_fir: float = 0.0
    occurrence_date: float = 0.0
    police_station: float = 0.0
    district: float = 0.0
    fir_state: float = 0.0
    sections_of_law: float = 0.0
    complainant_name: float = 0.0
    accused_name: float = 0.0
    occurrence_place: float = 0.0
    description: float = 0.0


class OCRResponse(BaseModel):
    raw_text: str
    extracted_fields: ExtractedFields
    field_confidence: FieldConfidence
    overall_confidence: float
    needs_review: bool
    review_reasons: List[str] = Field(default_factory=list)
    page_count: int = 1


class HealthResponse(BaseModel):
    status: str
    tesseract_available: bool