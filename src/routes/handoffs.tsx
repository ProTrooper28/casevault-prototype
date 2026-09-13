import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  FileWarning,
  Inbox,
  ShieldCheck,
  XCircle,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { GovBanner } from "@/components/gov";
import { Badge, Btn, IntegrityBadge, Mono, Td, Th } from "@/components/kit";
import {
  currentActor,
  findDocument,
  logAudit,
  signInAsRole,
  useApp,
} from "@/lib/app-state";
import {
  acceptHandoff,
  rejectHandoff,
  replaceCachedHandoff,
  useHandoffs,
} from "@/lib/handoffs-repository";
import { allSeededDocuments } from "@/lib/uploads-repository";

export const Route = createFileRoute("/handoffs")({
  component: HandoffsInbox,
});

function HandoffsInbox() {
  const navigate = useNavigate();
  const app = useApp();
  const forensic = app.session?.role === "FORENSIC_OFFICER";
  const { handoffs, loading, error, refresh } = useHandoffs();

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pending = handoffs.filter((h) => h.status === "Pending");
  const accepted = handoffs.filter((h) => h.status === "Accepted");
  const rejected = handoffs.filter((h) => h.status === "Rejected");

  async function decide(
    id: string,
    action: "accept" | "reject",
    docName: string | null,
    caseId: string,
    rejectionReason?: string,
  ) {
    setBusyId(id);
    setActionError(null);
    const result =
      action === "accept" ? await acceptHandoff(id) : await rejectHandoff(id, rejectionReason ?? "");
    setBusyId(null);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    replaceCachedHandoff(result.handoff);
    logAudit({
      user: currentActor().name,
      role: currentActor().role,
      action:
        action === "accept"
          ? `Forensic handoff accepted (${id.slice(0, 8)})`
          : `Forensic handoff rejected — ${rejectionReason}`,
      document: docName ?? "Case handoff",
      caseId,
      status: "Success",
    });
    toast.success(
      action === "accept" ? "Handoff accepted" : "Handoff rejected",
      { description: `Status saved to the database as ${result.handoff.status}.` },
    );
    setRejectingId(null);
    setReason("");
    refresh();
  }

  return (
    <AppShell title="Forensic Handoffs">
      <GovBanner
        title="Forensic Department"
        subtitle="Review incoming case documents and maintain evidence integrity."
        aside={
          <div className="flex items-center gap-2 text-right">
            <span className="flex size-9 items-center justify-center rounded-sm border border-white/15 bg-white/10">
              <ArrowLeftRight className="size-4 text-[#9CC4F5]" />
            </span>
            <div className="text-left">
              <p className="text-[10.5px] font-semibold tracking-[0.12em] text-sidebar-muted uppercase">
                Transfer Queue
              </p>
              <p className="text-[12.5px] font-medium">{pending.length} awaiting decision</p>
            </div>
          </div>
        }
      />

      <div className="space-y-4">
        {!forensic ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-primary/30 bg-primary/10 px-4 py-2.5 text-[12.5px] text-foreground">
            <span>
              Viewing queue in read-only mode as <strong>{app.session?.name ?? "Police Officer"}</strong>. Switch to <strong>Forensic Officer</strong> to accept or reject incoming handoffs.
            </span>
            <Btn size="sm" onClick={() => signInAsRole("FORENSIC_OFFICER")}>
              Switch to Forensic Officer
            </Btn>
          </div>
        ) : null}

        {/* Status summary strip */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-sm border border-border bg-card px-4 py-2.5 text-[13px]">
          <span className="label-caps">Incoming Forensic Handoffs</span>
          <span className="flex items-baseline gap-1.5">
            <span className="label-caps">Pending</span>
            <span className="font-semibold tabular-nums text-warning">{pending.length}</span>
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="label-caps">Accepted</span>
            <span className="font-semibold tabular-nums text-success">{accepted.length}</span>
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="label-caps">Rejected</span>
            <span className="font-semibold tabular-nums text-alert">{rejected.length}</span>
          </span>
          <span className="ml-auto flex items-center gap-2 text-[11.5px] text-muted-foreground">
            <Inbox className="size-3.5" /> Sent by the Investigation Officer
          </span>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-sm border border-alert/40 bg-alert-soft px-4 py-3 text-[13px] text-alert">
            <FileWarning className="mt-0.5 size-4 shrink-0" />
            <span>
              Could not load handoffs from the database: {error}
            </span>
          </div>
        ) : null}
        {actionError ? (
          <div className="flex items-start gap-2 rounded-sm border border-alert/40 bg-alert-soft px-4 py-3 text-[13px] text-alert">
            <FileWarning className="mt-0.5 size-4 shrink-0" />
            <span>Action not saved: {actionError}</span>
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-sm border border-border bg-card">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr>
                <Th className="px-4">Case / FIR</Th>
                <Th>Document</Th>
                <Th>Sent By</Th>
                <Th>Sent At</Th>
                <Th>Integrity</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading && handoffs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                    Loading handoffs from Supabase…
                  </td>
                </tr>
              ) : handoffs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <p className="text-[13px] font-medium">No forensic handoffs yet</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      When the Investigation Officer sends a document for forensic review, it
                      appears here as Pending.
                    </p>
                  </td>
                </tr>
              ) : (
                handoffs.map((h) => {
                  const doc = h.documentId
                    ? findDocument(h.documentId) ?? allSeededDocuments().find((d) => d.id === h.documentId)
                    : undefined;
                  return (
                    <tr key={h.id} className="border-b border-border/60 hover:bg-secondary/40">
                      <Td className="px-4">
                        <button
                          className="font-medium text-primary hover:underline"
                          onClick={() =>
                            navigate({ to: "/cases/$caseId", params: { caseId: h.caseId } })
                          }
                        >
                          <Mono className="text-[12.5px] font-semibold">{h.caseId}</Mono>
                        </button>
                      </Td>
                      <Td>
                        {doc ? (
                          <button
                            className="max-w-[240px] truncate text-left font-medium hover:underline"
                            onClick={() =>
                              navigate({
                                to: "/documents/$docId",
                                params: { docId: h.documentId! },
                              })
                            }
                          >
                            {doc.name}
                          </button>
                        ) : (
                          <span className="font-medium text-muted-foreground">
                            {h.documentId ?? "Whole case"}
                          </span>
                        )}
                        {doc ? (
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            {doc.type}
                          </span>
                        ) : null}
                        {h.notes ? (
                          <span className="mt-0.5 block max-w-[260px] truncate text-[11px] text-muted-foreground">
                            {h.notes}
                          </span>
                        ) : null}
                      </Td>
                      <Td className="whitespace-nowrap">
                        <p className="font-medium">{h.fromUser}</p>
                        <p className="text-[11px] text-muted-foreground">Police Department</p>
                      </Td>
                      <Td className="whitespace-nowrap text-[12px] text-muted-foreground">
                        {new Date(h.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </Td>
                      <Td>
                        {doc ? (
                          <IntegrityBadge status={doc.integrity} />
                        ) : (
                          <span className="text-[12px] text-muted-foreground">—</span>
                        )}
                      </Td>
                      <Td>
                        <Badge
                          tone={
                            h.status === "Pending"
                              ? "warning"
                              : h.status === "Accepted"
                                ? "success"
                                : "alert"
                          }
                        >
                          {h.status}
                        </Badge>
                        {h.status === "Rejected" && h.rejectionReason ? (
                          <span className="mt-0.5 block max-w-[180px] truncate text-[11px] text-muted-foreground">
                            {h.rejectionReason}
                          </span>
                        ) : null}
                      </Td>
                      <Td>
                        {h.status === "Pending" ? (
                          rejectingId === h.id ? (
                            <div className="flex min-w-[260px] flex-col gap-2">
                              <input
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Rejection reason (required)"
                                className="w-full rounded-sm border border-input bg-card px-2.5 py-1.5 text-[13px]"
                              />
                              <div className="flex gap-2">
                                <Btn
                                  size="sm"
                                  variant="danger"
                                  disabled={!reason.trim() || busyId === h.id}
                                  onClick={() =>
                                    decide(h.id, "reject", doc?.name ?? null, h.caseId, reason)
                                  }
                                >
                                  <XCircle className="size-3.5" />
                                  {busyId === h.id ? "Saving…" : "Confirm reject"}
                                </Btn>
                                <Btn
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setRejectingId(null);
                                    setReason("");
                                  }}
                                >
                                  Cancel
                                </Btn>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1.5 pr-3">
                              <Btn
                                size="sm"
                                variant="success"
                                disabled={busyId === h.id}
                                onClick={() => decide(h.id, "accept", doc?.name ?? null, h.caseId)}
                              >
                                <CheckCircle2 className="size-3.5" />
                                {busyId === h.id ? "Saving…" : "Accept"}
                              </Btn>
                              <Btn
                                size="sm"
                                variant="outline"
                                disabled={busyId === h.id}
                                onClick={() => setRejectingId(h.id)}
                              >
                                <XCircle className="size-3.5" /> Reject
                              </Btn>
                            </div>
                          )
                        ) : (
                          <div className="flex justify-end pr-3">
                            <span className="text-[12.5px] text-muted-foreground">
                              {h.status === "Accepted" && h.acceptedAt
                                ? `Accepted ${new Date(h.acceptedAt).toLocaleDateString("en-IN")}`
                                : h.status === "Rejected"
                                  ? `Reason: ${h.rejectionReason ?? "—"}`
                                  : "—"}
                            </span>
                          </div>
                        )}
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {rejected.length + accepted.length > 0 ? (
          <p className="text-[11.5px] text-muted-foreground">
            {accepted.length + rejected.length} decided handoff
            {accepted.length + rejected.length === 1 ? "" : "s"} remain listed with their decision
            — status is read live from <Mono>public.workflow_handoffs</Mono>.
            <ShieldCheck className="ml-1 inline size-3 text-success" />
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}

