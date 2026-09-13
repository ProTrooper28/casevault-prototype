import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileWarning, Paperclip, X } from "lucide-react";
import { Btn, Mono } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createFirCase,
  generateFirNumber,
  type CaseCreatedCallback,
} from "@/lib/cases-repository";
import { uploadCaseDocument } from "@/lib/uploads-repository";
import { isSupabaseConfigured } from "@/lib/supabase";

/* -------------------------------------------------------------------------- */
/*  Create FIR — minimal form matching the existing modal language.           */
/*  On submit the FIR is inserted into public.cases via the cases repository. */
/* -------------------------------------------------------------------------- */

const CASE_TYPES = [
  "Theft",
  "Financial Fraud",
  "Missing Person",
  "Assault",
  "Cyber Crime",
  "Narcotics",
  "Other",
] as const;
const PRIORITIES = ["High", "Medium", "Low"] as const;

export type FirCreatedCase = Parameters<CaseCreatedCallback>[0];

export function CreateFirModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: CaseCreatedCallback;
}) {
  const suggestedNo = generateFirNumber();

  const [firNo, setFirNo] = useState(suggestedNo);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<(typeof CASE_TYPES)[number]>("Theft");
  const [location, setLocation] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [policeStation, setPoliceStation] = useState("");
  const [complainant, setComplainant] = useState("");
  const [accused, setAccused] = useState("");
  const [sections, setSections] = useState("");
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("Medium");
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<"idle" | "creating" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitting = phase !== "idle";

  async function submit() {
    if (!title.trim() || !firNo.trim()) {
      setError("FIR number and title are required.");
      return;
    }
    setError(null);

    // 1. Create the FIR via the existing flow.
    setPhase("creating");
    const result = await createFirCase({
      id: firNo.trim(),
      title: title.trim(),
      type,
      location: location.trim(),
      incidentDate: incidentDate.trim() || undefined,
      policeStation: policeStation.trim() || undefined,
      complainant: complainant.trim() || undefined,
      accused: accused.trim() || undefined,
      sections: sections
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      summary: summary.trim() || undefined,
      priority,
    });

    if (!result.ok) {
      // Do NOT pretend it saved — surface the real error and keep the form.
      setPhase("idle");
      setError(result.error);
      return;
    }

    // 2. Optional attachment → reuse the existing real upload pipeline
    //    (Storage upload → SHA-256 → documents insert) under the new case ID.
    if (file && result.source === "supabase") {
      setPhase("uploading");
      const upload = await uploadCaseDocument({
        caseId: result.case.id,
        file,
        docType: "FIR",
        notes: summary.trim() || undefined,
      });

      if (!upload.ok) {
        // FIR stays intact; say exactly what failed — never fake success.
        setPhase("idle");
        toast.warning(`FIR ${result.case.id} created, but document upload failed`, {
          description: upload.error,
        });
        setError(
          `The FIR was created successfully, but the document could not be secured (${upload.error}). The FIR has been kept open — you can upload the document later from the case's Documents tab.`,
        );
        onCreated(result.case);
        return;
      }

      toast.success(`FIR created and document secured successfully.`, {
        description: `${result.case.id} registered; ${upload.document.name} stored with verified SHA-256.`,
      });
      onCreated(result.case);
      onClose();
      return;
    }

    if (file && result.source !== "supabase") {
      toast.warning("FIR created for this session", {
        description: "Connect Supabase keys to also store the attached document permanently.",
      });
    } else {
      toast.success(`FIR ${result.case.id} registered`, {
        description:
          result.source === "supabase"
            ? "Saved to the secure case database."
            : "Saved for this session (demo mode).",
      });
    }
    onCreated(result.case);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-sm border border-border bg-card shadow-xl">
        <header className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 text-sidebar-foreground">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              Register New FIR
              <span aria-hidden className="tricolour-bar h-[3px] w-10 rounded-full" />
            </h3>
            <p className="text-[11.5px] text-sidebar-muted">
              {isSupabaseConfigured
                ? "Saves as a permanent record in the case database."
                : "Case database not connected — see Settings → Supabase database."}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="p-1 hover:bg-sidebar-active">
            <X className="size-4" />
          </button>
        </header>

        <div className="space-y-3.5 px-4 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fir-no">FIR / Case Number *</Label>
              <div className="flex gap-1.5">
                <Input id="fir-no" value={firNo} onChange={(e) => setFirNo(e.target.value)} />
                <Btn size="sm" variant="outline" onClick={() => setFirNo(generateFirNumber())}>
                  <Mono className="text-[11px]">Auto</Mono>
                </Btn>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fir-title">Title *</Label>
              <Input
                id="fir-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Theft Investigation"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Case Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as (typeof CASE_TYPES)[number])}
                className="h-9 w-full rounded-sm border border-input bg-card px-2.5 text-sm"
              >
                {CASE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fir-location">Location</Label>
              <Input
                id="fir-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Andheri, Mumbai"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fir-date">Incident Date</Label>
              <Input
                id="fir-date"
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fir-ps">Police Station</Label>
              <Input
                id="fir-ps"
                value={policeStation}
                onChange={(e) => setPoliceStation(e.target.value)}
                placeholder="e.g. Andheri Police Station"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fir-complainant">Complainant Name</Label>
              <Input
                id="fir-complainant"
                value={complainant}
                onChange={(e) => setComplainant(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fir-accused">Accused / Suspect</Label>
              <Input id="fir-accused" value={accused} onChange={(e) => setAccused(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fir-sections">Sections / Acts</Label>
              <Input
                id="fir-sections"
                value={sections}
                onChange={(e) => setSections(e.target.value)}
                placeholder="Comma separated — IPC 379, IPC 411"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <div className="flex gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                      priority === p
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fir-summary">Description / Summary</Label>
            <textarea
              id="fir-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm"
              placeholder="Brief summary of the incident…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fir-file">Attach FIR / Case Document (optional)</Label>
            {file ? (
              <div className="flex items-center justify-between gap-3 border border-border bg-muted/40 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-[12.5px]">
                  <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{file.name}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {Math.max(1, Math.round(file.size / 1024))} KB
                  </span>
                </span>
                <span className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={submitting}
                    className="border border-border px-2 py-0.5 text-[12px] font-medium hover:bg-secondary disabled:opacity-50"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    disabled={submitting}
                    aria-label="Remove attachment"
                    className="px-2 py-0.5 text-[12px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    Remove
                  </button>
                </span>
              </div>
            ) : (
              <input
                ref={inputRef}
                id="fir-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.mp4,.mp3,.txt"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={submitting}
                className="block w-full rounded-sm border border-input bg-card px-2.5 py-1.5 text-[13px] file:mr-3 file:rounded-sm file:border-0 file:bg-secondary file:px-2 file:py-0.5 file:text-[12px] file:font-medium"
              />
            )}
            <p className="text-[11px] text-muted-foreground">
              {isSupabaseConfigured
                ? "The file is stored in the secure vault with a verified SHA-256 fingerprint."
                : "Connect Supabase keys to store the attachment permanently."}
            </p>
          </div>

          {error && (
            <p className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">
              <FileWarning className="mt-0.5 size-3.5 shrink-0" /> {error}
            </p>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Btn variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Btn>
          <Btn size="sm" onClick={submit} disabled={submitting}>
            {phase === "creating" ? "Creating FIR…" : phase === "uploading" ? "Uploading document…" : "Register FIR"}
          </Btn>
        </footer>
      </div>
    </div>
  );
}
