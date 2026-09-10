import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Upload, ShieldCheck, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, BtnLink, PageIntro, DemoNotice } from "@/components/kit";
import { DocumentsTable } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { DOCUMENT_CATEGORIES, type IntegrityStatus } from "@/lib/mock-data";
import { allDocuments, useApp } from "@/lib/app-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents/")({
  component: Documents,
});

const INTEGRITY_FILTERS: (IntegrityStatus | "all")[] = ["all", "verified", "pending", "compromised"];

function Documents() {
  const navigate = useNavigate();
  const app = useApp();
  const documents = allDocuments(app);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [integrityFilter, setIntegrityFilter] = useState<IntegrityStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((d) => {
      const matchesQuery =
        !q ||
        [d.id, d.name, d.type, d.caseId, d.uploadedBy, d.caseType, d.location]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesCategory = category === "All" || d.category === category;
      const effective: IntegrityStatus = d.integrity;
      const matchesIntegrity = integrityFilter === "all" || effective === integrityFilter;
      return matchesQuery && matchesCategory && matchesIntegrity;
    });
  }, [documents, query, category, integrityFilter]);

  return (
    <AppShell title="Documents">
      <PageIntro
        title="Document Vault"
        description="All ingested case documents with AI-extracted metadata, versioning and hash-based integrity state."
        actions={
          <>
            <BtnLink to="/ai-processing" variant="outline">
              <Upload className="size-3.5" /> AI Processing
            </BtnLink>
            <BtnLink to="/integrity">
              <ShieldCheck className="size-3.5" /> Integrity & Verification
            </BtnLink>
          </>
        }
      />
      <DemoNotice />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 md:max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents, case IDs, uploaders…"
            className="pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-md border border-input bg-card px-2.5 text-sm"
        >
          {["All", ...DOCUMENT_CATEGORIES].map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All categories" : c}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {INTEGRITY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setIntegrityFilter(f)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-[13px] font-medium capitalize transition-colors",
                integrityFilter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary",
              )}
            >
              {f === "all" ? "All statuses" : f}
            </button>
          ))}
        </div>
        {query || category !== "All" || integrityFilter !== "all" ? (
          <button
            className="flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground"
            onClick={() => {
              setQuery("");
              setCategory("All");
              setIntegrityFilter("all");
            }}
          >
            <X className="size-3.5" /> Clear filters
          </button>
        ) : null}
      </div>

      <p className="text-[12.5px] text-muted-foreground">
        Showing {filtered.length} of {documents.length} documents
      </p>

      <DocumentsTable documents={filtered} />

      <p className="text-[12px] text-muted-foreground">
        Need the full case context?{" "}
        <button
          className="font-medium text-info underline-offset-2 hover:underline"
          onClick={() => navigate({ to: "/cases", search: {} })}
        >
          Browse cases
        </button>
      </p>
    </AppShell>
  );
}
