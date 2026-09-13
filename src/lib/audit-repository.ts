import { useCallback, useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { currentActor } from "@/lib/app-state";

/* -------------------------------------------------------------------------- */
/*  Audit repository (Step 7) — every persistent audit event lives in         */
/*  public.audit_trail. No localStorage, no fabricated rows: if Supabase is   */
/*  not connected, recordAuditEvent() returns false and nothing is recorded.  */
/*  The UI is read-only by design; there is no update/delete path here.       */
/* -------------------------------------------------------------------------- */

export type AuditStatus = "Success" | "Warning" | "Blocked";

export type AuditRow = {
  id: number;
  case_id: string | null;
  user_name: string | null;
  role: string | null;
  action: string;
  document: string | null;
  status: AuditStatus | null;
  display_date: string | null;
  display_time: string | null;
  created_at: string;
};

export type AuditEvent = {
  id: number;
  caseId: string | null;
  user: string;
  role: string;
  action: string;
  document: string | null;
  status: AuditStatus;
  date: string; // display date
  time: string; // display time
  createdAt: string; // runtime ISO timestamp (source of ordering)
};

export function auditRowToEvent(r: AuditRow): AuditEvent {
  return {
    id: r.id,
    caseId: r.case_id,
    user: r.user_name ?? "—",
    role: r.role ?? "—",
    action: r.action,
    document: r.document,
    status: r.status ?? "Success",
    date: r.display_date ?? "—",
    time: r.display_time ?? "—",
    createdAt: r.created_at,
  };
}

export type RecordAuditInput = {
  action: string;
  caseId?: string | null;
  document?: string | null;
  status?: AuditStatus;
};

/** Insert one real audit row using the current demo-role identity. */
export async function recordAuditEvent(input: RecordAuditInput): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false; // honest no-op: no DB, no audit record
  const actor = currentActor();
  const now = new Date();
  const row = {
    case_id: input.caseId ?? null,
    user_name: actor.name,
    role: actor.role,
    action: input.action,
    document: input.document ?? null,
    status: input.status ?? ("Success" as AuditStatus),
    display_date: now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    display_time: now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    // created_at defaults to now() on the server; no client timestamp authority
  };
  const { error } = await sb.from("audit_trail").insert(row);
  if (error) {
    console.error("[audit] insert failed:", error.message);
    return false;
  }
  notifyAuditListeners();
  return true;
}

/* ------------------------------ one-shot reads ----------------------------- */

export async function getAuditEventsForCase(
  caseId: string,
  limit = 300,
): Promise<AuditEvent[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("audit_trail")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[audit] case query failed:", error.message);
    return [];
  }
  return ((data ?? []) as AuditRow[]).map(auditRowToEvent);
}

export async function getRecentAuditEvents(limit = 100): Promise<AuditEvent[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("audit_trail")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[audit] recent query failed:", error.message);
    return [];
  }
  return ((data ?? []) as AuditRow[]).map(auditRowToEvent);
}

/* -------------------------- reactive read (hook) --------------------------- */

let cacheEvents: AuditEvent[] = [];
const listeners = new Set<() => void>();

function notifyAuditListeners() {
  listeners.forEach((l) => l());
}

export function cachedAuditEvents(): AuditEvent[] {
  return cacheEvents;
}

/**
 * Live audit feed straight from public.audit_trail, newest first.
 * Pass a caseId to scope it to one case. Refreshes after every insert and on
 * demand — the database is always the source of truth.
 */
export function useAuditEvents(opts?: { caseId?: string; limit?: number }): {
  events: AuditEvent[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const caseId = opts?.caseId;
  const limit = opts?.limit ?? 300;
  const [events, setEvents] = useState<AuditEvent[]>(cacheEvents);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  // Refetch whenever any part of the app records a new event.
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      cacheEvents = [];
      setEvents([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    let q = sb.from("audit_trail").select("*");
    if (caseId) q = q.eq("case_id", caseId);
    q.order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setEvents([]);
        } else {
          const mapped = ((data ?? []) as AuditRow[]).map(auditRowToEvent);
          cacheEvents = mapped;
          setEvents(mapped);
          setError(null);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick, caseId, limit]);

  return { events, loading, error, refresh };
}
