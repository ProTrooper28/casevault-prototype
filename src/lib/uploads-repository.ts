import { useCallback, useEffect, useState } from "react";
import { DOCUMENTS, type Document } from "@/lib/mock-data";
import {
  getSupabase,
  isSupabaseConfigured,
  type DocumentRow,
  type EvidenceRow,
} from "@/lib/supabase";
import type { RegisterEvidence } from "@/lib/evidence-register";
import { uploadCaseFile, downloadCaseFile } from "@/lib/storage";
import { calculateSha256 } from "@/lib/hash";
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
  | { ok: true; document: Document; evidence: RegisterEvidence | null; sha256: string }
  | { ok: false; error: string; stage: "storage" | "hash" | "documents" | "evidence" };

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

  // 2. Real SHA-256 from the exact same File object bytes (Web Crypto).
  let sha256: string;
  try {
    sha256 = await calculateSha256(input.file);
  } catch (err) {
    return {
      ok: false,
      stage: "hash",
      error: err instanceof Error ? err.message : "Could not calculate SHA-256 of the file.",
    };
  }

  const session = getAppState().session;
  const actorName = session?.name ?? "Investigation Officer";
  const docId = nextDocId();
  const document: Document = {
    id: docId,
    caseId: input.caseId,
    name: input.file.name,
    category: "Evidence Records",
    type: input.docType,
    uploadedBy: actorName,
    date: displayDate(),
    version: "1.0",
    integrity: "verified",
    access: "Internal",
    hash: sha256,
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

  // 3. Metadata row → public.documents (sha256 = real fingerprint of the stored bytes)
  const { error: docErr } = await sb
    .from("documents")
    .insert(documentToRow(document, stored.path) as never);
  if (docErr) return { ok: false, stage: "documents", error: docErr.message };

  // 4. Optional evidence registration → public.evidence (same real hash)
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
      submitted_by: actorName,
      custodian: "Investigation Unit",
      integrity: "verified",
      status: "Active",
      sha256,
      event_id: input.eventId ?? null,
      custody_chain: [
        {
          stage: "Collected",
          date: input.collectedDate?.trim() || displayDate(),
          time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
          person: actorName,
          action: "File uploaded to the case vault",
        },
        {
          stage: "Submitted to Investigation Unit",
          date: displayDate(),
          time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
          person: actorName,
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

  return { ok: true, document, evidence, sha256 };
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

/** Merge real AI-processing results into the cached DB document (in place). */
export function applyProcessedDocument(docId: string, patch: Partial<Document>): void {
  cacheDocuments = cacheDocuments.map((d) => (d.id === docId ? { ...d, ...patch } : d));
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

/* --------------------------- real verification ----------------------------- */

export type VerifyResult =
  | {
      ok: true;
      match: boolean;
      storedHash: string;
      calculatedHash: string;
      integrity: "verified" | "compromised";
    }
  | { ok: false; error: string };

/**
 * Real integrity verification against the stored bytes:
 *   documents.storage_path → Storage download → SHA-256 → compare → persist.
 * Returns both hashes so the UI can show exactly what matched or differed.
 */
export async function verifyDocumentIntegrity(docId: string): Promise<VerifyResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase is not connected — nothing to verify against." };

  // 1. Row + storage_path from public.documents
  const { data: row, error: rowErr } = await sb
    .from("documents")
    .select("id, sha256, storage_path, name, case_id")
    .eq("id", docId)
    .maybeSingle<{ id: string; sha256: string | null; storage_path: string | null; name: string; case_id: string }>();
  if (rowErr) return { ok: false, error: rowErr.message };
  if (!row) return { ok: false, error: `Document ${docId} not found in the database.` };
  if (!row.storage_path) return { ok: false, error: "This document has no stored file (missing storage_path) — only metadata exists." };
  if (!row.sha256) return { ok: false, error: "No stored SHA-256 baseline for this document yet." };

  // 2. Download the actual bytes from the private bucket
  const downloaded = await downloadCaseFile(row.storage_path);
  if (!downloaded.ok) return { ok: false, error: `Storage download failed: ${downloaded.error}` };

  // 3. Hash the downloaded bytes
  let calculated: string;
  try {
    calculated = await calculateSha256(downloaded.blob);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Hashing failed on the downloaded file." };
  }

  // 4. Compare + 5. persist the verdict on the row
  const match = calculated === row.sha256.toLowerCase();
  const integrity: "verified" | "compromised" = match ? "verified" : "compromised";
  const { error: updErr } = await sb
    .from("documents")
    .update({ integrity })
    .eq("id", docId);
  if (updErr) return { ok: false, error: `Verification computed but saving the status failed: ${updErr.message}` };

  // Reflect locally too.
  cacheDocuments = cacheDocuments.map((d) =>
    d.id === docId ? { ...d, integrity, hash: row.sha256! } : d,
  );

  return { ok: true, match, storedHash: row.sha256, calculatedHash: calculated, integrity };
}
