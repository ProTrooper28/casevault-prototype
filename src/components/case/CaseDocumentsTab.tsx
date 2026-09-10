import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Upload, X, CheckCircle2 } from "lucide-react";
import { Btn, IntegrityBadge, Mono, Td, Th } from "@/components/kit";
import { getCase } from "@/lib/mock-data";
import { allDocuments, findDocument, useApp, uploadDocument } from "@/lib/app-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DOC_TYPES = [
  "FIR",
  "Investigation Report",
  "Witness Statement",
  "Forensic Report",
  "Court Filing",
  "Evidence Record",
  "Legal Notice",
] as const;

const STAGES = [
  "Uploading…",
  "Processing…",
  "Metadata extracted",
  "Integrity fingerprint generated",
  "Document added to case",
] as const;

function UploadModal({ caseId, onClose }: { caseId: string; onClose: () => void }) {
  const [fileName, setFileName] = useState("");
  const [docType, setDocType] = useState<(typeof DOC_TYPES)[number]>("FIR");
  const [notes, setNotes] = useState("");
  const [stage, setStage] = useState(-1); // -1 = form, 0..4 = progress, 5 = done

  function start() {
    if (!fileName.trim()) return;
    setStage(0);
    // Deterministic staged progress — no timers, no randomness.
    const timers = [
      window.setTimeout(() => setStage(1), 500),
      window.setTimeout(() => setStage(2), 1000),
      window.setTimeout(() => setStage(3), 1500),
      window.setTimeout(() => {
        uploadDocument({ caseId, fileName: fileName.trim(), docType, notes });
        setStage(4);
      }, 2000),
    ];
    void timers;
  }

  const done = stage === 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative w-full max-w-md border border-border bg-card shadow-xl">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Upload Document</h3>
          <button onClick={onClose} aria-label="Close" className="p-1 hover:bg-secondary">
            <X className="size-4" />
          </button>
        </header>

        {stage === -1 ? (
          <div className="space-y-3.5 px-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="up-file">File name</Label>
              <Input
                id="up-file"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. Seizure-Memo-02.pdf"
              />
              <p className="text-[11px] text-muted-foreground">
                File storage is simulated — type a file name to run the intake pipeline.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="up-type">Document type</Label>
              <select
                id="up-type"
                value={docType}
                onChange={(e) => setDocType(e.target.value as (typeof DOC_TYPES)[number])}
                className="h-9 w-full border border-input bg-card px-2.5 text-sm"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="up-notes">Notes (optional)</Label>
              <Input
                id="up-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Context for the case file"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Btn variant="outline" onClick={onClose}>
                Cancel
              </Btn>
              <Btn onClick={start} disabled={!fileName.trim()}>
                <Upload className="size-3.5" /> Upload
              </Btn>
            </div>
          </div>
        ) : (
          <div className="px-4 py-4">
            <ul className="space-y-2.5">
              {STAGES.map((s, i) => {
                const state = i < stage ? "done" : i === stage ? "active" : "pending";
                return (
                  <li key={s} className="flex items-center gap-2.5 text-[13px]">
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-full border",
                        state === "done" && "border-success bg-success text-white",
                        state === "active" && "border-primary",
                        state === "pending" && "border-border-strong",
                      )}
                    >
                      {state === "done" ? <CheckCircle2 className="size-3" /> : null}
                    </span>
                    <span
                      className={cn(
                        state === "pending" && "text-muted-foreground",
                        state === "active" && "font-medium",
                      )}
                    >
                      {s}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex justify-end border-t border-border pt-3">
              <Btn variant={done ? "primary" : "outline"} onClick={onClose}>
                {done ? "Close" : "Cancel"}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CaseDocumentsTab({ caseId }: { caseId: string }) {
  const app = useApp();
  const [uploadOpen, setUploadOpen] = useState(false);
  const navigate = useNavigate();
  const c = getCase(caseId);
  const docs = allDocuments(app).filter((d) => d.caseId === caseId);

  return (
    <div className="border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div>
          <h2 className="text-sm font-semibold">Document Register</h2>
          <p className="text-[11.5px] text-muted-foreground">
            {docs.length} documents on file for {c?.id ?? caseId}
          </p>
        </div>
        <Btn size="sm" onClick={() => setUploadOpen(true)}>
          <Upload className="size-3.5" /> Upload Document
        </Btn>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              <Th className="px-4">Document</Th>
              <Th>Type</Th>
              <Th>Version</Th>
              <Th>Uploaded By</Th>
              <Th>Date</Th>
              <Th>Integrity</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => {
              const resolved = findDocument(d.id);
              const version = "version" in d ? d.version : "?";
              const uploadedBy = "uploadedBy" in d ? d.uploadedBy : "—";
              const date = "date" in d ? d.date : "—";
              return (
                <tr key={d.id} className="hover:bg-secondary/50">
                  <Td className="px-4">
                    <p className="font-medium">{d.name}</p>
                    <Mono className="text-[11px] text-muted-foreground">{d.id}</Mono>
                  </Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{d.type}</Td>
                  <Td className="whitespace-nowrap">v{version}</Td>
                  <Td className="whitespace-nowrap">{uploadedBy}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{date}</Td>
                  <Td>
                    <IntegrityBadge status={resolved?.integrity ?? d.integrity} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1.5 pr-4">
                      <button
                        onClick={() => navigate({ href: `/documents/${d.id}` })}
                        className="border border-border px-2 py-0.5 text-[12px] font-medium hover:bg-secondary"
                      >
                        View
                      </button>
                      <button
                        onClick={() =>
                          navigate({ href: `/audit?q=${encodeURIComponent(d.name)}` })
                        }
                        className="px-2 py-0.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        History
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
            {docs.length === 0 ? (
              <tr>
                <Td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No documents on file for this case yet.
                </Td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {uploadOpen ? <UploadModal caseId={caseId} onClose={() => setUploadOpen(false)} /> : null}
    </div>
  );
}
