import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Emblem, WavingFlag, ArchitectureSilhouette } from "@/components/gov";
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
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ background: "#06152B" }}
    >
      {/* ── Layer 1: Deep navy base + subtle technical grid ──────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Scrolling grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(140,180,255,0.7) 1px, transparent 1px), linear-gradient(to bottom, rgba(140,180,255,0.7) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        {/* Central atmospheric blue glow */}
        <div
          className="login-atmos absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 52% 38%, rgba(20,60,140,0.38) 0%, transparent 75%)",
          }}
        />
        {/* Top-left warm daylight from flag direction */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 55% at 8% 30%, rgba(255,140,30,0.07) 0%, transparent 60%)",
          }}
        />
        {/* Soft vignette edges */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 45%, rgba(2,8,20,0.75) 100%)",
          }}
        />
      </div>

      {/* ── Layer 2: Indian flag — left hero element ─────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="login-flag-wrap absolute"
          style={{
            top: "2%",
            left: "1%",
            width: "clamp(240px, 34vw, 510px)",
            height: "auto",
            // Radial mask: flag fades smoothly into the navy at every edge
            maskImage:
              "radial-gradient(ellipse 80% 88% at 34% 44%, black 38%, rgba(0,0,0,0.6) 62%, transparent 88%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 88% at 34% 44%, black 38%, rgba(0,0,0,0.6) 62%, transparent 88%)",
          }}
        >
          <WavingFlag className="w-full opacity-[0.82]" />
        </div>
      </div>

      {/* ── Layer 3: Architecture silhouette — right atmospheric element ─── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        <div
          className="absolute"
          style={{
            bottom: "5%",
            right: "-2%",
            width: "clamp(280px, 34vw, 500px)",
            opacity: 0.055,
            maskImage: "linear-gradient(to left, black 30%, transparent 90%)",
            WebkitMaskImage: "linear-gradient(to left, black 30%, transparent 90%)",
          }}
        >
          <ArchitectureSilhouette className="w-full" />
        </div>
      </div>

      {/* ── LEFT sidebar text — Justice / Integrity / Security ──────────── */}
      <div
        className="pointer-events-none absolute hidden xl:flex flex-col gap-1.5"
        style={{ bottom: "18%", left: "3.5%" }}
      >
        <p
          className="text-[11px] font-semibold tracking-[0.25em] uppercase"
          style={{ color: "rgba(160,185,220,0.48)" }}
        >
          Justice
        </p>
        <p
          className="text-[11px] font-semibold tracking-[0.25em] uppercase"
          style={{ color: "rgba(160,185,220,0.48)" }}
        >
          Integrity
        </p>
        <p
          className="text-[11px] font-semibold tracking-[0.25em] uppercase"
          style={{ color: "rgba(160,185,220,0.48)" }}
        >
          Security
        </p>
        <p
          className="mt-1 text-[10px] font-medium tracking-[0.18em] uppercase"
          style={{ color: "rgba(120,150,195,0.34)" }}
        >
          For a Stronger
        </p>
        <p
          className="text-[10px] font-medium tracking-[0.18em] uppercase"
          style={{ color: "rgba(120,150,195,0.34)" }}
        >
          Tomorrow
        </p>
        {/* Tricolour accent line */}
        <div className="mt-2.5 flex gap-0 overflow-hidden rounded-full" style={{ width: 42, height: 2.5 }}>
          <div style={{ flex: 1, background: "#FF9933" }} />
          <div style={{ flex: 1, background: "#F5F7FA" }} />
          <div style={{ flex: 1, background: "#138808" }} />
        </div>
      </div>

      {/* ── RIGHT sidebar text — A Safer India Together ──────────────────── */}
      <div
        className="pointer-events-none absolute hidden xl:flex flex-col items-end gap-1"
        style={{ top: "5%", right: "3.5%" }}
      >
        <p
          className="text-[9px] font-semibold tracking-[0.22em] uppercase text-right"
          style={{ color: "rgba(160,185,220,0.4)" }}
        >
          A Safer
        </p>
        <p
          className="text-[9px] font-semibold tracking-[0.22em] uppercase text-right"
          style={{ color: "rgba(160,185,220,0.4)" }}
        >
          India
        </p>
        <p
          className="text-[9px] font-semibold tracking-[0.22em] uppercase text-right"
          style={{ color: "rgba(160,185,220,0.4)" }}
        >
          Together
        </p>
        {/* Vertical tricolour accent */}
        <div
          className="mt-2 flex flex-col rounded-full overflow-hidden"
          style={{ width: 2.5, height: 30 }}
        >
          <div style={{ flex: 1, background: "#FF9933" }} />
          <div style={{ flex: 1, background: "#F5F7FA" }} />
          <div style={{ flex: 1, background: "#138808" }} />
        </div>
      </div>

      {/* ── MAIN content column ──────────────────────────────────────────── */}
      <main className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 pt-8 pb-6 text-center">

        {/* Ashoka emblem + motto */}
        <div className="login-hero flex flex-col items-center">
          <Emblem
            className="size-20 drop-shadow-[0_0_22px_rgba(210,170,60,0.35)]"
            style={{ color: "#D4A930" }}
          />
          <p
            className="mt-2 text-[13px] font-semibold tracking-[0.32em] uppercase"
            style={{ color: "rgba(212,169,48,0.68)" }}
          >
            सत्यमेव जयते
          </p>
        </div>

        {/* Wordmark */}
        <div className="login-hero">
          <h1
            className="mt-5 font-display text-[56px] font-semibold tracking-tight sm:text-[64px] leading-none"
            style={{ color: "#EEF2F8" }}
          >
            CaseVault{" "}
            <span
              style={{
                color: "#5B9BF0",
                textShadow: "0 0 32px rgba(80,140,240,0.40)",
              }}
            >
              AI
            </span>
          </h1>

          {/* Tagline */}
          <p
            className="mt-3.5 text-[18px] font-medium tracking-wide"
            style={{ color: "rgba(200,215,240,0.88)" }}
          >
            Secure. Transparent. Trusted.
          </p>

          {/* Tricolour accent strip */}
          <div className="mt-3.5 flex justify-center">
            <div className="flex overflow-hidden rounded-full" style={{ width: 64, height: 3 }}>
              <div style={{ flex: 1, background: "#FF9933" }} />
              <div style={{ flex: 1, background: "#E8EDF5" }} />
              <div style={{ flex: 1, background: "#138808" }} />
            </div>
          </div>

          {/* Government context */}
          <p
            className="mt-5 text-[15px] font-normal tracking-wide leading-relaxed"
            style={{ color: "rgba(160,185,220,0.70)" }}
          >
            Digital Case Management for a Safer Tomorrow
          </p>
          <p
            className="mt-2 text-[14px] leading-relaxed"
            style={{ color: "rgba(130,160,200,0.55)" }}
          >
            Ministry of Home Affairs{" "}
            <span style={{ opacity: 0.5 }}>|</span>{" "}
            Government of India
          </p>
          <p
            className="mt-1 text-[12.5px] tracking-wide"
            style={{ color: "rgba(110,140,185,0.40)" }}
          >
            (SIH 2026 Prototype)
          </p>
        </div>

        {/* ── Role selection cards ─────────────────────────────────────── */}
        <div className="login-cards mt-10 grid w-full max-w-[660px] gap-5 sm:grid-cols-2">

          {/* Police Officer card */}
          <button
            id="role-police-officer"
            onClick={() => selectRole("POLICE_OFFICER")}
            className="group relative flex flex-col items-center overflow-hidden px-9 py-10 text-center transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none"
            style={{
              background: "linear-gradient(155deg, rgba(18,44,98,0.92) 0%, rgba(10,28,68,0.96) 100%)",
              border: "1px solid rgba(70,110,200,0.32)",
              borderRadius: 8,
              boxShadow: "0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(100,150,255,0.08)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(100,150,240,0.62)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 8px 40px rgba(0,0,0,0.45), 0 0 20px rgba(60,110,220,0.12), inset 0 1px 0 rgba(100,150,255,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(70,110,200,0.32)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(100,150,255,0.08)";
            }}
          >
            {/* Subtle inner top glow */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{ background: "linear-gradient(to right, transparent, rgba(120,170,255,0.25), transparent)" }}
            />

            {/* Police badge icon */}
            <div
              className="flex items-center justify-center"
              style={{
                width: 62,
                height: 62,
                marginBottom: 16,
              }}
            >
              <svg viewBox="0 0 48 48" width="62" height="62" fill="none">
                {/* Shield body */}
                <path
                  d="M24 4 L40 10 V24 C40 33.5 33 40.5 24 44 C15 40.5 8 33.5 8 24 V10 Z"
                  fill="rgba(70,120,230,0.18)"
                  stroke="rgba(110,160,255,0.55)"
                  strokeWidth="1.5"
                />
                {/* Star badge */}
                <path
                  d="M24 15 L25.8 20.5 H31.5 L26.9 23.8 L28.6 29.3 L24 26 L19.4 29.3 L21.1 23.8 L16.5 20.5 H22.2 Z"
                  fill="rgba(160,200,255,0.75)"
                />
              </svg>
            </div>

            <span
              className="text-[13px] font-medium tracking-[0.12em] uppercase"
              style={{ color: "rgba(140,175,230,0.65)" }}
            >
              Login as
            </span>
            <span
              className="mt-1.5 block text-[24px] font-semibold tracking-tight"
              style={{ color: "#D8E8FF" }}
            >
              Police Officer
            </span>
            <span
              className="mt-2 block text-[14px]"
              style={{ color: "rgba(140,175,230,0.58)" }}
            >
              {DEMO_ROLES.POLICE_OFFICER.tagline}
            </span>

            {/* Arrow button */}
            <div
              className="mt-6 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "1px solid rgba(100,150,240,0.35)",
                background: "rgba(60,100,200,0.12)",
              }}
            >
              <ArrowRight
                style={{ width: 15, height: 15, color: "rgba(160,200,255,0.80)" }}
                strokeWidth={2}
              />
            </div>
          </button>

          {/* Forensic Officer card */}
          <button
            id="role-forensic-officer"
            onClick={() => selectRole("FORENSIC_OFFICER")}
            className="group relative flex flex-col items-center overflow-hidden px-9 py-10 text-center transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none"
            style={{
              background: "linear-gradient(155deg, rgba(10,46,30,0.92) 0%, rgba(6,32,20,0.96) 100%)",
              border: "1px solid rgba(40,120,75,0.32)",
              borderRadius: 8,
              boxShadow: "0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(60,180,100,0.06)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(60,170,100,0.60)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 8px 40px rgba(0,0,0,0.45), 0 0 20px rgba(30,120,60,0.12), inset 0 1px 0 rgba(60,180,100,0.10)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(40,120,75,0.32)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(60,180,100,0.06)";
            }}
          >
            {/* Subtle inner top glow */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{ background: "linear-gradient(to right, transparent, rgba(60,180,100,0.20), transparent)" }}
            />

            {/* Forensic flask icon */}
            <div
              className="flex items-center justify-center"
              style={{
                width: 62,
                height: 62,
                marginBottom: 16,
              }}
            >
              <svg viewBox="0 0 48 48" width="62" height="62" fill="none">
                {/* Flask body */}
                <path
                  d="M19 8 H29 V22 L38 38 C38 40 36.5 42 34 42 H14 C11.5 42 10 40 10 38 L19 22 Z"
                  fill="rgba(30,120,60,0.20)"
                  stroke="rgba(60,180,100,0.55)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {/* Flask neck */}
                <rect x="18" y="6" width="12" height="4" rx="2" fill="rgba(60,180,100,0.30)" stroke="rgba(60,180,100,0.50)" strokeWidth="1" />
                {/* Liquid level */}
                <path
                  d="M13 34 L35 34 C35 37 33 40 30 40 H18 C15 40 13 37 13 34 Z"
                  fill="rgba(40,160,80,0.35)"
                />
                {/* Bubble */}
                <circle cx="20" cy="36" r="2" fill="rgba(80,210,120,0.35)" />
                <circle cx="28" cy="37.5" r="1.4" fill="rgba(80,210,120,0.25)" />
              </svg>
            </div>

            <span
              className="text-[13px] font-medium tracking-[0.12em] uppercase"
              style={{ color: "rgba(100,175,130,0.65)" }}
            >
              Login as
            </span>
            <span
              className="mt-1.5 block text-[24px] font-semibold tracking-tight"
              style={{ color: "#C8EDD8" }}
            >
              Forensic Officer
            </span>
            <span
              className="mt-2 block text-[14px]"
              style={{ color: "rgba(100,175,130,0.58)" }}
            >
              {DEMO_ROLES.FORENSIC_OFFICER.tagline}
            </span>

            {/* Arrow button */}
            <div
              className="mt-6 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "1px solid rgba(60,160,90,0.35)",
                background: "rgba(20,100,50,0.14)",
              }}
            >
              <ArrowRight
                style={{ width: 15, height: 15, color: "rgba(120,210,150,0.80)" }}
                strokeWidth={2}
              />
            </div>
          </button>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer
        className="relative z-10"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(0,0,0,0.22)",
          backdropFilter: "blur(2px)",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          {/* Left: Emblem + Ministry */}
          <span className="inline-flex items-center gap-2.5">
            <Emblem
              className="size-8 shrink-0"
              style={{ color: "#C8A030" }}
            />
            <span className="flex flex-col leading-tight">
              <span
                className="text-[13px] font-semibold"
                style={{ color: "rgba(200,220,255,0.72)" }}
              >
                Ministry of Home Affairs
              </span>
              <span
                className="text-[12px]"
                style={{ color: "rgba(150,180,220,0.48)" }}
              >
                Government of India
              </span>
            </span>
          </span>

          {/* Center: Disclaimer */}
          <span
            className="text-center text-[12.5px]"
            style={{ color: "rgba(130,160,205,0.42)" }}
          >
            Demo role selection — not authentication. Prototype data only.
          </span>

          {/* Right: Tech mission + tricolour */}
          <span className="inline-flex items-center gap-2.5">
            <span
              className="text-[12.5px] text-right"
              style={{ color: "rgba(130,160,205,0.42)" }}
            >
              Technology for a Safer, More Just India
            </span>
            {/* Vertical tricolour accent */}
            <div
              className="flex flex-col overflow-hidden rounded-full shrink-0"
              style={{ width: 2.5, height: 26 }}
            >
              <div style={{ flex: 1, background: "#FF9933" }} />
              <div style={{ flex: 1, background: "#E8EDF5" }} />
              <div style={{ flex: 1, background: "#138808" }} />
            </div>
          </span>
        </div>
      </footer>
    </div>
  );
}
