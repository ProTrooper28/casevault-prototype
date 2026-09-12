-- =====================================================================
-- SARVEKSHAN — Full Database Schema (Supabase / Postgres)
-- =====================================================================
-- Single source of truth. Run this top to bottom on a fresh Supabase
-- project to get the entire schema in one go.
--
-- Design principle: CASE is the root object, not a folder/file tree.
-- Every other table hangs off case_id (directly or via document_id),
-- which is what unlocks case timelines, custody trails, relationship
-- mapping, and search later.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid() for primary keys
create extension if not exists vector;     -- pgvector, for document embeddings

-- ---------------------------------------------------------------------
-- 1. PROFILES
-- ---------------------------------------------------------------------
-- App-level identity (role, department, badge no.). auth.users
-- (Supabase-managed) only holds login credentials and is never
-- modified directly.
create table if not exists profiles (
    id              uuid primary key references auth.users(id) on delete cascade,
    full_name       text not null,
    role            text not null check (
                        role in ('admin', 'investigator', 'forensic_analyst',
                                  'prosecutor', 'judge', 'clerk', 'auditor')
                    ),
    department      text,
    badge_number    text unique,
    phone           text,
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

comment on table profiles is 'App-level identity + role for every authenticated user. 1:1 with auth.users.';

-- ---------------------------------------------------------------------
-- 2. CASES  (root object of the whole system)
-- ---------------------------------------------------------------------
-- FIR number is only an ANNUAL SERIAL NUMBER inside a single police
-- station's register — repeats every year and across stations, so it
-- can never be a standalone unique key. Real identity is the 5-tuple:
-- (fir_state, fir_district, fir_police_station, fir_year, fir_number).
--
-- CNR (Case Number Record) is the actual nationally-unique 16-char
-- court case identifier. It only exists once the case is registered
-- in court, so it's nullable and gets filled in later.
--
-- search_vector powers full-text search for the "add docs to an
-- existing case" flow — auto-maintained by a trigger (section 10).
create table if not exists cases (
    id                      uuid primary key default gen_random_uuid(),

    case_title              text not null,
    case_type               text not null default 'criminal'
                                check (case_type in ('criminal', 'civil', 'other')),
    status                  text not null default 'open'
                                check (status in (
                                    'open', 'under_investigation', 'chargesheet_filed',
                                    'court_proceedings', 'disposed', 'closed', 'archived'
                                )),
    description             text,

    -- ---- FIR block (fills in first, from the physical/scanned FIR) ----
    fir_number              text,
    fir_state               text,
    fir_district            text,
    fir_police_station      text,
    fir_year                int check (fir_year between 1900 and 2100),
    fir_date                date,
    fir_sections            text[],

    -- ---- Court / CNR block (fills in later, once proceedings start) ----
    cnr_number              text,
    court_name              text,
    court_case_number       text,
    court_case_filed_date   date,

    lead_investigator_id    uuid references profiles(id),
    created_by              uuid not null references profiles(id),

    -- Full-text search column, auto-maintained by trigger (section 10).
    search_vector           tsvector,

    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),

    constraint uq_fir_identity unique (fir_state, fir_district, fir_police_station, fir_year, fir_number),
    constraint uq_cnr_number unique (cnr_number),
    constraint chk_cnr_length check (cnr_number is null or char_length(cnr_number) = 16)
);

comment on table cases is 'Root object. Every document, handoff, audit entry, extracted field, and embedding traces back to a case.';
comment on column cases.fir_number is 'Raw FIR serial as printed. Only unique combined with station+year — see uq_fir_identity.';
comment on column cases.cnr_number is '16-char national court case identifier. Null until the case is registered in court.';
comment on column cases.search_vector is 'Auto-maintained by trigger. Query with: select * from cases where search_vector @@ websearch_to_tsquery(''english'', ''<search text>'');';

-- ---------------------------------------------------------------------
-- 3. DOCUMENTS
-- ---------------------------------------------------------------------
-- Every uploaded file is a document ATTACHED to a case. file_hash_sha256
-- is the integrity anchor (see integrity_records, section 7).
-- extraction_status tracks the OCR pipeline separately from status,
-- which tracks human verification.
create table if not exists documents (
    id                  uuid primary key default gen_random_uuid(),
    case_id             uuid not null references cases(id) on delete cascade,

    title               text not null,
    document_type       text not null check (document_type in (
                            'fir_copy', 'panchnama', 'forensic_report', 'witness_statement',
                            'chargesheet', 'court_order', 'evidence_photo', 'evidence_video',
                            'seizure_memo', 'medical_report', 'other'
                        )),

    storage_path        text not null,
    mime_type           text,
    file_size_bytes     bigint,

    file_hash_sha256    text not null,

    is_redacted         boolean not null default false,
    ocr_extracted_text  text,

    -- Human verification state.
    status              text not null default 'pending_review'
                            check (status in ('pending_review', 'verified', 'flagged_tampered', 'archived')),

    -- OCR/extraction pipeline state — independent of the above.
    extraction_status   text not null default 'pending'
                            check (extraction_status in ('pending', 'processing', 'completed', 'failed')),

    uploaded_by         uuid not null references profiles(id),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

comment on table documents is 'One row per evidence file, attached to a case.';
comment on column documents.extraction_status is 'Tracks the OCR/extraction pipeline state, separate from documents.status (human verification).';

-- ---------------------------------------------------------------------
-- 4. DOCUMENT_VERSIONS
-- ---------------------------------------------------------------------
create table if not exists document_versions (
    id                  uuid primary key default gen_random_uuid(),
    document_id         uuid not null references documents(id) on delete cascade,
    version_number      int not null,

    storage_path        text not null,
    file_hash_sha256    text not null,

    change_reason       text,
    changed_by          uuid not null references profiles(id),
    created_at          timestamptz not null default now(),

    constraint uq_document_version unique (document_id, version_number)
);

comment on table document_versions is 'Immutable version history per document — never overwrite, always append.';

-- ---------------------------------------------------------------------
-- 5. HANDOFFS  (chain of custody)
-- ---------------------------------------------------------------------
create table if not exists handoffs (
    id                  uuid primary key default gen_random_uuid(),
    case_id             uuid not null references cases(id) on delete cascade,
    document_id         uuid references documents(id) on delete set null,

    handed_over_by      uuid not null references profiles(id),
    handed_over_to      uuid not null references profiles(id),
    handover_timestamp  timestamptz not null default now(),

    purpose             text,
    location             text,
    remarks             text,

    created_at          timestamptz not null default now()
);

comment on table handoffs is 'Chain-of-custody ledger. One row per transfer of a document/piece of evidence between people.';

-- ---------------------------------------------------------------------
-- 6. AUDIT_LOGS
-- ---------------------------------------------------------------------
create table if not exists audit_logs (
    id              uuid primary key default gen_random_uuid(),
    actor_id        uuid references profiles(id),
    action          text not null,
    entity_type     text not null,
    entity_id       uuid,
    metadata        jsonb,
    ip_address      inet,
    created_at      timestamptz not null default now()
);

comment on table audit_logs is 'Generic action trail across the app, independent of the chain-of-custody ledger.';

-- ---------------------------------------------------------------------
-- 7. INTEGRITY_RECORDS  (permissioned-ledger anchor)
-- ---------------------------------------------------------------------
create table if not exists integrity_records (
    id                  uuid primary key default gen_random_uuid(),
    document_id         uuid not null references documents(id) on delete cascade,
    case_id             uuid not null references cases(id) on delete cascade,

    file_hash_sha256    text not null,
    previous_hash       text,
    ledger_tx_id        text,
    anchor_status       text not null default 'pending'
                            check (anchor_status in ('pending', 'confirmed', 'failed')),

    block_timestamp     timestamptz,
    verified_at         timestamptz,
    created_at          timestamptz not null default now()
);

comment on table integrity_records is 'Off-chain hash + on-ledger anchor records. Documents themselves never leave Supabase storage.';

-- ---------------------------------------------------------------------
-- 8. EXTRACTED_FIELDS
-- ---------------------------------------------------------------------
-- One row per extracted field per document, with the OCR/extraction
-- model's confidence score and the officer's review outcome. This is
-- what the frontend reads to show a confidence badge next to each
-- field and let the officer confirm/correct it individually.
--
-- The confidence THRESHOLD (e.g. "flag anything under 0.85") lives in
-- FastAPI/frontend config, not the DB, so it can change without a migration.
create table if not exists extracted_fields (
    id                  uuid primary key default gen_random_uuid(),
    document_id         uuid not null references documents(id) on delete cascade,
    case_id             uuid not null references cases(id) on delete cascade,

    field_name          text not null,      -- e.g. 'fir_number', 'complainant_name', 'incident_date'
    extracted_value     text,
    confidence_score    numeric(4,3) not null check (confidence_score >= 0 and confidence_score <= 1),

    review_status       text not null default 'pending_review'
                            check (review_status in ('pending_review', 'verified', 'corrected', 'rejected')),

    corrected_value      text,
    reviewed_by          uuid references profiles(id),
    reviewed_at          timestamptz,

    created_at           timestamptz not null default now()
);

comment on table extracted_fields is 'One row per extracted field per document, with confidence score and human review status. Audit trail between raw extraction and confirmed values.';

-- ---------------------------------------------------------------------
-- 9. PGVECTOR — DOCUMENT EMBEDDINGS
-- ---------------------------------------------------------------------
create table if not exists document_embeddings (
    id              uuid primary key default gen_random_uuid(),
    document_id     uuid not null references documents(id) on delete cascade,
    case_id         uuid not null references cases(id) on delete cascade,

    chunk_index     int not null,
    content_chunk   text not null,
    embedding       vector(1536),           -- adjust dim to match the embedding model FastAPI uses

    created_at      timestamptz not null default now(),

    constraint uq_document_chunk unique (document_id, chunk_index)
);

comment on table document_embeddings is 'Chunked OCR text + embeddings per document, for semantic search across a case.';

-- ---------------------------------------------------------------------
-- 10. CASES SEARCH TRIGGER
-- ---------------------------------------------------------------------
-- Auto-maintains cases.search_vector from title/FIR/CNR/court number/
-- description, weighted so identifier matches rank above description matches.
create or replace function cases_search_vector_update() returns trigger as $$
begin
    new.search_vector :=
        setweight(to_tsvector('english', coalesce(new.case_title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(new.fir_number, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(new.cnr_number, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(new.court_case_number, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_cases_search_vector on cases;
create trigger trg_cases_search_vector
    before insert or update on cases
    for each row execute function cases_search_vector_update();

-- ---------------------------------------------------------------------
-- 11. STORAGE BUCKET
-- ---------------------------------------------------------------------
-- Private: evidence documents are confidential by default. Access
-- goes through signed URLs issued by FastAPI after a role/RLS check.
insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict (id) do nothing;
-- Path convention: {case_id}/{document_id}/v{version_number}/{filename}

-- ---------------------------------------------------------------------
-- 12. INDEXES
-- ---------------------------------------------------------------------
create index if not exists idx_documents_case_id             on documents(case_id);
create index if not exists idx_documents_extraction_status   on documents(extraction_status);
create index if not exists idx_document_versions_document_id on document_versions(document_id);
create index if not exists idx_handoffs_case_id               on handoffs(case_id);
create index if not exists idx_handoffs_document_id           on handoffs(document_id);
create index if not exists idx_audit_logs_entity              on audit_logs(entity_type, entity_id);
create index if not exists idx_integrity_records_document_id  on integrity_records(document_id);
create index if not exists idx_extracted_fields_document_id   on extracted_fields(document_id);
create index if not exists idx_extracted_fields_case_id       on extracted_fields(case_id);
create index if not exists idx_extracted_fields_review_status on extracted_fields(review_status);
create index if not exists idx_cases_status                   on cases(status);
create index if not exists idx_cases_cnr                      on cases(cnr_number);
create index if not exists idx_cases_search_vector             on cases using gin(search_vector);
-- ivfflat index for approximate nearest-neighbour search on embeddings.
-- Requires ANALYZE after some rows exist; lists=100 is a reasonable default for small/medium datasets.
create index if not exists idx_document_embeddings_vector
    on document_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);
