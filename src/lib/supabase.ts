import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* -------------------------------------------------------------------------- */
/*  Supabase — persistence layer for CaseVault AI.                            */
/*                                                                            */
/*  Configuration comes from environment variables set in the Freebuff        */
/*  Keys tab (they are injected as VITE_* at build time):                     */
/*                                                                            */
/*    VITE_SUPABASE_URL       e.g. https://xyzcompany.supabase.co             */
/*    VITE_SUPABASE_ANON_KEY  public anon key (safe in the browser w/ RLS)    */
/*                                                                            */
/*  SUPABASE_SERVICE_ROLE_KEY must stay server-side only — it is never used   */
/*  here or anywhere in client code.                                          */
/*                                                                            */
/*  Until both variables exist the app runs exactly as before on its local    */
/*  demo-state store: getSupabase() returns null and callers degrade          */
/*  gracefully instead of crashing.                                           */
/* -------------------------------------------------------------------------- */

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value: unknown = import.meta.env[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

export const SUPABASE_URL = readEnv("VITE_SUPABASE_URL", "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
export const SUPABASE_ANON_KEY = readEnv(
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
);

/** True when both the project URL and anon key are present. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client: SupabaseClient | null = null;

/** Lazily-created shared client. Returns null while the keys are missing. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  client ??= createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: {
      // The prototype uses its own demo session model; Supabase auth can be
      // switched on later without touching call sites.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return client;
}

/* ------------------------------ row types --------------------------------- */
/*  Hand-written mirror of supabase/schema.sql — keep both in sync.          */
/*  (Generated types can replace these once the project ref is linked.)      */

export type CaseRow = {
  id: string;
  title: string;
  case_type: string;
  location: string | null;
  status: string;
  priority: string | null;
  investigator: string | null;
  opened_on: string | null;
  summary: string | null;
  sections: string[] | null;
  people: { name: string; role: string; detail: string }[] | null;
  dates: { label: string; value: string }[] | null;
  officers: { name: string; role: string; unit: string }[] | null;
};

export type DocumentRow = {
  id: string;
  case_id: string;
  name: string;
  category: string | null;
  doc_type: string | null;
  uploaded_by: string | null;
  doc_date: string | null;
  version: string | null;
  integrity: "verified" | "pending" | "compromised";
  access: "Restricted" | "Confidential" | "Internal" | null;
  sha256: string | null;
  pages: number | null;
  case_type: string | null;
  location: string | null;
  persons: string[] | null;
  sections: string[] | null;
  extracted: { label: string; value: string }[] | null;
  summary: string | null;
};

export type EvidenceRow = {
  id: string;
  case_id: string;
  description: string;
  evidence_type: string | null;
  collected: string | null;
  submitted_by: string | null;
  custodian: string | null;
  integrity: "verified" | "pending" | "compromised";
  status: string | null;
  sha256: string | null;
  event_id: string | null;
  custody_chain:
    | { stage: string; date: string; time: string; person: string; action: string }[]
    | null;
};

export type AuditRow = {
  display_date: string | null;
  display_time: string | null;
  user_name: string | null;
  role: string | null;
  action: string;
  document: string | null;
  case_id: string | null;
  status: string | null;
};

export type AccessGrantRow = {
  user_name: string;
  role: string | null;
  scope: string;
  granted: string | null;
  expires: string | null;
  status: string | null;
};
