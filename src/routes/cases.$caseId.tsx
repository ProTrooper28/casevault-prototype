import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CaseStatusBadge, Mono } from "@/components/kit";
import { CaseOverviewTab } from "@/components/case/CaseOverviewTab";
import { CaseTimelineTab } from "@/components/case/CaseTimelineTab";
import { CaseDocumentsTab } from "@/components/case/CaseDocumentsTab";
import { CaseEvidenceTab } from "@/components/case/CaseEvidenceTab";
import { CasePeopleTab } from "@/components/case/CasePeopleTab";
import { CaseAccessTab } from "@/components/case/CaseAccessTab";
import { CASES } from "@/lib/mock-data";
import { allCases } from "@/lib/cases-repository";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cases/$caseId")({
  component: CaseWorkspace,
});

const TABS = ["Overview", "Timeline", "Documents", "Evidence", "People", "Access"] as const;
type Tab = (typeof TABS)[number];

function CaseWorkspace() {
  const { caseId } = Route.useParams();
  const [tab, setTab] = useState<Tab>("Overview");
  const c = allCases().find((x) => x.id === caseId);

  if (!c) {
    return (
      <AppShell title="Case not found">
        <div className="border border-border bg-card px-4 py-14 text-center">
          <p className="text-sm font-medium">No case file with ID “{caseId}” exists in this vault.</p>
          <a
            href="/cases"
            className="mt-4 inline-block border border-border px-3 py-1.5 text-[13px] font-medium hover:bg-secondary"
          >
            Back to cases
          </a>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Case file · ${c.id}`}>
      {/* Case file header — dense, official */}
      <div className="border border-border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-4 py-3.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <Mono className="text-[14px] font-bold tracking-wide">{c.id}</Mono>
              <CaseStatusBadge status={c.status} />
              <span className="text-[11.5px] text-muted-foreground">
                Priority: {c.priority}
              </span>
            </div>
            <h1 className="mt-0.5 text-lg font-semibold">{c.title}</h1>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-[12.5px] sm:grid-cols-4">
            <div>
              <dt className="label-caps">Location</dt>
              <dd className="mt-0.5 font-medium">{c.location}</dd>
            </div>
            <div>
              <dt className="label-caps">Opened</dt>
              <dd className="mt-0.5 font-medium">{c.openedOn}</dd>
            </div>
            <div>
              <dt className="label-caps">Investigator</dt>
              <dd className="mt-0.5 font-medium">{c.investigator}</dd>
            </div>
            <div>
              <dt className="label-caps">Last activity</dt>
              <dd className="mt-0.5 font-medium">{c.lastUpdated}</dd>
            </div>
          </dl>
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
      {tab === "Timeline" ? <CaseTimelineTab caseId={c.id} /> : null}
      {tab === "Documents" ? <CaseDocumentsTab caseId={c.id} /> : null}
      {tab === "Evidence" ? <CaseEvidenceTab caseId={c.id} /> : null}
      {tab === "People" ? <CasePeopleTab caseId={c.id} /> : null}
      {tab === "Access" ? <CaseAccessTab caseId={c.id} /> : null}
    </AppShell>
  );
}
