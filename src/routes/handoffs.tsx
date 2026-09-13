import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  FileWarning,
  Inbox,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge, Btn, Mono } from "@/components/kit";
import {
  currentActor,
  findDocument,
  isForensicSession,
  logAudit,
} from "@/lib/app-state";
import {
  acceptHandoff,
  rejectHandoff,
  replaceCachedHandoff,
  useHandoffs,
} from "@/lib/handoffs-repository";

export const Route = createFileRoute("/handoffs")({
  component: HandoffsInbox,
});

function HandoffsInbox() {
  const navigate = useNavigate();
  const forensic = isForensicSession();
  const { handoffs, loading, error, refresh } = useHandoffs();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pending = handoffs.filter((h) => h.status === "Pending");
  const decided = handoffs.filter((h) => h.status !== "Pending");

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
      return; // no fake success — the row stays Pending
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
      {!forensic ? (
        <div className="border border-border bg-card px-4 py-10 text-center">
          <p className="text-sm font-medium">Forensic review workspace</p>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-muted-foreground">
            This queue belongs to the Forensic Officer demo role. Police officers send handoffs from
            a case's Documents tab; switch to “Login as Forensic Officer” to review incoming items.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border border-border bg-card px-4 py-2.5 text-[13px]">
            <span className="label-caps">Incoming queue</span>
            <span className="flex items-baseline gap-1.5">
              <span className="label-caps">Pending</span>
              <span className="font-semibold tabular-nums">{pending.length}</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="label-caps">Accepted</span>
              <span className="font-semibold tabular-nums text-success">
                {handoffs.filter((h) => h.status === "Accepted").length}
              </span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="label-caps">Rejected</span>
              <span className="font-semibold tabular-nums text-alert">
                {handoffs.filter((h) => h.status === "Rejected").length}
              </span>
            </span>
            <span className="ml-auto flex items-center gap-2 text-[11.5px] text-muted-foreground">
              <Inbox className="size-3.5" /> Sent by the Investigation Officer
            </span>
          </div>

          {error ? (
            <div className="flex items-start gap-2 border border-alert/40 bg-alert-soft px-4 py-3 text-[13px] text-alert">
              <FileWarning className="mt-0.5 size-4 shrink-0" />
              <span>
                Could not load handoffs from the database: {error} — check the{" "}
                <code>workflow_handoffs</code> table exists (supabase/schema.sql).
              </span>
            </div>
          ) : null}
          {actionError ? (
            <div className="flex items-start gap-2 border border-alert/40 bg-alert-soft px-4 py-3 text-[13px] text-alert">
              <FileWarning className="mt-0.5 size-4 shrink-0" />
              <span>Action not saved: {actionError}</span>
            </div>
          ) : null}

          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  <ThCell>Case</ThCell>
                  <ThCell>Document</ThCell>
                  <ThCell>From</ThCell>
                  <ThCell>Status</ThCell>
                  <ThCell>Sent</ThCell>
                  <ThCell>Decision</ThCell>
                </tr>
              </thead>
              <tbody>
                {loading && handoffs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                      Loading handoffs from Supabase…
                    </td>
                  </tr>
                ) : handoffs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <p className="text-[13px] font-medium">No forensic handoffs yet</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        When the Investigation Officer sends a document for forensic review, it
                        appears here as Pending.
                      </p>
                    </td>
                  </tr>
                ) : (
                  handoffs.map((h) => {
                    const doc = h.documentId ? findDocument(h.documentId) : undefined;
                    return (
                      <tr key={h.id} className="border-b border-border/60 hover:bg-secondary/40">
                        <TdCell>
                          <button
                            className="font-medium text-primary hover:underline"
                            onClick={() =>
                              navigate({ to: "/cases/$caseId", params: { caseId: h.caseId } })
                            }
                          >
                            <Mono className="text-[12.5px]">{h.caseId}</Mono>
                          </button>
                        </TdCell>
                        <TdCell>
                          {doc ? (
                            <button
                              className="text-left hover:underline"
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
                            <span className="text-muted-foreground">
                              {h.documentId ?? "Whole case"}
                            </span>
                          )}
                          {h.notes ? (
                            <span className="mt-0.5 block max-w-[280px] truncate text-[11.5px] text-muted-foreground">
                              {h.notes}
                            </span>
                          ) : null}
                        </TdCell>
                        <TdCell className="whitespace-nowrap text-muted-foreground">
                          {h.fromUser}
                        </TdCell>
                        <TdCell>
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
                        </TdCell>
                        <TdCell className="whitespace-nowrap text-[12px] text-muted-foreground">
                          {new Date(h.createdAt).toLocaleString("en-IN")}
                        </TdCell>
                        <TdCell>
                          {h.status === "Pending" ? (
                            rejectingId === h.id ? (
                              <div className="flex min-w-[260px] flex-col gap-2">
                                <input
                                  value={reason}
                                  onChange={(e) => setReason(e.target.value)}
                                  placeholder="Rejection reason (required)"
                                  className="w-full rounded-none border border-input bg-card px-2.5 py-1.5 text-[13px]"
                                />
                                <div className="flex gap-2">
                                  <Btn
                                    size="sm"
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
                              <div className="flex gap-2">
                                <Btn
                                  size="sm"
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
                            <span className="text-[12.5px] text-muted-foreground">
                              {h.status === "Accepted" && h.acceptedAt
                                ? `Accepted ${new Date(h.acceptedAt).toLocaleDateString("en-IN")}`
                                : h.status === "Rejected"
                                  ? `Reason: ${h.rejectionReason ?? "—"}`
                                  : "—"}
                            </span>
                          )}
                        </TdCell>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {decided.length > 0 ? (
            <p className="text-[11.5px] text-muted-foreground">
              {decided.length} decided handoff{decided.length === 1 ? "" : "s"} shown below the
              pending queue — status is read live from <Mono>public.workflow_handoffs</Mono>.
              <ArrowRight className="ml-1 inline size-3" />
            </p>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

function ThCell({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
      {children}
    </th>
  );
}

function TdCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 align-middle text-[13px] ${className ?? ""}`}>{children}</td>;
}
