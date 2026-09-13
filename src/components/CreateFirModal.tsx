import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Btn, Mono } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createFirCase,
  generateFirNumber,
  type CaseCreatedCallback,
} from "@/lib/cases-repository";
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim() || !firNo.trim()) {
      setError("FIR number and title are required.");
      return;
    }
    setSubmitting(true);
    setError(null);

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
      setSubmitting(false);
      setError(result.error);
      return;
    }

    toast.success(`FIR ${result.case.id} registered`, {
      description:
        result.source === "supabase"
          ? "Saved to the secure case database."
          : "Saved for this session (demo mode).",
    });
    onCreated(result.case);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto border border-border bg-card shadow-xl">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Register New FIR</h3>
            <p className="text-[11.5px] text-muted-foreground">
              {isSupabaseConfigured
                ? "Saves as a permanent record in the case database."
                : "Case database not connected — see Settings → Supabase database."}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="p-1 hover:bg-secondary">
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
                className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm"
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
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              placeholder="Brief summary of the incident…"
            />
          </div>

          {error && (
            <p className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">
              {error}
            </p>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Btn variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Btn>
          <Btn size="sm" onClick={submit} disabled={submitting}>
            {submitting ? "Registering…" : "Register FIR"}
          </Btn>
        </footer>
      </div>
    </div>
  );
}
