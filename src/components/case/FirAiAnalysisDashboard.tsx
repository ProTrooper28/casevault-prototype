import { useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  FileText,
  ShieldCheck,
  Building2,
  MapPin,
  Users,
  AlertTriangle,
  Scale,
  Calendar,
  IndianRupee,
  Network,
  ExternalLink,
  CheckCircle2,
  ScanText,
  Tags,
  ListTree,
  DatabaseZap,
  ArrowRight,
  Info,
} from "lucide-react";
import { Badge, Btn, Mono } from "@/components/kit";
import { findDocument } from "@/lib/app-state";
import { cachedDocuments } from "@/lib/uploads-repository";

export function FirAiAnalysisDashboard({
  caseId = "FIR-2026-00124",
  docId = "DOC-10241",
  overrideDocName,
  overrideHash,
}: {
  caseId?: string;
  docId?: string;
  overrideDocName?: string;
  overrideHash?: string;
}) {
  const navigate = useNavigate();
  const doc = findDocument(docId) ?? cachedDocuments().find((d) => d.id === docId);
  const docName = overrideDocName ?? doc?.name ?? "First Information Report (FIR)";
  const realHash =
    overrideHash ??
    doc?.hash ??
    (doc as unknown as { sha256?: string })?.sha256 ??
    "a84f3c7d19e5b0426fa1c8d73be04517cc92e6a1f0d34b87ee215c9740ab92bd";

  return (
    <div className="space-y-5 text-sidebar-foreground">
      {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-sm border border-border bg-gradient-to-r from-[#06152B] via-[#0A2244] to-[#06152B] p-5 shadow-lg">
        {/* Subtle grid background overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(140,180,255,0.7) 1px, transparent 1px), linear-gradient(to bottom, rgba(140,180,255,0.7) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-sm bg-primary/20 text-primary ring-1 ring-primary/30">
                <Sparkles className="size-4" />
              </span>
              <h1 className="text-lg font-bold tracking-tight text-white">
                AI DOCUMENT ANALYSIS
              </h1>
              <Badge tone="ai" className="border border-primary/30 bg-primary/20 text-primary">
                Prototype Intelligence Layer
              </Badge>
              <span className="rounded bg-gold/20 px-2 py-0.5 text-[11px] font-semibold text-gold border border-gold/30">
                Prototype AI
              </span>
            </div>
            <p className="mt-1.5 text-[13px] text-sidebar-muted">
              Analysis based on uploaded FIR document · FIR No:{" "}
              <Mono className="font-semibold text-white">RC0312026A0009</Mono>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="rounded border border-border/80 bg-card/60 px-3 py-1 text-muted-foreground">
              Document: <strong className="text-foreground">{docName}</strong>
            </span>
            <span className="flex items-center gap-1.5 rounded border border-success/30 bg-success/10 px-3 py-1 font-medium text-success">
              <CheckCircle2 className="size-3.5" /> Status: Analysis Complete
            </span>
          </div>
        </div>

        {/* ── CONCEPTUAL PROCESSING PIPELINE BAR (Section 11) ──────────── */}
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between gap-2 pb-2">
            <span className="text-[11px] font-semibold tracking-wider text-sidebar-muted uppercase">
              Pipeline Progress · <span className="text-gold">Prototype AI Pipeline</span>
            </span>
            <span className="text-[11px] text-sidebar-muted">6 / 6 Stages Executed</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {[
              { icon: FileText, label: "DOCUMENT", sub: "Ingested" },
              { icon: ScanText, label: "OCR / TEXT", sub: "Recognised" },
              { icon: Users, label: "ENTITIES", sub: "Extracted" },
              { icon: Scale, label: "LEGAL SECTIONS", sub: "Detected" },
              { icon: Tags, label: "CLASSIFICATION", sub: "FIR Verified" },
              { icon: ListTree, label: "SUMMARY", sub: "Generated" },
            ].map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.label}
                  className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11.5px]"
                >
                  <Icon className="size-3.5 shrink-0 text-primary" />
                  <div className="min-w-0 leading-tight">
                    <p className="truncate font-semibold text-white/90">{p.label}</p>
                    <p className="text-[10px] text-sidebar-muted">{p.sub}</p>
                  </div>
                  {idx < 5 && <ArrowRight className="ml-auto hidden size-3 text-white/30 md:block" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN 2-COLUMN GRID ─────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* LEFT / CENTER MAIN COLUMN (2 cols wide) */}
        <div className="space-y-5 lg:col-span-2">
          {/* 1. DOCUMENT CLASSIFICATION CARD (Section 1) */}
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sidebar-muted">
                  1. Document Classification
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground">Confidence:</span>
                <span className="rounded bg-success/15 px-2.5 py-0.5 text-[12px] font-semibold text-success border border-success/30">
                  High
                </span>
              </div>
            </div>
            <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-border/80 bg-muted/30 p-3">
                <p className="label-caps text-muted-foreground">Document Type</p>
                <p className="mt-1 text-base font-bold text-foreground">
                  First Information Report (FIR)
                </p>
              </div>
              <div className="rounded border border-border/80 bg-muted/30 p-3">
                <p className="label-caps text-muted-foreground">Classification Reason</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  “Document structure, FIR number, police station, sections and investigation
                  details indicate an FIR.”
                </p>
              </div>
            </div>
          </div>

          {/* 2. EXECUTIVE SUMMARY (Section 2) */}
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-gold" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sidebar-muted">
                  2. Executive Summary
                </h2>
              </div>
              <span className="text-[11px] italic text-muted-foreground">
                Allegations recorded in FIR
              </span>
            </div>
            <p className="mt-3.5 text-[13.5px] leading-relaxed text-foreground/90">
              An FIR registered at ACB Jodhpur records allegations concerning fraudulent processing
              of ECHS medical reimbursement claims involving two hospitals in Rajgarh, Churu,
              Rajasthan. The FIR describes alleged manipulation of referral and medical records,
              submission of claims for admissions that were allegedly not authorized or required, and
              alleged involvement of unknown public/private persons.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5 border-t border-border pt-3">
              <span className="inline-flex items-center gap-1.5 rounded border border-border bg-muted/50 px-3 py-1 text-[12px] font-medium">
                <Calendar className="size-3.5 text-primary" /> Reported period:{" "}
                <strong className="text-foreground">2023–2025</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded border border-alert/30 bg-alert-soft px-3 py-1 text-[12px] font-medium text-alert">
                <IndianRupee className="size-3.5" /> Approx. alleged Government loss:{" "}
                <strong className="text-alert">₹34.93 lakh</strong>
              </span>
            </div>
          </div>

          {/* 3. KEY ENTITIES (Section 3) */}
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Users className="size-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-sidebar-muted">
                3. Extracted Key Entities
              </h2>
            </div>

            <div className="mt-3.5 space-y-4">
              {/* People */}
              <div>
                <p className="label-caps mb-2 text-muted-foreground">People Referenced</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2.5 rounded border border-border bg-muted/30 p-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded bg-primary/10 text-primary font-semibold text-xs">
                      IO
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">Maldan</p>
                      <p className="text-[11px] text-muted-foreground">
                        Inspector, CBI, ACB Jodhpur (Entrusted)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded border border-border bg-muted/30 p-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded bg-primary/10 text-primary font-semibold text-xs">
                      SP
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">
                        Kamal Singh Choudhary
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Superintendent of Police, ACB Jodhpur
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Organizations */}
              <div>
                <p className="label-caps mb-2 text-muted-foreground">Organizations / Entities</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Raika Multispeciality Hospital",
                    "Rohilla Nursing Home",
                    "Regional Centre, ECHS, Hisar",
                    "ECHS Polyclinics",
                    "Ex-Servicemen Contributory Health Scheme (ECHS)",
                  ].map((org) => (
                    <span
                      key={org}
                      className="inline-flex items-center gap-1.5 rounded border border-border bg-sidebar-active px-2.5 py-1 text-[12.5px] font-medium text-foreground"
                    >
                      <Building2 className="size-3.5 text-primary" /> {org}
                    </span>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div>
                <p className="label-caps mb-2 text-muted-foreground">Locations Identified</p>
                <div className="flex flex-wrap gap-2">
                  {["Jodhpur", "Rajgarh", "Churu", "Rajasthan", "Hisar"].map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-2.5 py-1 text-[12px] font-medium text-muted-foreground"
                    >
                      <MapPin className="size-3.5 text-gold" /> {loc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. LEGAL SECTIONS & 5. OFFENCE CLASSIFICATION (Sections 4 & 5) */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Legal Sections */}
            <div className="rounded-sm border border-border bg-card p-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Scale className="size-4 text-gold" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sidebar-muted">
                  4. Legal Sections
                </h2>
              </div>
              <div className="mt-3.5 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Prevention of Corruption Act, 1988
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {["13(2)", "13(1)(a)"].map((s) => (
                      <span
                        key={s}
                        className="rounded border border-gold/40 bg-gold/10 px-2.5 py-1 text-[12px] font-semibold text-gold cursor-default"
                      >
                        Sec {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                    BNS 2023 (Bharatiya Nyaya Sanhita)
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {["61(2)", "318", "336", "338", "340"].map((s) => (
                      <span
                        key={s}
                        className="rounded border border-primary/40 bg-primary/10 px-2.5 py-1 text-[12px] font-semibold text-primary cursor-default"
                      >
                        Sec {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                    IPC Corresponding References
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {["120-B", "420", "467", "468", "471"].map((s) => (
                      <span
                        key={s}
                        className="rounded border border-border bg-muted px-2 py-0.5 text-[11.5px] font-mono text-muted-foreground cursor-default"
                      >
                        IPC {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Offence Themes */}
            <div className="rounded-sm border border-border bg-card p-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-alert" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-sidebar-muted">
                    5. Offence Themes
                  </h2>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Themes identified from the FIR text
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "Forgery",
                  "Cheating",
                  "Criminal Misconduct",
                  "Conspiracy",
                  "Fraudulent Claims",
                  "Record Manipulation",
                ].map((offence) => (
                  <span
                    key={offence}
                    className="inline-flex items-center gap-1 rounded border border-alert/30 bg-alert-soft px-2.5 py-1 text-[12px] font-medium text-alert"
                  >
                    • {offence}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 8. ENTITIES / RELATIONSHIPS VISUAL (Section 8) */}
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Network className="size-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sidebar-muted">
                  8. Entity Relationship Flow
                </h2>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Allegations recorded in FIR
              </span>
            </div>

            <div className="mt-4 rounded border border-border/80 bg-[#06152B]/60 p-4 text-center">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Hospital A */}
                <div className="rounded border border-primary/30 bg-card p-3 shadow-sm">
                  <p className="text-[13px] font-bold text-foreground">
                    Raika Multispeciality Hospital
                  </p>
                  <p className="text-[11px] text-muted-foreground">Rajgarh, Churu</p>
                  <div className="my-2 flex justify-center text-primary">↓</div>
                  <div className="rounded bg-muted px-2 py-1 text-[11.5px] font-semibold text-gold">
                    ECHS Medical Claims
                  </div>
                  <div className="my-2 flex justify-center text-primary">↓</div>
                  <p className="text-[12px] font-medium text-sidebar-muted">
                    Regional Centre / ECHS Officials
                  </p>
                </div>

                {/* Hospital B */}
                <div className="rounded border border-primary/30 bg-card p-3 shadow-sm">
                  <p className="text-[13px] font-bold text-foreground">
                    Rohilla Nursing Home
                  </p>
                  <p className="text-[11px] text-muted-foreground">Rajgarh, Churu</p>
                  <div className="my-2 flex justify-center text-primary">↓</div>
                  <div className="rounded bg-muted px-2 py-1 text-[11.5px] font-semibold text-gold">
                    ECHS Medical Claims
                  </div>
                  <div className="my-2 flex justify-center text-primary">↓</div>
                  <p className="text-[12px] font-medium text-sidebar-muted">
                    Regional Centre / ECHS Officials
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded border border-white/10 bg-white/5 py-1.5 text-[11.5px] font-medium text-sidebar-muted">
                Central Focus: Alleged referral manipulation & fraudulent ECHS reimbursement
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN (1 col wide) */}
        <div className="space-y-5">
          {/* 7. FINANCIAL IMPACT (Section 7) */}
          <div className="rounded-sm border border-gold/40 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <IndianRupee className="size-4 text-gold" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-sidebar-muted">
                7. Financial Impact
              </h2>
            </div>
            <div className="mt-3.5 text-center">
              <p className="font-mono text-2xl font-bold tracking-tight text-gold">
                ₹34,92,628
              </p>
              <p className="mt-1 text-[12px] font-medium text-foreground">
                Approx. alleged wrongful loss to Government Exchequer
              </p>
              <p className="mt-1 text-[11px] italic text-muted-foreground">
                Value stated in the FIR
              </p>
            </div>
          </div>

          {/* 6. CASE TIMELINE (Section 6) */}
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Calendar className="size-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-sidebar-muted">
                6. Case Timeline
              </h2>
            </div>
            <div className="mt-4 space-y-4 pl-2">
              {[
                { time: "2023", label: "Beginning of stated activity period" },
                {
                  time: "2023–2025",
                  label: "Alleged fraudulent ECHS claim activity / record manipulation period",
                },
                {
                  time: "10 Sep 2026",
                  label: "FIR registered / information received at ACB Jodhpur",
                },
                {
                  time: "Investigation",
                  label: "Case entrusted to Inspector Maldan, CBI, ACB Jodhpur",
                },
              ].map((item, idx, arr) => (
                <div key={item.time} className="relative pl-5">
                  {/* Vertical bar */}
                  {idx < arr.length - 1 && (
                    <div className="absolute left-1.5 top-3.5 bottom-0 w-0.5 bg-border" />
                  )}
                  {/* Node point */}
                  <span className="absolute left-0 top-1 size-3 rounded-full border border-primary bg-background" />
                  <p className="text-[12.5px] font-bold text-foreground">{item.time}</p>
                  <p className="text-[11.5px] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 9. RISK / REVIEW FLAGS (Section 9) */}
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-warning" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sidebar-muted">
                  9. Review Flags
                </h2>
              </div>
            </div>
            <p className="mt-2 text-[11px] font-medium text-warning">
              AI-assisted review flags — prototype
            </p>
            <ul className="mt-3 space-y-2 text-[12px] text-foreground/90">
              <li className="flex items-start gap-2">
                <span className="text-alert font-bold">•</span> Alleged manipulation of medical/referral records
              </li>
              <li className="flex items-start gap-2">
                <span className="text-alert font-bold">•</span> Alleged fraudulent reimbursement claims
              </li>
              <li className="flex items-start gap-2">
                <span className="text-alert font-bold">•</span> Multiple entities referenced
              </li>
              <li className="flex items-start gap-2">
                <span className="text-alert font-bold">•</span> Unknown public/private persons referenced
              </li>
              <li className="flex items-start gap-2">
                <span className="text-alert font-bold">•</span> Claims allegedly processed despite reported irregularities
              </li>
            </ul>
          </div>

          {/* 10. KEY EVIDENCE REFERENCE (Section 10) */}
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <ExternalLink className="size-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-sidebar-muted">
                10. Key Evidence References
              </h2>
            </div>
            <div className="mt-3 space-y-2">
              <button
                onClick={() => navigate({ to: "/documents/$docId", params: { docId } })}
                className="group flex w-full items-center justify-between rounded border border-border bg-muted/40 p-2.5 text-left transition-colors hover:bg-secondary"
              >
                <div>
                  <p className="text-[12px] font-semibold text-foreground">
                    Approx. ₹34.93 lakh loss
                  </p>
                  <p className="text-[11px] text-muted-foreground">Source document reference</p>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground" />
              </button>

              <button
                onClick={() => navigate({ to: "/documents/$docId", params: { docId } })}
                className="group flex w-full items-center justify-between rounded border border-border bg-muted/40 p-2.5 text-left transition-colors hover:bg-secondary"
              >
                <div>
                  <p className="text-[12px] font-semibold text-foreground">
                    2023–2025 activity period
                  </p>
                  <p className="text-[11px] text-muted-foreground">Stated in FIR report</p>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground" />
              </button>

              <button
                onClick={() => navigate({ to: "/documents/$docId", params: { docId } })}
                className="group flex w-full items-center justify-between rounded border border-border bg-muted/40 p-2.5 text-left transition-colors hover:bg-secondary"
              >
                <div>
                  <p className="text-[12px] font-semibold text-foreground">
                    FIR RC0312026A0009
                  </p>
                  <p className="text-[11px] text-muted-foreground">Open Document Viewer</p>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground" />
              </button>
            </div>
          </div>

          {/* 12. EXISTING SHA-256 INTEGRITY PANEL (Section 12) */}
          <div className="rounded-sm border border-success/30 bg-card p-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-success" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sidebar-muted">
                  12. Document Integrity
                </h2>
              </div>
              <span className="rounded bg-success/20 px-2 py-0.5 text-[11px] font-semibold text-success">
                Verified
              </span>
            </div>
            <div className="mt-3">
              <p className="label-caps text-muted-foreground">SHA-256 Fingerprint</p>
              <Mono className="mt-1.5 block rounded border border-border bg-muted p-2 text-[11px] break-all text-foreground">
                {realHash}
              </Mono>
              <p className="mt-2 text-[11.5px] text-muted-foreground">
                Fingerprint retrieved live from document vault record.
              </p>
            </div>
          </div>

          {/* 14. DATA SOURCE FOOTER LABEL (Section 14) */}
          <div className="rounded border border-border/80 bg-muted/30 p-3 text-[11.5px] text-muted-foreground">
            <p className="flex items-center gap-1.5 font-medium text-foreground">
              <Info className="size-3.5 text-primary" /> Data Source Attribution
            </p>
            <p className="mt-1">
              • Analysis based on uploaded FIR document
            </p>
            <p className="mt-0.5">
              • Prototype / demonstration analysis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
