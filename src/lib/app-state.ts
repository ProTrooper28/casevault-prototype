import { useSyncExternalStore } from "react";
import {
  ACCESS_GRANTS,
  AUDIT_TRAIL,
  DOCUMENTS,
  type AuditEntry,
  type Document,
  type IntegrityStatus,
  getCase,
} from "@/lib/mock-data";
import type { TimelineAttachment, TimelineEvent } from "@/lib/case-timeline";

/* -------------------------------------------------------------------------- */
/*  Single tiny store shared by all screens (module-level, frontend only).    */
/*  Covers: demo-role session, document integrity overrides, runtime audit    */
/*  entries, access grants, uploaded documents and per-event attachments.     */
/* -------------------------------------------------------------------------- */

/** Demo role selector — NOT authentication. Two fixed demo identities. */
export type DemoRole = "POLICE_OFFICER" | "FORENSIC_OFFICER";

export const DEMO_ROLES: Record<
  DemoRole,
  { name: string; roleLabel: string; tagline: string }
> = {
  POLICE_OFFICER: {
    name: "Investigation Officer",
    roleLabel: "Police Officer",
    tagline: "Investigation & FIR Management",
  },
  FORENSIC_OFFICER: {
    name: "Forensic Officer",
    roleLabel: "Forensic Officer",
    tagline: "Forensic Review & Case Handoffs",
  },
};

type Session = { role: DemoRole; name: string; roleLabel: string } | null;

const SESSION_KEY = "casevault-demo-role";

function readPersistedRole(): Session {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;
    if (raw === "POLICE_OFFICER" || raw === "FORENSIC_OFFICER") {
      const demo = DEMO_ROLES[raw];
      return { role: raw, name: demo.name, roleLabel: demo.roleLabel };
    }
  } catch {
    /* storage unavailable (SSR/private mode) — session stays null */
  }
  return null;
}

/** A document created at runtime via the case Documents "+ Upload Document" flow.
 *  Structurally identical to the seeded `Document` so it renders identically
 *  in every table, viewer and integrity screen. */
export type UploadedDocument = Document;

/** Evidence registered at runtime via the timeline "+ Add Evidence" modal. */
export type AddedEvidence = {
  id: string;
  caseId: string;
  eventId: string | null;
  type: string;
  name: string;
  description: string;
  source: string;
  collectedDate: string;
  submittedBy: string;
  custodian: string;
  status: string;
  integrity: IntegrityStatus;
  hash: string;
  addedAt: string; // display timestamp
  custodyChain: {
    stage: string;
    person: string;
    date: string;
    time: string;
    action: string;
  }[];
};

export type AppState = {
  session: Session;
  /** docId -> integrity status once a user verifies / tampers / restores */
  integrity: Record<string, IntegrityStatus>;
  /** entries prepended at runtime (verify, tamper, restore, grants, uploads…) */
  audit: AuditEntry[];
  grants: typeof ACCESS_GRANTS;
  documents: UploadedDocument[];
  evidence: AddedEvidence[];
};

let state: AppState = {
  session: readPersistedRole(),
  integrity: {},
  audit: [],
  grants: ACCESS_GRANTS,
  documents: [],
  evidence: [],
};

const listeners = new Set<() => void>();

function set(next: Partial<AppState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let auditSeq = 90001;
let docSeq = 9001;
let evdSeq = 301;

function stamp() {
  const now = new Date();
  return {
    time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
    date: now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  };
}

export function logAudit(entry: Omit<AuditEntry, "id" | "time" | "date">) {
  const { time, date } = stamp();
  const id = `#${auditSeq++}`;
  set({ audit: [{ ...entry, id, time, date }, ...state.audit] });
  return id;
}

/* --------------------------------- session -------------------------------- */

/** Demo role selection — persists across refresh; never a real credential. */
export function signInAsRole(role: DemoRole) {
  const demo = DEMO_ROLES[role];
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(SESSION_KEY, role);
  } catch {
    /* non-fatal */
  }
  set({ session: { role, name: demo.name, roleLabel: demo.roleLabel } });
}

export function signOut() {
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(SESSION_KEY);
  } catch {
    /* non-fatal */
  }
  set({ session: null });
}

/**
 * Demo identity used for audit entries and record attribution.
 * Returns the selected role's fixed names; falls back to the police demo
 * identity when no role has been picked yet (deep-link before login).
 */
export function currentActor(): { name: string; role: string; role_: DemoRole | null } {
  const s = state.session;
  if (!s) return { name: "Investigation Officer", role: "Police Officer", role_: null };
  return { name: s.name, role: s.roleLabel, role_: s.role };
}

/** True when the current demo role is the forensic officer. */
export function isForensicSession(): boolean {
  return state.session?.role === "FORENSIC_OFFICER";
}

/** True when the current demo role is the police officer. */
export function isPoliceSession(): boolean {
  return state.session?.role === "POLICE_OFFICER";
}

/* -------------------------------- integrity ------------------------------- */

/** Apply / reset the integrity status of one document. */
export function setIntegrity(docId: string, status: IntegrityStatus) {
  set({ integrity: { ...state.integrity, [docId]: status } });
}

export function resetAllIntegrity() {
  set({ integrity: {} });
}

/* ------------------------------ access grants ----------------------------- */

export function addGrant(grant: (typeof ACCESS_GRANTS)[number]) {
  set({ grants: [grant, ...state.grants] });
}

export function revokeGrant(user: string, scope: string) {
  set({ grants: state.grants.filter((g) => !(g.user === user && g.scope === scope)) });
}

/* ---------------------------- uploaded documents --------------------------- */

const DOC_TYPE_MAP: Record<string, { category: string; access: UploadedDocument["access"] }> = {
  FIR: { category: "FIRs", access: "Restricted" },
  "Witness Statement": { category: "Witness Statements", access: "Confidential" },
  "Forensic Report": { category: "Forensic Reports", access: "Confidential" },
  "Investigation Report": { category: "Investigation Reports", access: "Restricted" },
  "Court Filing": { category: "Court Filings", access: "Restricted" },
  "Evidence Record": { category: "Evidence Records", access: "Confidential" },
  "Legal Notice": { category: "Legal Documents", access: "Internal" },
};

/** Deterministic pseudo-hash so the same file name always yields the same fingerprint. */
function pseudoHash(input: string) {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
  }
  let out = "";
  let x = h1;
  while (out.length < 64) {
    x = Math.imul(x ^ (x >>> 15), 0x2545f491) >>> 0;
    out += x.toString(16).padStart(8, "0");
  }
  return out.slice(0, 64);
}

export function uploadDocument(input: {
  caseId: string;
  fileName: string;
  docType: string;
  notes?: string;
}): UploadedDocument {
  const { time, date } = stamp();
  const actor = currentActor();
  const id = `DOC-9${docSeq++}`;
  const meta = DOC_TYPE_MAP[input.docType] ?? { category: "Legal Documents", access: "Internal" as const };
  const hash = pseudoHash(`${input.caseId}:${input.fileName}:${input.docType}`);
  const parentCase = getCase(input.caseId);
  const doc: UploadedDocument = {
    id,
    caseId: input.caseId,
    name: input.fileName,
    category: meta.category,
    type: input.docType,
    uploadedBy: actor.name,
    date: date,
    version: "1.0",
    access: meta.access,
    hash,
    pages: 1 + (input.fileName.length % 6),
    caseType: parentCase?.type ?? "General",
    location: parentCase?.location ?? "—",
    persons: parentCase ? parentCase.people.map((p) => p.name) : [],
    sections: parentCase ? parentCase.sections : [],
    integrity: "verified",
    extracted: [
      { label: "Document Type", value: input.docType },
      { label: "File Name", value: input.fileName },
      { label: "Case ID", value: input.caseId },
      { label: "Upload Time", value: `${date}, ${time}` },
      ...(input.notes ? [{ label: "Notes", value: input.notes }] : []),
    ],
    summary:
      input.notes?.trim() ||
      `Runtime-uploaded ${input.docType.toLowerCase()} ingested through the prototype intake flow.`,
  };    set({ documents: [doc, ...state.documents] });
    logAudit({
      user: actor.name,
      role: actor.role,
      action: `Document uploaded — fingerprint generated (${id})`,
      document: input.fileName,
      caseId: input.caseId,
      status: "Success",
    });
  return doc;
}

/* --------------------------- evidence attachments -------------------------- */

export function addEvidence(input: {
  caseId: string;
  eventId: string | null;
  type: string;
  name: string;
  description: string;
  source: string;
  collectedDate: string;
}): AddedEvidence {
  const { time, date } = stamp();
  const actor = currentActor();
  const id = `EV-${evdSeq++}`;
  const item: AddedEvidence = {
    id,
    caseId: input.caseId,
    eventId: input.eventId,
    type: input.type,
    name: input.name,
    description: input.description || input.name,
    source: input.source || "—",
    collectedDate: input.collectedDate || date,
    submittedBy: actor.name,
    custodian: "Investigation Unit",
    status: "Active",
    integrity: "verified",
    hash: pseudoHash(`${input.caseId}:${input.name}:${input.type}`),
    addedAt: `${date}, ${time}`,
    custodyChain: [
      {
        stage: "Collected",
        person: actor.name,
        date: input.collectedDate || date,
        time: time,
        action: "Collected at source and packaged",
      },
      {
        stage: "Submitted to Investigation Unit",
        person: actor.name,
        date: date,
        time: time,
        action: "Registered in the evidence register",
      },
    ],
  };
  set({ evidence: [item, ...state.evidence] });
  logAudit({
    user: actor.name,
    role: actor.role,
    action: `Evidence registered (${id})${input.eventId ? " on timeline event" : ""}`,
    document: input.name,
    caseId: input.caseId,
    status: "Success",
  });
  return item;
}

/** Attach a newly created evidence item to a timeline event at runtime. */
const eventAttachmentsMap = new Map<string, TimelineAttachment[]>();

export function attachEvidenceToEvent(eventId: string, attachment: TimelineAttachment) {
  // Runtime attachments live in a side-map so static demo data is never mutated.
  eventAttachmentsMap.set(eventId, [...(eventAttachmentsMap.get(eventId) ?? []), attachment]);
  listeners.forEach((l) => l());
}

export function eventAttachmentsFor(eventId: string): TimelineAttachment[] {
  return eventAttachmentsMap.get(eventId) ?? [];
}

/* --------------------------------- hooks ---------------------------------- */

export function useApp() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

/** Non-reactive snapshot of the current store — for one-shot reads (sync jobs). */
export function getAppState(): AppState {
  return state;
}

/* ------------------------------ derived data ------------------------------ */

/** Integrity status of a document, taking any runtime override into account. */
export function docIntegrity(docId: string): IntegrityStatus {
  const runtimeDoc = state.documents.find((d) => d.id === docId);
  if (runtimeDoc) return state.integrity[docId] ?? runtimeDoc.integrity;
  return state.integrity[docId] ?? DOCUMENTS.find((d) => d.id === docId)?.integrity ?? "pending";
}

/** Full audit trail = runtime entries first, then the seeded prototype log. */
export function fullAuditTrail(): AuditEntry[] {
  return [...state.audit, ...AUDIT_TRAIL];
}

/** Every document in the vault: seeded + runtime-uploaded. */
export function allDocuments(s: AppState) {
  return [...s.documents, ...DOCUMENTS];
}

/** Find a document (seeded or runtime) by id, with its integrity resolved. */
export function findDocument(docId: string) {
  const runtime = state.documents.find((d) => d.id === docId);
  if (runtime) return { ...runtime, integrity: state.integrity[runtime.id] ?? runtime.integrity };
  const seeded = DOCUMENTS.find((d) => d.id === docId);
  if (seeded) return { ...seeded, integrity: state.integrity[seeded.id] ?? seeded.integrity };
  return undefined;
}

/** Merge runtime attachments into a timeline event. */
export function eventWithAttachments(event: TimelineEvent): TimelineEvent {
  const extra = eventAttachmentsFor(event.id);
  if (extra.length === 0) return event;
  return { ...event, attachments: [...event.attachments, ...extra] };
}
