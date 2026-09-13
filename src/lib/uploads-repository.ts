import { useCallback, useEffect, useState } from "react";
import { DOCUMENTS, type Document } from "@/lib/mock-data";
import {
  getSupabase,
  isSupabaseConfigured,
  type DocumentRow,
  type EvidenceRow,
} from "@/lib/supabase";
import type { RegisterEvidence } from "@/lib/evidence-register";
import { uploadCaseFile } from "@/lib/storage";
import { getAppState } from "@/lib/app-state";

/* -------------------------------------------------------------------------- */
/*  Uploads repository — real documents/evidence records backed by Supabase,  */
/*  merged ahead of the static demo data so existing registers keep working.  */
/*                                                                            */
/*  Flow (real, no fake timers):                                              */
/*    1. uploadCaseFile()  → binary goes to Storage bucket `case-documents`   */
/*    2. insert into public.documents (integrity 'pending', sha256 NULL)      */
/*    3. optional insert into public.evidence (same guarantees)               */
/*    4. registers refresh from Supabase on next render / refresh()           */
/* -------------------------------------------------------------------------- */

let docSeq = 0;
function nextDocId(): string {
  docSeq += 1;
  return `DOC-R${Date.now().toString(36)}${docSeq}`;
}

let evdSeq = 0;
function nextEvdId(): string {
  evdSeq += 1;
  return `EV-R${Date.now().toString(36)}${evdSeq}`;
}

function displayDate(d = new Date()): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ------------------------------- documents -------------------------------- */

export function docRowToDocument(r: DocumentRow): Document {
  return {
    id: r.id,
    caseId: r.case_id,
    name: r.name,
    category: r.category ?? "Legal Documents",
    type: r.doc_type ?? "Evidence Record",
    uploadedBy: r.uploaded_by ?? "—",
    date: r.doc_date ?? displayDate(),
    version: r.version ?? "1.0",
    integrity: r.integrity,
    access: r.access ?? "Internal",
    hash: r.sha256 ?? "— (pending hashing stage)",
    pages: r.pages ?? 1,
    caseType: r.case_type ?? "General",
    location: r.location ?? "—",
    persons: r.persons ?? [],
    sections: r.sections ?? [],
    extracted: r.extracted ?? [],
    summary: r.summary ?? "",
  };
}

export function documentToRow(d: Document, storagePath: string | null): DocumentRow {
  return {
    id: d.id,
    case_id: d.caseId,
    name: d.name,
    category: d.category,
    doc_type: d.type,
    uploaded_by: d.uploadedBy,
    doc_date: d.date,
    version: d.version,
    integrity: d.integrity,
    access: d.access,
    sha256: null, // hashing is a later stage — never fake it
    pages: d.pages,
    case_type: d.caseType,
    location: d.location,
    persons: d.persons,
    sections: d.sections,
    extracted: d.extracted,
    summary: d.summary,
    ...(storagePath ? { storage_path: storagePath } : {}),
  } as DocumentRow & { storage_path?: string };
}

/* ------------------------------- evidence --------------------------------- */

export function evidenceRowToRegister(r: EvidenceRow): RegisterEvidence {
  return {
    id: r.id,
    caseId: r.case_id,
    description: r.description,
    type: (r.evidence_type as RegisterEvidence["type"]) ?? "Other",
    collected: r.collected ?? displayDate(),
    submittedBy: r.submitted_by ?? "—",
    custodian: r.custodian ?? "Investigation Unit",
    integrity: r.integrity,
    status: (r.status as RegisterEvidence["status"]) ?? "Active",
    hash: r.sha256 ?? "— (pending hashing stage)",
    ...(r.event_id ? { eventId: r.event_id } : {}),
    custodyChain: r.custody_chain ?? [],
  };
}

export type UploadDocInput = {
  caseId: string;
  file: File;
  docType: string;
  notes?: string | undefined;
  makeEvidence?: boolean;
  eventId?: string | null;
  evidenceDescription?: string | undefined;
  collectedDate?: string | undefined;
};

export type UploadResult =
  | { ok: true; document: Document; evidence: RegisterEvidence | null }
  | { ok: false; error: string; stage: "storage" | "documents" | "evidence" };

/**
 * Real upload pipeline:
 *   Storage upload → documents insert → (optional) evidence insert.
 * Fails loudly at whichever stage actually failed; never fabricates success.
 */
export async function uploadCaseDocument(input: UploadDocInput): Promise<UploadResult> {
  const sb = getSupabase();
  if (!sb) {
    return {
      ok: false,
      stage: "storage",
      error:
        "Supabase is not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Keys tab to upload files.",
    };
  }

  // 1. Binary file → Supabase Storage
  const stored = await uploadCaseFile(input.caseId, input.file);
  if (!stored.ok) return { ok: false, stage: "storage", error: stored.error };

  const session = getAppState().session;
  const docId = nextDocId();
  const document: Document = {
    id: docId,
    caseId: input.caseId,
    name: input.file.name,
    category: "Evidence Records",
    type: input.docType,
    uploadedBy: session?.name ?? "Rahul Mehta",
    date: displayDate(),
    version: "1.0",
    integrity: "pending",
    access: "Internal",
    hash: "— (pending hashing stage)",
    pages: 1,
    caseType: "General",
    location: "—",
    persons: [],
    sections: [],
    extracted: [
      { label: "Document Type", value: input.docType },
      { label: "File Name", value: input.file.name },
      { label: "Case ID", value: input.caseId },
      { label: "Size", value: `${Math.max(1, Math.round(input.file.size / 1024))} KB` },
      ...(input.notes?.trim() ? [{ label: "Notes", value: input.notes.trim() }] : []),
    ],
    summary: input.notes?.trim() || `Uploaded file pending processing (${input.docType}).`,
  };

  // 2. Metadata row → public.documents
  const { error: docErr } = await sb
    .from("documents")
    .insert(documentToRow(document, stored.path) as never);
  if (docErr) return { ok: false, stage: "documents", error: docErr.message };

  // 3. Optional evidence registration → public.evidence
  let evidence: RegisterEvidence | null = null;
  if (input.makeEvidence) {
    const evdId = nextEvdId();
    const now = new Date();
    const evdRow: EvidenceRow = {
      id: evdId,
      case_id: input.caseId,
      description: input.evidenceDescription?.trim() || input.file.name,
      evidence_type: "Document",
      collected: input.collectedDate?.trim() || displayDate(),
      submitted_by: session?.name ?? "Rahul Mehta",
      custodian: "Investigation Unit",
      integrity: "pending",
      status: "Active",
      sha256: null,
      event_id: input.eventId ?? null,
      custody_chain: [
        {
          stage: "Collected",
          date: input.collectedDate?.trim() || displayDate(),
          time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
          person: session?.name ?? "Rahul Mehta",
          action: "File uploaded to the case vault",
        },
        {
          stage: "Submitted to Investigation Unit",
          date: displayDate(),
          time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
          person: session?.name ?? "Rahul Mehta",
          action: "Registered in the evidence register",
        },
      ],
    };
    const { error: evdErr } = await sb.from("evidence").insert(evdRow);
    if (evdErr) return { ok: false, stage: "evidence", error: evdErr.message };
    evidence = evidenceRowToRegister(evdRow);
  }

  // Optimistically reflect in one-shot caches used by detail views.
  cacheDocuments = [document, ...cacheDocuments];
  if (evidence) cacheEvidence = [evidence, ...cacheEvidence];

  return { ok: true, document, evidence };
}

/* ------------------------------- fetch hook -------------------------------- */

let cacheDocuments: Document[] = [];
let cacheEvidence: RegisterEvidence[] = [];

export function cachedDocuments(): Document[] {
  return cacheDocuments;
}

export function cachedEvidence(): RegisterEvidence[] {
  return cacheEvidence;
}

export function useSupabaseRecords(): {
  documents: Document[];
  evidence: RegisterEvidence[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [documents, setDocuments] = useState<Document[]>(cacheDocuments);
  const [evidence, setEvidence] = useState<RegisterEvidence[]>(cacheEvidence);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setDocuments([]);
      setEvidence([]);
      cacheDocuments = [];
      cacheEvidence = [];
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    Promise.all([
      sb.from("documents").select("*").order("created_at", { ascending: false }),
      sb.from("evidence").select("*").order("created_at", { ascending: false }),
    ]).then(([docsRes, evdRes]) => {
      if (cancelled) return;
      if (docsRes.error || evdRes.error) {
        setError(docsRes.error?.message ?? evdRes.error?.message ?? "fetch failed");
      } else {
        const d = (docsRes.data as DocumentRow[]).map(docRowToDocument);
        const e = (evdRes.data as EvidenceRow[]).map(evidenceRowToRegister);
        cacheDocuments = d;
        cacheEvidence = e;
        setDocuments(d);
        setEvidence(e);
        setError(null);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { documents, evidence, loading, error, refresh };
}

/** Demo + DB merge helpers used by registers. */
export function allSeededDocuments(): Document[] {
  return [...cacheDocuments, ...DOCUMENTS];
}
