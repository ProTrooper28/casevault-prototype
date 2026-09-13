import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  FolderOpen,
  Plus,
  ScrollText,
  Send,
  ShieldCheck,
  Inbox,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GovBanner } from "@/components/gov";
import { Badge, Btn, BtnLink, CaseStatusBadge, Mono, Td, Th } from "@/components/kit";
import { DOCUMENTS } from "@/lib/mock-data";
import { isPoliceSession, useApp } from "@/lib/app-state";
import { useCases } from "@/lib/cases-repository";
import { useHandoffs } from "@/lib/handoffs-repository";
import { CreateFirModal } from "@/components/CreateFirModal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Metric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof FolderOpen;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 border border-border bg-card px-3.5 py-3">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-sm", tone)}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="label-caps block truncate">{label}</span>
        <span className="text-lg leading-tight font-semibold tabular-nums">{value}</span>
      </span>
    </div>
  );
}

function QuickAction({
  to,
  label,
  variant,
}: {
  to: string;
  label: string;
  variant: "primary" | "outline" | "success" | "danger";
}) {
  return (
    <BtnLink to={to} variant={variant} size="md" className="w-full justify-between">
      {label} <ArrowUpRight className="size-3.5" />
    </BtnLink>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const app = useApp();
  const { cases: dbCases, refresh: refreshCases } = useCases();
  const { handoffs } = useHandoffs();
  const [showCreateFir, setShowCreateFir] = useState(false);
  const police = isPoliceSession();

  const documents = [...app.documents, ...DOCUMENTS];
  const pendingHandoffs = handoffs.filter((h) => h.status === "Pending").length;
  const verifiedDocs = documents.filter((d) => d.integrity === "verified").length;
  const aiProcessed = documents.filter((d) => (d.extracted?.length ?? 0) > 4).length;

  const recentCases = dbCases.slice(0, 5);

  const activity = useMemo(
    () =>
      [...app.audit].slice(0, 6).map((a) => ({
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

  const firstName = app.session?.name ?? "Investigation Officer";

  return (
    <AppShell title="Dashboard">
      {/* Government banner */}
      <GovBanner
        title={`Welcome, ${firstName}`}
        subtitle="Manage cases, documents, evidence integrity and forensic collaboration."
        aside={
          <div className="flex items-center gap-3 border-l border-sidebar-border pl-4 text-right">
            <div>
              <p className="text-[10.5px] font-semibold tracking-[0.12em] text-sidebar-muted uppercase">
                National e-Vault
              </p>
              <p className="mt-0.5 text-[12.5px] font-medium">Secure Digital Case & Evidence Management</p>
            </div>
          </div>
        }
      />

      {/* Metrics — real application data */}
      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Metric label="Total Cases" value={dbCases.length} icon={FolderOpen} tone="bg-info-soft text-info" />
        <Metric
          label="Pending Handoffs"
          value={pendingHandoffs}
          icon={Inbox}
          tone="bg-warning-soft text-warning"
        />
        <Metric label="Documents" value={documents.length} icon={FileText} tone="bg-secondary text-secondary-foreground" />
        <Metric
          label="Verified Documents"
          value={verifiedDocs}
          icon={ShieldCheck}
          tone="bg-success-soft text-success"
        />
        <Metric label="AI Processed" value={aiProcessed} icon={ScrollText} tone="bg-ai-soft text-ai" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        {/* Recent cases */}
        <section aria-label="Recent cases" className="min-w-0">
          <div className="overflow-x-auto border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <h2 className="text-sm font-semibold">Recent Cases</h2>
              <BtnLink to="/cases" variant="ghost" size="sm" className="text-muted-foreground">
                View All <ArrowRight className="size-3.5" />
              </BtnLink>
            </header>
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  <Th className="px-4">FIR Number</Th>
                  <Th>Case Title</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Documents</Th>
                  <Th>Last Updated</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((c) => {
                  const docCount =
                    DOCUMENTS.filter((d) => d.caseId === c.id).length +
                    app.documents.filter((d) => d.caseId === c.id).length;
                  return (
                    <tr
                      key={c.id}
                      className="cursor-pointer transition-colors hover:bg-secondary/60"
                      onClick={() => navigate({ to: "/cases/$caseId", params: { caseId: c.id } })}
                    >
                      <Td className="px-4">
                        <Mono className="text-[12.5px] font-semibold">{c.id}</Mono>
                      </Td>
                      <Td className="max-w-[220px] truncate font-medium">{c.title}</Td>
                      <Td>
                        <CaseStatusBadge status={c.status} />
                      </Td>
                      <Td className="text-right tabular-nums">{docCount}</Td>
                      <Td className="whitespace-nowrap text-muted-foreground">{c.lastUpdated}</Td>
                      <Td>
                        <div className="flex justify-end pr-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate({ to: "/cases/$caseId", params: { caseId: c.id } });
                            }}
                            className="border border-border px-2 py-0.5 text-[12px] font-medium hover:bg-secondary"
                          >
                            Open
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
                {recentCases.length === 0 ? (
                  <tr>
                    <Td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No cases registered yet.
                    </Td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Recent activity */}
          {activity.length > 0 ? (
            <section aria-label="Recent activity" className="mt-4 border border-border bg-card">
              <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <h2 className="text-sm font-semibold">Recent Activity</h2>
                <BtnLink to="/audit" variant="ghost" size="sm" className="text-muted-foreground">
                  <ScrollText className="size-3.5" /> Audit Trail
                </BtnLink>
              </header>
              <ul className="divide-y divide-border">
                {activity.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        a.tone === "success" && "bg-success",
                        a.tone === "warning" && "bg-warning",
                        a.tone === "alert" && "bg-alert",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{a.title}</span>
                      <span className="block text-[11.5px] text-muted-foreground">
                        {a.subtitle} · {a.meta}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>

        {/* Quick actions — role aware */}
        <aside aria-label="Quick actions" className="min-w-0">
          <div className="rounded-sm border border-border bg-card">
            <header className="border-b border-border px-4 py-2.5">
              <h2 className="text-sm font-semibold">Quick Actions</h2>
            </header>
            <div className="space-y-2 px-4 py-3.5">
              {police ? (
                <>
                  <Btn className="w-full justify-start" onClick={() => setShowCreateFir(true)}>
                    <Plus className="size-4" /> Create New FIR
                  </Btn>
                  <BtnLink
                    to="/cases"
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <FolderOpen className="size-4" /> Upload Document
                  </BtnLink>
                  <BtnLink to="/handoffs" variant="outline" className="w-full justify-start">
                    <Send className="size-4" /> Send to Forensic
                  </BtnLink>
                  <BtnLink to="/integrity" variant="success" className="w-full justify-start">
                    <ShieldCheck className="size-4" /> Verify Integrity
                  </BtnLink>
                </>
              ) : (
                <>
                  <BtnLink to="/handoffs" className="w-full justify-start">
                    <Inbox className="size-4" /> Incoming Handoffs
                  </BtnLink>
                  <BtnLink to="/integrity" variant="outline" className="w-full justify-start">
                    <ShieldCheck className="size-4" /> Verify Integrity
                  </BtnLink>
                  <BtnLink to="/documents" variant="outline" className="w-full justify-start">
                    <FileText className="size-4" /> Browse Documents
                  </BtnLink>
                </>
              )}
            </div>
            <div className="border-t border-border px-4 py-3">
              <div className="flex items-start gap-2 text-[11.5px] text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                <span>
                  {verifiedDocs} of {documents.length} documents carry a verified SHA-256 baseline.
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {showCreateFir && (
        <CreateFirModal
          onClose={() => setShowCreateFir(false)}
          onCreated={(created) => {
            refreshCases();
            navigate({ to: "/cases/$caseId", params: { caseId: created.id } });
          }}
        />
      )}
    </AppShell>
  );
}
