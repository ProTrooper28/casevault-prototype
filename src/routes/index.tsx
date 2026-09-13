import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Fingerprint, ShieldCheck, Shield } from "lucide-react";
import { BrandMark } from "@/components/BrandLogo";
import { Badge, Btn } from "@/components/kit";
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

  const roleIcons = { POLICE_OFFICER: Shield, FORENSIC_OFFICER: ShieldCheck } as const;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand / narrative panel */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.95 0.01 250 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.95 0.01 250 / 0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded bg-white p-1.5 shadow-sm">
            <BrandMark className="size-full" />
          </span>
          <div>
            <p className="text-base font-semibold">
              CaseVault <span className="text-[#7FB0F0]">AI</span>
            </p>
            <p className="text-[11.5px] tracking-wide text-sidebar-muted uppercase">
              NCRB · SIH26190
            </p>
          </div>
        </div>

        <div className="relative">
          <Badge tone="ai" className="mb-4">
            SIH 2026 Prototype
          </Badge>
          <h2 className="max-w-md text-3xl leading-tight font-semibold">
            Tamper-evident case files with an audit trail on every action.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-sidebar-muted">
            CaseVault AI ingests FIRs, forensic reports and evidence records, fingerprints each
            document with SHA-256 and keeps every read, grant and verification on the record.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-sidebar-muted">
            {[
              "AI document pipeline — OCR, classification, entity extraction",
              "Chain-of-custody timeline for every evidence item",
              "Hash-verified integrity with simulated tamper detection",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <Fingerprint className="mt-0.5 size-4 shrink-0 opacity-70" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-sidebar-muted">
          Prototype build · fabricated demo data only · not connected to any real NCRB system
        </p>
      </div>

      {/* Login form */}
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <BrandMark className="size-9" />
            <p className="text-base font-semibold">
              CaseVault <span className="text-[#1E5FBF]">AI</span>
            </p>
          </div>

          <h1 className="text-xl font-semibold">Select your demo role</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Central investigation document vault — demonstration role selection.
          </p>

          <div className="mt-7 space-y-3">
            {(Object.keys(DEMO_ROLES) as DemoRole[]).map((role) => {
              const demo = DEMO_ROLES[role];
              const Icon = roleIcons[role];
              return (
                <button
                  key={role}
                  onClick={() => selectRole(role)}
                  className="flex w-full items-center gap-4 border border-border bg-card px-4 py-4 text-left transition-colors hover:border-primary/40 hover:bg-secondary/60"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center border border-border bg-secondary text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-semibold">Login as {demo.roleLabel}</span>
                    <span className="block text-[12.5px] text-muted-foreground">{demo.tagline}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
          </div>

          <p className="mt-5 border border-border bg-secondary/40 px-3 py-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Demo role selection</span> — no password,
            email or OTP. This is a controlled SIH demonstration selector, not authentication; both
            roles operate on the same prototype vault.
          </p>
        </div>
      </div>
    </div>
  );
}
