import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  FileText,
  FolderOpen,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, BtnLink, CaseStatusBadge, Mono, Td, Th } from "@/components/kit";
import { Timeline } from "@/components/shared";
import { CASES, DOCUMENTS } from "@/lib/mock-data";
import { allDocuments, useApp } from "@/lib/app-state";
import { EVIDENCE_REGISTER } from "@/lib/evidence-register";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const app = useApp();
  const documents = allDocuments(app);
  const runtimeEvidence = app.evidence;

  const metrics = {
    total: CASES.length,
    active: CASES.filter((c) => c.status === "Active").length,
    review: CASES.filter((c) => c.status === "Under Review").length,
    closed: CASES.filter((c) => c.status === "Closed").length,
    documents: documents.length,
    evidence: EVIDENCE_REGISTER.length + runtimeEvidence.length,
  };

  const pendingVerification = documents.filter((d) => d.integrity === "pending").length;
  const compromised = documents.filter((d) => d.integrity === "compromised").length;
  const pendingEvidence = [
    ...EVIDENCE_REGISTER.filter((e) => e.status === "Under Review").map((e) => ({
      id: e.id,
      label: e.description,
      caseId: e.caseId,
      to: `/evidence/${e.id}`,
    })),
    ...runtimeEvidence
      .filter((e) => e.status === "Under Review")
      .map((e) => ({ id: e.id, label: e.name, caseId: e.caseId, to: `/evidence/${e.id}` })),
  ];
  const accessRequests = app.grants.filter((g) => g.status !== "Active").length;

  const activity = useMemo(
    () =>
      [...app.audit, ...[]]
        .slice(0, 7)
        .map((a) => ({
          title: a.action,
          subtitle: `${a.user} · ${a.role}`,
          meta: `${a.date}, ${a.time}`,
          tone:
            a.status === "Success"
              ? ("success" as const)
              : a.status === "Blocked"
                ? ("alert" as const)
                : ("warning" as const),
        })),
    [app.audit],
  );

  return (
    <AppShell title="Dashboard">
      {/* 1 — Compact investigation overview strip (restrained, single row) */}
      <section aria-label="Investigation overview" className="border border-border bg-card">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
          <span className="flex items-baseline gap-2">
            <span className="label-caps">Total Cases</span>
            <span className="text-lg font-semibold tabular-nums">{metrics.total}</span>
          </span>
          <span className="flex items-baseline gap-2">
            <span className="label-caps">Active</span>
            <span className="font-semibold tabular-nums text-success">{metrics.active}</span>
          </span>
          <span className="flex items-baseline gap-2">
            <span className="label-caps">Under Review</span>
            <span className="font-semibold tabular-nums text-warning">{metrics.review}</span>
          </span>
          <span className="flex items-baseline gap-2">
            <span className="label-caps">Closed</span>
            <span className="font-semibold tabular-nums">{metrics.closed}</span>
          </span>
          <span className="hidden h-6 w-px bg-border sm:block" />
          <span className="flex items-baseline gap-2">
            <span className="label-caps">Documents</span>
            <span className="font-semibold tabular-nums">{metrics.documents}</span>
          </span>
          <span className="flex items-baseline gap-2">
            <span className="label-caps">Evidence</span>
            <span className="font-semibold tabular-nums">{metrics.evidence}</span>
          </span>
          {compromised > 0 ? (
            <Badge tone="alert" className="ml-auto">
              <ShieldAlert className="size-3" /> {compromised} integrity alert
              {compromised === 1 ? "" : "s"}
            </Badge>
          ) : (
            <Badge tone="success" className="ml-auto">
              <ShieldCheck className="size-3" /> All baselines match
            </Badge>
          )}
        </div>
      </section>

      {/* 2 — Your investigations (primary object on the page) */}
      <section aria-label="Your investigations">
        <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Your Investigations</h2>
          <BtnLink to="/cases" variant="outline" size="sm">
            View All Cases <ArrowRight className="size-3.5" />
          </BtnLink>
        </header>
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr>
                <Th>Case ID</Th>
                <Th>Case Title</Th>
                <Th>Location</Th>
                <Th>Status</Th>
                <Th>Date Opened</Th>
                <Th>Last Activity</Th>
                <Th className="text-right">Documents</Th>
                <Th className="text-right">Evidence</Th>
                <Th>Investigator</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {CASES.map((c) => {
                const docs =
                  DOCUMENTS.filter((d) => d.caseId === c.id).length +
                  app.documents.filter((d) => d.caseId === c.id).length;
                const evd =
                  EVIDENCE_REGISTER.filter((e) => e.caseId === c.id).length +
                  runtimeEvidence.filter((e) => e.caseId === c.id).length;
                return (
                  <tr
                    key={c.id}
                    className="cursor-pointer transition-colors hover:bg-secondary/60"
                    onClick={() => navigate({ to: "/cases/$caseId", params: { caseId: c.id } })}
                  >
                    <Td>
                      <Mono className="text-[12.5px] font-semibold">{c.id}</Mono>
                    </Td>
                    <Td className="font-medium">{c.title}</Td>
                    <Td className="whitespace-nowrap text-muted-foreground">{c.location}</Td>
                    <Td>
                      <CaseStatusBadge status={c.status} />
                    </Td>
                    <Td className="whitespace-nowrap text-muted-foreground">{c.openedOn}</Td>
                    <Td className="whitespace-nowrap text-muted-foreground">{c.lastUpdated}</Td>
                    <Td className="text-right tabular-nums">{docs}</Td>
                    <Td className="text-right tabular-nums">{evd}</Td>
                    <Td className="whitespace-nowrap">{c.investigator}</Td>
                    <Td>
                      <div className="flex justify-end pr-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate({ to: "/cases/$caseId", params: { caseId: c.id } });
                          }}
                          className="border border-border px-2.5 py-1 text-[12.5px] font-medium hover:bg-secondary"
                        >
                          Open Case
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 3 — Recent activity (case-related events) */}
        <section aria-label="Recent activity" className="border border-border bg-card lg:col-span-2">
          <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <BtnLink to="/audit" variant="ghost" size="sm" className="text-muted-foreground">
              <ScrollText className="size-3.5" /> Full audit trail
            </BtnLink>
          </header>
          <div className="px-4 py-4">
            {activity.length > 0 ? (
              <Timeline items={activity} />
            ) : (
              <div className="py-2 text-[12.5px] text-muted-foreground">
                No session activity yet. Actions like verifying a document or registering evidence
                appear here immediately.
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {[
                    "FIR-001.pdf verified against sealed baseline — 18 Jan 2026, 14:41",
                    "Forensic report v2.0 published to FIR-2026-00124 — 18 Jan 2026, 11:20",
                    "Access granted to A. Sharma (Forensic Officer) — 17 Jan 2026, 16:05",
                  ].map((line) => (
                    <p key={line} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                      <span>{line}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 4 — Pending actions */}
        <section aria-label="Pending actions" className="border border-border bg-card">
          <header className="border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">Pending Actions</h2>
          </header>
          <ul className="divide-y divide-border">
            <li>
              <button
                onClick={() => navigate({ to: "/integrity" })}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60"
              >
                <FileText className="mt-0.5 size-4 shrink-0 text-warning" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">
                    {pendingVerification} document{pendingVerification === 1 ? "" : "s"} awaiting
                    verification
                  </span>
                  <span className="block text-[11.5px] text-muted-foreground">
                    Run integrity checks to seal their baselines
                  </span>
                </span>
                <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate({ to: "/evidence" })}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60"
              >
                <Boxes className="mt-0.5 size-4 shrink-0 text-info" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">
                    {pendingEvidence.length} evidence item{pendingEvidence.length === 1 ? "" : "s"}{" "}
                    requires review
                  </span>
                  <span className="block truncate text-[11.5px] text-muted-foreground">
                    {pendingEvidence.length > 0
                      ? pendingEvidence
                          .slice(0, 2)
                          .map((e) => `${e.id} · ${e.label}`)
                          .join(" · ")
                      : "All items cleared"}
                  </span>
                </span>
                <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate({ to: "/access" })}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60"
              >
                <UserCheck className="mt-0.5 size-4 shrink-0 text-ai" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">
                    1 access request pending approval
                  </span>
                  <span className="block text-[11.5px] text-muted-foreground">
                    S. Kapoor · Legal Officer · FIR-2026-00124
                  </span>
                </span>
                <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
              </button>
            </li>
          </ul>
          <div
            className={cn(
              "flex items-center gap-2 border-t border-border px-4 py-3 text-[12px]",
              compromised > 0 ? "text-alert" : "text-muted-foreground",
            )}
          >
            {compromised > 0 ? (
              <>
                <ShieldAlert className="size-3.5" /> {compromised} document
                {compromised === 1 ? "" : "s"} tampered — restore required
              </>
            ) : (
              <>
                <ShieldCheck className="size-3.5 text-success" /> Vault integrity nominal
              </>
            )}
          </div>
        </section>
      </div>

      {/* Quick entry points — restrained text links, not widgets */}
      <section aria-label="Quick actions" className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[12.5px]">
        <span className="label-caps">Quick actions</span>
        {[
          { to: "/cases", label: "Open a case", icon: FolderOpen },
          { to: "/documents", label: "Browse documents", icon: FileText },
          { to: "/search", label: "Smart search", icon: ScrollText },
          { to: "/ai-processing", label: "AI pipeline", icon: Clock },
        ].map(({ to, label, icon: Icon }) => (
          <BtnLink key={to} to={to} variant="ghost" size="sm" className="px-0 text-muted-foreground">
            <Icon className="size-3.5" /> {label}
          </BtnLink>
        ))}
      </section>
    </AppShell>
  );
}
