import { getSupabase } from "@/lib/supabase";

/* -------------------------------------------------------------------------- */
/*  Supabase Storage helper — real binary file uploads.                       */
/*                                                                            */
/*  Bucket: case-documents (created in the dashboard or via the SQL below).   */
/*  Path pattern: {case_id}/{timestamp}-{sanitised-file-name}                 */
/*  Binaries live ONLY in Storage; Postgres rows carry metadata + the path.   */
/* -------------------------------------------------------------------------- */

export const STORAGE_BUCKET = "case-documents";

export type StorageUploadResult =
  | { ok: true; path: string; bucket: string }
  | { ok: false; error: string };

/** Flatten a file name to a safe, collision-resistant storage path segment. */
function sanitizeName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base}`;
}

/** Upload a real file to case-documents/{case_id}/{unique-name}. */
export async function uploadCaseFile(
  caseId: string,
  file: File,
): Promise<StorageUploadResult> {
  const sb = getSupabase();
  if (!sb) {
    return {
      ok: false,
      error:
        "Supabase is not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Keys tab to upload files.",
    };
  }

  const path = `${caseId}/${sanitizeName(file.name)}`;
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false, // unique timestamped path — collisions impossible
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, path, bucket: STORAGE_BUCKET };
}

/** Download the actual stored bytes for integrity verification. */
export async function downloadCaseFile(
  path: string,
): Promise<{ ok: true; blob: Blob } | { ok: false; error: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase is not connected." };
  const { data, error } = await sb.storage.from(STORAGE_BUCKET).download(path);
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Empty response from storage." };
  return { ok: true, blob: data };
}

/** Signed URL for viewing an uploaded file (1 hour). */
export async function caseFileUrl(path: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.storage.from(STORAGE_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/**
 * One-time bucket bootstrap SQL (run in the Supabase SQL Editor if the bucket
 * does not exist yet — the dashboard UI also works):
 *
 *   insert into storage.buckets (id, name, public) values ('case-documents', 'case-documents', false)
 *   on conflict (id) do nothing;
 *
 *   create policy "anon full access case-documents" on storage.objects
 *     for all to anon using (bucket_id = 'case-documents')
 *     with check (bucket_id = 'case-documents');
 */
