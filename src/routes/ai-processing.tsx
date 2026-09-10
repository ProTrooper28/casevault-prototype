import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ScanText,
  Tags,
  Users,
  ListTree,
  DatabaseZap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Btn, BtnLink, DemoNotice, Mono, Panel, PageIntro } from "@/components/kit";
import { DOCUMENTS, PROCESSING_STAGES, getCase } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai-processing")({
  component: AiProcessing,
});

const STAGE_ICONS = [ScanText, Tags, Users, ListTree, DatabaseZap] as const;
const DOC_KEYS = PROCESSING_STAGES.map((s) => s.key);

/** Deterministic per-doc/per-stage output so refreshes always look identical. */
function stageDetail(docId: string, stageIdx: number) {
  const doc = DOCUMENTS.find((d) => d.id === docId);
  if (!doc) return "—";
  if (stageIdx === 0)
    return `${doc.pages} pages read · ${(doc.name.length * 137 + doc.pages * 61).toLocaleString("en-IN")} characters recognised`;
  if (stageIdx === 1)
    return `Classified as ${doc.type} · ${doc.caseType} (confidence 0.${88 + (doc.pages % 10)})`;
  if (stageIdx === 2)
    return `Extracted ${doc.persons.length} person(s) · ${doc.location} · ${doc.sections.join(", ")}`;
  if (stageIdx === 3)
    return `Linked to ${doc.caseId} · v${doc.version} · ${doc.access} access default`;
  return `${4 + (doc.pages % 8)} passages embedded · index segment sealed for ${doc.caseId}`;
}

function AiProcessing() {
  const [docId, setDocId] = useState("DOC-10241"); // main FIR demo doc
  const [ran, setRan] = useState(false);
  const doc = DOCUMENTS.find((d) => d.id === docId);

  return (
    <AppShell title="AI Processing">
      <PageIntro
        title="AI Document Processing"
        description="Deterministic 5-stage pipeline. In the prototype each stage returns fixed demo output; production plugs in OCR, NER and embedding services."
        actions={
          <Badge tone="ai">
            <Sparkles className="size-3" /> Prototype pipeline
          </Badge>
        }
      />
      <DemoNotice>
        No live OCR/ML runs here — stages replay deterministic prototype states so results are
        identical on every refresh.
      </DemoNotice>

      {/* Pipeline flow */}
      <div className="flex flex-wrap items-center gap-2">
        {PROCESSING_STAGES.map((s, i) => {
          const Icon = STAGE_ICONS[i]!;
          return (
          <div key={s.key} className="flex items-center gap-2">
            <div className="rounded-md border border-border bg-card px-3 py-2">
              <div className="flex items-center gap-2">
                <Icon className="size-3.5 text-ai" />
                <span className="text-[12.5px] font-medium">
                  <span className="text-muted-foreground">S{i + 1}</span> {s.name}
                </span>
              </div>
            </div>
            {i < PROCESSING_STAGES.length - 1 ? (
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
            ) : null}
          </div>
          );
        })}
      </div>

      <Panel title="Run pipeline on a document">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1 md:max-w-md">
            <p className="label-caps mb-1.5">Document</p>
            <select
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm"
            >
              {DOCUMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id} — {d.name}
                </option>
              ))}
            </select>
          </div>
          <Btn onClick={() => setRan(true)}>
            <Sparkles className="size-3.5" /> Run pipeline
          </Btn>
          {ran ? (
            <Btn variant="outline" onClick={() => setRan(false)}>
              Reset
            </Btn>
          ) : null}
        </div>
        {doc ? (
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            Case {getCase(doc.caseId)?.id ?? doc.caseId} · {doc.caseType} · uploaded by{" "}
            {doc.uploadedBy}
          </p>
        ) : null}
      </Panel>

      {/* Stages */}
      <div className="grid gap-3 lg:grid-cols-2">
        {PROCESSING_STAGES.map((s, i) => {
          const Icon = STAGE_ICONS[i]!;
          const done = ran;
          return (
            <div
              key={s.key}
              className={cn(
                "rounded-md border bg-card p-4 shadow-[0_1px_2px_0_oklch(0.25_0.05_258/0.06)] transition-colors",
                done ? "border-success/40" : "border-border",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded",
                    done ? "bg-success-soft text-success" : "bg-ai-soft text-ai",
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">
                      S{i + 1}. {s.name}
                    </h3>
                    {done ? (
                      <Badge tone="success">
                        <CheckCircle2 className="size-3" /> Complete
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Ready</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">{s.description}</p>
                  <div className="mt-2.5 rounded bg-muted px-3 py-2 text-[12.5px]">
                    <p className="font-medium">{done ? stageDetail(docId, i) : s.detail}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Mono>{s.engine}</Mono>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Panel title="Pipeline output → vault linkage" bodyClassName="p-0">
        <div className="divide-y divide-border">
          {[
            {
              label: "Extraction preview",
              value: doc
                ? doc.extracted.map((f) => `${f.label}: ${f.value}`).join(" · ")
                : "—",
            },
            {
              label: "Search indexing",
              value: doc
                ? `Embedded into the ${doc.caseType.toLowerCase()} segment — find this document via Smart Search (“${doc.persons[0] ?? doc.type}”).`
                : "—",
            },
            {
              label: "Next step",
              value: "Verify the fingerprint on the Integrity & Verification page.",
            },
          ].map((row) => (
            <div key={row.label} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
              <span className="label-caps sm:w-40 shrink-0">{row.label}</span>
              <span className="text-[12.5px]">{row.value}</span>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 px-4 py-3">
            <BtnLink to="/documents/$docId" params={{ docId: docId }} size="sm">
              Open document viewer
            </BtnLink>
            <BtnLink to="/integrity" variant="outline" size="sm">
              Go to Integrity & Verification
            </BtnLink>
            <BtnLink to="/search" variant="ghost" size="sm">
              Try Smart Search
            </BtnLink>
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}
