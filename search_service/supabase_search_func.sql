create table if not exists case_access (
    id            uuid primary key default gen_random_uuid(),
    case_id       uuid not null references cases(id) on delete cascade,
    profile_id    uuid not null references profiles(id) on delete cascade,
    access_level  text not null default 'read' check (access_level in ('read', 'write', 'admin')),
    granted_by    uuid references profiles(id),
    granted_at    timestamptz not null default now(),

    constraint uq_case_access unique (case_id, profile_id)
);

comment on table case_access is 'Per-officer access grants to a case. A case creator/lead investigator always has implicit access even without a row here — see the two search functions.';

create index if not exists idx_case_access_case_id    on case_access(case_id);
create index if not exists idx_case_access_profile_id on case_access(profile_id);

create or replace function match_document_chunks(
    query_embedding        vector(384),
    match_case_id          uuid,
    requesting_officer_id  uuid,
    match_count             int default 5,
    similarity_threshold    float default 0.15
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
    join cases c on c.id = de.case_id
    where de.case_id = match_case_id
      and (
            c.created_by = requesting_officer_id
            or c.lead_investigator_id = requesting_officer_id
            or exists (
                select 1 from case_access ca
                where ca.case_id = c.id and ca.profile_id = requesting_officer_id
            )
          )
      and 1 - (de.embedding <=> query_embedding) >= similarity_threshold
    order by de.embedding <=> query_embedding
    limit match_count;
$$;

create or replace function match_document_chunks_global(
    query_embedding        vector(384),
    requesting_officer_id  uuid,
    match_count             int default 5,
    similarity_threshold    float default 0.15
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
    where (
            c.created_by = requesting_officer_id
            or c.lead_investigator_id = requesting_officer_id
            or exists (
                select 1 from case_access ca
                where ca.case_id = c.id and ca.profile_id = requesting_officer_id
            )
          )
      and 1 - (de.embedding <=> query_embedding) >= similarity_threshold
    order by de.embedding <=> query_embedding
    limit match_count;
$$;

create or replace function get_case_timeline(
    match_case_id          uuid,
    requesting_officer_id  uuid
)
returns table (
    event_timestamp timestamptz,
    event_type      text,
    title           text,
    description     text,
    source_id       uuid
)
language sql stable
as $$
    with case_auth as (
        select 1
        from cases c
        where c.id = match_case_id
          and (
                c.created_by = requesting_officer_id
                or c.lead_investigator_id = requesting_officer_id
                or exists (
                    select 1 from case_access ca
                    where ca.case_id = c.id and ca.profile_id = requesting_officer_id
                )
              )
    )
    select event_timestamp, event_type, title, description, source_id
    from (
        select
            c.fir_date::timestamptz as event_timestamp,
            'fir_registered' as event_type,
            'FIR Registered' as title,
            coalesce('FIR ' || c.fir_number || ' — ' || c.fir_police_station, 'FIR registered') as description,
            c.id as source_id
        from cases c, case_auth
        where c.id = match_case_id and c.fir_date is not null

        union all

        select
            c.court_case_filed_date::timestamptz,
            'court_filed',
            'Case Filed in Court',
            coalesce(c.court_name || ' — ' || c.court_case_number, 'Court proceedings began'),
            c.id
        from cases c, case_auth
        where c.id = match_case_id and c.court_case_filed_date is not null

        union all

        select
            d.created_at,
            'document_uploaded',
            'Document Uploaded: ' || d.title,
            d.document_type,
            d.id
        from documents d, case_auth
        where d.case_id = match_case_id

        union all

        select
            h.handover_timestamp,
            'custody_transfer',
            'Evidence Transferred',
            coalesce(h.purpose, 'Custody transfer'),
            h.id
        from handoffs h, case_auth
        where h.case_id = match_case_id
    ) events
    order by event_timestamp asc;
$$;