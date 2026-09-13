import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ScrollText, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Mono, PageIntro, Td, Th, DemoNotice } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { fullAuditTrail } from "@/lib/app-state";
import { useAuditEvents, type AuditEvent } from "@/lib/audit-repository";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/audit")({
  component: AuditTrail,
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    const q = search["q"];
    return typeof q === "string" ? { q } : {};
  },
});

const STATUS_FILTERS = ["All", "Success", "Warning", "Blocked"] as const;

function statusTone(status: string) {
  return status === "Success" ? "success" : status === "Blocked" ? "alert" : "warning";
}

/** Real DB row → the display shape used by this table. */
function dbEventToEntry(e: AuditEvent) {
  return {
    id: `DB#${e.id}`,
    user: e.user,
    role: e.role,
    action: e.action,
    document: e.document,
    caseId: e.caseId,
    status: e.status,
    date: e.date,
    time: e.time,
  };
}

type AuditEntryView = ReturnType<typeof dbEventToEntry>;

function AuditTrail() {
  // Real rows first (public.audit_trail), then session-only prototype entries.
  const { events: dbEvents, loading: dbLoading, error: dbError } = useAuditEvents({ limit: 200 });
  const audit: AuditEntryView[] = [
    ...dbEvents.map(dbEventToEntry),
    ...fullAuditTrail(),
  ];
  const initialQ = Route.useSearch().q ?? "";
  const [query, setQuery] = useState(initialQ);
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return audit.filter((a) => {
      const matchesQuery =
        !q || [a.id, a.user, a.action, a.document, a.caseId, a.role].join(" ").toLowerCase().includes(q);
      const matchesStatus = status === "All" || a.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [audit, query, status]);

  const counts = {
    total: audit.length,
    success: audit.filter((a) => a.status === "Success").length,
    warning: audit.filter((a) => a.status === "Warning").length,
    blocked: audit.filter((a) => a.status === "Blocked").length,
  };

  return (
    <AppShell title="Audit Trail">
      <PageIntro
        title="Audit Trail"
        description="Every upload, verification, grant and blocked attempt is recorded with timestamp, actor and outcome. Entries are append-only."
        actions={
          <Badge tone="ai">
            <ScrollText className="size-3" /> Append-only record
          </Badge>
        }
      />
      <DemoNotice />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total events", value: counts.total, tone: "neutral" as const },
          { label: "Success", value: counts.success, tone: "success" as const },
          { label: "Warning", value: counts.warning, tone: "warning" as const },
          { label: "Blocked", value: counts.blocked, tone: "alert" as const },
        ].map((s) => (
          <div key={s.label} className="rounded-md border border-border bg-card px-4 py-3">
            <span className="label-caps">{s.label}</span>
            <p className="mt-1 text-xl font-semibold tabular-nums">{s.value}</p>
            <Badge tone={s.tone} className="mt-1.5">
              {s.label}
            </Badge>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 md:max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search user, action, document, case…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors",
                status === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        {query || status !== "All" ? (
          <button
            className="flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground"
            onClick={() => {
              setQuery("");
              setStatus("All");
            }}
          >
            <X className="size-3.5" /> Clear
          </button>
        ) : null}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr>
              <Th>Timestamp</Th>
              <Th>User</Th>
              <Th>Action</Th>
              <Th>Document</Th>
              <Th>Case</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-secondary/60">
                <Td className="whitespace-nowrap text-muted-foreground">
                  {a.date}, {a.time}
                  <Mono className="block text-[10.5px]">{a.id}</Mono>
                </Td>
                <Td>
                  <p className="font-medium">{a.user}</p>
                  <p className="text-[11px] text-muted-foreground">{a.role}</p>
                </Td>
                <Td>{a.action}</Td>
                <Td className="text-muted-foreground">{a.document}</Td>
                <Td>
                  <Mono className="text-[12px]">{a.caseId}</Mono>
                </Td>
                <Td>
                  <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                </Td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <Td colSpan={6} className="py-10 text-center text-muted-foreground">
                  {dbLoading
                    ? "Loading audit events from Supabase…"
                    : `No audit entries match “${query}”.`}
                </Td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-[12px] text-muted-foreground">
        Entries prefixed <Mono>DB#</Mono> are real rows from <Mono>public.audit_trail</Mono>
        {dbError ? ` (database unavailable: ${dbError})` : ""}. Session-only prototype events
        (verify / tamper / restore / grants on demo documents) appear below them.
      </p>
    </AppShell>
  );
}
