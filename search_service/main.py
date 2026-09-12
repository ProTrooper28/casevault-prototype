import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    HealthResponse,
    IndexDocumentRequest,
    IndexDocumentResponse,
    SearchRequest,
    SearchResponse,
    SearchResultItem,
    GlobalSearchRequest,
    GlobalSearchResponse,
    GlobalSearchResultItem,
)
from app import search_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nyaya_setu_search")

app = FastAPI(
    title="Nyaya Setu Semantic Search Service",
    description="Natural-language search over OCR'd case documents, backed by Supabase + pgvector.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok")


@app.post("/search/index", response_model=IndexDocumentResponse)
def index_document(req: IndexDocumentRequest):
    try:
        result = search_service.index_document(document_id=req.document_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return IndexDocumentResponse(**result)


@app.post("/search/query", response_model=SearchResponse)
def search(req: SearchRequest):
    rows = search_service.search(
        case_id=req.case_id,
        query=req.query,
        requesting_officer_id=req.requesting_officer_id,
        top_k=req.top_k,
        min_similarity=req.min_similarity,
    )

    if not rows:
        return SearchResponse(
            query=req.query,
            results=[],
            message="No relevant results found for this query in the case.",
        )

    result_items = [
        SearchResultItem(
            document_id=row["document_id"],
            source_filename=row["source_filename"] or "",
            chunk_text=row["chunk_text"],
            similarity=round(row["similarity"], 3),
        )
        for row in rows
    ]

    return SearchResponse(query=req.query, results=result_items)

@app.post("/search/query/global", response_model=GlobalSearchResponse)
def search_global(req: GlobalSearchRequest):
    rows = search_service.search_global(
        query=req.query,
        requesting_officer_id=req.requesting_officer_id,
        top_k=req.top_k,
        min_similarity=req.min_similarity,
    )

    if not rows:
        return GlobalSearchResponse(
            query=req.query,
            results=[],
            message="No relevant results found across any case.",
        )

    result_items = [
        GlobalSearchResultItem(
            case_id=row["case_id"],
            case_title=row["case_title"],
            document_id=row["document_id"],
            source_filename=row["source_filename"] or "",
            chunk_text=row["chunk_text"],
            similarity=round(row["similarity"], 3),
        )
        for row in rows
    ]

    return GlobalSearchResponse(query=req.query, results=result_items)