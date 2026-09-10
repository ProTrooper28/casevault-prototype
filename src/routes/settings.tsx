import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Database, Server, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Btn, Panel, PageIntro, Field, DemoNotice, Mono } from "@/components/kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

const PIPELINE_TOGGLES = [
  { key: "ocr", label: "OCR text extraction", planned: "Tesseract / PaddleOCR" },
  { key: "classification", label: "Document classification", planned: "FastAPI classifier" },
  { key: "entities", label: "Entity extraction", planned: "spaCy / transformer NER" },
  { key: "metadata", label: "Metadata extraction", planned: "Rules service" },
  { key: "index", label: "Semantic indexing", planned: "Sentence Transformers + FAISS" },
] as const;

function Settings() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(PIPELINE_TOGGLES.map((t) => [t.key, true])),
  );
  const [retention, setRetention] = useState("7");

  return (
    <AppShell title="Settings">
      <PageIntro
        title="Workspace Settings"
        description="Prototype configuration for the AI pipeline, retention policy and deployment topology. Values persist for this session only."
      />
      <DemoNotice>
        Settings are frontend-only in this prototype. Production wires these to the deployment
        environment and the NCRB backend.
      </DemoNotice>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-ai" /> AI pipeline stages
            </span>
          }
        >
          <ul className="divide-y divide-border">
            {PIPELINE_TOGGLES.map((t) => (
              <li key={t.key} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-[13px] font-medium">{t.label}</p>
                  <p className="text-[11.5px] text-muted-foreground">Planned: {t.planned}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={enabled[t.key]}
                  aria-label={`Toggle ${t.label}`}
                  onClick={() => setEnabled((s) => ({ ...s, [t.key]: !s[t.key] }))}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    enabled[t.key] ? "bg-ai" : "bg-border-strong",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-4 rounded-full bg-white transition-all",
                      enabled[t.key] ? "left-[18px]" : "left-0.5",
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel
            title={
              <span className="flex items-center gap-2">
                <Database className="size-4 text-muted-foreground" /> Retention policy
              </span>
            }
          >
            <div className="space-y-1.5">
              <p className="label-caps">Document retention (years)</p>
              <select
                value={retention}
                onChange={(e) => setRetention(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm"
              >
                {["3", "5", "7", "10", "Per legal hold"].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <p className="text-[11.5px] text-muted-foreground">
                Case files are retained per NCRB record-retention guidance; legal holds override
                expiry.
              </p>
            </div>
            <div className="mt-4">
              <Btn
                size="sm"
                onClick={() => {
                  /* prototype: values persist in component state only */
                }}
              >
                Save configuration
              </Btn>
            </div>
          </Panel>

          <Panel
            title={
              <span className="flex items-center gap-2">
                <Server className="size-4 text-muted-foreground" /> Deployment topology (planned)
              </span>
            }
          >
            <dl className="space-y-3">
              <Field
                label="Ingest service"
                value={
                  <span className="flex items-center gap-2">
                    <Mono>FastAPI</Mono> <Badge tone="neutral">planned</Badge>
                  </span>
                }
              />
              <Field
                label="Vector index"
                value={
                  <span className="flex items-center gap-2">
                    <Mono>FAISS</Mono> <Badge tone="neutral">planned</Badge>
                  </span>
                }
              />
              <Field
                label="Ledger"
                value={
                  <span className="flex items-center gap-2">
                    <Mono>Hyperledger</Mono> <Badge tone="neutral">planned</Badge>
                  </span>
                }
              />
              <Field
                label="Prototype scope"
                value="Frontend only — all data is local demo state"
              />
            </dl>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
