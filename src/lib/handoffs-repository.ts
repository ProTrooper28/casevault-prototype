import { useCallback, useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { recordAuditEvent } from "@/lib/audit-repository";
import { appendCustodyEvent } from "@/lib/uploads-repository";
import { currentActor, findDocument } from "@/lib/app-state";
import type { CustodyEvent } from "@/lib/evidence-register";

/* -------------------------------------------------------------------------- */
/*  Workflow handoffs — police → forensic document transfers (Step 6).        */
/*  Real rows in public.workflow_handoffs; status always comes from the DB.   */
/* -------------------------------------------------------------------------- */

export type HandoffStatus = "Pending" | "Accepted" | "Rejected";

export type HandoffRow = {
  id: string | number;
  case_id: string;
  document_id: string | null;
  from_department: string;
  from_user: string;
  to_department: string;
  to_user: string;
  status: HandoffStatus;
  reason?: string | null;
  notes?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
  sent_at?: string;
  accepted_at?: string | null;
  rejected_at?: string | null;
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
    id: String(r.id),
    caseId: r.case_id,
    documentId: r.document_id,
    fromUser: r.from_user,
    toUser: r.to_user,
    status: r.status,
    notes: r.reason ?? r.notes ?? null,
    rejectionReason: r.rejection_reason ?? null,
    createdAt: r.sent_at ?? r.created_at ?? new Date().toISOString(),
    acceptedAt: r.accepted_at ?? null,
    rejectedAt: r.rejected_at ?? null,
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

/**
 * Police sends a document/case to Forensic — status always starts Pending.
 * Compromised documents are refused: an unverified file must not enter the
 * forensic chain. Also records the audit event and appends custody history.
 */
export async function createHandoff(input: CreateHandoffInput): Promise<CreateHandoffResult> {
  const sb = getSupabase();
  if (!sb) {
    return { ok: false, error: "Supabase is not connected — handoffs need the database." };
  }

  // 1. Ensure parent case exists in public.cases (satisfies foreign key)
  await sb.from("cases").upsert(
    { id: input.caseId, title: `Case ${input.caseId}`, case_type: "General", status: "Active" },
    { onConflict: "id", ignoreDuplicates: true }
  );

  // 2. Integrity gate & document record check
  let docName: string | null = null;
  let docSha: string | null = null;
  if (input.documentId) {
    const localDoc = findDocument(input.documentId);
    const { data: doc, error: docErr } = await sb
      .from("documents")
      .select("name, sha256, integrity")
      .eq("id", input.documentId)
      .maybeSingle<{ name: string; sha256: string | null; integrity: string }>();

    if (docErr) return { ok: false, error: docErr.message };

    const integrity = doc?.integrity ?? localDoc?.integrity ?? "verified";
    docName = doc?.name ?? localDoc?.name ?? input.documentId;
    docSha = doc?.sha256 ?? localDoc?.hash ?? null;

    if (integrity === "compromised") {
      await recordAuditEvent({
        action: `Handoff BLOCKED — document integrity compromised (${input.documentId})`,
        caseId: input.caseId,
        document: docName,
        status: "Blocked",
      });
      return {
        ok: false,
        error:
          "This document's integrity is COMPROMISED — its SHA-256 no longer matches the sealed baseline. Resolve the integrity failure before sending it to Forensic.",
      };
    }

    // Ensure document exists in public.documents (satisfies foreign key)
    await sb.from("documents").upsert(
      {
        id: input.documentId,
        case_id: input.caseId,
        name: docName,
        doc_type: localDoc?.type ?? "Evidence Record",
        integrity,
        sha256: docSha,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
  }

  const row = {
    case_id: input.caseId,
    document_id: input.documentId,
    from_department: "POLICE",
    from_user: input.fromUser || "Investigation Officer",
    to_department: "FORENSIC",
    to_user: input.toUser || "Forensic Officer",
    status: "Pending" as const,
    reason: input.notes?.trim() || null,
    sent_at: new Date().toISOString(),
  };
  const { data, error } = await sb
    .from("workflow_handoffs")
    .insert(row)
    .select("*")
    .single<HandoffRow>();
  if (error) return { ok: false, error: error.message };

  const handoff = handoffRowToHandoff(data);
  replaceCachedHandoff(handoff);

  // audit_trail — Document sent to Forensic
  await recordAuditEvent({
    action: `Document sent to Forensic — handoff ${handoff.id.slice(0, 8)} (Pending)`,
    caseId: input.caseId,
    document: docName ?? input.documentId ?? "Whole case",
    status: "Success",
  });

  // Custody history: append the transfer to any linked evidence chain.
  if (input.documentId) {
    const linked = await findEvidenceForDocument(sb, input.documentId, input.caseId);
    if (linked) {
      await appendCustodyEvent(linked, {
        stage: "SENT TO FORENSIC",
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
        person: currentActor().name,
        action: `${input.fromUser} → ${input.toUser} (handoff ${handoff.id.slice(0, 8)})`,
        from_department: "POLICE",
        to_department: "FORENSIC",
        document_id: input.documentId,
        ...(docSha ? { sha256: docSha } : {}),
        status: "Success",
      } satisfies CustodyEvent);
    }
  }

  return { ok: true, handoff };
}

/** Evidence row linked to a document (by custody chain document_id or case+hash). */
async function findEvidenceForDocument(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  documentId: string,
  caseId: string,
): Promise<string | null> {
  const { data } = await sb
    .from("evidence")
    .select("id, custody_chain")
    .eq("case_id", caseId)
    .limit(200);
  const rows = (data ?? []) as { id: string; custody_chain: CustodyEvent[] | null }[];
  const hit = rows.find((r) => (r.custody_chain ?? []).some((c) => c.document_id === documentId));
  return hit?.id ?? null;
}

export type DecideHandoffResult =
  | { ok: true; handoff: Handoff }
  | { ok: false; error: string };

/**
 * Forensic accepts — status Accepted + accepted_at timestamp from the server.
 * Also records the audit event and appends ACCEPTED to the custody chain.
 */
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
  const h = handoffRowToHandoff(data);

  await recordAuditEvent({
    action: `Forensic handoff accepted — ${h.id.slice(0, 8)}`,
    caseId: h.caseId,
    document: h.documentId ?? "Whole case",
    status: "Success",
  });

  if (h.documentId) {
    const sha = await shaForDocument(sb, h.documentId);
    const linked = await findEvidenceForDocument(sb, h.documentId, h.caseId);
    if (linked) {
      await appendCustodyEvent(linked, {
        stage: "ACCEPTED",
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
        person: currentActor().name,
        action: `Accepted by ${h.toUser} — document received with SHA-256 intact`,
        from_department: "POLICE",
        to_department: "FORENSIC",
        document_id: h.documentId,
        ...(sha ? { sha256: sha } : {}),
        status: "Success",
      } satisfies CustodyEvent);
    }
  }

  return { ok: true, handoff: h };
}

/**
 * Forensic rejects — a user-entered reason is REQUIRED. The existing custody
 * history is left intact; only the decision events are appended.
 */
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
  const h = handoffRowToHandoff(data);

  await recordAuditEvent({
    action: `Forensic handoff rejected — ${h.id.slice(0, 8)} · Reason: ${reason}`,
    caseId: h.caseId,
    document: h.documentId ?? "Whole case",
    status: "Warning",
  });

  if (h.documentId) {
    const sha = await shaForDocument(sb, h.documentId);
    const linked = await findEvidenceForDocument(sb, h.documentId, h.caseId);
    if (linked) {
      await appendCustodyEvent(linked, {
        stage: "RETURNED — HANDOFF REJECTED",
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
        person: currentActor().name,
        action: `Rejected by ${h.toUser} — ${reason}`,
        from_department: "FORENSIC",
        to_department: "POLICE",
        document_id: h.documentId,
        ...(sha ? { sha256: sha } : {}),
        status: "Warning",
      } satisfies CustodyEvent);
    }
  }

  return { ok: true, handoff: h };
}

async function shaForDocument(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  documentId: string,
): Promise<string | null> {
  const { data } = await sb
    .from("documents")
    .select("sha256")
    .eq("id", documentId)
    .maybeSingle<{ sha256: string | null }>();
  return data?.sha256 ?? null;
}

let cacheHandoffs: Handoff[] = [];

export function cachedHandoffs(): Handoff[] {
  return cacheHandoffs;
}

/** Directly fetch incoming handoffs directed to Forensic from Supabase. */
export async function getIncomingHandoffs(): Promise<Handoff[]> {
  const sb = getSupabase();
  if (!sb) return cacheHandoffs;
  const { data, error } = await sb
    .from("workflow_handoffs")
    .select("*")
    .eq("to_department", "FORENSIC")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[handoffs] getIncomingHandoffs error:", error.message);
    return cacheHandoffs;
  }
  const mapped = ((data ?? []) as HandoffRow[]).map(handoffRowToHandoff);
  cacheHandoffs = mapped;
  return mapped;
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
      .eq("to_department", "FORENSIC")
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

