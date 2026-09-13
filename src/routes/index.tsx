import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Shield } from "lucide-react";
import { FlaskConical } from "lucide-react";
import { BrandMark } from "@/components/BrandLogo";
import { Emblem, WavingFlag, ParliamentHint } from "@/components/gov";
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

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      {/* --- Backdrop: colonnade + darkening washes (flag paints above these) --- */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <ParliamentHint className="absolute right-[-4%] bottom-[8%] w-[46vw] min-w-[420px] opacity-[0.05]" />
        <div className="absolute inset-0 bg-sidebar/55" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 75% at 50% 38%, transparent 30%, oklch(0.16 0.04 262 / 0.55) 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.95 0.01 250 / 0.6) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.95 0.01 250 / 0.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      {/* --- Flag layer: ABOVE the washes so the cloth is clearly visible;
           radial mask fades every edge into the navy (no rectangle boundary) --- */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-[8%] left-0 w-[28vw] min-w-[250px] max-w-[410px]"
          style={
            {
              maskImage:
                "radial-gradient(ellipse 95% 90% at 40% 42%, black 52%, transparent 96%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 95% 90% at 40% 42%, black 52%, transparent 96%)",
            } as React.CSSProperties
          }
        >
          <WavingFlag className="w-full opacity-90" />
        </div>
      </div>

      {/* --- Centered hero + role selection --- */}
      <main className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 py-12 text-center">
        {/* Emblem with motto */}
        <div className="flex flex-col items-center">
          <Emblem className="size-14 text-white/90" />
          <p className="mt-1 text-[10px] font-semibold tracking-[0.3em] text-white/55 uppercase">
            सत्यमेव जयते
          </p>
        </div>

        {/* Wordmark */}
        <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight sm:text-[42px]">
          CaseVault <span className="text-[#8FBAF6]">AI</span>
        </h1>
        <p className="mt-2 text-[15px] font-medium text-white/85">Secure. Transparent. Trusted.</p>

        <p className="mt-4 text-[13.5px] leading-relaxed text-white/60">
          Digital Case Management for a Safer Tomorrow
          <span className="mx-2 opacity-40">·</span>
          Ministry of Home Affairs <span className="mx-1 opacity-40">|</span> Government of India
          <span className="mt-0.5 block text-[11.5px] text-white/40">(SIH 2026 prototype)</span>
        </p>

        {/* Role cards — police blue / forensic green */}
        <div className="mt-9 grid w-full max-w-xl gap-5 sm:grid-cols-2">
          {/* Police */}
          <button
            onClick={() => selectRole("POLICE_OFFICER")}
            className="group flex flex-col items-center rounded-md border border-[#4F7FD4]/50 bg-[#1D4FA8]/85 px-6 py-7 shadow-[0_18px_40px_-18px_oklch(0.2_0.08_260/0.8)] transition-all hover:-translate-y-0.5 hover:border-[#6D9BE8] hover:bg-[#2159B8]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FBAF6]/70"
          >
            <Emblem className="size-10 text-white/85" />
            <span className="mt-3 text-[14px] font-medium text-white/80">Login as</span>
            <span className="text-[17px] font-semibold text-white">Police Officer</span>
            <span className="mt-1 text-[12.5px] text-white/70">
              {DEMO_ROLES.POLICE_OFFICER.tagline}
            </span>
            <span className="mt-4 flex size-7 items-center justify-center rounded-full border border-white/25 bg-white/10 transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="size-3.5 text-white" />
            </span>
          </button>

          {/* Forensic */}
          <button
            onClick={() => selectRole("FORENSIC_OFFICER")}
            className="group flex flex-col items-center rounded-md border border-[#3F8A5A]/60 bg-[#14503A]/85 px-6 py-7 shadow-[0_18px_40px_-18px_oklch(0.15_0.06_160/0.8)] transition-all hover:-translate-y-0.5 hover:border-[#54A872] hover:bg-[#185C43]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FC492]/70"
          >
            <FlaskConical className="size-10 text-white/85" strokeWidth={1.5} />
            <span className="mt-3 text-[14px] font-medium text-white/80">Login as</span>
            <span className="text-[17px] font-semibold text-white">Forensic Officer</span>
            <span className="mt-1 text-[12.5px] text-white/70">
              {DEMO_ROLES.FORENSIC_OFFICER.tagline}
            </span>
            <span className="mt-4 flex size-7 items-center justify-center rounded-full border border-white/25 bg-white/10 transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="size-3.5 text-white" />
            </span>
          </button>
        </div>

        <p className="mt-6 text-[11px] text-white/40">
          Demo role selection — not authentication. Prototype data only.
        </p>
      </main>

      {/* --- Bottom government bar --- */}
      <footer className="relative border-t border-white/10 bg-black/25 backdrop-blur-[2px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-[11.5px] text-white/70">
          <span className="inline-flex items-center gap-2">
            <Emblem className="size-3.5 text-white/70" />
            <span className="font-semibold">Government of India</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="tricolour-bar h-[3px] w-7 rounded-full opacity-90" />
            <span>Nation First</span>
            <span className="opacity-40">|</span>
            <Shield className="size-3" />
            <span>Justice for All</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
