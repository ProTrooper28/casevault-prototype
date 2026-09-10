import type { IntegrityStatus } from "@/lib/mock-data";

/* -------------------------------------------------------------------------- */
/*  Case-scoped evidence register (EV-001…). Deterministic demo data mapped    */
/*  to the spec's case workspace. custodyChain mirrors the EV detail view.     */
/* -------------------------------------------------------------------------- */

export type RegisterEvidence = {
  id: string; // EV-001 …
  caseId: string;
  description: string;
  type: "Document" | "Image" | "Video" | "Audio" | "Other";
  collected: string;
  submittedBy: string;
  custodian: string;
  integrity: IntegrityStatus;
  status: "Active" | "Under Review" | "Released";
  hash: string;
  /** linked timeline event id, when the item was added from an event */
  eventId?: string;
  custodyChain: {
    stage: string;
    date: string;
    time: string;
    person: string;
    action: string;
  }[];
};

export const EVIDENCE_REGISTER: RegisterEvidence[] = [
  {
    id: "EV-001",
    caseId: "FIR-2026-00124",
    description: "FIR Document",
    type: "Document",
    collected: "12 Jan 2026",
    submittedBy: "Rahul Mehta",
    custodian: "Investigation Unit",
    integrity: "verified",
    status: "Active",
    hash: "a84f3c7d19e5b0426fa1c8d73be04517cc92e6a1f0d34b87ee215c9740ab92bd",
    eventId: "EV-TL-124-1",
    custodyChain: [
      { stage: "Collected", date: "12 Jan 2026", time: "09:42", person: "Rahul Mehta", action: "FIR recorded and packaged" },
      { stage: "Submitted to Investigation Unit", date: "12 Jan 2026", time: "09:45", person: "Rahul Mehta", action: "Registered in evidence register" },
      { stage: "Transferred to Forensic Unit", date: "14 Jan 2026", time: "09:15", person: "HC S. Pawar", action: "Handed over for examination" },
      { stage: "Examined", date: "14 Jan 2026", time: "10:05", person: "A. Sharma", action: "Reviewed and countersigned" },
      { stage: "Stored", date: "14 Jan 2026", time: "17:30", person: "Evidence Custodian", action: "Sealed in Evidence Room A-04" },
    ],
  },
  {
    id: "EV-002",
    caseId: "FIR-2026-00124",
    description: "CCTV Footage",
    type: "Video",
    collected: "13 Jan 2026",
    submittedBy: "Rahul Mehta",
    custodian: "Forensic Unit",
    integrity: "verified",
    status: "Under Review",
    hash: "b71d0e44ac8f2915d6ba37c05e1948fd227b6ec4a95038117cfd2e6b40173a9c",
    eventId: "EV-TL-124-3",
    custodyChain: [
      { stage: "Collected", date: "13 Jan 2026", time: "14:50", person: "Rahul Mehta", action: "Exported from operator NVR" },
      { stage: "Submitted to Investigation Unit", date: "13 Jan 2026", time: "15:30", person: "Rahul Mehta", action: "Registered in evidence register" },
      { stage: "Transferred to Forensic Unit", date: "13 Jan 2026", time: "16:00", person: "HC S. Pawar", action: "Chain form signed on transfer" },
      { stage: "Examined", date: "16 Jan 2026", time: "11:30", person: "A. Sharma", action: "Frame extraction and review" },
      { stage: "Stored", date: "16 Jan 2026", time: "17:10", person: "Lab Custodian", action: "Locker B-12" },
    ],
  },
  {
    id: "EV-003",
    caseId: "FIR-2026-00124",
    description: "Witness Statement",
    type: "Document",
    collected: "12 Jan 2026",
    submittedBy: "Rahul Mehta",
    custodian: "Investigation Unit",
    integrity: "verified",
    status: "Active",
    hash: "c92a5f108b6d47e3aa10cf7592b3416d8e0c74af1592dd63b0817ae4c3f5209e",
    eventId: "EV-TL-124-2",
    custodyChain: [
      { stage: "Collected", date: "12 Jan 2026", time: "11:10", person: "Rahul Mehta", action: "Statement recorded at premises" },
      { stage: "Submitted to Investigation Unit", date: "12 Jan 2026", time: "11:20", person: "Rahul Mehta", action: "Filed with case documents" },
      { stage: "Stored", date: "12 Jan 2026", time: "17:00", person: "Evidence Custodian", action: "Case file archive" },
    ],
  },
  {
    id: "EV-004",
    caseId: "FIR-2026-00124",
    description: "Forensic Report",
    type: "Document",
    collected: "14 Jan 2026",
    submittedBy: "A. Sharma",
    custodian: "Forensic Unit",
    integrity: "verified",
    status: "Active",
    hash: "d13b7c2905ae64f1cb8027d5a4913f6e70cd18b2ea45390176fbc25d80e4a17f",
    eventId: "EV-TL-124-4",
    custodyChain: [
      { stage: "Collected", date: "14 Jan 2026", time: "10:00", person: "A. Sharma", action: "Report compiled at forensic lab" },
      { stage: "Submitted to Investigation Unit", date: "14 Jan 2026", time: "10:05", person: "A. Sharma", action: "Delivered to case file" },
      { stage: "Stored", date: "14 Jan 2026", time: "17:30", person: "Evidence Custodian", action: "Case file archive" },
    ],
  },
  {
    id: "EV-005",
    caseId: "FIR-2026-00124",
    description: "Recovered Laptop (serial partially defaced)",
    type: "Other",
    collected: "16 Jan 2026",
    submittedBy: "Rahul Mehta",
    custodian: "Forensic Unit",
    integrity: "pending",
    status: "Under Review",
    hash: "e5470ac1b39d826fcf01a7d54e3928b6710dc84f2a9503b1687fcde240a19b73",
    eventId: "EV-TL-124-6",
    custodyChain: [
      { stage: "Collected", date: "16 Jan 2026", time: "13:40", person: "Rahul Mehta", action: "Seized on premises inspection" },
      { stage: "Submitted to Investigation Unit", date: "16 Jan 2026", time: "14:05", person: "Rahul Mehta", action: "Registered in evidence register" },
      { stage: "Transferred to Forensic Unit", date: "17 Jan 2026", time: "09:20", person: "HC S. Pawar", action: "Sent for data extraction" },
      { stage: "Examined", date: "18 Jan 2026", time: "10:00", person: "A. Sharma", action: "Scheduled examination" },
      { stage: "Stored", date: "—", time: "—", person: "Lab Custodian", action: "Pending intake" },
    ],
  },
  {
    id: "EV-007",
    caseId: "CASE-2026-00731",
    description: "CCTV Footage — Fancy Bazaar Junction",
    type: "Video",
    collected: "11 Jan 2026",
    submittedBy: "P. Singh",
    custodian: "District Media Vault",
    integrity: "pending",
    status: "Under Review",
    hash: "31b7e5d04c8f62a9157ce3fd0b428a95e6dc17f4a0253c8812b6e4f95d0a7cb3",
    eventId: "EV-TL-731-3",
    custodyChain: [
      { stage: "Collected", date: "11 Jan 2026", time: "08:30", person: "P. Singh", action: "Junction footage collected from operator NVR" },
      { stage: "Submitted to Investigation Unit", date: "11 Jan 2026", time: "09:10", person: "P. Singh", action: "Registered in evidence register" },
      { stage: "Transferred to District Vault", date: "11 Jan 2026", time: "13:45", person: "HC B. Das", action: "Media transfer initiated for district vault intake" },
      { stage: "Stored", date: "—", time: "—", person: "Media Custodian", action: "Pending vault intake" },
    ],
  },
  {
    id: "EV-008",
    caseId: "CASE-2026-00731",
    description: "Missing Person Notice",
    type: "Document",
    collected: "09 Jan 2026",
    submittedBy: "P. Singh",
    custodian: "Investigation Unit",
    integrity: "verified",
    status: "Active",
    hash: "9c24f0d1e7a3b8650d421cf59e0a736bd81f4ca2b9057e31c64d801a3f2b574e",
    eventId: "EV-TL-731-1",
    custodyChain: [
      { stage: "Collected", date: "09 Jan 2026", time: "08:55", person: "P. Singh", action: "Notice filed at Fancy Bazaar police station" },
      { stage: "Submitted to Investigation Unit", date: "09 Jan 2026", time: "09:20", person: "P. Singh", action: "Filed with case documents" },
      { stage: "Stored", date: "09 Jan 2026", time: "17:45", person: "Evidence Custodian", action: "Case file archive" },
    ],
  },
  {
    id: "EV-009",
    caseId: "CASE-2026-00731",
    description: "Informant Statement — Rupa Bora",
    type: "Document",
    collected: "10 Jan 2026",
    submittedBy: "P. Singh",
    custodian: "Investigation Unit",
    integrity: "verified",
    status: "Active",
    hash: "5f80c2b71ea94d306b175c8f02de9a431c67b0d5e9a814f2c3b7d604e1a95c82",
    eventId: "EV-TL-731-2",
    custodyChain: [
      { stage: "Collected", date: "10 Jan 2026", time: "12:30", person: "P. Singh", action: "Statement recorded at informant residence" },
      { stage: "Submitted to Investigation Unit", date: "10 Jan 2026", time: "13:05", person: "P. Singh", action: "Registered in evidence register" },
      { stage: "Stored", date: "10 Jan 2026", time: "18:15", person: "Evidence Custodian", action: "Case file archive" },
    ],
  },
  {
    id: "EV-006",
    caseId: "CASE-2026-00418",
    description: "Bank Statement Exports (4 accounts)",
    type: "Other",
    collected: "14 Jan 2026",
    submittedBy: "A. Sharma",
    custodian: "Digital Forensics Unit",
    integrity: "verified",
    status: "Active",
    hash: "07f95c2e1ba84d3760cf12ae95b34817d0e6ca47f2913b58ed07ac4b6152903d",
    eventId: "EV-TL-418-2",
    custodyChain: [
      { stage: "Collected", date: "14 Jan 2026", time: "11:15", person: "A. Sharma", action: "Collected at bank compliance office" },
      { stage: "Submitted to Investigation Unit", date: "14 Jan 2026", time: "17:00", person: "ASI P. Yadav", action: "Transferred to EOW" },
      { stage: "Examined", date: "15 Jan 2026", time: "10:40", person: "Audit Cell", action: "Flagged-transfer review" },
      { stage: "Stored", date: "15 Jan 2026", time: "19:25", person: "Digital Custodian", action: "Digital Vault" },
    ],
  },
];

export function registerEvidenceForCase(caseId: string): RegisterEvidence[] {
  return EVIDENCE_REGISTER.filter((e) => e.caseId === caseId);
}

export function findRegisterEvidence(id: string): RegisterEvidence | undefined {
  return EVIDENCE_REGISTER.find((e) => e.id === id);
}
