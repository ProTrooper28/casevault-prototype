# Sarvekshan — Database Schema

Database layer for the Sarvekshan case/evidence management platform (Supabase/Postgres).
This repo holds only the schema — the FastAPI backend consuming it lives in a separate repo.

## Why this structure (case-centric, not file-centric)

`cases` is the root object. Every other table points back to a `case_id`
(directly, or indirectly via `document_id`). That one modeling decision is
what makes later features possible without a schema rewrite:

- **Case timeline** — union of `documents.created_at`, `handoffs.handover_timestamp`,
  `audit_logs.created_at` filtered by `case_id`.
- **Chain of custody** — `handoffs` gives an unbroken, timestamped record of
  who held a piece of evidence and when it moved — this is the thing courts
  actually contest, more than storage or search.
- **Tamper detection** — `documents.file_hash_sha256` + `integrity_records`
  give you a hash computed at upload time and anchored externally, so any
  later mismatch is detectable.

If we'd modeled this as folders/files (a DMS), none of the above falls out
naturally — you'd be bolting it on later.

## Table-by-table

| Table | What it holds | Why it exists separately |
|---|---|---|
| `profiles` | App-level identity (role, department, badge no.) | `auth.users` (Supabase-managed) only has login creds — never touched directly |
| `cases` | The root case record, including FIR + CNR identity | Single source of truth for "which case is this" |
| `documents` | One row per uploaded evidence file | Holds the integrity hash + OCR text |
| `document_versions` | Version history per document | Documents are versioned, never overwritten |
| `handoffs` | Chain-of-custody transfers | Separate from generic audit — this is the legal trail |
| `audit_logs` | Generic "who did what, when" | Covers reads/views too, not just custody transfers |
| `integrity_records` | Hash + permissioned-ledger anchor per document | Keeps blockchain logic isolated from the document table |
| `document_embeddings` | Chunked OCR text + pgvector embeddings | One document → many chunks, so it can't live as a column |

## FIR number — verified, and NOT used as a standalone key

Checked this before modeling it. An FIR number is only an **annual serial
number inside a single police station's register** — every station restarts
its own count each calendar year, so the same number repeats across
stations and across years. That means an FIR number alone can collide and
can never be a primary/unique key by itself.

**What we did instead:** a composite uniqueness constraint on
`(fir_state, fir_district, fir_police_station, fir_year, fir_number)` in
`cases`. That 5-tuple is the actual unique identity of an FIR. All five
columns are nullable together, since a case can exist in the system before
the FIR is logged.

## Court case number — use CNR, not a generic "case number"

A plain "court case number" (like `CC 1/2026`) is **not** globally unique —
the same style of number recurs across different courts. The number that
actually is unique across the whole country is the **CNR (Case Number
Record)**: a 16-character code assigned once a case is registered in
court, and it stays with the case for its entire life.

**What we did:**
- `cases.cnr_number` — `unique`, `char_length = 16` when present.
- `cases.court_case_number` — kept as a separate, non-unique, human-readable
  field (e.g. `CC 1/2026`) for display alongside the CNR.
- Both are **nullable**, because they don't exist until court proceedings
  begin. The intent (per the brief) is that once proceedings start, these
  fields get auto-filled from an uploaded chargesheet/court order via
  document extraction — so `cnr_number` and `court_case_number` should be
  named exactly this way in the extraction pipeline output, so FastAPI can
  write straight into these columns without a translation layer.

## Field naming for document-extraction handoff

Since document extraction will populate several `cases` fields
automatically (FIR block, CNR block), the column names above are the
contract between the extraction service and the DB. Don't rename them
downstream — if the extraction output needs different names, map them to
these column names at the FastAPI layer, not by renaming the schema.

## Storage

- Bucket: `case-documents`, **private** (not public). Access goes through
  signed URLs issued by FastAPI after a role/RLS check — evidence is
  confidential by default.
- Path convention: `{case_id}/{document_id}/v{version_number}/{filename}`

## Blockchain / integrity design (why it's narrow, not everywhere)

Only `file_hash_sha256 + case_id + timestamp` gets anchored externally
(`integrity_records.ledger_tx_id`), on a **permissioned ledger** — not a
public chain. The actual documents never leave Supabase storage. This is
both the easier build and the technically correct choice for confidential
government evidence: public chains give you no confidentiality and no
access control, and you don't need a public chain's trust model when the
set of validators (police, forensics, judiciary) is already known and
permissioned.

## What's next for the FastAPI side

1. Read `schema.sql` top to bottom — comments explain the "why" inline.
2. RLS policies aren't included yet (deliberately) — role checks in
   `profiles.role` should drive them once the API's auth flow is settled.
   Flag before writing policies so we agree on read/write rules per role.
3. Embedding dimension in `document_embeddings.embedding` is set to
   `vector(1536)` — change this to match whichever embedding model gets
   used; it must match exactly or inserts will fail.
4. Run `schema.sql` on a fresh Supabase project via the SQL editor, or via
   `supabase db push` if migrations are set up.

## Files

- `schema.sql` — the full schema, in dependency order, heavily commented.
