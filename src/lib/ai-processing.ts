import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*  AI processing (Node side) — the browser never touches the raw file or     */
/*  service credentials. Flow:                                                */
/*                                                                            */
/*    browser → processDocument (createServerFn, RPC to server-only handler)  */
/*      1. read public.documents row (storage_path, case_id)                  */
/*      2. download bytes from the PRIVATE case-documents bucket              */
/*         (SUPABASE_SERVICE_ROLE_KEY when present, else anon)                */
/*      3. POST the real bytes to the Python/FastAPI service (/process)       */
/*      4. write results into the existing JSONB/metadata columns             */
/*                                                                            */
/*  NOTE: intentionally NOT under a "server" directory — TanStack Start's    */
/*  import-protection denies client imports of server-dir path patterns.      */
/*  createServerFn files must stay client-importable; the handler body is     */
/*  stripped from the client bundle automatically.                            */
/*  The service-role key is read inside the handler from the server           */
/*  environment only — it is never shipped to React. Falls back to the        */
/*  anon key when not provided (matches the prototype's permissive RLS).      */
/* -------------------------------------------------------------------------- */

export type ProcessDocumentResult =
  | {
      ok: true;
      documentType: string;
      summary: string;
      extracted: { label: string; value: string }[];
      persons: string[];
      sections: string[];
      dates: string[];
      locations: string[];
      firNumbers: string[];
      policeStations: string[];
      organizations: string[];
      pages: number;
      ocrPages: number;
      textChars: number;
    }
  | { ok: false; error: string };

export const processDocument = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ docId: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<ProcessDocumentResult> => {
    // Read env INSIDE the handler: this module is also imported by the browser
    // bundle (as the RPC proxy), so process.env must never run at module scope.
    const env = process.env;
    const SUPABASE_URL =
      env["VITE_SUPABASE_URL"] ?? env["SUPABASE_URL"] ?? env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
    const SUPABASE_KEY =
      env["SUPABASE_SERVICE_ROLE_KEY"] ?? env["VITE_SUPABASE_ANON_KEY"] ?? env["SUPABASE_ANON_KEY"] ?? "";
    const AI_SERVICE_URL = env["AI_SERVICE_URL"] ?? "http://localhost:8000";

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return { ok: false, error: "Supabase keys are not configured on the server (SUPABASE_URL / key)." };
    }
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

    // 1. Document row → storage_path
    const { data: row, error: rowErr } = await sb
      .from("documents")
      .select("id, name, storage_path, case_id")
      .eq("id", data.docId)
      .maybeSingle<{ id: string; name: string; storage_path: string | null; case_id: string }>();
    if (rowErr) return { ok: false, error: rowErr.message };
    if (!row) return { ok: false, error: `Document ${data.docId} not found.` };
    if (!row.storage_path) {
      return { ok: false, error: "This document has no stored file — upload it through the case Documents tab first." };
    }

    // 2. Real bytes from the private bucket
    const { data: blob, error: dlErr } = await sb.storage.from("case-documents").download(row.storage_path);
    if (dlErr || !blob) {
      return { ok: false, error: `Could not download the stored file: ${dlErr?.message ?? "empty response"}` };
    }

    // 3. Proxy the actual bytes to the Python service
    const form = new FormData();
    form.append("file", blob, row.name || "document");
    let aiRes: Response;
    try {
      aiRes = await fetch(`${AI_SERVICE_URL}/process`, { method: "POST", body: form });
    } catch {
      return {
        ok: false,
        error: `AI service unreachable at ${AI_SERVICE_URL}. Start it with: cd ai-service && uvicorn app.main:app --port 8000`,
      };
    }
    const aiJson = (await aiRes.json().catch(() => null)) as
      | (Record<string, unknown> & {
          ok?: boolean;
          error?: string;
          document_type?: string;
          summary?: string;
          pages?: number;
          ocr_pages?: number;
          text_chars?: number;
          extracted?: {
            persons?: string[];
            organizations?: string[];
            locations?: string[];
            dates?: string[];
            fir_numbers?: string[];
            police_stations?: string[];
            sections?: string[];
          };
        })
      | null;

    if (!aiRes.ok || !aiJson?.ok) {
      return { ok: false, error: aiJson?.error ?? `AI service failed (HTTP ${aiRes.status}).` };
    }

    const ex = aiJson.extracted ?? {};
    const persons = ex.persons ?? [];
    const sections = ex.sections ?? [];
    const dates = ex.dates ?? [];
    const locations = ex.locations ?? [];
    const orgs = ex.organizations ?? [];
    const firNumbers = ex.fir_numbers ?? [];
    const stations = ex.police_stations ?? [];

    // 4. Persist into the EXISTING columns only.
    const extractedPairs: { label: string; value: string }[] = [
      { label: "AI Document Type", value: aiJson.document_type ?? "Other" },
      { label: "Extraction Pages", value: String(aiJson.pages ?? 1) },
      ...(aiJson.ocr_pages ? [{ label: "OCR Pages", value: String(aiJson.ocr_pages) }] : []),
      { label: "Text Characters", value: String(aiJson.text_chars ?? 0) },
      ...(persons.length ? [{ label: "Persons Detected", value: persons.join(", ") }] : []),
      ...(orgs.length ? [{ label: "Organizations", value: orgs.join(", ") }] : []),
      ...(stations.length ? [{ label: "Police Stations", value: stations.join(", ") }] : []),
      ...(firNumbers.length ? [{ label: "FIR Numbers Found", value: firNumbers.join(", ") }] : []),
      { label: "AI Processed At", value: new Date().toISOString() },
    ];

    const { error: updErr } = await sb
      .from("documents")
      .update({
        doc_type: aiJson.document_type ?? undefined,
        persons,
        sections,
        extracted: extractedPairs,
        summary: aiJson.summary ?? "",
      })
      .eq("id", data.docId);
    if (updErr) return { ok: false, error: `Processing finished but saving results failed: ${updErr.message}` };

    return {
      ok: true,
      documentType: aiJson.document_type ?? "Other",
      summary: aiJson.summary ?? "",
      extracted: extractedPairs,
      persons,
      sections,
      dates,
      locations,
      firNumbers,
      policeStations: stations,
      organizations: orgs,
      pages: aiJson.pages ?? 1,
      ocrPages: aiJson.ocr_pages ?? 0,
      textChars: aiJson.text_chars ?? 0,
    };
  });
