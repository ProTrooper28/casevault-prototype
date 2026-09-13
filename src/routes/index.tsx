import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Fingerprint, ShieldCheck, Shield, Lock, FileSearch } from "lucide-react";
import { BrandMark } from "@/components/BrandLogo";
import { Emblem, FlagChip, Chakra } from "@/components/gov";
import { Badge } from "@/components/kit";
import { DEMO_ROLES, signInAsRole, type DemoRole } from "@/lib/app-state";

export const Route = createFileRoute("/")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();

  function selectRole(role: DemoRole) {
    signInAsRole(role);
    navigate({ to: "/dashboard" });
  }

  const roleIcons = { POLICE_OFFICER: Shield, FORENSIC_OFFICER: FileSearch } as const;
  const roleCards: {
    role: DemoRole;
    panel: string;
  }[] = [
    { role: "POLICE_OFFICER", panel: "border-sidebar-border bg-sidebar/[0.97]" },
    { role: "FORENSIC_OFFICER", panel: "border-sidebar-border bg-sidebar/[0.97]" },
  ];

  return (
    <div className="relative flex min-h-screen flex-col bg-sidebar text-sidebar-foreground">
      {/* Subtle national visual — tricolour wash top, chakra watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-[0.14]"
        style={{
          background:
            "linear-gradient(to bottom, var(--color-saffron) 0%, transparent 55%), linear-gradient(to bottom, var(--color-india-green) 0%, transparent 85%)",
          backgroundSize: "100% 100%, 100% 100%",
          backgroundPosition: "left top, right top",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.95 0.01 250 / 0.6) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.95 0.01 250 / 0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Top government strip */}
      <div className="relative border-b border-sidebar-border/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2.5 text-[11px] tracking-wide text-sidebar-muted">
          <span className="inline-flex items-center gap-2">
            <Emblem className="size-4 text-gold" />
            <span className="font-semibold tracking-[0.14em] uppercase">
              Government of India style demo
            </span>
          </span>
          <span className="hidden items-center gap-2 sm:inline-flex">
            <FlagChip />
            <span className="tracking-[0.1em] uppercase">
              Ministry of Home Affairs · NCRB problem statement
            </span>
          </span>
        </div>
      </div>

      {/* Hero + role selection */}
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-sm bg-white p-2 shadow-md">
            <BrandMark className="size-full" />
          </span>
          <h1 className="font-display mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            CaseVault <span className="text-[#7FB0F0]">AI</span>
          </h1>
          <p className="mt-2 text-[15px] font-medium text-sidebar-foreground/90">
            Secure. Transparent. Trusted.
          </p>
          <p className="mt-3 max-w-md text-[13px] leading-relaxed text-sidebar-muted">
            Digital case management for a safer tomorrow — an SIH 2026 prototype for the
            Ministry of Home Affairs / NCRB problem statement.
          </p>
        </div>

        {/* Two premium role cards */}
        <div className="mt-9 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          {roleCards.map(({ role, panel }) => {
            const demo = DEMO_ROLES[role];
            const Icon = roleIcons[role];
            return (
              <button
                key={role}
                onClick={() => selectRole(role)}
                className={cnRoleCard(panel)}
              >
                <span className="flex size-11 items-center justify-center rounded-sm border border-white/15 bg-white/10 text-[#9CC4F5]">
                  <Icon className="size-5" />
                </span>
                <span className="mt-3 block text-[15px] font-semibold text-sidebar-foreground">
                  Login as
                  <span className="block text-[16px]">
                    {role === "POLICE_OFFICER" ? "Police Officer" : "Forensic Officer"}
                  </span>
                </span>
                <span className="mt-1 block text-[12.5px] leading-snug text-sidebar-muted">
                  {demo.tagline}
                </span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#9CC4F5]">
                  Continue <ArrowRight className="size-3.5" />
                </span>
              </button>
            );
          })}
        </div>

        {/* Capability strip */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-sidebar-muted">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5 text-gold" /> SHA-256 tamper evidence
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileSearch className="size-3.5 text-gold" /> AI document pipeline
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-gold" /> Chain of custody
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Chakra className="size-3.5 text-gold" /> Append-only audit trail
          </span>
        </div>

        <Badge tone="gold" className="mt-7 border-white/20 bg-white/10 text-sidebar-muted">
          SIH 2026 Prototype
        </Badge>
      </main>

      {/* Government footer */}
      <footer className="relative border-t border-sidebar-border/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-3 text-[11px] text-sidebar-muted">
          <span className="inline-flex items-center gap-2">
            <Emblem className="size-3.5 text-gold" />
            <span className="font-semibold tracking-[0.1em] uppercase">Government of India</span>
            <span className="opacity-60">/ Ministry of Home Affairs · NCRB (demo)</span>
          </span>
          <span>Demo role selection — not authentication. Prototype data only.</span>
        </div>
        <div aria-hidden className="tricolour-bar h-[3px] w-full opacity-90" />
      </footer>
    </div>
  );
}

/** Shared card treatment — premium navy panel, restrained hover. */
function cnRoleCard(extra: string) {
  return [
    "group flex flex-col rounded-sm border p-5 text-left transition-colors",
    "hover:border-[#4F7FD4]/60 hover:bg-sidebar-active/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FB0F0]/60",
    extra,
  ].join(" ");
}
