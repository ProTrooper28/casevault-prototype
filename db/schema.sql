-- =====================================================================
-- SARVEKSHAN — Core Database Schema (Supabase / Postgres)
-- =====================================================================
-- Design principle: CASE is the root object, not a folder/file tree.
-- Every other table hangs off case_id (directly or via document_id),
-- which is what unlocks case timelines, custody trails, and
-- relationship mapping later — a flat file store can't give you that.
--
-- Run order matters: extensions -> profiles -> cases -> documents ->
-- document_versions -> handoffs -> audit_logs -> integrity_records ->
-- document_embeddings -> storage bucket -> indexes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
-- pgcrypto: gen_random_uuid() for primary keys.
-- vector (pgvector): stores document embeddings for semantic/OCR search.
create extension if not exists pgcrypto;
create extension if not exists vector;

-- ---------------------------------------------------------------------
-- 1. PROFILES
-- ---------------------------------------------------------------------
-- Why: Supabase auth.users only holds login credentials (email, password
-- hash). We never modify that table. `profiles` is our app-level identity
-- table — 1:1 with auth.users — holding role, department, badge number,
-- everything FastAPI/RLS logic needs about "who is this person".
create table if not exists profiles (
    id              uuid primary key references auth.users(id) on delete cascade,
    full_name       text not null,
    -- role drives RBAC in FastAPI + Supabase RLS policies later.
    role            text not null check (
                        role in ('admin', 'investigator', 'forensic_analyst',
                                  'prosecutor', 'judge', 'clerk', 'auditor')
                    ),
    department      text,           -- e.g. 'Delhi Police - Crime Branch'
    badge_number    text unique,    -- nullable: judges/prosecutors may not have one
    phone           text,
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

comment on table profiles is 'App-level identity + role for every authenticated user. 1:1 with auth.users.';

-- ---------------------------------------------------------------------
-- 2. CASES  (root object of the whole system)
-- ---------------------------------------------------------------------
-- Why case-centric: documents, custody handoffs, audit trail and
-- embeddings all reference a case. This is what turns "upload/search/
-- RBAC" into a case intelligence platform — the case is the spine,
-- documents are just one type of thing attached to it.
--
-- FIR fields: an FIR number is only an ANNUAL SERIAL NUMBER inside a
-- single police station's register — it repeats every year and across
-- stations, so it can NEVER be a standalone unique/primary key. We
-- store it as a composite: (fir_state, fir_district, fir_police_station,
-- fir_year, fir_number). That 5-tuple is the real unique identity of an FIR.
--
-- CNR fields: CNR (Case Number Record) is the actual nationally-unique
-- 16-character court case identifier (format roughly: 2-letter state
-- code + court/establishment code + 6-digit running number + 4-digit
-- year, e.g. DLHC010012342023). It ONLY exists once the case is
-- registered in court — so it must be nullable, and gets filled in
-- later (often auto-extracted from a chargesheet/court order document).
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
    fir_number              text,          -- raw serial as printed, e.g. "228/2025"
    fir_state               text,
    fir_district            text,
    fir_police_station      text,
    fir_year                int check (fir_year between 1900 and 2100),
    fir_date                date,
    fir_sections            text[],        -- IPC/BNS sections invoked

    -- ---- Court / CNR block (fills in later, once proceedings start) ----
    cnr_number              text,          -- 16-char, nationally unique when present
    court_name              text,
    court_case_number       text,          -- human filing no., e.g. "CC 1/2026" (NOT unique alone)
    court_case_filed_date   date,

    lead_investigator_id    uuid references profiles(id),
    created_by              uuid not null references profiles(id),

    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),

    -- An FIR number is only unique WITHIN one station+year, so the
    -- uniqueness constraint has to be on the full tuple, not the number
    -- alone. NULLS are allowed (case may exist before FIR is logged).
    constraint uq_fir_identity unique (fir_state, fir_district, fir_police_station, fir_year, fir_number),

    -- CNR really is globally unique once assigned — 16 chars per the
    -- eCommittee/NIC spec. Enforce the length when it's populated;
    -- leave it null until court proceedings begin.
    constraint uq_cnr_number unique (cnr_number),
    constraint chk_cnr_length check (cnr_number is null or char_length(cnr_number) = 16)
);

comment on table cases is 'Root object. Every document, handoff, audit entry and embedding traces back to a case.';
comment on column cases.fir_number is 'Raw FIR serial as printed on the document. Only unique combined with station+year — see uq_fir_identity.';
comment on column cases.cnr_number is '16-char national court case identifier. Null until the case is registered in court.';

-- ---------------------------------------------------------------------
-- 3. DOCUMENTS
-- ---------------------------------------------------------------------
-- Why: every uploaded file is a document ATTACHED to a case — never a
-- bare file in a folder. file_hash_sha256 is the field that actually
-- answers "evidentiary integrity": it's computed at upload time and
-- re-checked on every access, which is what integrity_records anchors
-- externally (see table 7).
create table if not exists documents (
    id                  uuid primary key default gen_random_uuid(),
    case_id             uuid not null references cases(id) on delete cascade,

    title               text not null,
    document_type       text not null check (document_type in (
                            'fir_copy', 'panchnama', 'forensic_report', 'witness_statement',
                            'chargesheet', 'court_order', 'evidence_photo', 'evidence_video',
                            'seizure_memo', 'medical_report', 'other'
                        )),

    storage_path        text not null,      -- path inside the case-documents bucket (see section 8)
    mime_type           text,
    file_size_bytes     bigint,

    -- Integrity: SHA-256 of the file bytes at upload time. Any later
    -- mismatch between this and a re-computed hash = tamper flag.
    file_hash_sha256    text not null,

    is_redacted         boolean not null default false,
    ocr_extracted_text  text,               -- feeds document_embeddings (section 6)

    status              text not null default 'pending_review'
                            check (status in ('pending_review', 'verified', 'flagged_tampered', 'archived')),

    uploaded_by         uuid not null references profiles(id),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

comment on table documents is 'One row per evidence file, attached to a case. file_hash_sha256 is the integrity anchor.';

-- ---------------------------------------------------------------------
-- 4. DOCUMENT_VERSIONS
-- ---------------------------------------------------------------------
-- Why: documents get re-uploaded/re-processed (e.g. after OCR cleanup
-- or redaction). We never overwrite — we version, so nothing that once
-- existed can quietly disappear.
create table if not exists document_versions (
    id                  uuid primary key default gen_random_uuid(),
    document_id         uuid not null references documents(id) on delete cascade,
    version_number      int not null,

    storage_path        text not null,
    file_hash_sha256    text not null,

    change_reason       text,               -- e.g. 'redaction applied', 'OCR re-run'
    changed_by          uuid not null references profiles(id),
    created_at          timestamptz not null default now(),

    constraint uq_document_version unique (document_id, version_number)
);

comment on table document_versions is 'Immutable version history per document — never overwrite, always append.';

-- ---------------------------------------------------------------------
-- 5. HANDOFFS  (chain of custody)
-- ---------------------------------------------------------------------
-- Why: this is the table that directly answers what Indian courts
-- challenge when evidence is disputed — an unbroken, timestamped
-- record of who held a piece of evidence and when it moved hands.
create table if not exists handoffs (
    id                  uuid primary key default gen_random_uuid(),
    case_id             uuid not null references cases(id) on delete cascade,
    document_id         uuid references documents(id) on delete set null,

    handed_over_by      uuid not null references profiles(id),
    handed_over_to      uuid not null references profiles(id),
    handover_timestamp  timestamptz not null default now(),

    purpose             text,               -- e.g. 'forensic analysis', 'court submission'
    location             text,
    remarks             text,

    created_at          timestamptz not null default now()
);

comment on table handoffs is 'Chain-of-custody ledger. One row per transfer of a document/piece of evidence between people.';

-- ---------------------------------------------------------------------
-- 6. AUDIT_LOGS
-- ---------------------------------------------------------------------
-- Why: every read/write action needs to be attributable, independent
-- of the custody table (which only covers physical/logical handoffs).
-- This is the generic "who did what, when" trail across the whole app.
create table if not exists audit_logs (
    id              uuid primary key default gen_random_uuid(),
    actor_id        uuid references profiles(id),
    action          text not null,          -- 'upload', 'view', 'download', 'edit', 'redact', 'login', ...
    entity_type     text not null,          -- 'case' | 'document' | 'handoff' | 'profile'
    entity_id       uuid,
    metadata        jsonb,
    ip_address      inet,
    created_at      timestamptz not null default now()
);

comment on table audit_logs is 'Generic action trail across the app, independent of the chain-of-custody ledger.';

-- ---------------------------------------------------------------------
-- 7. INTEGRITY_RECORDS  (permissioned-ledger anchor)
-- ---------------------------------------------------------------------
-- Why: this is the tamper-detection layer. We do NOT put documents on
-- a blockchain — only (case_id + file_hash + timestamp) gets anchored
-- to a permissioned ledger (e.g. Hyperledger Fabric), because that's
-- the technically correct choice for confidential government evidence:
-- narrow, private, and cheap to verify, instead of a public chain.
create table if not exists integrity_records (
    id                  uuid primary key default gen_random_uuid(),
    document_id         uuid not null references documents(id) on delete cascade,
    case_id             uuid not null references cases(id) on delete cascade,

    file_hash_sha256    text not null,
    previous_hash       text,               -- optional hash-chaining within a case's ledger
    ledger_tx_id        text,               -- transaction id returned by the permissioned ledger
    anchor_status       text not null default 'pending'
                            check (anchor_status in ('pending', 'confirmed', 'failed')),

    block_timestamp     timestamptz,
    verified_at         timestamptz,
    created_at          timestamptz not null default now()
);

comment on table integrity_records is 'Off-chain hash + on-ledger anchor records. Documents themselves never leave Supabase storage.';

-- ---------------------------------------------------------------------
-- 8. STORAGE BUCKET
-- ---------------------------------------------------------------------
-- Why private: evidence documents are confidential by default. Access
-- goes through signed URLs issued by FastAPI after an RLS/role check,
-- never a public bucket.
insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict (id) do nothing;
-- Convention for storage_path values above: {case_id}/{document_id}/v{version_number}/{filename}

-- ---------------------------------------------------------------------
-- 9. PGVECTOR — DOCUMENT EMBEDDINGS
-- ---------------------------------------------------------------------
-- Why: OCR text gets chunked and embedded so the "find related
-- documents/cases" and semantic search features can work. Kept as a
-- separate table (not a column on documents) because one document can
-- produce many chunks/embeddings.
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
-- 10. INDEXES
-- ---------------------------------------------------------------------
create index if not exists idx_documents_case_id            on documents(case_id);
create index if not exists idx_document_versions_document_id on document_versions(document_id);
create index if not exists idx_handoffs_case_id              on handoffs(case_id);
create index if not exists idx_handoffs_document_id          on handoffs(document_id);
create index if not exists idx_audit_logs_entity              on audit_logs(entity_type, entity_id);
create index if not exists idx_integrity_records_document_id on integrity_records(document_id);
create index if not exists idx_cases_status                  on cases(status);
create index if not exists idx_cases_cnr                     on cases(cnr_number);
-- ivfflat index for approximate nearest-neighbour search on embeddings.
-- Requires ANALYZE after some rows exist; lists=100 is a reasonable default for small/medium datasets.
create index if not exists idx_document_embeddings_vector
    on document_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);
