import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Paperclip, ShieldCheck, Clock, ShieldAlert, Plus, X, Eye } from "lucide-react";
import { Badge, Btn, IntegrityBadge, Mono } from "@/components/kit";
import { caseTimeline, eventWithAttachments, type TimelineEvent } from "@/lib/case-timeline";
import { addEvidence, attachEvidenceToEvent, useApp } from "@/lib/app-state";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const EVIDENCE_TYPES = ["Document", "Image", "Video", "Audio", "Other"] as const;

function AddEvidenceModal({
  event,
  caseId,
  onClose,
}: {
  event: TimelineEvent;
  caseId: string;
  onClose: () => void;
}) {
  const [type, setType] = useState<(typeof EVIDENCE_TYPES)[number]>("Document");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [collectedDate, setCollectedDate] = useState(event.date);

  function submit() {
    if (!name.trim()) return;
    const item = addEvidence({
      caseId,
      eventId: event.id,
      type,
      name: name.trim(),
      description: description.trim(),
      source: source.trim(),
      collectedDate: collectedDate.trim() || event.date,
    });
    attachEvidenceToEvent(event.id, {
      id: item.id,
      label: item.name,
      kind: "evidence",
      href: `/evidence/${item.id}`,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto border border-border bg-card shadow-xl">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Add Evidence</h3>
            <p className="text-[11.5px] text-muted-foreground">
              {event.title} · {event.date}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="p-1 hover:bg-secondary">
            <X className="size-4" />
          </button>
        </header>

        <div className="space-y-3.5 px-4 py-4">
          <div className="space-y-1.5">
            <Label>Evidence Type</Label>
            <div className="flex flex-wrap gap-1.5">
              {EVIDENCE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "border px-2.5 py-1 text-[12.5px] font-medium transition-colors",
                    type === t
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-name">Evidence Name</Label>
            <Input
              id="ev-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CCTV-AND-014.mp4"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-desc">Description</Label>
            <Input
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of the item"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ev-source">Source</Label>
              <Input
                id="ev-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Premises NVR, operator statement"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-date">Collection Date</Label>
              <Input
                id="ev-date"
                value={collectedDate}
                onChange={(e) => setCollectedDate(e.target.value)}
                placeholder="e.g. 13 Jan 2026"
              />
            </div>
          </div>

          <div className="border border-dashed border-border-strong px-4 py-5 text-center">
            <Paperclip className="mx-auto size-4 text-muted-foreground" />
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Upload File — file storage is simulated in this prototype; the register entry and
              fingerprint are generated locally.
            </p>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn onClick={submit} disabled={!name.trim()}>
            <Plus className="size-3.5" /> Add Evidence
          </Btn>
        </footer>
      </div>
    </div>
  );
}

function EventBlock({ event, caseId }: { event: TimelineEvent; caseId: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <li className="relative flex gap-4 pl-6">
      {/* connector */}
      <span className="absolute top-4 bottom-[-1.25rem] left-[5px] w-px bg-border-strong" />
      <span className="absolute top-[7px] left-0 size-[11px] rounded-full border-2 border-card bg-primary" />

      <div className="min-w-0 flex-1 pb-5">
        {/* timestamp row */}
        <div className="flex flex-wrap items-baseline gap-x-3">
          <span className="font-mono text-[12px] font-semibold tracking-wide uppercase">
            {event.date}
          </span>
          <span className="font-mono text-[12px] text-muted-foreground">{event.time}</span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h3 className="text-[13.5px] font-semibold">{event.title}</h3>
          {event.integrity ? (
            <Badge
              tone={
                event.integrity.status === "verified"
                  ? "success"
                  : event.integrity.status === "pending"
                    ? "warning"
                    : "alert"
              }
            >
              {event.integrity.status === "verified" ? (
                <ShieldCheck className="size-3" />
              ) : event.integrity.status === "pending" ? (
                <Clock className="size-3" />
              ) : (
                <ShieldAlert className="size-3" />
              )}
              {event.integrity.label}
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">{event.description}</p>

        {/* attachments */}
        {event.attachments.length > 0 ? (
          <div className="mt-2.5">
            <p className="label-caps">
              {event.attachments.some((a) => a.kind === "evidence") ? "Evidence" : "Attachments"}
            </p>
            <ul className="mt-1 divide-y divide-border border border-border">
              {event.attachments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-1.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-[12.5px] font-medium">{a.label}</span>
                    <Mono className="hidden shrink-0 text-[10.5px] text-muted-foreground sm:inline">
                      {a.id}
                    </Mono>
                  </span>
                  <button
                    onClick={() => navigate({ href: a.href })}
                    className="flex shrink-0 items-center gap-1 border border-border px-2 py-0.5 text-[12px] font-medium hover:bg-secondary"
                  >
                    <Eye className="size-3" /> View
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-2.5 flex items-center gap-2">
          <Btn variant="outline" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="size-3.5" /> Add Evidence
          </Btn>
        </div>
      </div>

      {modalOpen ? (
        <AddEvidenceModal event={event} caseId={caseId} onClose={() => setModalOpen(false)} />
      ) : null}
    </li>
  );
}

export function CaseTimelineTab({ caseId }: { caseId: string }) {
  const { evidence } = useApp();
  const events = caseTimeline(caseId).map(eventWithAttachments);
  const caseEvidence = evidence.filter((e) => e.caseId === caseId);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="border border-border bg-card lg:col-span-2">
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-semibold">Investigation Chronology</h2>
          <span className="text-[11.5px] text-muted-foreground">
            {events.length} events · newest last
          </span>
        </header>
        <div className="px-4 py-4">
          <ol className="space-y-0">
            {events.map((e) => (
              <EventBlock key={e.id} event={e} caseId={caseId} />
            ))}
          </ol>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-border bg-card">
          <header className="border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">Evidence added this session</h2>
          </header>
          <div className="px-4 py-3">
            {caseEvidence.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground">
                Nothing added yet. Use “Add Evidence” on any event — the item is appended to the
                event and to the case evidence register.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {caseEvidence.map((e) => (
                  <li key={e.id} className="py-2 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <Mono className="text-[12px] font-semibold">{e.id}</Mono>
                      <IntegrityBadge status={e.integrity} />
                    </div>
                    <p className="truncate text-[12.5px] font-medium">{e.name}</p>
                    <p className="text-[11px] text-muted-foreground">Added {e.addedAt}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="border border-border bg-card px-4 py-3 text-[12px] text-muted-foreground">
          <p className="font-medium text-foreground">Chronology rules</p>
          <p className="mt-1 leading-relaxed">
            Events are append-only. Every evidence item added here receives an ID, a SHA-256
            fingerprint and a chain-of-custody record, and is audit-logged.
          </p>
        </div>
      </div>
    </div>
  );
}
