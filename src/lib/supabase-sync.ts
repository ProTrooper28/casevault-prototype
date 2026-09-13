import type { AppState } from "@/lib/app-state";
import {
  ACCESS_GRANTS,
  AUDIT_TRAIL,
  CASES,
  DOCUMENTS,
  type AuditEntry,
  type Case,
  type Document,
} from "@/lib/mock-data";
import { EVIDENCE_REGISTER } from "@/lib/evidence-register";
import { getSupabase, isSupabaseConfigured, type CaseRow, type DocumentRow, type EvidenceRow } from "@/lib/supabase";

/* -------------------------------------------------------------------------- */
/*  Supabase sync helpers — the bridge between the local demo-state store     */
/*  and a Supabase Postgres project.                                          */
/*                                                                            */
/*  • testSupabaseConnection() — verifies URL + anon key against the REST API */
/*  • pushSnapshotToSupabase() — upserts the prototype's full demo dataset    */
/*    (cases, documents, evidence, audit, grants) into the matching tables.   */
/*                                                                            */
/*  Every helper degrades gracefully: while the VITE_SUPABASE_* keys are      */
/*  missing (or the network/schema is unavailable) the app keeps running on   */
/*  its local store and simply reports the failure to the caller.             */
/* -------------------------------------------------------------------------- */

export type SupabaseCheck =
  | { ok: true; message: string }
  | { ok: false; message: string };

function fail(message: string): SupabaseCheck {
  return { ok: false, message };
}

/** Minimal reachability + credentials probe (uses the count endpoint). */
export async function testSupabaseConnection(): Promise<SupabaseCheck> {
  const sb = getSupabase();
  if (!sb) return fail("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Keys tab to connect.");

  const { error, count } = await sb.from("cases").select("id", { count: "exact", head: true });
  if (error) return fail(error.message);
  return { ok: true, message: `Connected — ${count ?? 0} case record(s) found.` };
}

/* ------------------------------- mappers ---------------------------------- */

export function toCaseRow(c: Case): CaseRow {
  return {
    id: c.id,
    title: c.title,
    case_type: c.type,
    location: c.location,
    status: c.status,
    priority: c.priority,
    investigator: c.investigator,
    opened_on: null, // display date string; real dates can replace this later
    summary: c.summary,
    sections: c.sections,
    people: c.people,
    dates: c.dates,
    officers: c.officers,
  };
}

export function toDocumentRow(d: Document): DocumentRow {
  return {
    id: d.id,
    case_id: d.caseId,
    name: d.name,
    category: d.category,
    doc_type: d.type,
    uploaded_by: d.uploadedBy,
    doc_date: d.date,
    version: d.version,
    integrity: d.integrity,
    access: d.access,
    sha256: d.hash,
    pages: d.pages,
    case_type: d.caseType,
    location: d.location,
    persons: d.persons,
    sections: d.sections,
    extracted: d.extracted,
    summary: d.summary,
  };
}

export function toEvidenceRow(e: (typeof EVIDENCE_REGISTER)[number]): EvidenceRow {
  return {
    id: e.id,
    case_id: e.caseId,
    description: e.description,
    evidence_type: e.type,
    collected: e.collected,
    submitted_by: e.submittedBy,
    custodian: e.custodian,
    integrity: e.integrity,
    status: e.status,
    sha256: e.hash,
    event_id: e.eventId ?? null,
    custody_chain: e.custodyChain,
  };
}

function toAuditRows(entries: AuditEntry[]) {
  return entries.map((a) => ({
    case_id: a.caseId,
    user_name: a.user,
    role: a.role,
    action: a.action,
    document: a.document,
    status: a.status,
    display_date: a.date,
    display_time: a.time,
  }));
}

/* ------------------------------- snapshot push ----------------------------- */

export type PushResult = {
  ok: boolean;
  message: string;
  counts?: { cases: number; documents: number; evidence: number; audit: number; grants: number };
};

/** Chunked upsert — PostgREST/Supabase accept ~1000 rows per call comfortably. */
async function upsertChunked(
  table: string,
  rows: Record<string, unknown>[],
  chunkSize = 500,
): Promise<{ ok: boolean; message: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, message: "Supabase client unavailable" };
  const client = sb.from(table) as unknown as {
    upsert: (rows: Record<string, unknown>[], opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
  };
  for (let i = 0; i < Math.max(rows.length, 1); i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await client.upsert(chunk, { onConflict: "id" });
    if (error) return { ok: false, message: `${table}: ${error.message}` };
  }
  return { ok: true, message: `${table}: ${rows.length} row(s) synced` };
}

/**
 * Push the full prototype dataset to Supabase. Upserts are idempotent —
 * running it twice never duplicates rows. Evidence is taken from the
 * evidence register (EV-…) which mirrors the case workspaces.
 */
export async function pushSnapshotToSupabase(state: AppState): Promise<PushResult> {
  if (!getSupabase()) {
    return {
      ok: false,
      message: "Not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Keys tab first.",
    };
  }

  const cases = CASES.map(toCaseRow);
  const documents = [...state.documents, ...DOCUMENTS].map(toDocumentRow);
  const evidence = EVIDENCE_REGISTER.map(toEvidenceRow);
  const audit = toAuditRows([...state.audit, ...AUDIT_TRAIL]);
  const grants = [...state.grants, ...ACCESS_GRANTS].map((g) => ({
    user_name: g.user,
    role: g.role,
    scope: g.scope,
    granted: g.granted,
    expires: g.expires,
    status: g.status,
  }));

  try {
    const results = [
      await upsertChunked("cases", cases),
      await upsertChunked("documents", documents),
      await upsertChunked("evidence", evidence),
      await upsertChunked("audit_trail", audit as unknown as Record<string, unknown>[]),
      await upsertChunked("access_grants", grants as unknown as Record<string, unknown>[]),
    ];
    const failed = results.find((r) => !r.ok);
    if (failed) return { ok: false, message: failed.message };
    return {
      ok: true,
      message: "Prototype dataset synced to Supabase.",
      counts: {
        cases: cases.length,
        documents: documents.length,
        evidence: evidence.length,
        audit: audit.length,
        grants: grants.length,
      },
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Unknown network error" };
  }
}

/** Convenience probe used by the Settings panel (and future loaders). */
export async function supabaseRowCounts(): Promise<Record<string, number>> {
  const sb = getSupabase();
  if (!sb) return {};
  const out: Record<string, number> = {};
  for (const table of ["cases", "documents", "evidence", "audit_trail", "access_grants"]) {
    const { count, error } = await sb.from(table).select("id", { count: "exact", head: true });
    out[table] = error ? -1 : (count ?? 0);
  }
  return out;
}
