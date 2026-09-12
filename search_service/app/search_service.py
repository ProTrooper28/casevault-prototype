from typing import List, Optional
from app.chunking import split_into_chunks
from app.embedding_backend import embed_texts
from app.supabase_client import supabase

def index_document(document_id: str) -> dict:
    """
    Chunk + embed + store ONE document's OCR text, read directly from
    Supabase instead of being passed in by the caller.
    """
    # 1. Fetch the document row — need ocr_extracted_text AND case_id
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

    text = doc.get("ocr_extracted_text")
    if not text or not text.strip():
        raise ValueError(
            f"documents.ocr_extracted_text is empty for document_id={document_id} "
            "— nothing to index. Has OCR run and been confirmed for this document yet?"
        )

    case_id = doc["case_id"]

    # 2. Chunk the text
    chunk_texts = split_into_chunks(text)
    if not chunk_texts:
        return {"case_id": case_id, "document_id": document_id, "chunks_indexed": 0}

    # 3. Embed all chunks in one batch call
    vectors = embed_texts(chunk_texts)

    # 4. Delete any existing chunks for this document first, so
    #    re-indexing after a correction doesn't leave stale chunks behind.
    supabase.table("document_embeddings").delete().eq("document_id", document_id).execute()

    # 5. Insert one row per chunk.
    rows = [
        {
            "document_id": document_id,
            "case_id": case_id,
            "chunk_index": i,
            "content_chunk": chunk_text,
            "embedding": vectors[i].tolist(),
        }
        for i, chunk_text in enumerate(chunk_texts)
    ]
    supabase.table("document_embeddings").insert(rows).execute()

    return {
        "case_id": case_id,
        "document_id": document_id,
        "chunks_indexed": len(rows),
    }

def search(
    case_id: str, query: str, requesting_officer_id: str, top_k: int = 5, min_similarity: float = 0.15
) -> List[dict]:
    query_vector = embed_texts([query])[0].tolist()

    result = supabase.rpc(
        "match_document_chunks",
        {
            "query_embedding": query_vector,
            "match_case_id": case_id,
            "requesting_officer_id": requesting_officer_id,
            "match_count": top_k,
            "similarity_threshold": min_similarity,
        },
    ).execute()

    return result.data or []


def search_global(
    query: str, requesting_officer_id: str, top_k: int = 5, min_similarity: float = 0.15
) -> List[dict]:
    query_vector = embed_texts([query])[0].tolist()

    result = supabase.rpc(
        "match_document_chunks_global",
        {
            "query_embedding": query_vector,
            "requesting_officer_id": requesting_officer_id,
            "match_count": top_k,
            "similarity_threshold": min_similarity,
        },
    ).execute()

    return result.data or []