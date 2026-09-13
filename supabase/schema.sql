-- ============================================================================
-- CaseVault AI — Supabase schema (fully idempotent)
-- Safe to run repeatedly and against a PARTIALLY-created database:
--   • tables / indexes / extension   → IF NOT EXISTS
--   • trigger function               → CREATE OR REPLACE
--   • triggers and RLS policies      → atomic DO blocks with
--     DROP IF EXISTS + CREATE, plus duplicate_object guards
-- Mirrors the frontend domain types in src/lib/supabase.ts.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- cases ----
create table if not exists public.cases (
  id            text primary key,              -- e.g. FIR-2026-00124
  title         text not null,
  case_type     text not null,
  location      text,
  status        text not null default 'Active'
                check (status in ('Active', 'Under Review', 'Closed')),
  priority      text check (priority in ('High', 'Medium', 'Low')),
  investigator  text,
  opened_on     date,
  summary       text,
  sections      jsonb default '[]'::jsonb,     -- ["IPC 379", ...]
  people        jsonb default '[]'::jsonb,     -- [{name, role, detail}]
  dates         jsonb default '[]'::jsonb,     -- [{label, value}]
  officers      jsonb default '[]'::jsonb,     -- [{name, role, unit}]
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ------------------------------------------------------------ documents ----
create table if not exists public.documents (
  id          text primary key,                -- e.g. DOC-10241
  case_id     text not null references public.cases(id) on delete cascade,
  name        text not null,
  category    text,
  doc_type    text,
  uploaded_by text,
  doc_date    text,                            -- display date, prototype parity
  version     text default '1.0',
  integrity   text not null default 'verified'
              check (integrity in ('verified', 'pending', 'compromised')),
  access      text check (access in ('Restricted', 'Confidential', 'Internal')),
  sha256      text,
  pages       integer,
  case_type   text,
  location    text,
  persons     jsonb default '[]'::jsonb,
  sections    jsonb default '[]'::jsonb,
  extracted   jsonb default '[]'::jsonb,       -- [{label, value}]
  summary     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists documents_case_id_idx on public.documents (case_id);

-- ------------------------------------------------------------- evidence ----
create table if not exists public.evidence (
  id            text primary key,              -- e.g. EV-001
  case_id       text not null references public.cases(id) on delete cascade,
  description   text not null,
  evidence_type text check (evidence_type in ('Document', 'Image', 'Video', 'Audio', 'Other')),
  collected     text,
  submitted_by  text,
  custodian     text,
  integrity     text not null default 'verified'
                check (integrity in ('verified', 'pending', 'compromised')),
  status        text,
  sha256        text,
  event_id      text,                          -- linked timeline event, nullable
  custody_chain jsonb default '[]'::jsonb,     -- [{stage, date, time, person, action}]
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists evidence_case_id_idx on public.evidence (case_id);

-- ---------------------------------------------------------------- audit ----
create table if not exists public.audit_trail (
  id            bigint generated always as identity primary key,
  case_id       text,
  user_name     text,
  role          text,
  action        text not null,
  document      text,
  status        text default 'Success' check (status in ('Success', 'Warning', 'Blocked')),
  display_date  text,
  display_time  text,
  created_at    timestamptz not null default now()
);

create index if not exists audit_case_id_idx on public.audit_trail (case_id);
create index if not exists audit_created_at_idx on public.audit_trail (created_at desc);

-- -------------------------------------------------------- access grants ----
create table if not exists public.access_grants (
  id            bigint generated always as identity primary key,
  user_name     text not null,
  role          text,
  scope         text not null,                 -- case id, e.g. FIR-2026-00124
  granted       text,                          -- display date
  expires       text,                          -- display date
  status        text default 'Active',
  created_at    timestamptz not null default now(),
  unique (user_name, scope)
);

-- ------------------------------------------------------------ timestamps ---
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $fn$
begin
  new.updated_at = now();
  return new;
end
$fn$;

-- Each DROP + CREATE pair below is a single atomic DO statement, so the
-- trigger can never be created while an old copy still exists — even if a
-- partially-successful earlier run left one behind.
do $trigger$
begin
  drop trigger if exists cases_touch on public.cases;
  create trigger cases_touch
    before update on public.cases
    for each row execute function public.touch_updated_at();
exception
  when duplicate_object then null;  -- already present with same definition
end
$trigger$;

do $trigger$
begin
  drop trigger if exists documents_touch on public.documents;
  create trigger documents_touch
    before update on public.documents
    for each row execute function public.touch_updated_at();
exception
  when duplicate_object then null;
end
$trigger$;

do $trigger$
begin
  drop trigger if exists evidence_touch on public.evidence;
  create trigger evidence_touch
    before update on public.evidence
    for each row execute function public.touch_updated_at();
exception
  when duplicate_object then null;
end
$trigger$;

-- ---------------------------------------------------------------- RLS ------
-- The prototype ships with permissive anon policies so the seeded demo data
-- can round-trip before Supabase Auth is wired in. Tighten to
-- `to authenticated` once sign-in moves to Supabase Auth.
alter table public.cases          enable row level security;
alter table public.documents      enable row level security;
alter table public.evidence       enable row level security;
alter table public.audit_trail    enable row level security;
alter table public.access_grants  enable row level security;

-- Policies are wrapped the same way as triggers: drop + create in one
-- atomic statement with a duplicate_object guard.
do $policy$
begin
  drop policy if exists "anon full access cases" on public.cases;
  create policy "anon full access cases" on public.cases
    for all to anon using (true) with check (true);
exception
  when duplicate_object then null;
end
$policy$;

do $policy$
begin
  drop policy if exists "anon full access documents" on public.documents;
  create policy "anon full access documents" on public.documents
    for all to anon using (true) with check (true);
exception
  when duplicate_object then null;
end
$policy$;

do $policy$
begin
  drop policy if exists "anon full access evidence" on public.evidence;
  create policy "anon full access evidence" on public.evidence
    for all to anon using (true) with check (true);
exception
  when duplicate_object then null;
end
$policy$;

do $policy$
begin
  drop policy if exists "anon full access audit" on public.audit_trail;
  create policy "anon full access audit" on public.audit_trail
    for all to anon using (true) with check (true);
exception
  when duplicate_object then null;
end
$policy$;

do $policy$
begin
  drop policy if exists "anon full access grants" on public.access_grants;
  create policy "anon full access grants" on public.access_grants
    for all to anon using (true) with check (true);
exception
  when duplicate_object then null;
end
$policy$;
