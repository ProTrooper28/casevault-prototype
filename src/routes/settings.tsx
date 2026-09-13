import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Cloud, Database, RefreshCw, Server, SlidersHorizontal, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Btn, Panel, PageIntro, Field, DemoNotice, Mono } from "@/components/kit";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import { pushSnapshotToSupabase, testSupabaseConnection } from "@/lib/supabase-sync";
import { getAppState } from "@/lib/app-state";

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

type SyncState =
  | { kind: "idle" }
  | { kind: "busy"; label: string }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

function SupabasePanel() {
  const [sync, setSync] = useState<SyncState>({ kind: "idle" });

  async function run(action: "test" | "sync") {
    setSync({ kind: "busy", label: action === "test" ? "Testing connection…" : "Uploading dataset…" });
    try {
      const result =
        action === "test" ? await testSupabaseConnection() : await pushSnapshotToSupabase(getAppState());
      setSync(result.ok ? { kind: "ok", message: result.message } : { kind: "error", message: result.message });
    } catch (err) {
      setSync({
        kind: "error",
        message: err instanceof Error ? err.message : "Unexpected network error",
      });
    }
  }

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <Cloud className="size-4 text-muted-foreground" /> Supabase database
        </span>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium">Connection status</p>
            <p className="text-[11.5px] text-muted-foreground">
              {isSupabaseConfigured
                ? "Keys detected — the app can persist to your Supabase project."
                : "Add the two keys below in the Keys tab to connect."}
            </p>
          </div>
          <Badge tone={isSupabaseConfigured ? "success" : "neutral"}>
            {isSupabaseConfigured ? "Configured" : "Local demo mode"}
          </Badge>
        </div>

        <div className="rounded-md border border-border bg-muted/40 p-3">
          <p className="label-caps mb-1.5">Required keys</p>
          <ul className="space-y-1 text-[12px]">
            <li>
              <Mono>VITE_SUPABASE_URL</Mono> — project URL, e.g. https://xyz.supabase.co
            </li>
            <li>
              <Mono>VITE_SUPABASE_ANON_KEY</Mono> — public anon key (RLS-protected)
            </li>
          </ul>
          <p className="mt-2 text-[11.5px] text-muted-foreground">
            Server-only secret (never exposed to the browser): <Mono>SUPABASE_SERVICE_ROLE_KEY</Mono>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Btn size="sm" onClick={() => run("test")} disabled={sync.kind === "busy"}>
            Test connection
          </Btn>
          <Btn size="sm" onClick={() => run("sync")} disabled={sync.kind === "busy"}>
            Sync demo dataset
          </Btn>
        </div>

        {sync.kind === "busy" && (
          <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <RefreshCw className="size-3.5 animate-spin" /> {sync.label}
          </p>
        )}
        {sync.kind === "ok" && (
          <p className="flex items-center gap-2 text-[12.5px] text-emerald-700">
            <CheckCircle2 className="size-4" /> {sync.message}
          </p>
        )}
        {sync.kind === "error" && (
          <p className="flex items-center gap-2 text-[12.5px] text-red-700">
            <XCircle className="size-4" /> {sync.message}
          </p>
        )}

        <p className="text-[11.5px] text-muted-foreground">
          The SQL schema lives in <Mono>supabase/schema.sql</Mono> — run it in the Supabase SQL Editor
          before syncing. Sync is idempotent: re-running never duplicates rows.
        </p>
      </div>
    </Panel>
  );
}

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
        <div className="space-y-4">
          <SupabasePanel />

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
        </div>

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
                label="Database"
                value={
                  <span className="flex items-center gap-2">
                    <Mono>Supabase Postgres</Mono> <Badge tone="success">integrated</Badge>
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
                value="Frontend demo state; optional Supabase persistence via Settings"
              />
            </dl>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
