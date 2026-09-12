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