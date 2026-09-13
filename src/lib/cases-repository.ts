import { useCallback, useEffect, useState } from "react";
import { CASES, type Case } from "@/lib/mock-data";
import { getSupabase, isSupabaseConfigured, type CaseRow } from "@/lib/supabase";
import { recordAuditEvent } from "@/lib/audit-repository";

/* -------------------------------------------------------------------------- */
/*  Cases repository — single source of truth for case rows.                  */
/*                                                                            */
/*  • When Supabase keys are configured, cases are read from / written to     */
/*    public.cases and merged ahead of the static demo dataset.               */
/*  • When they are not (or a call fails), the app falls back to the existing */
/*    demo CASES so nothing breaks.                                           */
/* -------------------------------------------------------------------------- */

/** Map a `public.cases` row to the frontend `Case` shape. */
export function rowToCase(r: CaseRow): Case {
  return {
    id: r.id,
    title: r.title,
    location: r.location ?? "—",
    status: (r.status as Case["status"]) ?? "Active",
    type: r.case_type,
    investigator: r.investigator ?? "Unassigned",
    openedOn: r.opened_on ?? "—",
    lastUpdated: "Just now",
    priority: (r.priority as Case["priority"]) ?? "Medium",
    summary: r.summary ?? "",
    sections: r.sections ?? [],
    people: r.people ?? [],
    dates: r.dates ?? [],
    officers: r.officers ?? [],
  };
}

/** Map the frontend `Case` shape back to a `public.cases` row. */
export function caseToRow(c: Omit<Case, "lastUpdated">): CaseRow {
  return {
    id: c.id,
    title: c.title,
    case_type: c.type,
    location: c.location,
    status: c.status,
    priority: c.priority,
    investigator: c.investigator,
    opened_on: c.openedOn,
    summary: c.summary,
    sections: c.sections,
    people: c.people,
    dates: c.dates,
    officers: c.officers,
  };
}

export type CreateCaseInput = {
  id: string; // FIR / case number
  title: string;
  type: string;
  location: string;
  incidentDate?: string | undefined;
  policeStation?: string | undefined;
  complainant?: string | undefined;
  accused?: string | undefined;
  sections: string[];
  summary?: string | undefined;
  priority: Case["priority"];
};

export type CreateCaseResult =
  | { ok: true; case: Case; source: "supabase" | "local" }
  | { ok: false; error: string };

/** Called with the freshly created case after a successful registration. */
export type CaseCreatedCallback = (created: Case) => void;

/** Fir-2026-00124 style number derived from today's date + a random serial. */
export function generateFirNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const serial = String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");
  return `FIR-${y}-${serial}`;
}

/** Insert a new FIR row into public.cases (or fall back to demo state). */
export async function createFirCase(input: CreateCaseInput): Promise<CreateCaseResult> {
  const people: Case["people"] = [];
  if (input.complainant?.trim())
    people.push({ name: input.complainant.trim(), role: "Complainant", detail: "" });
  if (input.accused?.trim())
    people.push({ name: input.accused.trim(), role: "Accused", detail: "" });

  const dates: Case["dates"] = [];
  if (input.incidentDate?.trim()) dates.push({ label: "Incident Date", value: input.incidentDate.trim() });
  dates.push({ label: "FIR Registered", value: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) });
  if (input.policeStation?.trim()) dates.push({ label: "Police Station", value: input.policeStation.trim() });

  const officers: Case["officers"] = [];
  if (input.policeStation?.trim())
    officers.push({ name: "Investigating Officer", role: "Police Investigator", unit: input.policeStation.trim() });

  const newCase: Case = {
    id: input.id.trim(),
    title: input.title.trim(),
    location: input.location.trim() || "—",
    status: "Active",
    type: input.type.trim(),
    investigator: input.policeStation?.trim() || "Unassigned",
    openedOn:
      dates[dates.length - 1]?.value ??
      new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    lastUpdated: "Just now",
    priority: input.priority,
    summary: input.summary?.trim() ?? "",
    sections: input.sections,
    people,
    dates,
    officers,
  };

  const sb = getSupabase();
  if (!sb) {
    return {
      ok: false,
      error:
        "Supabase is not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Keys tab to save FIRs permanently.",
    };
  }

  const { error } = await sb.from("cases").insert(caseToRow(newCase));
  if (error) return { ok: false, error: error.message };
  // Reflect the new FIR immediately in one-shot lookups before the next fetch.
  cache = [newCase, ...(cache ?? [])];
  // Real audit record — FIR created (public.audit_trail).
  await recordAuditEvent({
    action: `FIR created — ${newCase.id} (${newCase.type}${input.sections.length ? `, ${input.sections.join(", ")}` : ""})`,
    caseId: newCase.id,
    document: null,
    status: "Success",
  });
  return { ok: true, case: newCase, source: "supabase" };
}

/** One-shot lookup: Supabase-backed cache merged ahead of demo CASES. */
let cache: Case[] | null = null;
export function allCases(): Case[] {
  return [...(cache ?? []), ...CASES];
}

/** True when the id resolves to a REAL database case (not the demo dataset). */
export function isSupabaseCase(id: string): boolean {
  return (cache ?? []).some((c) => c.id === id);
}

/** Look up a case in the cache, else demo data. Sync, never fetches. */
function findCached(id: string): Case | undefined {
  return allCases().find((c) => c.id === id);
}

/**
 * Async case loader that works on cold SSR/deep-link: if the cache misses,
 * fetches the single row from Supabase before falling back to demo data.
 */
export async function getCaseById(id: string): Promise<Case | undefined> {
  const hit = findCached(id);
  if (hit) return hit;
  const sb = getSupabase();
  if (!sb) return undefined;
  const { data, error } = await sb
    .from("cases")
    .select("*")
    .eq("id", id)
    .maybeSingle<CaseRow>();
  if (error || !data) return undefined;
  const mapped = rowToCase(data);
  // Keep the one-shot cache warm for subsequent renders of the same request.
  cache = [mapped, ...(cache ?? [])];
  return mapped;
}

/** Hook: Supabase cases (when configured) merged ahead of the demo dataset. */
export function useCases(): {
  cases: Case[];
  supabaseCases: Case[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [supabaseCases, setSupabaseCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setSupabaseCases([]);
      cache = null;
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    sb.from("cases")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setSupabaseCases([]);
        } else {
          setError(null);
          const mapped = (data ?? []).map(rowToCase);
          setSupabaseCases(mapped);
          cache = mapped; // keep one-shot allCases() in sync for the workspace route
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { cases: [...supabaseCases, ...CASES], supabaseCases, loading, error, refresh };
}
