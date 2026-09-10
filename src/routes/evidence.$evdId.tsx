import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Clock, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Btn, IntegrityBadge, Mono, Td, Th } from "@/components/kit";
import { EVIDENCE_REGISTER, findRegisterEvidence } from "@/lib/evidence-register";
import { useApp } from "@/lib/app-state";
import { CASES } from "@/lib/mock-data";

export const Route = createFileRoute("/evidence/$evdId")({
  component: EvidenceDetail,
});

type UnifiedEvidence = {
  id: string;
  caseId: string;
  description: string;
  type: string;
  collected: string;
  submittedBy: string;
  custodian: string;
  integrity: "verified" | "pending" | "compromised";
  status: string;
  hash: string;
  chain: { stage: string; date: string; time: string; person: string; action: string }[];
};

function EvidenceDetail() {
  const { evdId } = Route.useParams();
  const navigate = useNavigate();
  const { evidence: runtime } = useApp();

  const seeded = findRegisterEvidence(evdId);
  const runtimeItem = runtime.find((e) => e.id === evdId);

  const item: UnifiedEvidence | undefined = seeded
    ? {
        id: seeded.id,
        caseId: seeded.caseId,
        description: seeded.description,
        type: seeded.type,
        collected: seeded.collected,
        submittedBy: seeded.submittedBy,
        custodian: seeded.custodian,
        integrity: seeded.integrity,
        status: seeded.status,
        hash: seeded.hash,
        chain: seeded.custodyChain.map((c) => ({
          stage: c.stage,
          date: c.date,
          time: c.time,
          person: c.person,
          action: c.action,
        })),
      }
    : runtimeItem
      ? {
          id: runtimeItem.id,
          caseId: runtimeItem.caseId,
          description: runtimeItem.name,
          type: runtimeItem.type,
          collected: runtimeItem.collectedDate,
          submittedBy: runtimeItem.submittedBy,
          custodian: runtimeItem.custodian,
          integrity: runtimeItem.integrity,
          status: runtimeItem.status,
          hash: runtimeItem.hash,
          chain: runtimeItem.custodyChain,
        }
      : undefined;

  if (!item) {
    return (
      <AppShell title="Evidence not found">
        <div className="border border-border bg-card px-4 py-14 text-center">
          <p className="text-sm font-medium">No evidence item “{evdId}” exists in this vault.</p>
          <Btn className="mt-4" onClick={() => navigate({ to: "/evidence" })}>
            Back to evidence register
          </Btn>
        </div>
      </AppShell>
    );
  }

  const caseTitle = CASES.find((c) => c.id === item.caseId)?.title ?? "—";

  return (
    <AppShell title={`Evidence · ${item.id}`}>
      <button
        onClick={() => navigate({ to: "/evidence" })}
        className="mb-2 inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Evidence register
      </button>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Item record */}
        <div className="border border-border bg-card">
          <header className="border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">Evidence Record</h2>
          </header>
          <dl className="space-y-3 px-4 py-4 text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="label-caps">Evidence ID</dt>
              <dd>
                <Mono className="text-[12.5px] font-semibold">{item.id}</Mono>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="label-caps">Evidence Type</dt>
              <dd className="font-medium">{item.type}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="label-caps shrink-0">Description</dt>
              <dd className="text-right font-medium">{item.description}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="label-caps">Case</dt>
              <dd>
                <button
                  className="font-mono text-[12.5px] font-medium text-info hover:underline"
                  onClick={() => navigate({ to: "/cases/$caseId", params: { caseId: item.caseId } })}
                >
                  {item.caseId}
                </button>
                <span className="block text-[11px] text-muted-foreground">{caseTitle}</span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="label-caps">Collected</dt>
              <dd className="font-medium">{item.collected}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="label-caps">Submitted By</dt>
              <dd className="font-medium">{item.submittedBy}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="label-caps">Current Custodian</dt>
              <dd className="font-medium">{item.custodian}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <dt className="label-caps">Integrity</dt>
              <dd>
                <IntegrityBadge status={item.integrity} />
              </dd>
            </div>
            <div>
              <dt className="label-caps">SHA-256</dt>
              <dd>
                <Mono className="mt-1 block bg-muted px-2.5 py-1.5 text-[11.5px] break-all">
                  {item.hash}
                </Mono>
              </dd>
            </div>
          </dl>
        </div>

        {/* Chain of custody */}
        <div className="border border-border bg-card lg:col-span-2">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">Chain of Custody</h2>
            <span className="text-[11.5px] text-muted-foreground">
              {item.chain.length} recorded transfers · append-only
            </span>
          </header>
          <div className="px-4 py-4">
            <ol>
              {item.chain.map((step, i) => (
                <li key={`${step.stage}-${i}`} className="relative flex gap-4 pl-6">
                  {i < item.chain.length - 1 ? (
                    <span className="absolute top-5 bottom-[-1.25rem] left-[5px] w-px bg-border-strong" />
                  ) : null}
                  <span
                    className={
                      "absolute top-[6px] left-0 size-[11px] rounded-full border-2 border-card " +
                      (i === item.chain.length - 1 ? "bg-primary" : "bg-success")
                    }
                  />
                  <div className="min-w-0 flex-1 pb-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <h3 className="text-[13.5px] font-semibold">{step.stage}</h3>
                      <span className="font-mono text-[11.5px] whitespace-nowrap text-muted-foreground">
                        {step.date} · {step.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">{step.action}</p>
                    <p className="mt-0.5 text-[12px]">
                      <span className="label-caps">Person</span>{" "}
                      <span className="font-medium">{step.person}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex items-center gap-2 border-t border-border pt-3 text-[12px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-success" />
              Each transfer is countersigned and hash-chained to the previous record.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
