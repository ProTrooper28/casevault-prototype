import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ShieldHalf,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  Badge,
  Btn,
  BtnLink,
  DemoNotice,
  Field,
  IntegrityBadge,
  Mono,
  Panel,
  PageIntro,
  Td,
  Th,
} from "@/components/kit";
import { DOCUMENTS, shortHash } from "@/lib/mock-data";
import { allDocuments, docIntegrity, findDocument, logAudit, setIntegrity, useApp } from "@/lib/app-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/integrity")({
  component: Integrity,
});

function Integrity() {
  const navigate = useNavigate();
  const app = useApp();
  const documents = allDocuments(app);
  const [selectedId, setSelectedId] = useState("DOC-10241"); // main FIR demo doc
  const doc = findDocument(selectedId);
  const effective = doc?.integrity ?? "pending";
  const tamperedCount = documents.filter((d) => d.integrity === "compromised").length;

  function verify() {
    if (!doc) return;
    setIntegrity(doc.id, "verified");
    logAudit({
      user: app.session?.name ?? "Guest Investigator",
      role: "Police Investigator",
      action: "Integrity re-verified against sealed baseline",
      document: doc.name,
      caseId: doc.caseId,
      status: "Success",
    });
  }

  function tamper() {
    if (!doc) return;
    setIntegrity(doc.id, "compromised");
    logAudit({
      user: "Simulation",
      role: "System",
      action: "SIMULATED TAMPER — hash mismatch detected",
      document: doc.name,
      caseId: doc.caseId,
      status: "Blocked",
    });
  }

  function restore() {
    if (!doc) return;
    setIntegrity(doc.id, "verified");
    logAudit({
      user: app.session?.name ?? "Guest Investigator",
      role: "Police Investigator",
      action: "Original document restored from sealed copy",
      document: doc.name,
      caseId: doc.caseId,
      status: "Success",
    });
  }

  return (
    <AppShell title="Integrity & Verification">
      <PageIntro
        title="Integrity & Verification"
        description="SHA-256 fingerprints are compared against the sealed baseline on every check. Simulate a tamper event to see the vault react, then restore the original."
        actions={
          <Badge tone={tamperedCount > 0 ? "alert" : "success"}>
            {tamperedCount > 0
              ? `${tamperedCount} compromised`
              : "All baselines match"}
          </Badge>
        }
      />
      <DemoNotice>
        Verification is simulated client-side for the prototype. In production the stored file is
        re-hashed server-side and compared against the sealed fingerprint.
      </DemoNotice>

      {tamperedCount > 0 ? (
        <div className="flex items-start gap-3 rounded-md border border-alert/50 bg-alert-soft px-4 py-3">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-alert" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold tracking-wide text-alert">INTEGRITY COMPROMISED</p>
            <p className="mt-0.5 text-[12.5px] text-alert">
              HASH MISMATCH DETECTED on {tamperedCount} document{tamperedCount === 1 ? "" : "s"} —
              open the affected record below and restore the original.
            </p>
          </div>
          <Btn variant="danger" size="sm" onClick={() => navigate({ to: "/audit" })}>
            View audit entry
          </Btn>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-5">
        {/* Document picker */}
        <Panel className="xl:col-span-2" title="Documents under baseline" bodyClassName="p-0">
          <div className="max-h-[420px] divide-y divide-border overflow-y-auto">
            {documents.map((d) => {
              const status = d.integrity;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary",
                    selectedId === d.id && "bg-secondary",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{d.name}</p>
                    <Mono className="text-[11px] text-muted-foreground">
                      {d.id} · v{d.version}
                    </Mono>
                  </div>
                  <IntegrityBadge status={status} />
                </button>
              );
            })}
          </div>
        </Panel>

        {/* Selected document integrity panel */}
        {doc ? (
          <div className="space-y-4 xl:col-span-3">
            <Panel
              title={
                <span className="flex items-center gap-2">
                  <ShieldHalf className="size-4 text-muted-foreground" /> Baseline check — {doc.id}
                </span>
              }
              action={<Badge tone="neutral">{doc.type}</Badge>}
            >
              <div
                className={cn(
                  "rounded-md border px-4 py-4 text-center",
                  effective === "compromised"
                    ? "border-alert/50 bg-alert-soft"
                    : effective === "verified"
                      ? "border-success/40 bg-success-soft"
                      : "border-warning/40 bg-warning-soft",
                )}
              >
                {effective === "compromised" ? (
                  <>
                    <ShieldAlert className="mx-auto size-8 text-alert" />
                    <p className="mt-2 text-base font-bold tracking-wide text-alert">
                      INTEGRITY COMPROMISED
                    </p>
                    <p className="mt-1 text-[13px] font-medium text-alert">
                      HASH MISMATCH DETECTED
                    </p>
                    <p className="mt-1 text-[12px] text-alert/90">
                      The rendered document differs from the sealed SHA-256 baseline.
                    </p>
                  </>
                ) : effective === "verified" ? (
                  <>
                    <CheckCircle2 className="mx-auto size-8 text-success" />
                    <p className="mt-2 text-base font-bold tracking-wide text-success">
                      INTEGRITY VERIFIED
                    </p>
                    <p className="mt-1 text-[12.5px] text-success">
                      Rendered content matches the sealed baseline byte-for-byte.
                    </p>
                  </>
                ) : (
                  <>
                    <Clock className="mx-auto size-8 text-warning" />
                    <p className="mt-2 text-base font-bold tracking-wide text-warning">
                      VERIFICATION PENDING
                    </p>
                    <p className="mt-1 text-[12.5px] text-warning">
                      Run the first verification to seal the current content.
                    </p>
                  </>
                )}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                <Field label="Document" value={doc.name} />
                <Field label="Integrity status" value={<IntegrityBadge status={effective} />} />
                <Field label="Version" value={`v${doc.version}`} />
                <Field label="Last verified" value={effective === "pending" ? "—" : doc.date} />
                <Field label="Audit record" value={<Mono>#18429</Mono>} />
                <Field label="Access level" value={doc.access} />
              </dl>

              <div className="mt-4">
                <p className="label-caps">SHA-256 fingerprint</p>
                <Mono className="mt-1 block rounded bg-muted px-3 py-2 text-[12px] break-all">
                  {doc.hash}
                </Mono>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                <Btn onClick={verify}>
                  <ShieldCheck className="size-3.5" /> Verify now
                </Btn>
                <Btn variant="danger" onClick={tamper} disabled={effective === "compromised"}>
                  SIMULATE TAMPERING
                </Btn>
                <Btn
                  variant="outline"
                  onClick={restore}
                  disabled={effective !== "compromised"}
                >
                  <RotateCcw className="size-3.5" /> RESTORE ORIGINAL
                </Btn>
                <BtnLink to="/documents/$docId" params={{ docId: doc.id }} variant="ghost" size="md">
                  Open viewer
                </BtnLink>
              </div>
              <p className="mt-2 text-[11.5px] text-muted-foreground">
                Tamper and restore are frontend-only simulations; both write a real entry to the
                audit trail.
              </p>
            </Panel>

            {/* Verification history for this doc's case */}
            <Panel title="Audit record for this document">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse">
                  <thead>
                    <tr>
                      <Th>Timestamp</Th>
                      <Th>User</Th>
                      <Th>Action</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const rows = [
                        {
                          id: "#18429",
                          label: "18 Jan 2026, 14:41",
                          user: "Dr. A. Banerjee",
                          action: "Integrity verified",
                          status: "Success" as const,
                        },
                        {
                          id: "#18426",
                          label: "18 Jan 2026, 14:33",
                          user: "CaseVault Pipeline",
                          action: "Document fingerprint generated",
                          status: "Success" as const,
                        },
                        ...(effective === "compromised"
                          ? [
                              {
                                id: "#SIM-01",
                                label: "Just now",
                                user: "Simulation",
                                action: "SIMULATED TAMPER — hash mismatch detected",
                                status: "Blocked" as const,
                              },
                            ]
                          : []),
                      ];
                      return rows.map((r) => (
                        <tr key={r.id}>
                          <Td className="whitespace-nowrap text-muted-foreground">{r.label}</Td>
                          <Td className="whitespace-nowrap">{r.user}</Td>
                          <Td>{r.action}</Td>
                          <Td>
                            <Badge
                              tone={
                                r.status === "Success"
                                  ? "success"
                                  : r.status === "Blocked"
                                    ? "alert"
                                    : "warning"
                              }
                            >
                              {r.status}
                            </Badge>
                          </Td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
