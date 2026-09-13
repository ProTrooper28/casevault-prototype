import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Upload, X, CheckCircle2, FileWarning } from "lucide-react";
import { toast } from "sonner";
import { Btn, IntegrityBadge, Mono, Td, Th } from "@/components/kit";
import { getCase } from "@/lib/mock-data";
import { allDocuments, findDocument, useApp, uploadDocument } from "@/lib/app-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { uploadCaseDocument, useSupabaseRecords } from "@/lib/uploads-repository";
import { isSupabaseConfigured } from "@/lib/supabase";
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

function UploadModal({ caseId, onClose }: { caseId: string; onClose: () => void }) {
  const [docType, setDocType] = useState<(typeof DOC_TYPES)[number]>("FIR");
  const [notes, setNotes] = useState("");
  const [stage, setStage] = useState(-1); // -1 = form, 0 = uploading, 4 = done
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function start() {
    if (!file) return;
    setError(null);
    setStage(0); // real upload in progress — no fake timers

    const result = await uploadCaseDocument({ caseId, file, docType, notes });

    if (!result.ok) {
      setStage(-1);
      setError(
        result.stage === "storage"
          ? `File upload failed: ${result.error}`
          : result.stage === "documents"
            ? `File uploaded to storage, but saving the document record failed: ${result.error}`
            : `Document saved, but evidence registration failed: ${result.error}`,
      );
      return;
    }

    setStage(4);
    toast.success(`${result.document.name} added to case`, {
      description: "File stored in the secure vault; record saved to the database.",
    });
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
              <Label htmlFor="up-file">Document file</Label>
              <input
                ref={inputRef}
                id="up-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.mp4,.mp3,.txt"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full border border-input bg-card px-2.5 py-1.5 text-[13px] file:mr-3 file:border-0 file:bg-secondary file:px-2 file:py-0.5 file:text-[12px] file:font-medium"
              />
              {file && (
                <p className="text-[11px] text-muted-foreground">
                  {file.name} · {Math.max(1, Math.round(file.size / 1024))} KB
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {isSupabaseConfigured
                  ? "The file is stored in the secure vault (case-documents) and linked to this case."
                  : "Connect Supabase keys in Settings to store files permanently."}
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
            {error && (
              <p className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">
                <FileWarning className="mt-0.5 size-3.5 shrink-0" /> {error}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Btn variant="outline" onClick={onClose}>
                Cancel
              </Btn>
              <Btn onClick={start} disabled={!file}>
                <Upload className="size-3.5" /> Upload
              </Btn>
            </div>
          </div>
        ) : (
          <div className="px-4 py-4">
            <ul className="space-y-2.5">
              {[
                stage === 0 && !done ? "Uploading file to secure vault…" : "File stored in secure vault",
                done ? "Document record saved to database" : "Saving document record…",
                done ? "Document added to case" : "Finalizing…",
              ].map((s, i) => {
                const state = done || i === 0 ? "done" : "active";
                return (
                  <li key={`${s}-${i}`} className="flex items-center gap-2.5 text-[13px]">
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-full border",
                        state === "done" && "border-success bg-success text-white",
                        state === "active" && "border-primary",
                      )}
                    >
                      {state === "done" ? <CheckCircle2 className="size-3" /> : null}
                    </span>
                    <span className={state === "active" ? "font-medium" : ""}>{s}</span>
                  </li>
                );
              })}
            </ul>
            {error && (
              <p className="mt-3 flex items-start gap-2 border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">
                <FileWarning className="mt-0.5 size-3.5 shrink-0" /> {error}
              </p>
            )}
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
  const { documents: dbDocs } = useSupabaseRecords();
  const c = getCase(caseId);
  const docs = [...dbDocs, ...allDocuments(app)].filter((d) => d.caseId === caseId);

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
      </div>      {uploadOpen ? <UploadModal caseId={caseId} onClose={() => setUploadOpen(false)} /> : null}
    </div>
  );
}
