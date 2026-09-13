import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  Badge,
  Btn,
  BtnLink,
  DemoNotice,
  Field,
  IntegrityBadge,
  Mono,
  Panel,
} from "@/components/kit";
import { Timeline } from "@/components/shared";
import { shortHash } from "@/lib/mock-data";
import { findDocument, fullAuditTrail } from "@/lib/app-state";
import { cachedDocuments } from "@/lib/uploads-repository";

export const Route = createFileRoute("/documents/$docId")({
  component: DocumentViewer,
});

/** Deterministic mock page render — stands in for a real PDF preview. */
function DocumentPreview({ docId, name, hash }: { docId: string; name: string; hash: string }) {
  const isFir = docId === "DOC-10241";
  return (
    <div className="rounded-md border border-border bg-white p-6 font-mono text-[12.5px] leading-relaxed text-[oklch(0.25_0.03_258)] shadow-inner">
      <div className="border-b-2 border-black/60 pb-3 text-center">
        <p className="text-[13px] font-bold tracking-wide">
          {isFir ? "FIRST INFORMATION REPORT" : name.toUpperCase()}
        </p>
        <p className="mt-1 text-[11px]">
          {isFir ? "Form No. 94 · State Police" : "CaseVault AI — ingested document"}
        </p>
      </div>
      <div className="mt-3 space-y-2.5">
        <p>
          <span className="font-semibold">FIR No.</span> {isFir ? "0124/2026" : "—"}
          &nbsp;&nbsp;<span className="font-semibold">Police Station:</span> Andheri, Mumbai
        </p>
        {isFir ? (
          <>
            <p>
              <span className="font-semibold">Complainant:</span> Rahul Sharma, Store owner, Andheri
              East
            </p>
            <p>
              <span className="font-semibold">Sections:</span> IPC 379, IPC 411
            </p>
            <p className="mt-3">
              Written report: On 11 Jan 2026 at approximately 22:40, unidentified persons gained
              entry to the commercial premises at Andheri East and removed electronic equipment
              valued at ₹4.6 lakh. Premises inspection was conducted on 12 Jan 2026 and seized
              items were listed under the seizure memo. Neighbouring shopkeeper Sunita Rao reported
              observing vehicle movement around the time of the incident.
            </p>
            <p className="mt-3">
              Registered on 12 Jan 2026. Investigation entrusted to Insp. Meera Kulkarni, Andheri
              Police Station.
            </p>
          </>
        ) : (
          <p className="mt-3">
            Preview content is simulated for this prototype. The full document preview is generated
            deterministically from the ingested record so every render is identical — mirroring how
            the production vault re-renders a sealed document byte-for-byte before re-hashing.
          </p>
        )}
        <div className="mt-4 border-t border-black/40 pt-2 text-[11px] text-black/70">
          Sealed copy · page 1 of {docId === "DOC-10241" ? 3 : 1} · rendered from SHA-256{" "}
          {shortHash(hash)}
        </div>
      </div>
    </div>
  );
}

function DocumentViewer() {
  const { docId } = Route.useParams();
  const navigate = useNavigate();
  const doc = findDocument(docId) ?? cachedDocuments().find((d) => d.id === docId);

  if (!doc) {
    return (
      <AppShell title="Document not found">
        <div className="rounded-md border border-border bg-card px-4 py-14 text-center">
          <p className="text-sm font-medium">No document with ID “{docId}”.</p>
          <Btn className="mt-4" onClick={() => navigate({ to: "/documents" })}>
            Back to vault
          </Btn>
        </div>
      </AppShell>
    );
  }

  const effective = doc.integrity;
  const history = fullAuditTrail().filter(
    (a) => a.document === doc.name || a.caseId === doc.caseId,
  );

  return (
    <AppShell title={`Document · ${doc.name}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <button
            onClick={() => navigate({ to: "/documents" })}
            className="mb-1.5 inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Document vault
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <Mono className="text-[13px] font-semibold">{doc.id}</Mono>
            <Badge tone="neutral">{doc.type}</Badge>
            <IntegrityBadge status={effective} />
          </div>
          <h1 className="mt-1 text-xl font-semibold">{doc.name}</h1>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Case{" "}
            <button
              className="font-mono font-medium text-info hover:underline"
              onClick={() => navigate({ to: "/cases/$caseId", params: { caseId: doc.caseId } })}
            >
              {doc.caseId}
            </button>{" "}
            · v{doc.version} · {doc.date} · {doc.pages} pages
          </p>
        </div>
        <div className="flex gap-2">
          <BtnLink to="/ai-processing" variant="outline" size="sm">
            <Sparkles className="size-3.5" /> AI Processing
          </BtnLink>
          <BtnLink to="/integrity" size="sm">
            <ShieldCheck className="size-3.5" /> Integrity & Verification
          </BtnLink>
        </div>
      </div>

      {effective === "compromised" ? (
        <div className="flex items-start gap-3 rounded-md border border-alert/40 bg-alert-soft px-4 py-3">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-alert" />
          <div>
            <p className="text-sm font-semibold text-alert">INTEGRITY COMPROMISED</p>
            <p className="mt-0.5 text-[12.5px] text-alert">
              HASH MISMATCH DETECTED — this document does not match its sealed baseline. Restore the
              original from the Integrity & Verification page.
            </p>
            <BtnLink to="/integrity" variant="danger" size="sm" className="mt-2">
              Open Integrity & Verification
            </BtnLink>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-5">
        {/* Preview */}
        <Panel
          className="xl:col-span-3"
          title={
            <span className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" /> Document preview
            </span>
          }
          action={<Badge tone="neutral">{doc.access}</Badge>}
        >
          <DocumentPreview docId={doc.id} name={doc.name} hash={doc.hash} />
          <p className="mt-3 text-[12px] text-muted-foreground">
            Simulated page render — production build streams the stored file and re-verifies the
            hash before display.
          </p>
        </Panel>

        {/* Metadata + AI extraction */}
        <div className="space-y-4 xl:col-span-2">
          <Panel title="Metadata">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Uploaded by" value={doc.uploadedBy} />
              <Field label="Date" value={doc.date} />
              <Field label="Version" value={`v${doc.version}`} />
              <Field label="Pages" value={String(doc.pages)} />
              <Field label="Category" value={doc.category} />
              <Field label="Access level" value={doc.access} />
            </dl>
          </Panel>

          <Panel title={<span className="flex items-center gap-2"><Sparkles className="size-4 text-ai" /> AI extracted information</span>}>
            <p className="text-[12.5px] leading-snug text-muted-foreground">{doc.summary}</p>
            <dl className="mt-3 space-y-2">
              {doc.extracted.map((f) => (
                <div key={f.label} className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
                  <dt className="text-[12px] text-muted-foreground">{f.label}</dt>
                  <dd className="max-w-[60%] text-right text-[12.5px] font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {doc.sections.map((s) => (
                <Badge key={s} tone="ai">
                  {s}
                </Badge>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Integrity + history */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Integrity & fingerprint">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="label-caps">Current status</span>
              <IntegrityBadge status={effective} />
            </div>
            <div>
              <p className="label-caps">SHA-256 fingerprint</p>
              <Mono className="mt-1 block rounded bg-muted px-3 py-2 text-[12px] break-all">
                {doc.hash}
              </Mono>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <Field label="Version" value={`v${doc.version}`} />
              <Field label="Short form" value={<Mono>{shortHash(doc.hash)}</Mono>} />
            </dl>
            <div className="flex items-center gap-4 border-t border-border pt-3 text-[12.5px]">
              {effective === "verified" ? (
                <span className="flex items-center gap-1.5 text-success">
                  <CheckCircle2 className="size-4" /> Verified against sealed baseline
                </span>
              ) : effective === "pending" ? (
                <span className="flex items-center gap-1.5 text-warning">
                  <Clock className="size-4" /> Awaiting first verification run
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-medium text-alert">
                  <ShieldAlert className="size-4" /> Hash mismatch — baseline does not match
                </span>
              )}
            </div>
            <BtnLink to="/integrity" variant={effective === "compromised" ? "danger" : "primary"} size="sm">
              <ShieldCheck className="size-3.5" /> Manage integrity & simulate tamper
            </BtnLink>
          </div>
        </Panel>

        <Panel title="Audit history">
          <Timeline
            items={history.map((a) => ({
              title: a.action,
              subtitle: `${a.user} · ${a.role}`,
              meta: `${a.date}, ${a.time} · ${a.id}`,
              tone:
                a.status === "Success"
                  ? ("success" as const)
                  : a.status === "Blocked"
                    ? ("alert" as const)
                    : ("warning" as const),
              active: true,
            }))}
          />
        </Panel>
      </div>
    </AppShell>
  );
}
