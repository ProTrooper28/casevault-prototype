create or replace function match_document_chunks(
    query_embedding    vector(384),
    match_case_id      uuid,
    match_count        int default 5,
    similarity_threshold float default 0.15
)
returns table (
    document_id     uuid,
    source_filename text,
    chunk_text      text,
    similarity      float
)
language sql stable
as $$
    select
        de.document_id,
        d.title as source_filename,
        de.content_chunk as chunk_text,
        1 - (de.embedding <=> query_embedding) as similarity
    from document_embeddings de
    join documents d on d.id = de.document_id
    where de.case_id = match_case_id
      and 1 - (de.embedding <=> query_embedding) >= similarity_threshold
    order by de.embedding <=> query_embedding
    limit match_count;
$$;

create or replace function match_document_chunks_global(
    query_embedding      vector(384),
    match_count           int default 5,
    similarity_threshold  float default 0.15
)
returns table (
    case_id         uuid,
    case_title      text,
    document_id     uuid,
    source_filename text,
    chunk_text      text,
    similarity      float
)
language sql stable
as $$
    select
        de.case_id,
        c.case_title,
        de.document_id,
        d.title as source_filename,
        de.content_chunk as chunk_text,
        1 - (de.embedding <=> query_embedding) as similarity
    from document_embeddings de
    join documents d on d.id = de.document_id
    join cases c on c.id = de.case_id
    where 1 - (de.embedding <=> query_embedding) >= similarity_threshold
    order by de.embedding <=> query_embedding
    limit match_count;
$$;