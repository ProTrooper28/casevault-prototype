import type { IntegrityStatus } from "@/lib/mock-data";

/* -------------------------------------------------------------------------- */
/*  Case chronology — the heart of the case workspace.                        */
/*  Deterministic demo data; event ids are stable across refreshes.           */
/*  Runtime evidence added via the "+ Add Evidence" modal lives in app-state. */
/* -------------------------------------------------------------------------- */

export type TimelineAttachment = {
  /** stable ref id, e.g. DOC-10241 or EVD-2026-0103 */
  id: string;
  label: string;
  kind: "document" | "evidence";
  /** route target for the View action */
  href: string;
};

export type TimelineEvent = {
  id: string;
  caseId: string;
  date: string; // "12 Jan 2026"
  time: string; // "09:42"
  title: string;
  description: string;
  attachments: TimelineAttachment[];
  /** integrity marker shown in the event, e.g. VERIFIED */
  integrity?: { status: IntegrityStatus; label: string };
};

export const CASE_TIMELINES: TimelineEvent[] = [
  // ----------------------- FIR-2026-00124 — Theft ---------------------------
  {
    id: "EV-TL-124-1",
    caseId: "FIR-2026-00124",
    date: "12 Jan 2026",
    time: "09:42",
    title: "FIR Registered",
    description: "FIR submitted and case created.",
    attachments: [
      { id: "DOC-10241", label: "FIR-001.pdf", kind: "document", href: "/documents/DOC-10241" },
    ],
  },
  {
    id: "EV-TL-124-2",
    caseId: "FIR-2026-00124",
    date: "12 Jan 2026",
    time: "11:18",
    title: "Initial Statement Recorded",
    description: "Witness statement recorded by the investigating officer.",
    attachments: [
      {
        id: "DOC-10243",
        label: "Witness-Statement-01.pdf",
        kind: "document",
        href: "/documents/DOC-10243",
      },
    ],
  },
  {
    id: "EV-TL-124-3",
    caseId: "FIR-2026-00124",
    date: "13 Jan 2026",
    time: "15:32",
    title: "CCTV Footage Added",
    description: "CCTV footage associated with the case.",
    attachments: [
      {
        id: "EV-002",
        label: "CCTV-AND-013.mp4",
        kind: "evidence",
        href: "/evidence/EV-002",
      },
    ],
  },
  {
    id: "EV-TL-124-4",
    caseId: "FIR-2026-00124",
    date: "14 Jan 2026",
    time: "10:05",
    title: "Forensic Report Received",
    description: "Forensic report added by Forensic Officer.",
    attachments: [
      {
        id: "DOC-10244",
        label: "Forensic-Report-01.pdf",
        kind: "document",
        href: "/documents/DOC-10244",
      },
    ],
  },
  {
    id: "EV-TL-124-5",
    caseId: "FIR-2026-00124",
    date: "15 Jan 2026",
    time: "16:42",
    title: "Evidence Integrity Verified",
    description: "Evidence hash successfully verified.",
    integrity: { status: "verified", label: "VERIFIED" },
    attachments: [],
  },
  {
    id: "EV-TL-124-6",
    caseId: "FIR-2026-00124",
    date: "16 Jan 2026",
    time: "09:55",
    title: "Site Investigation Report Uploaded",
    description: "Spot inspection notes and seizure list added to the case file.",
    attachments: [
      {
        id: "DOC-10242",
        label: "Site-Investigation-Report.pdf",
        kind: "document",
        href: "/documents/DOC-10242",
      },
    ],
  },

  // ------------------- CASE-2026-00418 — Financial Fraud --------------------
  {
    id: "EV-TL-418-1",
    caseId: "CASE-2026-00418",
    date: "03 Jan 2026",
    time: "10:15",
    title: "Case Registered",
    description: "Complaint received via banking ombudsman referral and case opened.",
    attachments: [],
  },
  {
    id: "EV-TL-418-2",
    caseId: "CASE-2026-00418",
    date: "14 Jan 2026",
    time: "11:15",
    title: "Bank Records Collected",
    description: "Flagged transaction exports collected from the bank compliance office.",
    attachments: [
      {
        id: "EV-006",
        label: "Bank-Statement-Exports",
        kind: "evidence",
        href: "/evidence/EV-006",
      },
    ],
  },
  {
    id: "EV-TL-418-3",
    caseId: "CASE-2026-00418",
    date: "15 Jan 2026",
    time: "16:10",
    title: "Transaction Ledger Uploaded",
    description: "Consolidated ledger of flagged transfers added to the case file.",
    attachments: [
      {
        id: "DOC-10245",
        label: "Bank-Transaction-Audit-Ledger.pdf",
        kind: "document",
        href: "/documents/DOC-10245",
      },
    ],
  },
  {
    id: "EV-TL-418-4",
    caseId: "CASE-2026-00418",
    date: "17 Jan 2026",
    time: "09:50",
    title: "Charge Sheet Drafted",
    description: "Draft charge sheet prepared for prosecution review.",
    attachments: [
      {
        id: "DOC-10246",
        label: "Charge-Sheet-Draft-v0.9.pdf",
        kind: "document",
        href: "/documents/DOC-10246",
      },
    ],
  },

  // ------------------- CASE-2026-00731 — Missing Person ---------------------
  {
    id: "EV-TL-731-1",
    caseId: "CASE-2026-00731",
    date: "09 Jan 2026",
    time: "08:55",
    title: "Missing Person Report Filed",
    description: "Report filed at Fancy Bazaar police station.",
    attachments: [
      {
        id: "DOC-10247",
        label: "Missing-Person-Notice.pdf",
        kind: "document",
        href: "/documents/DOC-10247",
      },
    ],
  },
  {
    id: "EV-TL-731-2",
    caseId: "CASE-2026-00731",
    date: "10 Jan 2026",
    time: "12:30",
    title: "Informant Statement Recorded",
    description: "Statement of the informant covering last known movements and contacts.",
    attachments: [
      {
        id: "DOC-10248",
        label: "Witness-Statement-Rupa-Bora.pdf",
        kind: "document",
        href: "/documents/DOC-10248",
      },
    ],
  },
  {
    id: "EV-TL-731-3",
    caseId: "CASE-2026-00731",
    date: "11 Jan 2026",
    time: "08:30",
    title: "CCTV Footage Collected",
    description: "Junction footage collected from Fancy Bazaar operator.",
    attachments: [
      {
        id: "EV-007",
        label: "CCTV-FancyBazaar-011.mp4",
        kind: "evidence",
        href: "/evidence/EV-007",
      },
    ],
  },
  {
    id: "EV-TL-731-4",
    caseId: "CASE-2026-00731",
    date: "11 Jan 2026",
    time: "13:45",
    title: "Footage Dispatched to District Vault",
    description: "Media transfer initiated for district vault intake.",
    integrity: { status: "pending", label: "PENDING" },
    attachments: [],
  },
];

export function caseTimeline(caseId: string): TimelineEvent[] {
  return CASE_TIMELINES.filter((e) => e.caseId === caseId);
}
