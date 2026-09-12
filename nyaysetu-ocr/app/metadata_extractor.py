import re
from datetime import datetime
from typing import List, Optional, Tuple
from app.schemas import ExtractedFields, FieldConfidence

CRITICAL_FIELDS = {
    "fir_number",
    "date_of_fir",
    "occurrence_date",
    "sections_of_law",
}

def _clean(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    value = value.replace("\x00", " ")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n\s*\n+", "\n", value)
    value = value.strip(" \t\r\n'\"“”‘’")
    return value if value else None

def _clean_single_line(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    value = re.sub(r"\s+", " ", value)
    value = value.strip(" \t\r\n:;,'\"“”‘’")
    return value if value else None

def _first_match(
    patterns: List[str],
    text: str,
) -> Tuple[Optional[str], float]:
    for i, pattern in enumerate(patterns):
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE | re.MULTILINE | re.DOTALL,
        )
        if match:
            value = _clean_single_line(match.group(1))
            if value:
                return value, 0.9 if i == 0 else 0.75
    return None, 0.0

def _parse_date(date_text: Optional[str]) -> Optional[str]:
    if not date_text:
        return None

    date_text = re.sub(r"\s+", " ", date_text.strip())

    formats = [
        "%d %B %Y",
        "%d %b %Y",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%d.%m.%Y",
        "%d/%m/%y",
        "%d-%m-%y",
        "%d.%m.%y",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_text, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue

    return None

def _extract_fir_year(
    fir_number: Optional[str],
    fir_date_iso: Optional[str],
) -> Optional[int]:
    if fir_date_iso:
        try:
            return int(fir_date_iso[:4])
        except (ValueError, TypeError):
            pass

    if fir_number:
        match = re.search(r"\b(20\d{2})\b", fir_number)
        if match:
            return int(match.group(1))

    return None

# ---------------------------------------------------------
# FIR NUMBER
# ---------------------------------------------------------

_FIR_NUMBER_PATTERNS = [
    # Handles:
    # FIR Number: TEST-FIR-2026-00427
    # FIR Nomber: TEST-FIR-2026-00427
    # FIR No.: TEST-FIR-2026-00427
    # FIR No: TEST-FIR-2026-00427
    r"^\s*FIR\s*(?:Number|Nomber|Namber|Num(?:ber)?|No\.?)\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9/_\-.]*)\s*$",

    # Handles spaced OCR such as F.I.R. Number
    r"^\s*F\.?\s*I\.?\s*R\.?\s*(?:Number|Nomber|Namber|Num(?:ber)?|No\.?)\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9/_\-.]*)\s*$",
]

def _extract_fir_number(text: str) -> Tuple[Optional[str], float]:
    for i, pattern in enumerate(_FIR_NUMBER_PATTERNS):
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE | re.MULTILINE,
        )

        if match:
            value = _clean_single_line(match.group(1))

            if value:
                return value, 0.9 if i == 0 else 0.8

    return None, 0.0

# ---------------------------------------------------------
# DATES
# ---------------------------------------------------------

_DATE_PATTERNS = [
    r"^\s*Date\s+of\s+(?:FIR|Complaint|Report)\s*[:\-]\s*([0-9]{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+[0-9]{4})\s*$",

    r"^\s*Date\s+of\s+(?:FIR|Complaint|Report)\s*[:\-]\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})\s*$",

    r"^\s*Date\s+of\s+(?:FIR|Complaint|Report)\s*[:\-]\s*([^\n]+)$",

    r"^\s*Date\s+of\s+FIR\s*[:\-]\s*([^\n]+)$",
]

_OCCURRENCE_DATE_PATTERNS = [
    r"^\s*Date\s+of\s+(?:Incident|Occurrence)\s*[:\-]\s*([0-9]{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+[0-9]{4})\s*$",

    r"^\s*Date\s+of\s+(?:Incident|Occurrence)\s*[:\-]\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})\s*$",

    r"^\s*Date\s+of\s+(?:Incident|Occurrence)\s*[:\-]\s*([^\n]+)$",
]

def _extract_date_of_fir(text: str) -> Tuple[Optional[str], float]:
    value, confidence = _first_match(_DATE_PATTERNS, text)

    if value:
        parsed = _parse_date(value)

        if parsed:
            return value, confidence

    return None, 0.0

def _extract_occurrence_date(
    text: str,
) -> Tuple[Optional[str], float]:
    value, confidence = _first_match(
        _OCCURRENCE_DATE_PATTERNS,
        text,
    )

    if value:
        parsed = _parse_date(value)

        if parsed:
            return value, confidence

    return None, 0.0

# ---------------------------------------------------------
# POLICE STATION
# ---------------------------------------------------------

_POLICE_STATION_PATTERNS = [
    r"^\s*Police\s+Station\s*[:\-]\s*([^\n]+)$",

    r"^\s*P\.?\s*S\.?\s*[:\-]\s*([^\n]+)$",
]

def _extract_police_station(
    text: str,
) -> Tuple[Optional[str], float]:
    return _first_match(
        _POLICE_STATION_PATTERNS,
        text,
    )

# ---------------------------------------------------------
# DISTRICT
# ---------------------------------------------------------

_DISTRICT_PATTERNS = [
    r"^\s*District\s*[:\-]\s*([^\n,]+)\s*$",
]

def _extract_district(
    text: str,
) -> Tuple[Optional[str], float]:
    # Only extract district when the document explicitly says
    # "District:". Do not assume that a part of Location is
    # the district.
    return _first_match(
        _DISTRICT_PATTERNS,
        text,
    )

# ---------------------------------------------------------
# STATE
# ---------------------------------------------------------

_STATE_PATTERNS = [
    r"^\s*State\s*[:\-]\s*([^\n,]+)\s*$",
]

_COMMON_INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Puducherry",
    "Chandigarh",
]

def _extract_state(
    text: str,
) -> Tuple[Optional[str], float]:
    value, confidence = _first_match(
        _STATE_PATTERNS,
        text,
    )

    if value:
        return value, confidence

    # Conservative fallback: only look for a known state name.
    for state in _COMMON_INDIAN_STATES:
        if re.search(
            rf"\b{re.escape(state)}\b",
            text,
            flags=re.IGNORECASE,
        ):
            return state, 0.75

    return None, 0.0

# ---------------------------------------------------------
# SECTIONS OF LAW
# ---------------------------------------------------------

_SECTIONS_PATTERNS = [
    r"\b(?:U/S|U\/S|U\.\/S|Under\s+Section[s]?)\s*[:\-]?\s*([0-9A-Za-z,\s()\/&.\-]+?)\s+(IPC|BNS|CrPC|BNSS|Indian\s+Penal\s+Code|Bharatiya\s+Nyaya\s+Sanhita)\b",

    r"^\s*Section[s]?(?:\s+of\s+Law)?\s*[:\-]\s*([0-9A-Za-z,\s()\/&.\-]+)\s*$",

    r"^\s*Section[s]?\s*[:\-]\s*([^\n]+)$",
]

def _extract_sections_of_law(
    text: str,
) -> Tuple[List[str], float]:
    for i, pattern in enumerate(_SECTIONS_PATTERNS):
        matches = re.finditer(
            pattern,
            text,
            flags=re.IGNORECASE | re.MULTILINE,
        )

        values = []

        for match in matches:
            value = _clean_single_line(match.group(1))

            if value:
                values.append(value)

        if values:
            return values, 0.9 if i == 0 else 0.75

    return [], 0.0

# ---------------------------------------------------------
# COMPLAINANT
# ---------------------------------------------------------

def _extract_complainant(
    text: str,
) -> Tuple[Optional[str], float]:
    # First try the exact labelled field.
    patterns = [
        r"^\s*Name\s+of\s+Complainant\s*[:\-]\s*([^\n]+)$",
        r"^\s*Complainant\s+Name\s*[:\-]\s*([^\n]+)$",
    ]

    value, confidence = _first_match(patterns, text)

    if value:
        return value, confidence

    # Then restrict "Name:" to the Complainant Details block.
    block_match = re.search(
        r"Complainant\s+Details\s*(.*?)(?=\n\s*(?:Incident Details|Accused Details|Description of Complaint|Stolen Property)\b|$)",
        text,
        flags=re.IGNORECASE | re.MULTILINE | re.DOTALL,
    )

    if block_match:
        block = block_match.group(1)

        match = re.search(
            r"^\s*Name\s*[:\-]\s*([^\n]+)$",
            block,
            flags=re.IGNORECASE | re.MULTILINE,
        )

        if match:
            value = _clean_single_line(match.group(1))

            if value:
                return value, 0.9

    return None, 0.0

# ---------------------------------------------------------
# ACCUSED
# ---------------------------------------------------------

_ACCUSED_PATTERNS = [
    r"^\s*Name\s+of\s+Accused\s*[:\-]\s*([^\n]+)$",
    r"^\s*Accused\s+Name\s*[:\-]\s*([^\n]+)$",
]

def _extract_accused(
    text: str,
) -> Tuple[Optional[str], float]:
    value, confidence = _first_match(
        _ACCUSED_PATTERNS,
        text,
    )

    if value:
        return value, confidence

    block_match = re.search(
        r"Accused\s+Details\s*(.*?)(?=\n\s*(?:Incident Details|Description of Complaint|Stolen Property)\b|$)",
        text,
        flags=re.IGNORECASE | re.MULTILINE | re.DOTALL,
    )

    if block_match:
        block = block_match.group(1)

        match = re.search(
            r"^\s*Name\s*[:\-]\s*([^\n]+)$",
            block,
            flags=re.IGNORECASE | re.MULTILINE,
        )

        if match:
            value = _clean_single_line(match.group(1))

            if value:
                return value, 0.9

    return None, 0.0

# ---------------------------------------------------------
# OCCURRENCE PLACE
# ---------------------------------------------------------

_OCCURRENCE_PLACE_PATTERNS = [
    r"^\s*Place\s+of\s+(?:Incident|Occurrence)\s*[:\-]\s*([^\n]+)$",
]

def _extract_occurrence_place(
    text: str,
) -> Tuple[Optional[str], float]:
    return _first_match(
        _OCCURRENCE_PLACE_PATTERNS,
        text,
    )

# ---------------------------------------------------------
# DESCRIPTION
# ---------------------------------------------------------

_DESCRIPTION_START_PATTERNS = [
    r"Description\s+of\s+Complaint",
    r"Description\s+of\s+Incident",
    r"Brief\s+Facts\s+of\s+the\s+Case",
    r"Brief\s+Facts",
    r"Description",
]

_DESCRIPTION_END_HEADINGS = (
    r"Stolen\s+Property",
    r"Property\s+Details",
    r"Investigating\s+Officer",
    r"Investigation\s+Officer",
    r"IO\s+Details",
    r"Witness\s+Details",
    r"Evidence\s+Details",
    r"Police\s+Station",
    r"Signature",
    r"Complainant\s+Signature",
)

def _extract_description(
    text: str,
) -> Tuple[Optional[str], float]:
    end_heading = "|".join(_DESCRIPTION_END_HEADINGS)

    for start_pattern in _DESCRIPTION_START_PATTERNS:
        pattern = (
            rf"(?is)"
            rf"{start_pattern}"
            rf"\s*[:\-]?\s*"
            rf"(.*?)"
            rf"(?=\n\s*(?:{end_heading})\b|$)"
        )

        match = re.search(pattern, text)

        if match:
            description = match.group(1)

            # Remove OCR quotation marks at the beginning/end.
            description = description.strip()
            description = description.strip("'\"“”‘’")

            # Collapse all whitespace/newlines into normal spaces.
            description = re.sub(
                r"\s+",
                " ",
                description,
            ).strip()

            if description:
                return description, 0.95

    return None, 0.0

# ---------------------------------------------------------
# MAIN EXTRACTION
# ---------------------------------------------------------

def extract_metadata(
    raw_text: str,
) -> Tuple[
    ExtractedFields,
    FieldConfidence,
    float,
    bool,
    List[str],
]:
    fir_number, fir_number_conf = _extract_fir_number(
        raw_text
    )

    date_of_fir, date_of_fir_conf = _extract_date_of_fir(
        raw_text
    )

    occurrence_date, occurrence_date_conf = _extract_occurrence_date(
        raw_text
    )

    police_station, police_station_conf = _extract_police_station(
        raw_text
    )

    district, district_conf = _extract_district(
        raw_text
    )

    fir_state, fir_state_conf = _extract_state(
        raw_text
    )

    sections_of_law, sections_conf = _extract_sections_of_law(
        raw_text
    )

    complainant_name, complainant_conf = _extract_complainant(
        raw_text
    )

    accused_name, accused_conf = _extract_accused(
        raw_text
    )

    occurrence_place, occurrence_place_conf = _extract_occurrence_place(
        raw_text
    )

    description, description_conf = _extract_description(
        raw_text
    )

    fir_date_iso = _parse_date(date_of_fir)
    occurrence_date_iso = _parse_date(occurrence_date)

    fir_year = _extract_fir_year(
        fir_number,
        fir_date_iso,
    )

    fields = ExtractedFields(
        fir_number=fir_number,
        date_of_fir=date_of_fir,
        occurrence_date=occurrence_date,
        police_station=police_station,
        district=district,
        fir_state=fir_state,
        sections_of_law=sections_of_law,
        complainant_name=complainant_name,
        accused_name=accused_name,
        occurrence_place=occurrence_place,
        description=description,
        fir_year=fir_year,
        fir_date_iso=fir_date_iso,
        occurrence_date_iso=occurrence_date_iso,
    )

    confidence = FieldConfidence(
        fir_number=fir_number_conf,
        date_of_fir=date_of_fir_conf,
        occurrence_date=occurrence_date_conf,
        police_station=police_station_conf,
        district=district_conf,
        fir_state=fir_state_conf,
        sections_of_law=sections_conf,
        complainant_name=complainant_conf,
        accused_name=accused_conf,
        occurrence_place=occurrence_place_conf,
        description=description_conf,
    )

    all_confidences = [
        fir_number_conf,
        date_of_fir_conf,
        occurrence_date_conf,
        police_station_conf,
        district_conf,
        fir_state_conf,
        sections_conf,
        complainant_conf,
        accused_conf,
        occurrence_place_conf,
        description_conf,
    ]

    matched_confidences = [
        value for value in all_confidences
        if value > 0
    ]

    if matched_confidences:
        overall_confidence = round(
            sum(matched_confidences)
            / len(matched_confidences),
            2,
        )
    else:
        overall_confidence = 0.0

    review_reasons = []

    for field_name in CRITICAL_FIELDS:
        value = getattr(fields, field_name)

        if field_name == "sections_of_law":
            missing = not value
        else:
            missing = value is None

        if missing:
            review_reasons.append(
                f"{field_name.replace('_', ' ').title()} "
                f"could not be detected — please enter manually."
            )

    needs_review = len(review_reasons) > 0

    return (
        fields,
        confidence,
        overall_confidence,
        needs_review,
        review_reasons,
    )