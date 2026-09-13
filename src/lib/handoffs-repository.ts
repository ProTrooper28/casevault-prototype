import { useCallback, useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/* -------------------------------------------------------------------------- */
/*  Workflow handoffs — police → forensic document transfers (Step 6).        */
/*  Real rows in public.workflow_handoffs; status always comes from the DB.   */
/* -------------------------------------------------------------------------- */

export type HandoffStatus = "Pending" | "Accepted" | "Rejected";

export type HandoffRow = {
  id: string;
  case_id: string;
  document_id: string | null;
  from_department: string;
  from_user: string;
  to_department: string;
  to_user: string;
  status: HandoffStatus;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
};

export type Handoff = {
  id: string;
  caseId: string;
  documentId: string | null;
  fromUser: string;
  toUser: string;
  status: HandoffStatus;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
};

export function handoffRowToHandoff(r: HandoffRow): Handoff {
  return {
    id: r.id,
    caseId: r.case_id,
    documentId: r.document_id,
    fromUser: r.from_user,
    toUser: r.to_user,
    status: r.status,
    notes: r.notes,
    rejectionReason: r.rejection_reason,
    createdAt: r.created_at,
    acceptedAt: r.accepted_at,
    rejectedAt: r.rejected_at,
  };
}

export type CreateHandoffInput = {
  caseId: string;
  documentId: string | null;
  fromUser: string;
  toUser: string;
  notes?: string | undefined;
};

export type CreateHandoffResult =
  | { ok: true; handoff: Handoff }
  | { ok: false; error: string };

/** Police sends a document/case to Forensic — status always starts Pending. */
export async function createHandoff(input: CreateHandoffInput): Promise<CreateHandoffResult> {
  const sb = getSupabase();
  if (!sb) {
    return { ok: false, error: "Supabase is not connected — handoffs need the database." };
  }
  const row = {
    case_id: input.caseId,
    document_id: input.documentId,
    from_department: "POLICE",
    from_user: input.fromUser,
    to_department: "FORENSIC",
    to_user: input.toUser,
    status: "Pending" as const,
    notes: input.notes?.trim() || null,
  };
  const { data, error } = await sb
    .from("workflow_handoffs")
    .insert(row)
    .select("*")
    .single<HandoffRow>();
  if (error) return { ok: false, error: error.message };
  return { ok: true, handoff: handoffRowToHandoff(data) };
}

export type DecideHandoffResult =
  | { ok: true; handoff: Handoff }
  | { ok: false; error: string };

/** Forensic accepts — status Accepted + accepted_at timestamp from the server. */
export async function acceptHandoff(id: string): Promise<DecideHandoffResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase is not connected." };
  const { data, error } = await sb
    .from("workflow_handoffs")
    .update({ status: "Accepted", accepted_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single<HandoffRow>();
  if (error) return { ok: false, error: error.message };
  return { ok: true, handoff: handoffRowToHandoff(data) };
}

/** Forensic rejects — a user-entered reason is REQUIRED. */
export async function rejectHandoff(
  id: string,
  rejectionReason: string,
): Promise<DecideHandoffResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase is not connected." };
  const reason = rejectionReason.trim();
  if (!reason) return { ok: false, error: "A rejection reason is required." };
  const { data, error } = await sb
    .from("workflow_handoffs")
    .update({
      status: "Rejected",
      rejection_reason: reason,
      rejected_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single<HandoffRow>();
  if (error) return { ok: false, error: error.message };
  return { ok: true, handoff: handoffRowToHandoff(data) };
}

let cacheHandoffs: Handoff[] = [];

export function cachedHandoffs(): Handoff[] {
  return cacheHandoffs;
}

/** Reactive handoffs list, newest first. Status is read from the DB, never UI state. */
export function useHandoffs(): {
  handoffs: Handoff[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [handoffs, setHandoffs] = useState<Handoff[]>(cacheHandoffs);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      cacheHandoffs = [];
      setHandoffs([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    sb.from("workflow_handoffs")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setHandoffs([]);
        } else {
          const mapped = ((data ?? []) as HandoffRow[]).map(handoffRowToHandoff);
          cacheHandoffs = mapped;
          setHandoffs(mapped);
          setError(null);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { handoffs, loading, error, refresh };
}

/** Update the local cache after a create/accept/reject so lists reflect immediately. */
export function replaceCachedHandoff(updated: Handoff): void {
  const exists = cacheHandoffs.some((h) => h.id === updated.id);
  cacheHandoffs = exists
    ? cacheHandoffs.map((h) => (h.id === updated.id ? updated : h))
    : [updated, ...cacheHandoffs];
}
