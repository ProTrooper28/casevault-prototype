/**
 * PROTOTYPE DEMO DATA — CaseVault AI (SIH26190).
 * All values below are fabricated sample data for UI demonstration only.
 * They are NOT real NCRB / Ministry of Home Affairs records or statistics.
 * Data is static and deterministic so IDs, people and timestamps stay
 * consistent across every screen and across page refreshes.
 */

export type IntegrityStatus = "verified" | "pending" | "compromised";

export type Case = {
  id: string;
  title: string;
  location: string;
  status: "Active" | "Under Review" | "Closed";
  type: string;
  investigator: string;
  openedOn: string;
  lastUpdated: string;
  priority: "High" | "Medium" | "Low";
  summary: string;
  sections: string[];
  people: { name: string; role: string; detail: string }[];
  dates: { label: string; value: string }[];
  officers: { name: string; role: string; unit: string }[];
};

export type Document = {
  id: string;
  name: string;
  category: string;
  type: string;
  caseId: string;
  uploadedBy: string;
  date: string;
  version: string;
  integrity: IntegrityStatus;
  access: "Restricted" | "Confidential" | "Internal";
  hash: string;
  pages: number;
  caseType: string;
  location: string;
  persons: string[];
  sections: string[];
  extracted: { label: string; value: string }[];
  summary: string;
};

export type Evidence = {
  id: string;
  caseId: string;
  type: string;
  description: string;
  submittedBy: string;
  date: string;
  integrity: IntegrityStatus;
  custody: "Sealed" | "In Transit" | "Under Examination" | "Released";
  custodian: string;
  storage: string;
  custodyChain: {
    stage: "Collected" | "Transferred" | "Examined" | "Stored" | "Accessed";
    officer: string;
    location: string;
    timestamp: string;
    done: boolean;
  }[];
};

export type AuditEntry = {
  id: string;
  time: string;
  date: string;
  user: string;
  role: string;
  action: string;
  document: string;
  caseId: string;
  status: "Success" | "Warning" | "Blocked";
};

export const CASES: Case[] = [
  {
    id: "FIR-2026-00124",
    title: "Theft Investigation",
    location: "Andheri, Mumbai",
    status: "Active",
    type: "Theft",
    investigator: "Rahul Mehta",
    openedOn: "12 Jan 2026",
    lastUpdated: "18 Jan 2026, 14:41",
    priority: "High",
    summary:
      "Reported theft of electronic equipment from a commercial premises in Andheri East. Recovered items are logged as evidence and pending forensic examination.",
    sections: ["IPC 379", "IPC 411"],
    people: [
      { name: "Rahul Sharma", role: "Complainant", detail: "Store owner, Andheri East" },
      { name: "Unidentified Suspect", role: "Accused", detail: "Under identification" },
      { name: "Sunita Rao", role: "Witness", detail: "Neighbouring shopkeeper" },
    ],
    dates: [
      { label: "Incident Date", value: "11 Jan 2026" },
      { label: "FIR Registered", value: "12 Jan 2026" },
      { label: "Last Hearing", value: "04 Feb 2026" },
      { label: "Next Review", value: "22 Feb 2026" },
    ],
    officers: [
      { name: "Rahul Mehta", role: "Police Investigator", unit: "Andheri Police Station" },
      { name: "A. Sharma", role: "Forensic Officer", unit: "Regional Forensic Lab" },
      { name: "N. Iyer", role: "Legal Officer", unit: "Prosecution Cell" },
    ],
  },
  {
    id: "CASE-2026-00418",
    title: "Financial Fraud Investigation",
    location: "New Delhi",
    status: "Under Review",
    type: "Financial Fraud",
    investigator: "A. Sharma",
    openedOn: "03 Jan 2026",
    lastUpdated: "17 Jan 2026, 11:20",
    priority: "High",
    summary:
      "Alleged fraudulent transfer of funds through shell accounts. Bank statements and transaction ledgers are under audit review.",
    sections: ["IPC 420", "IPC 468", "IT Act 66D"],
    people: [
      { name: "Priya Menon", role: "Complainant", detail: "Authorised bank representative" },
      { name: "Vikram Chauhan", role: "Accused", detail: "Primary account holder" },
    ],
    dates: [
      { label: "Incident Window", value: "Nov – Dec 2025" },
      { label: "Case Registered", value: "03 Jan 2026" },
      { label: "Audit Submitted", value: "15 Jan 2026" },
      { label: "Next Review", value: "26 Feb 2026" },
    ],
    officers: [
      { name: "A. Sharma", role: "Police Investigator", unit: "Economic Offences Wing" },
      { name: "S. Kapoor", role: "Prosecutor", unit: "District Court, New Delhi" },
    ],
  },
  {
    id: "CASE-2026-00731",
    title: "Missing Person Investigation",
    location: "Guwahati",
    status: "Active",
    type: "Missing Person",
    investigator: "P. Singh",
    openedOn: "09 Jan 2026",
    lastUpdated: "16 Jan 2026, 09:05",
    priority: "Medium",
    summary:
      "Missing person report filed for an adult last seen near Fancy Bazaar. Witness statements and CCTV records are being consolidated.",
    sections: ["BNSS 35", "IPC 363"],
    people: [
      { name: "Anil Bora", role: "Missing Person", detail: "Age 34, last seen 08 Jan 2026" },
      { name: "Rupa Bora", role: "Informant", detail: "Spouse" },
    ],
    dates: [
      { label: "Last Seen", value: "08 Jan 2026" },
      { label: "Report Filed", value: "09 Jan 2026" },
      { label: "Search Update", value: "16 Jan 2026" },
      { label: "Next Review", value: "20 Feb 2026" },
    ],
    officers: [
      { name: "P. Singh", role: "Police Investigator", unit: "Fancy Bazaar Police Station" },
      { name: "Insp. R. Sarma", role: "Administrator", unit: "District Control Room" },
    ],
  },
];

export const DOCUMENT_CATEGORIES = [
  "FIRs",
  "Investigation Reports",
  "Witness Statements",
  "Forensic Reports",
  "Court Filings",
  "Evidence Records",
  "Legal Documents",
] as const;

export const DOCUMENTS: Document[] = [
  {
    id: "DOC-10241",
    name: "First Information Report",
    category: "FIRs",
    type: "FIR",
    caseId: "FIR-2026-00124",
    uploadedBy: "Police Investigator",
    date: "12 Jan 2026",
    version: "1.0",
    integrity: "verified",
    access: "Restricted",
    hash: "a84f3c7d19e5b0426fa1c8d73be04517cc92e6a1f0d34b87ee215c9740ab92bd",
    pages: 3,
    caseType: "Theft",
    location: "Andheri, Mumbai",
    persons: ["Rahul Sharma"],
    sections: ["IPC 379", "IPC 411"],
    extracted: [
      { label: "Document Type", value: "FIR" },
      { label: "Case Type", value: "Theft" },
      { label: "Date", value: "12 Jan 2026" },
      { label: "Location", value: "Andheri, Mumbai" },
      { label: "Persons Involved", value: "Rahul Sharma" },
      { label: "Sections", value: "IPC 379, 411" },
      { label: "Case ID", value: "FIR-2026-00124" },
    ],
    summary:
      "Complaint registered regarding theft of electronic equipment from commercial premises at Andheri East on 11 Jan 2026.",
  },
  {
    id: "DOC-10242",
    name: "Site Investigation Report",
    category: "Investigation Reports",
    type: "Investigation Report",
    caseId: "FIR-2026-00124",
    uploadedBy: "Rahul Mehta",
    date: "13 Jan 2026",
    version: "1.2",
    integrity: "verified",
    access: "Restricted",
    hash: "b71d0e44ac8f2915d6ba37c05e1948fd227b6ec4a95038117cfd2e6b40173a9c",
    pages: 6,
    caseType: "Theft",
    location: "Andheri, Mumbai",
    persons: ["Rahul Sharma", "Sunita Rao"],
    sections: ["IPC 379"],
    extracted: [
      { label: "Document Type", value: "Investigation Report" },
      { label: "Case Type", value: "Theft" },
      { label: "Date", value: "13 Jan 2026" },
      { label: "Location", value: "Andheri, Mumbai" },
      { label: "Persons Involved", value: "Rahul Sharma, Sunita Rao" },
      { label: "Case ID", value: "FIR-2026-00124" },
    ],
    summary:
      "Spot inspection notes, seizure list and photographic index prepared during premises examination.",
  },
  {
    id: "DOC-10243",
    name: "Witness Statement — Sunita Rao",
    category: "Witness Statements",
    type: "Witness Statement",
    caseId: "FIR-2026-00124",
    uploadedBy: "Rahul Mehta",
    date: "14 Jan 2026",
    version: "1.0",
    integrity: "pending",
    access: "Confidential",
    hash: "c92a5f108b6d47e3aa10cf7592b3416d8e0c74af1592dd63b0817ae4c3f5209e",
    pages: 2,
    caseType: "Theft",
    location: "Andheri, Mumbai",
    persons: ["Sunita Rao"],
    sections: ["IPC 379"],
    extracted: [
      { label: "Document Type", value: "Witness Statement" },
      { label: "Case Type", value: "Theft" },
      { label: "Date", value: "14 Jan 2026" },
      { label: "Location", value: "Andheri, Mumbai" },
      { label: "Persons Involved", value: "Sunita Rao" },
      { label: "Case ID", value: "FIR-2026-00124" },
    ],
    summary:
      "Statement recorded from neighbouring shopkeeper describing movement observed on the night of the incident.",
  },
  {
    id: "DOC-10244",
    name: "Forensic Fingerprint Analysis",
    category: "Forensic Reports",
    type: "Forensic Report",
    caseId: "FIR-2026-00124",
    uploadedBy: "A. Sharma",
    date: "16 Jan 2026",
    version: "2.0",
    integrity: "verified",
    access: "Confidential",
    hash: "d13b7c2905ae64f1cb8027d5a4913f6e70cd18b2ea45390176fbc25d80e4a17f",
    pages: 8,
    caseType: "Theft",
    location: "Regional Forensic Lab, Mumbai",
    persons: ["Rahul Sharma"],
    sections: ["IPC 411"],
    extracted: [
      { label: "Document Type", value: "Forensic Report" },
      { label: "Case Type", value: "Theft" },
      { label: "Date", value: "16 Jan 2026" },
      { label: "Location", value: "Regional Forensic Lab, Mumbai" },
      { label: "Evidence Reference", value: "EVD-2026-0091" },
      { label: "Case ID", value: "FIR-2026-00124" },
    ],
    summary:
      "Comparative fingerprint analysis of lifted latent prints against recovered equipment surfaces.",
  },
  {
    id: "DOC-10245",
    name: "Bank Transaction Audit Ledger",
    category: "Evidence Records",
    type: "Evidence Record",
    caseId: "CASE-2026-00418",
    uploadedBy: "A. Sharma",
    date: "15 Jan 2026",
    version: "1.1",
    integrity: "verified",
    access: "Confidential",
    hash: "e5470ac1b39d826fcf01a7d54e3928b6710dc84f2a9503b1687fcde240a19b73",
    pages: 24,
    caseType: "Financial Fraud",
    location: "New Delhi",
    persons: ["Vikram Chauhan", "Priya Menon"],
    sections: ["IPC 420", "IT Act 66D"],
    extracted: [
      { label: "Document Type", value: "Evidence Record" },
      { label: "Case Type", value: "Financial Fraud" },
      { label: "Date", value: "15 Jan 2026" },
      { label: "Location", value: "New Delhi" },
      { label: "Persons Involved", value: "Vikram Chauhan, Priya Menon" },
      { label: "Case ID", value: "CASE-2026-00418" },
    ],
    summary:
      "Consolidated ledger of flagged transfers across four accounts during the November–December 2025 window.",
  },
  {
    id: "DOC-10246",
    name: "Charge Sheet Draft",
    category: "Court Filings",
    type: "Court Filing",
    caseId: "CASE-2026-00418",
    uploadedBy: "S. Kapoor",
    date: "17 Jan 2026",
    version: "0.9",
    integrity: "pending",
    access: "Restricted",
    hash: "f6812bd3ca90475eab13d6f0925c481773ae0dc5b219438f60cd7ae19b520d84",
    pages: 12,
    caseType: "Financial Fraud",
    location: "District Court, New Delhi",
    persons: ["Vikram Chauhan"],
    sections: ["IPC 420", "IPC 468"],
    extracted: [
      { label: "Document Type", value: "Court Filing" },
      { label: "Case Type", value: "Financial Fraud" },
      { label: "Date", value: "17 Jan 2026" },
      { label: "Location", value: "District Court, New Delhi" },
      { label: "Persons Involved", value: "Vikram Chauhan" },
      { label: "Case ID", value: "CASE-2026-00418" },
    ],
    summary: "Draft charge sheet prepared for prosecution review before court submission.",
  },
  {
    id: "DOC-10247",
    name: "Missing Person Notice",
    category: "Legal Documents",
    type: "Legal Notice",
    caseId: "CASE-2026-00731",
    uploadedBy: "P. Singh",
    date: "09 Jan 2026",
    version: "1.0",
    integrity: "verified",
    access: "Internal",
    hash: "07f95c2e1ba84d3760cf12ae95b34817d0e6ca47f2913b58ed07ac4b6152903d",
    pages: 1,
    caseType: "Missing Person",
    location: "Guwahati",
    persons: ["Anil Bora", "Rupa Bora"],
    sections: ["BNSS 35"],
    extracted: [
      { label: "Document Type", value: "Legal Notice" },
      { label: "Case Type", value: "Missing Person" },
      { label: "Date", value: "09 Jan 2026" },
      { label: "Location", value: "Guwahati" },
      { label: "Persons Involved", value: "Anil Bora, Rupa Bora" },
      { label: "Case ID", value: "CASE-2026-00731" },
    ],
    summary: "Public notice issued for circulation across district police stations.",
  },
  {
    id: "DOC-10248",
    name: "Witness Statement — Rupa Bora",
    category: "Witness Statements",
    type: "Witness Statement",
    caseId: "CASE-2026-00731",
    uploadedBy: "P. Singh",
    date: "10 Jan 2026",
    version: "1.0",
    integrity: "verified",
    access: "Confidential",
    hash: "18ac6d3f2b95470ecb02a7d1e5934f68701cd25ba9f4380176edc1ba40275c9e",
    pages: 3,
    caseType: "Missing Person",
    location: "Guwahati",
    persons: ["Rupa Bora", "Anil Bora"],
    sections: ["BNSS 35"],
    extracted: [
      { label: "Document Type", value: "Witness Statement" },
      { label: "Case Type", value: "Missing Person" },
      { label: "Date", value: "10 Jan 2026" },
      { label: "Location", value: "Guwahati" },
      { label: "Persons Involved", value: "Rupa Bora" },
      { label: "Case ID", value: "CASE-2026-00731" },
    ],
    summary: "Statement of the informant covering last known movements and contacts.",
  },
];

export const EVIDENCE: Evidence[] = [
  {
    id: "EVD-2026-0091",
    caseId: "FIR-2026-00124",
    type: "Electronic Device",
    description: "Recovered laptop, serial partially defaced",
    submittedBy: "Rahul Mehta",
    date: "13 Jan 2026",
    integrity: "verified",
    custody: "Under Examination",
    custodian: "Forensic Unit",
    storage: "Forensic Lab Locker B-12, Mumbai",
    custodyChain: [
      {
        stage: "Collected",
        officer: "Rahul Mehta",
        location: "Andheri East premises",
        timestamp: "13 Jan 2026, 09:20",
        done: true,
      },
      {
        stage: "Transferred",
        officer: "HC S. Pawar",
        location: "Andheri Police Station → Forensic Lab",
        timestamp: "13 Jan 2026, 15:05",
        done: true,
      },
      {
        stage: "Examined",
        officer: "A. Sharma",
        location: "Regional Forensic Lab",
        timestamp: "16 Jan 2026, 11:30",
        done: true,
      },
      {
        stage: "Stored",
        officer: "Lab Custodian",
        location: "Locker B-12",
        timestamp: "16 Jan 2026, 17:10",
        done: true,
      },
      {
        stage: "Accessed",
        officer: "N. Iyer",
        location: "Prosecution Cell (view only)",
        timestamp: "18 Jan 2026, 14:38",
        done: false,
      },
    ],
  },
  {
    id: "EVD-2026-0092",
    caseId: "FIR-2026-00124",
    type: "Physical Sample",
    description: "Latent fingerprint lifts, 4 cards",
    submittedBy: "A. Sharma",
    date: "14 Jan 2026",
    integrity: "verified",
    custody: "Sealed",
    custodian: "Investigation Unit",
    storage: "Evidence Room A-04, Mumbai",
    custodyChain: [
      {
        stage: "Collected",
        officer: "A. Sharma",
        location: "Andheri East premises",
        timestamp: "13 Jan 2026, 10:05",
        done: true,
      },
      {
        stage: "Transferred",
        officer: "HC S. Pawar",
        location: "To Regional Forensic Lab",
        timestamp: "13 Jan 2026, 16:20",
        done: true,
      },
      {
        stage: "Examined",
        officer: "A. Sharma",
        location: "Regional Forensic Lab",
        timestamp: "15 Jan 2026, 12:00",
        done: true,
      },
      {
        stage: "Stored",
        officer: "Evidence Custodian",
        location: "Evidence Room A-04",
        timestamp: "15 Jan 2026, 18:40",
        done: true,
      },
      {
        stage: "Accessed",
        officer: "—",
        location: "No access recorded",
        timestamp: "Pending",
        done: false,
      },
    ],
  },
  {
    id: "EVD-2026-0117",
    caseId: "CASE-2026-00418",
    type: "Digital Records",
    description: "Bank statement exports, 4 accounts",
    submittedBy: "A. Sharma",
    date: "15 Jan 2026",
    integrity: "verified",
    custody: "Sealed",
    custodian: "Digital Forensics Unit",
    storage: "Digital Vault, EOW New Delhi",
    custodyChain: [
      {
        stage: "Collected",
        officer: "A. Sharma",
        location: "Bank compliance office",
        timestamp: "14 Jan 2026, 11:15",
        done: true,
      },
      {
        stage: "Transferred",
        officer: "ASI P. Yadav",
        location: "To EOW Digital Vault",
        timestamp: "14 Jan 2026, 17:00",
        done: true,
      },
      {
        stage: "Examined",
        officer: "Audit Cell",
        location: "EOW New Delhi",
        timestamp: "15 Jan 2026, 10:40",
        done: true,
      },
      {
        stage: "Stored",
        officer: "Digital Custodian",
        location: "Digital Vault",
        timestamp: "15 Jan 2026, 19:25",
        done: true,
      },
      {
        stage: "Accessed",
        officer: "S. Kapoor",
        location: "Prosecution review",
        timestamp: "17 Jan 2026, 09:50",
        done: true,
      },
    ],
  },
  {
    id: "EVD-2026-0164",
    caseId: "CASE-2026-00731",
    type: "CCTV Footage",
    description: "Fancy Bazaar junction, 08 Jan 2026",
    submittedBy: "P. Singh",
    date: "11 Jan 2026",
    integrity: "pending",
    custody: "In Transit",
    custodian: "District Escort (in transit)",
    storage: "Awaiting district vault intake",
    custodyChain: [
      {
        stage: "Collected",
        officer: "P. Singh",
        location: "Fancy Bazaar, Guwahati",
        timestamp: "11 Jan 2026, 08:30",
        done: true,
      },
      {
        stage: "Transferred",
        officer: "Const. J. Deka",
        location: "To district vault",
        timestamp: "11 Jan 2026, 13:45",
        done: true,
      },
      {
        stage: "Examined",
        officer: "—",
        location: "Scheduled",
        timestamp: "Pending",
        done: false,
      },
      { stage: "Stored", officer: "—", location: "Pending", timestamp: "Pending", done: false },
      { stage: "Accessed", officer: "—", location: "Pending", timestamp: "Pending", done: false },
    ],
  },
];

export const AUDIT_TRAIL: AuditEntry[] = [
  {
    id: "#18424",
    time: "14:32",
    date: "18 Jan 2026",
    user: "Rahul Mehta",
    role: "Police Investigator",
    action: "Investigator uploaded FIR",
    document: "First Information Report",
    caseId: "FIR-2026-00124",
    status: "Success",
  },
  {
    id: "#18425",
    time: "14:33",
    date: "18 Jan 2026",
    user: "CaseVault Pipeline",
    role: "System",
    action: "AI document processing completed",
    document: "First Information Report",
    caseId: "FIR-2026-00124",
    status: "Success",
  },
  {
    id: "#18426",
    time: "14:33",
    date: "18 Jan 2026",
    user: "CaseVault Pipeline",
    role: "System",
    action: "Document fingerprint generated",
    document: "First Information Report",
    caseId: "FIR-2026-00124",
    status: "Success",
  },
  {
    id: "#18427",
    time: "14:35",
    date: "18 Jan 2026",
    user: "Rahul Mehta",
    role: "Police Investigator",
    action: "Investigator viewed document",
    document: "First Information Report",
    caseId: "FIR-2026-00124",
    status: "Success",
  },
  {
    id: "#18428",
    time: "14:38",
    date: "18 Jan 2026",
    user: "Rahul Mehta",
    role: "Police Investigator",
    action: "Access granted to Forensic Officer",
    document: "First Information Report",
    caseId: "FIR-2026-00124",
    status: "Success",
  },
  {
    id: "#18429",
    time: "14:41",
    date: "18 Jan 2026",
    user: "A. Sharma",
    role: "Forensic Officer",
    action: "Integrity verified",
    document: "First Information Report",
    caseId: "FIR-2026-00124",
    status: "Success",
  },
  {
    id: "#18430",
    time: "15:02",
    date: "18 Jan 2026",
    user: "Unknown session",
    role: "Unassigned",
    action: "Download attempt outside access scope",
    document: "Forensic Fingerprint Analysis",
    caseId: "FIR-2026-00124",
    status: "Blocked",
  },
  {
    id: "#18431",
    time: "15:14",
    date: "18 Jan 2026",
    user: "S. Kapoor",
    role: "Prosecutor",
    action: "Version 0.9 uploaded for review",
    document: "Charge Sheet Draft",
    caseId: "CASE-2026-00418",
    status: "Warning",
  },
];

export const ROLES = [
  {
    name: "Police Investigator",
    users: 42,
    description: "Registers cases, uploads documents and evidence records.",
    permissions: { View: true, Upload: true, Download: true, Edit: true, Verify: true, Share: true },
  },
  {
    name: "Forensic Officer",
    users: 18,
    description: "Examines evidence and publishes forensic findings.",
    permissions: {
      View: true,
      Upload: true,
      Download: true,
      Edit: false,
      Verify: true,
      Share: false,
    },
  },
  {
    name: "Legal Officer",
    users: 12,
    description: "Reviews case files and prepares legal documentation.",
    permissions: {
      View: true,
      Upload: true,
      Download: true,
      Edit: true,
      Verify: false,
      Share: true,
    },
  },
  {
    name: "Prosecutor",
    users: 9,
    description: "Accesses case bundles for court proceedings.",
    permissions: {
      View: true,
      Upload: false,
      Download: true,
      Edit: false,
      Verify: false,
      Share: true,
    },
  },
  {
    name: "Court Authority",
    users: 6,
    description: "Read-only access to submitted filings and verification records.",
    permissions: {
      View: true,
      Upload: false,
      Download: true,
      Edit: false,
      Verify: true,
      Share: false,
    },
  },
  {
    name: "Administrator",
    users: 4,
    description: "Manages roles, retention policy and audit oversight.",
    permissions: { View: true, Upload: true, Download: true, Edit: true, Verify: true, Share: true },
  },
] as const;

export const PERMISSION_KEYS = [
  "View",
  "Upload",
  "Download",
  "Edit",
  "Verify",
  "Share",
] as const;

export const ACCESS_GRANTS = [
  {
    user: "Rahul Mehta",
    role: "Police Investigator",
    scope: "FIR-2026-00124",
    granted: "12 Jan 2026",
    expires: "31 Mar 2026",
    status: "Active" as const,
  },
  {
    user: "A. Sharma",
    role: "Forensic Officer",
    scope: "FIR-2026-00124",
    granted: "13 Jan 2026",
    expires: "28 Feb 2026",
    status: "Active" as const,
  },
  {
    user: "N. Iyer",
    role: "Legal Officer",
    scope: "FIR-2026-00124",
    granted: "15 Jan 2026",
    expires: "30 Apr 2026",
    status: "Active" as const,
  },
  {
    user: "S. Kapoor",
    role: "Prosecutor",
    scope: "CASE-2026-00418",
    granted: "16 Jan 2026",
    expires: "15 Apr 2026",
    status: "Active" as const,
  },
  {
    user: "Judicial Registry Desk",
    role: "Court Authority",
    scope: "CASE-2026-00418",
    granted: "17 Jan 2026",
    expires: "17 Feb 2026",
    status: "Expiring" as const,
  },
  {
    user: "P. Singh",
    role: "Police Investigator",
    scope: "CASE-2026-00731",
    granted: "09 Jan 2026",
    expires: "30 Apr 2026",
    status: "Active" as const,
  },
];

export const DASHBOARD_STATS = [
  { label: "Active Cases", value: "24", delta: "+3 this week" },
  { label: "Documents", value: "1,284", delta: "+56 this week" },
  { label: "Evidence Items", value: "376", delta: "+12 this week" },
  { label: "Pending Verification", value: "8", delta: "Needs attention" },
];

export const RECENT_ACTIVITY = [
  {
    time: "14:41",
    text: "Integrity verified for First Information Report",
    actor: "A. Sharma",
    tone: "success" as const,
  },
  {
    time: "14:38",
    text: "Access granted to Forensic Officer on FIR-2026-00124",
    actor: "Rahul Mehta",
    tone: "info" as const,
  },
  {
    time: "14:33",
    text: "Document processing pipeline completed 5 of 5 stages",
    actor: "CaseVault Pipeline",
    tone: "ai" as const,
  },
  {
    time: "15:02",
    text: "Download attempt blocked outside access scope",
    actor: "Unknown session",
    tone: "alert" as const,
  },
  {
    time: "15:14",
    text: "Charge Sheet Draft v0.9 awaiting verification",
    actor: "S. Kapoor",
    tone: "warning" as const,
  },
];

export const PROCESSING_STAGES = [
  {
    key: "ocr",
    name: "OCR",
    description: "Text layer extraction from scanned pages",
    detail: "3 pages read · 1,842 characters recognised",
    engine: "Planned: Tesseract / PaddleOCR service",
  },
  {
    key: "classification",
    name: "Document Classification",
    description: "Assigns document category and case type",
    detail: "Classified as FIR · Theft (confidence 0.94)",
    engine: "Planned: FastAPI classifier endpoint",
  },
  {
    key: "entities",
    name: "Entity Extraction",
    description: "Names, sections, locations and dates",
    detail: "Rahul Sharma · IPC 379, 411 · Andheri, Mumbai · 12 Jan 2026",
    engine: "Planned: spaCy / transformer NER",
  },
  {
    key: "metadata",
    name: "Metadata Extraction",
    description: "Case linkage, version and access defaults",
    detail: "Linked to FIR-2026-00124 · version 1.0 · Restricted",
    engine: "Planned: rules service",
  },
  {
    key: "index",
    name: "Semantic Indexing",
    description: "Embedding generation for smart search",
    detail: "12 passages embedded · index segment sealed",
    engine: "Planned: Sentence Transformers + FAISS",
  },
];

export const CURRENT_USER = {
  name: "Guest Investigator",
  role: "Police Investigator",
  unit: "Demo Session · Prototype",
  badge: "PI-DEMO-001",
};

export const NOTIFICATIONS = [
  {
    title: "8 documents pending verification",
    time: "10 min ago",
    tone: "warning" as const,
  },
  {
    title: "Blocked download attempt logged (#18430)",
    time: "26 min ago",
    tone: "alert" as const,
  },
  {
    title: "Forensic report v2.0 published to FIR-2026-00124",
    time: "2 hrs ago",
    tone: "info" as const,
  },
];

export function getCase(id: string) {
  return CASES.find((c) => c.id === id);
}

export function getDocument(id: string) {
  return DOCUMENTS.find((d) => d.id === id);
}

export function getEvidence(id: string) {
  return EVIDENCE.find((e) => e.id === id);
}

export function shortHash(hash: string) {
  return `${hash.slice(0, 4)}...${hash.slice(-4)}`;
}
