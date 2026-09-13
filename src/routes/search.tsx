import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, FolderOpen, FileText, ArrowRight, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Btn, BtnLink, IntegrityBadge, Mono, PageIntro, DemoNotice } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { CASES } from "@/lib/mock-data";
import { allCases } from "@/lib/cases-repository";
import { allDocuments, useApp } from "@/lib/app-state";
import { EVIDENCE_REGISTER } from "@/lib/evidence-register";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/search")({
  component: SmartSearch,
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    const q = search["q"];
    return typeof q === "string" ? { q } : {};
  },
});

type Hit =
  | { kind: "case"; id: string; title: string; sub: string; meta: string; to: string; tone: "info" }
  | {
      kind: "document";
      id: string;
      title: string;
      sub: string;
      meta: string;
      to: string;
      tone: "ai";
      integrity: "verified" | "pending" | "compromised";
    }
  | { kind: "evidence"; id: string; title: string; sub: string; meta: string; to: string; tone: "neutral" };

const EXAMPLES = ["Rahul Sharma", "theft", "Andheri", "FIR", "forensic"];

function SmartSearch() {
  const navigate = useNavigate();
  const app = useApp();
  const documents = allDocuments(app);
  const searchParams = Route.useSearch();
  const [query, setQuery] = useState(searchParams.q ?? "");
  const [submitted, setSubmitted] = useState(searchParams.q ?? "");

  const results = useMemo<Hit[]>(() => {
    const q = submitted.trim().toLowerCase();
    if (!q) return [];
    const hits: Hit[] = [];

    for (const c of allCases()) {
      const hay = [c.id, c.title, c.type, c.location, c.investigator, c.summary, ...c.sections, ...c.people.map((p) => p.name)]
        .join(" ")
        .toLowerCase();
      if (hay.includes(q))
        hits.push({
          kind: "case",
          id: c.id,
          title: c.title,
          sub: `${c.type} · ${c.location} · ${c.status}`,
          meta: c.investigator,
          to: `/cases/${c.id}`,
          tone: "info",
        });
    }

    for (const d of documents) {
      const hay = [d.id, d.name, d.type, d.caseId, d.uploadedBy, d.caseType, d.location, d.summary, ...d.persons, ...d.sections]
        .join(" ")
        .toLowerCase();
      if (hay.includes(q))
        hits.push({
          kind: "document",
          id: d.id,
          title: d.name,
          sub: `${d.type} · ${d.caseId} · uploaded by ${d.uploadedBy}`,
          meta: d.date,
          to: `/documents/${d.id}`,
          tone: "ai",
          integrity: d.integrity,
        });
    }

    for (const e of EVIDENCE_REGISTER) {
      const hay = [e.id, e.caseId, e.type, e.description, e.submittedBy, e.custodian].join(" ").toLowerCase();
      if (hay.includes(q))
        hits.push({
          kind: "evidence",
          id: e.id,
          title: `${e.type} — ${e.description}`,
          sub: `${e.caseId} · submitted by ${e.submittedBy}`,
          meta: e.collected,
          to: `/evidence/${e.id}`,
          tone: "neutral",
        });
    }

    for (const e of app.evidence) {
      const hay = [e.id, e.caseId, e.type, e.name, e.description, e.source, e.submittedBy, e.custodian]
        .join(" ")
        .toLowerCase();
      if (hay.includes(q))
        hits.push({
          kind: "evidence",
          id: e.id,
          title: `${e.type} — ${e.name}`,
          sub: `${e.caseId} · submitted by ${e.submittedBy}`,
          meta: e.collectedDate,
          to: `/evidence/${e.id}`,
          tone: "neutral",
        });
    }

    return hits;
  }, [submitted, documents, app.evidence]);

  const counts = {
    case: results.filter((r) => r.kind === "case").length,
    document: results.filter((r) => r.kind === "document").length,
    evidence: results.filter((r) => r.kind === "evidence").length,
  };

  function runSearch(q: string) {
    setQuery(q);
    setSubmitted(q);
    navigate({ to: "/search", search: { q } });
  }

  return (
    <AppShell title="Smart Search">
      <PageIntro
        title="Smart Search"
        description="Semantic-style search across cases, documents, people and evidence. The prototype matches on indexed record text; production adds Sentence Transformers + FAISS embeddings."
        actions={<Badge tone="ai">Prototype matcher</Badge>}
      />
      <DemoNotice />

      {/* Search box */}
      <div className="rounded-sm border border-border bg-card p-4">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
        >
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try "Rahul Sharma", "theft", "Andheri", "FIR", "forensic"…'
              className="pl-9"
            />
          </div>
          <Btn type="submit">
            <Search className="size-3.5" /> Search
          </Btn>
          {submitted ? (
            <Btn variant="ghost" onClick={() => runSearch("")}>
              <X className="size-3.5" /> Clear
            </Btn>
          ) : null}
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="label-caps">Try</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => runSearch(ex)}
              className={cn(
                "rounded border border-border bg-secondary px-2 py-0.5 text-[12px] font-medium transition-colors hover:bg-accent",
                submitted === ex && "border-primary/40 bg-accent",
              )}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {submitted ? (
        <p className="text-[12.5px] text-muted-foreground">
          {results.length} result{results.length === 1 ? "" : "s"} for{" "}
          <span className="font-semibold text-foreground">“{submitted}”</span> — {counts.case} case
          {counts.case === 1 ? "" : "s"}, {counts.document} document{counts.document === 1 ? "" : "s"},{" "}
          {counts.evidence} evidence
        </p>
      ) : null}

      {/* Results */}
      {results.length === 0 && submitted ? (
        <div className="rounded-md border border-dashed border-border-strong px-4 py-14 text-center">
          <p className="text-sm font-medium">No matches for “{submitted}”.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try a person, city, document type or section (e.g. “Rahul Sharma”, “Andheri”, “IPC 379”).
          </p>
        </div>
      ) : null}

      <div className="space-y-2.5">
        {results.map((r) => (
          <div
            key={`${r.kind}-${r.id}`}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sm border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary/60"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded",
                r.kind === "case"
                  ? "bg-info-soft text-info"
                  : r.kind === "document"
                    ? "bg-ai-soft text-ai"
                    : "bg-secondary text-secondary-foreground",
              )}
            >
              {r.kind === "case" ? (
                <FolderOpen className="size-4" />
              ) : (
                <FileText className="size-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={r.tone}>{r.kind}</Badge>
                <Mono className="text-[12px] font-semibold">{r.id}</Mono>
                {"integrity" in r ? <IntegrityBadge status={r.integrity} /> : null}
              </div>
              <p className="mt-0.5 truncate text-sm font-medium">{r.title}</p>
              <p className="text-[12px] text-muted-foreground">{r.sub}</p>
            </div>
            <span className="text-[12px] whitespace-nowrap text-muted-foreground">{r.meta}</span>
            <BtnLink to={r.to} size="sm" variant="subtle">
              Open <ArrowRight className="size-3.5" />
            </BtnLink>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
