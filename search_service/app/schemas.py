from typing import List, Optional
from pydantic import BaseModel

class IndexDocumentRequest(BaseModel):
    document_id: str  

class IndexDocumentResponse(BaseModel):
    case_id: str
    document_id: str
    chunks_indexed: int

class SearchRequest(BaseModel):
    case_id: str
    query: str
    requesting_officer_id: str
    top_k: int = 5
    min_similarity: float = 0.15

class SearchResultItem(BaseModel):
    document_id: str
    source_filename: str
    chunk_text: str
    similarity: float

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
    message: Optional[str] = None

class HealthResponse(BaseModel):
    status: str

class GlobalSearchRequest(BaseModel):
    query: str
    requesting_officer_id: str
    top_k: int = 5
    min_similarity: float = 0.15


class GlobalSearchResultItem(BaseModel):
    case_id: str
    case_title: str
    document_id: str
    source_filename: str
    chunk_text: str
    similarity: float


class GlobalSearchResponse(BaseModel):
    query: str
    results: List[GlobalSearchResultItem]
    message: Optional[str] = None

class TimelineRequest(BaseModel):
    case_id: str
    requesting_officer_id: str


class TimelineEvent(BaseModel):
    event_timestamp: str
    event_type: str
    title: str
    description: Optional[str] = None
    source_id: Optional[str] = None


class TimelineResponse(BaseModel):
    case_id: str
    events: List[TimelineEvent]