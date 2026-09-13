import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CaseCustodyEvidenceList } from "@/components/case/CaseCustodyList";
import { Badge, CaseStatusBadge, Mono } from "@/components/kit";
import { CaseOverviewTab } from "@/components/case/CaseOverviewTab";
import { CaseTimelineTab } from "@/components/case/CaseTimelineTab";
import { CaseDocumentsTab } from "@/components/case/CaseDocumentsTab";
import { CaseEvidenceTab } from "@/components/case/CaseEvidenceTab";
import { CasePeopleTab } from "@/components/case/CasePeopleTab";
import { CaseAccessTab } from "@/components/case/CaseAccessTab";
import { CaseAuditTab } from "@/components/case/CaseAuditTab";
import { allCases, getCaseById, isSupabaseCase } from "@/lib/cases-repository";
import { recordAuditEvent } from "@/lib/audit-repository";
import { isPoliceSession } from "@/lib/app-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cases/$caseId")({
  loader: async ({ params }) => {
    // Resolve the case server-side on deep links/refreshes — the sync cache is
    // empty on cold SSR, so Supabase-created cases would 404 otherwise.
    await getCaseById(params.caseId);
  },
  component: CaseWorkspace,
});

const TABS = [
  "Overview",
  "Documents",
  "Evidence",
  "AI Analysis",
  "Timeline",
  "Audit Trail",
  "Chain of Custody",
] as const;
type Tab = (typeof TABS)[number];

function CaseWorkspace() {
  const { caseId } = Route.useParams();
  const [tab, setTab] = useState<Tab>("Overview");
  const navigate = useNavigate();
  const c = allCases().find((x) => x.id === caseId);

  // "Case viewed" audit record — real DB cases only, once per open.
  useEffect(() => {
    if (c && isSupabaseCase(caseId)) {
      void recordAuditEvent({
        action: `Case file viewed — ${c.title}`,
        caseId,
        document: null,
        status: "Success",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  if (!c) {
    return (
      <AppShell title="Case not found">
        <div className="rounded-sm border border-border bg-card px-4 py-14 text-center">
          <p className="text-sm font-medium">No case file with ID “{caseId}” exists in this vault.</p>
          <button
            onClick={() => navigate({ to: "/cases" })}
            className="mt-4 inline-block border border-border px-3 py-1.5 text-[13px] font-medium hover:bg-secondary"
          >
            Back to cases
          </button>
        </div>
      </AppShell>
    );
  }

  const policeStation =
    c.dates.find((d) => d.label === "Police Station")?.value ??
    c.officers.find((o) => o.role === "Police Investigator")?.unit ??
    c.investigator;
  const peopleLine =
    c.people.find((p) => p.role === "Complainant")?.name ??
    c.people[0]?.detail ??
    "—";

  return (
    <AppShell title={`Case file · ${c.id}`}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[12px] text-muted-foreground">
        <button className="hover:text-foreground" onClick={() => navigate({ to: "/cases" })}>
          Cases
        </button>
        <span className="mx-1.5">/</span>
        <Mono className="font-semibold">{c.id}</Mono>
      </nav>

      {/* Case file header — dense, official */}
      <div className="rounded-sm border border-border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-4 py-3.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <Mono className="text-[15px] font-bold tracking-wide">{c.id}</Mono>
              <CaseStatusBadge status={c.status} />
            </div>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Police Station: <span className="font-medium text-foreground">{policeStation}</span>
              <span className="mx-2 opacity-40">·</span>
              Incident: <span className="font-medium text-foreground">{c.openedOn}</span>
              <span className="mx-2 opacity-40">·</span>
              Sections: <span className="font-medium text-foreground">{c.sections.join(", ") || "—"}</span>
              <span className="mx-2 opacity-40">·</span>
              Investigator: <span className="font-medium text-foreground">{c.investigator}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isPoliceSession() ? (
              <button
                onClick={() => setTab("Documents")}
                className="inline-flex h-9 items-center gap-2 rounded-sm bg-gold px-3.5 text-[13px] font-semibold text-[oklch(0.25_0.06_70)] transition-opacity hover:opacity-90"
              >
                <ArrowLeftRight className="size-4" /> Send to Forensic
              </button>
            ) : (
              <Badge tone="neutral">Forensic review — read only intake</Badge>
            )}
          </div>
        </div>

        {/* Restrained tab navigation */}
        <nav className="flex overflow-x-auto border-t border-border" aria-label="Case sections">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors first:pl-4",
                tab === t
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {tab === "Overview" ? <CaseOverviewTab caseId={c.id} /> : null}
      {tab === "Documents" ? <CaseDocumentsTab caseId={c.id} /> : null}
      {tab === "Evidence" ? <CaseEvidenceTab caseId={c.id} /> : null}
      {tab === "AI Analysis" ? <CaseAnalysisPanel caseId={c.id} /> : null}
      {tab === "Timeline" ? <CaseTimelineTab caseId={c.id} /> : null}
      {tab === "Audit Trail" ? <CaseAuditTab caseId={c.id} /> : null}
      {tab === "Chain of Custody" ? <CaseCustodyPanel caseId={c.id} /> : null}

      <p className="text-[11.5px] text-muted-foreground">
        Complainant on record: {peopleLine}
      </p>
    </AppShell>
  );
}

/** AI Analysis — surfaces the per-document AI results already stored on records. */
function CaseAnalysisPanel({ caseId }: { caseId: string }) {
  const c = allCases().find((x) => x.id === caseId);
  const hasParties = (c?.people.length ?? 0) > 0;
  return (
    <div className="rounded-sm border border-border bg-card">
      <header className="border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-semibold">AI Analysis</h2>
        <p className="text-[11.5px] text-muted-foreground">
          AI extraction runs per document — open a document to process it or view stored results.
        </p>
      </header>
      <div className="px-4 py-6 text-center">
        <p className="text-[13px] text-muted-foreground">
          {hasParties
            ? "This case has registered parties and documents in the vault."
            : "No AI analysis recorded for this case yet."}{" "}
          Open the <span className="font-medium text-foreground">Documents</span> tab and choose{" "}
          <span className="font-medium text-foreground">View</span> on a document, then use{" "}
          <span className="font-medium text-foreground">Process with AI</span>. Results (document
          type, entities, sections, summary) are shown on the document viewer and stored on the
          record.
        </p>
      </div>
    </div>
  );
}

/** Chain of Custody — case-scoped view pointing at each evidence item's trail. */
function CaseCustodyPanel({ caseId }: { caseId: string }) {
  return (
    <div className="rounded-sm border border-border bg-card">
      <header className="border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-semibold">Chain of Custody</h2>
        <p className="text-[11.5px] text-muted-foreground">
          Per-item custody trails live in the evidence register — each trail is append-only and
          records the SHA-256 at every stage.
        </p>
      </header>
      <div className="px-4 py-3">
        <CaseCustodyEvidenceList caseId={caseId} />
      </div>
    </div>
  );
}
