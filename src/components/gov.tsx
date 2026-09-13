import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Government visual identity — used as a restrained institutional accent.   */
/*  CaseVault AI is a prototype built for the SIH 2026 MHA/NCRB problem       */
/*  statement; it is NOT an official Government of India application.         */
/* -------------------------------------------------------------------------- */

/**
 * Simplified Ashoka Lion Capital (state emblem style) — a dignified vector
 * interpretation: four-lion capital suggestion over the abacus with the
 * "सत्यमेव जयते" motto position, in gold. Deliberately abstract; not a
 * reproduction of the official emblem.
 */
export function Emblem({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Ashoka emblem (stylised)"
      className={cn("shrink-0", className)}
    >
      <g fill="currentColor">
        {/* Capital: abacus base */}
        <path d="M14 52h36v3.5a1.5 1.5 0 0 1-1.5 1.5h-33A1.5 1.5 0 0 1 14 55.5Z" />
        <path d="M17 47h30v3.6H17z" />
        <path d="M20 43.5h24v2.6H20z" />
        {/* Lion figures (stylised silhouette group) */}
        <path d="M32 8c-6.6 0-12 2.3-12 2.3l1.7 4.4s2.3-1 4.2-1.4c-.4 3.4-1.6 7.6-4.4 10.9-2.9 3.4-6.4 5-6.4 5l2.5 4.6s3.9-2.2 7-5.7c.9-1 1.7-2.1 2.4-3.3V38h9.9V24.7c.7 1.2 1.5 2.3 2.4 3.3 3.1 3.5 7 5.7 7 5.7l2.5-4.6s-3.5-1.6-6.4-5c-2.8-3.3-4-7.5-4.4-10.9 1.9.4 4.2 1.4 4.2 1.4L44 10.3S38.6 8 32 8Z" />
        {/* Center head hint */}
        <circle cx="32" cy="15.5" r="3.2" />
      </g>
    </svg>
  );
}

/** 24-spoke Ashoka Chakra — the wheel from the national flag, navy. */
export function Chakra({ className }: { className?: string }) {
  const spokes = Array.from({ length: 24 }, (_, i) => (i * 360) / 24);
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Ashoka Chakra" className={cn("shrink-0", className)}>
      <circle cx="12" cy="12" r="10.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      {spokes.map((deg) => (
        <line
          key={deg}
          x1="12"
          y1="12"
          x2="12"
          y2="2.4"
          stroke="currentColor"
          strokeWidth="0.9"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}

/** Small Indian national flag chip (restrained accent, not decoration spam). */
export function FlagChip({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Flag of India"
      className={cn(
        "inline-flex h-[13px] w-[19.5px] shrink-0 flex-col overflow-hidden rounded-[1px] ring-1 ring-black/15",
        className,
      )}
    >
      <span className="h-1/3 w-full" style={{ background: "var(--color-saffron)" }} />
      <span className="relative h-1/3 w-full bg-white">
        <Chakra className="absolute top-1/2 left-1/2 size-[9px] -translate-x-1/2 -translate-y-1/2 text-[oklch(0.35_0.12_260)]" />
      </span>
      <span className="h-1/3 w-full" style={{ background: "var(--color-india-green)" }} />
    </span>
  );
}

/**
 * Restrained government page banner — navy field, emblem, title and problem
 * statement line. Editorial, not decorative: no gradients beyond the flat
 * navy, no illustrations.
 */
export function GovBanner({
  title,
  subtitle,
  aside,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-sm border border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.95 0.01 250 / 0.6) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.95 0.01 250 / 0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <Emblem className="mt-0.5 size-9 text-gold" />
          <div className="min-w-0">
            <h2 className="text-[17px] leading-snug font-semibold tracking-tight">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 max-w-2xl text-[12.5px] leading-relaxed text-sidebar-muted">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      <div aria-hidden className="tricolour-bar h-[3px] w-full" />
    </section>
  );
}

/** Official context line used in footers. */
export function GovFooterLine({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Emblem className="size-3.5 text-gold" />
      <span>
        Smart India Hackathon 2026 · Ministry of Home Affairs / NCRB problem statement — prototype,
        not an official Government of India application
      </span>
    </span>
  );
}

/**
 * Waving Indian tricolour — premium cloth treatment for dark hero backdrops.
 * The fabric is a flying flag: band edges follow a real wave function sampled
 * into smooth curved paths (not a bent rectangle), with travelling fold
 * shadows, a soft daylight sheen and a centred 24-spoke Chakra riding the
 * wave. Static and lightweight; fade/blend is handled by the caller via CSS
 * mask so edges never read as a pasted rectangle.
 */
export function WavingFlag({ className }: { className?: string }) {
  const spokes = Array.from({ length: 24 }, (_, i) => (i * 360) / 24);

  // --- Fabric geometry (3:2 flag, three equal bands along one wave) ---
  const X0 = 20;
  const X1 = 252;
  const FLAG_W = X1 - X0;
  const BH = 150 / 3; // band height for a 150 tall flag

  /** Top edge of the fabric — two superposed gentle waves. */
  const topY = (x: number) =>
    40 +
    13 * Math.sin(((x - X0) / FLAG_W) * Math.PI * 1.15) +
    5 * Math.sin(((x - X0) / FLAG_W) * Math.PI * 2.6 + 0.8);
  const edgeY = (k: number) => (x: number) => topY(x) + k * BH;

  /** Closed path for band k → k+1 following the wave. */
  const bandPath = (k: number): string => {
    const steps = 28;
    const d: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = X0 + (FLAG_W * i) / steps;
      d.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${edgeY(k)(x).toFixed(1)}`);
    }
    for (let i = steps; i >= 0; i--) {
      const x = X0 + (FLAG_W * i) / steps;
      d.push(`L${x.toFixed(1)} ${edgeY(k + 1)(x).toFixed(1)}`);
    }
    return `${d.join(" ")} Z`;
  };

  const bandColors = ["#FF9933", "#F7F9FC", "#138808"];

  // Chakra rides the centre of the white band.
  const chakraX = (X0 + X1) / 2;
  const chakraY = topY(chakraX) + BH * 1.5;

  return (
    <svg
      viewBox="0 0 300 240"
      role="img"
      aria-label="Flag of India"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="wfPole" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E2E7EF" />
          <stop offset="0.5" stopColor="#9AA2B2" />
          <stop offset="1" stopColor="#5F6776" />
        </linearGradient>
        {/* Travelling fold shadows — aligned with the wave crests/troughs */}
        <linearGradient id="wfFolds" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0A1730" stopOpacity="0.24" />
          <stop offset="0.1" stopColor="#0A1730" stopOpacity="0.02" />
          <stop offset="0.26" stopColor="#0A1730" stopOpacity="0.14" />
          <stop offset="0.42" stopColor="#0A1730" stopOpacity="0.02" />
          <stop offset="0.58" stopColor="#0A1730" stopOpacity="0.17" />
          <stop offset="0.74" stopColor="#0A1730" stopOpacity="0.04" />
          <stop offset="0.9" stopColor="#0A1730" stopOpacity="0.2" />
          <stop offset="1" stopColor="#0A1730" stopOpacity="0.1" />
        </linearGradient>
        {/* Soft top-left daylight sheen */}
        <linearGradient id="wfSheen" x1="0" y1="0" x2="0.75" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.2" />
          <stop offset="0.4" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Pole + gold finial */}
      <rect x="9" y="26" width="4.5" height="208" rx="2.25" fill="url(#wfPole)" />
      <circle cx="11.25" cy="19" r="5.2" fill="#D8B64A" />
      <circle cx="11.25" cy="17.8" r="2.1" fill="#F4E09A" />

      {/* Saffron → White → India green, each following the wave */}
      <path d={bandPath(0)} fill={bandColors[0]} />
      <path d={bandPath(1)} fill={bandColors[1]} />
      <path d={bandPath(2)} fill={bandColors[2]} />

      {/* Ashoka Chakra — centred on the white band, riding the wave */}
      <g transform={`translate(${chakraX.toFixed(1)} ${chakraY.toFixed(1)})`}>
        <circle r="20" fill="none" stroke="#26418F" strokeWidth="2.2" />
        <circle r="16.4" fill="none" stroke="#26418F" strokeWidth="0.7" opacity="0.5" />
        <circle r="2.7" fill="#26418F" />
        {spokes.map((deg) => (
          <line
            key={deg}
            x1="0"
            y1="0"
            x2="0"
            y2="-16.2"
            stroke="#26418F"
            strokeWidth="1"
            transform={`rotate(${deg})`}
          />
        ))}
      </g>

      {/* Cloth dimension: fold shadows + sheen clipped to the waved fabric */}
      <path d={bandPath(0)} fill="url(#wfFolds)" />
      <path d={bandPath(1)} fill="url(#wfFolds)" />
      <path d={bandPath(2)} fill="url(#wfFolds)" />
      <path d={bandPath(0)} fill="url(#wfSheen)" />
      <path d={bandPath(1)} fill="url(#wfSheen)" />
      <path d={bandPath(2)} fill="url(#wfSheen)" />
    </svg>
  );
}

/**
 * Faint parliament-style colonnade silhouette — an ambient institutional
 * hint for dark hero backdrops. Render at very low opacity only.
 */
export function ParliamentHint({ className }: { className?: string }) {
  const columns = Array.from({ length: 8 }, (_, i) => 84 + i * 56);
  return (
    <svg
      viewBox="0 0 560 200"
      aria-hidden
      className={cn("pointer-events-none shrink-0", className)}
    >
      <g fill="white">
        <path d="M64 62 L280 16 L496 62 Z" opacity="0.9" />
        <rect x="44" y="66" width="472" height="9" rx="2" />
        {columns.map((x) => (
          <rect key={x} x={x} y="82" width="22" height="106" rx="3" />
        ))}
        <rect x="36" y="194" width="488" height="6" rx="2" />
      </g>
    </svg>
  );
}
