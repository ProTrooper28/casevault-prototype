/* -------------------------------------------------------------------------- */
/*  Real SHA-256 helpers (Web Crypto API — no libraries, no fake hashes).      */
/* -------------------------------------------------------------------------- */

/** SHA-256 of the exact file bytes, as a lowercase hex string. */
export async function calculateSha256(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return bytesToHex(new Uint8Array(digest));
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
