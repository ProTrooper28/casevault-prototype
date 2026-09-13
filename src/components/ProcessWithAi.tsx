import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Badge, Btn, Mono, Panel } from "@/components/kit";
import { processDocument } from "@/lib/ai-processing";
import { applyProcessedDocument } from "@/lib/uploads-repository";
import { recordAuditEvent } from "@/lib/audit-repository";
import type { Document } from "@/lib/mock-data";

/**
 * Client side of the real AI pipeline.
 *
 * The button only appears for documents that were actually uploaded (they have
 * real stored bytes + a real SHA-256). Clicking it runs:
 *   browser → processDocument (server fn: Storage download + proxy) → Python/FastAPI
 * and renders exactly what the real service extracted — nothing is faked here.
 */

const STAGES = [
  "Fetching document from secure vault…",
  "OCR / text extraction…",
  "Entity extraction…",
  "Document classification…",
  "Building summary…",
] as const;

function EntityGroup({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div>
      <p className="label-caps">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Badge key={v} tone="neutral" className="normal-case">
            {v}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function ProcessWithAi({ doc }: { doc: Document }) {
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof processDocument>> | null>(null);
  const timerRef = useRef<number | null>(null);

  // Only DB-backed uploads with real stored bytes can be processed.
  // NOTE: computed before hooks, but the early return happens AFTER all hooks
  // run — conditional hook execution crashes React on demo documents.
  const canProcess = /^DOC-R/.test(doc.id) && /^[a-f0-9]{64}$/.test(doc.hash);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  if (!canProcess) return null;

  const startStageCycler = () => {
    setStage(0);
    timerRef.current = window.setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 2500);
  };
  const stopStageCycler = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    startStageCycler();
    // Real audit record — AI processing started (public.audit_trail).
    void recordAuditEvent({
      action: `AI processing started on ${doc.name} (${doc.id})`,
      caseId: doc.caseId,
      document: doc.name,
      status: "Success",
    });
    try {
      const res = await processDocument({ data: { docId: doc.id } });
      if (res.ok) {
        setResult(res);
        // Real audit record — AI processing completed.
        void recordAuditEvent({
          action: `AI processing completed — classified as ${res.documentType}, ${res.textChars} chars extracted (${doc.id})`,
          caseId: doc.caseId,
          document: doc.name,
          status: "Success",
        });
        // Patch the cached DB document so the existing AI panel + registers
        // show the real results after re-navigation too.
        applyProcessedDocument(doc.id, {
          type: res.documentType,
          summary: res.summary,
          persons: res.persons,
          sections: res.sections,
          extracted: res.extracted,
          pages: res.pages,
        });
        toast.success("AI processing completed — results saved to the document record.");
      } else {
        setError(res.error);
        void recordAuditEvent({
          action: `AI processing failed — ${res.error} (${doc.id})`,
          caseId: doc.caseId,
          document: doc.name,
          status: "Warning",
        });
        toast.error("AI processing failed.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error during AI processing.";
      setError(msg);
      void recordAuditEvent({
        action: `AI processing failed — ${msg} (${doc.id})`,
        caseId: doc.caseId,
        document: doc.name,
        status: "Warning",
      });
      toast.error("AI processing failed.");
    } finally {
      stopStageCycler();
      setBusy(false);
    }
  };

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="size-4 text-ai" /> AI document processing
          <Badge tone="ai" className="ml-1">OCR · NER · classify</Badge>
        </span>
      }
    >
      <p className="text-[12.5px] leading-snug text-muted-foreground">
        Runs the real pipeline on the stored file: PDF text extraction / Tesseract OCR → spaCy
        entity recognition → content-based classification → extractive summary. Results are written
        to the document record; the stored file and its SHA-256 are never modified.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Btn variant="ai" size="sm" onClick={run} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> {STAGES[stage]}
            </>
          ) : (
            <>
              <Sparkles className="size-3.5" /> Process with AI
            </>
          )}
        </Btn>
      </div>

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-sm border border-alert/40 bg-alert-soft px-3 py-2.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-alert" />
          <p className="text-[12.5px] text-alert">{error}</p>
        </div>
      ) : null}

      {result?.ok ? (
        <div className="mt-4 space-y-3 border-t border-border pt-3">
          <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-success">
            <CheckCircle2 className="size-4" /> Processing completed
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <dt className="label-caps">Document type</dt>
              <dd className="text-sm font-medium">{result.documentType}</dd>
            </div>
            <div>
              <dt className="label-caps">Extracted from</dt>
              <dd className="text-sm font-medium">
                {result.pages} page{result.pages === 1 ? "" : "s"}
                {result.ocrPages > 0 ? ` · ${result.ocrPages} OCR` : ""}
              </dd>
            </div>
          </dl>

          <div>
            <p className="label-caps">Summary</p>
            <p className="mt-1 text-[12.5px] leading-snug">{result.summary || "—"}</p>
          </div>

          <div className="space-y-2.5">
            <EntityGroup label="Persons" values={result.persons} />
            <EntityGroup label="Locations" values={result.locations} />
            <EntityGroup label="Organizations" values={result.organizations} />
            <EntityGroup label="Dates" values={result.dates} />
            <EntityGroup label="Sections / Acts" values={result.sections} />
            <EntityGroup label="FIR / case numbers" values={result.firNumbers} />
            <EntityGroup label="Police stations" values={result.policeStations} />
          </div>

          <p className="text-[11.5px] text-muted-foreground">
            Text analysed: <Mono>{result.textChars.toLocaleString()}</Mono> characters
            {result.ocrPages > 0 ? " (OCR applied to scanned pages)" : ""}.
          </p>
        </div>
      ) : null}
    </Panel>
  );
}
