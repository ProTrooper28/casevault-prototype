import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CaseStatusBadge, Mono, Td, Th } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { CASES, DOCUMENTS } from "@/lib/mock-data";
import { useApp } from "@/lib/app-state";
import { EVIDENCE_REGISTER } from "@/lib/evidence-register";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cases/")({
  component: Cases,
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    const q = search["q"];
    return typeof q === "string" ? { q } : {};
  },
});

const FILTERS = ["All", "Active", "Under Review", "Closed"] as const;
const SORTS = ["Last Updated", "Date Opened", "Priority"] as const;
type Sort = (typeof SORTS)[number];

/** Deterministic last-activity strings so the table is stable across refreshes. */
const LAST_ACTIVITY: Record<string, string> = {
  "FIR-2026-00124": "Today, 14:41",
  "CASE-2026-00418": "Yesterday, 15:14",
  "CASE-2026-00731": "10 Sep 2026, 09:05",
};

function Cases() {
  const { session, evidence: runtimeEvidence, documents: runtimeDocs } = useApp();
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const [query, setQuery] = useState(searchParams.q ?? "");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [sort, setSort] = useState<Sort>("Last Updated");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = CASES.filter((c) => {
      const matchesQuery =
        !q ||
        [c.id, c.title, c.type, c.location, c.investigator, ...c.sections]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesFilter = filter === "All" || c.status === filter;
      return matchesQuery && matchesFilter;
    });
    const priorityRank = { High: 0, Medium: 1, Low: 2 } as const;
    return [...rows].sort((a, b) => {
      if (sort === "Date Opened") {
        const parse = (d: string) => new Date(d.replace(/(\d+) (\w+) (\d+)/, "$2 $1 $3")).getTime();
        return parse(b.openedOn) - parse(a.openedOn);
      }
      if (sort === "Priority") return priorityRank[a.priority] - priorityRank[b.priority];
      // Last Updated: keep spec order (FIR case first)
      return CASES.indexOf(a) - CASES.indexOf(b);
    });
  }, [query, filter, sort]);

  const counts = {
    total: CASES.length,
    active: CASES.filter((c) => c.status === "Active").length,
    review: CASES.filter((c) => c.status === "Under Review").length,
    closed: CASES.filter((c) => c.status === "Closed").length,
  };

  const officer = session?.name ?? "Rahul Mehta";

  return (
    <AppShell title="Cases">
      {/* Compact metric strip — restrained, not giant cards */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border border-border bg-card px-4 py-2.5 text-[13px]">
        <span className="label-caps">Workspace of {officer}</span>
        <span className="flex items-baseline gap-1.5">
          <span className="label-caps">Total Cases</span>
          <span className="text-base font-semibold tabular-nums">{counts.total}</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="label-caps">Active</span>
          <span className="font-semibold tabular-nums">{counts.active}</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="label-caps">Under Review</span>
          <span className="font-semibold tabular-nums">{counts.review}</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="label-caps">Closed</span>
          <span className="font-semibold tabular-nums">{counts.closed}</span>
        </span>
        <span className="ml-auto hidden text-[11.5px] text-muted-foreground sm:block">
          Click a case to open its workspace
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[240px] flex-1 md:max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases — ID, title, officer, location…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "border px-3 py-1.5 text-[13px] font-medium transition-colors",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-9 rounded-none border border-input bg-card px-2.5 text-[13px]"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {(query || filter !== "All" || sort !== "Last Updated") && (
          <button
            className="flex items-center gap-1 pb-2 text-[12.5px] text-muted-foreground hover:text-foreground"
            onClick={() => {
              setQuery("");
              setFilter("All");
              setSort("Last Updated");
            }}
          >
            <X className="size-3.5" /> Reset
          </button>
        )}
      </div>

      {/* Case table */}
      <div className="overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr>
              <Th>Case ID</Th>
              <Th>Case Title</Th>
              <Th>Type</Th>
              <Th>Location</Th>
              <Th>Assigned Officer</Th>
              <Th>Date Opened</Th>
              <Th>Last Activity</Th>
              <Th>Status</Th>
              <Th className="text-right">Documents</Th>
              <Th className="text-right">Evidence</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const docs =
                DOCUMENTS.filter((d) => d.caseId === c.id).length +
                runtimeDocs.filter((d) => d.caseId === c.id).length;
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
                  <Td className="whitespace-nowrap text-muted-foreground">{c.type}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{c.location}</Td>
                  <Td className="whitespace-nowrap">{c.investigator}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{c.openedOn}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">
                    {LAST_ACTIVITY[c.id] ?? c.lastUpdated}
                  </Td>
                  <Td>
                    <CaseStatusBadge status={c.status} />
                  </Td>
                  <Td className="text-right tabular-nums">{docs}</Td>
                  <Td className="text-right tabular-nums">{evd}</Td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <Td colSpan={10} className="py-12 text-center text-muted-foreground">
                  No cases match “{query}” with the current filters.
                </Td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-[12px] text-muted-foreground">
        {filtered.length} of {CASES.length} cases shown · demo workspace with fabricated records
      </p>
    </AppShell>
  );
}
