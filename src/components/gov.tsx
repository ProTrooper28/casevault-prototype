import type { ReactNode, CSSProperties } from "react";
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
export function Emblem({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Ashoka emblem (stylised)"
      className={cn("shrink-0", className)}
      style={style}
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
 * Cinematic waving Indian tricolour — premium cloth treatment for dark hero backdrops.
 * Large-scale, with dramatic wave, strong fold shadows, daylight sheen,
 * and a centred 24-spoke Chakra riding the wave.
 * Edges fade via CSS mask handled by the caller.
 */
export function WavingFlag({ className }: { className?: string }) {
  const spokes = Array.from({ length: 24 }, (_, i) => (i * 360) / 24);

  // Larger viewBox for more dramatic, cinematic flag
  const VW = 520;
  const VH = 420;

  const X0 = 34;
  const X1 = 480;
  const FLAG_W = X1 - X0;
  // Three equal bands; total flag height ~240
  const BH = 80;

  /** Top edge of the fabric — dramatic compound wave */
  const topY = (x: number) => {
    const t = (x - X0) / FLAG_W;
    return (
      68 +
      28 * Math.sin(t * Math.PI * 1.1) +
      10 * Math.sin(t * Math.PI * 2.4 + 0.7) +
      4 * Math.sin(t * Math.PI * 4.2 + 1.2)
    );
  };

  const edgeY = (k: number) => (x: number) => topY(x) + k * BH;

  /** Smooth cubic bezier path for band k → k+1 */
  const bandPath = (k: number): string => {
    const steps = 48;
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const x = X0 + (FLAG_W * i) / steps;
      pts.push([x, edgeY(k)(x)]);
    }
    // Build top edge (left to right)
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
    }
    // Build bottom edge (right to left)
    const bpts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const x = X0 + (FLAG_W * i) / steps;
      bpts.push([x, edgeY(k + 1)(x)]);
    }
    for (let i = bpts.length - 1; i >= 0; i--) {
      d += ` L${bpts[i][0].toFixed(1)} ${bpts[i][1].toFixed(1)}`;
    }
    return `${d} Z`;
  };

  const bandColors = ["#FF9933", "#F5F7FA", "#138808"];

  // Chakra centred on the white band
  const chakraX = (X0 + X1) / 2;
  const chakraY = topY(chakraX) + BH * 1.5;
  const chakraR = 34;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      role="img"
      aria-label="Flag of India"
      className={cn("shrink-0", className)}
    >
      <defs>
        {/* Pole gradient */}
        <linearGradient id="wfPole" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#D4D9E4" />
          <stop offset="0.4" stopColor="#8A93A6" />
          <stop offset="1" stopColor="#4A5265" />
        </linearGradient>
        {/* Dramatic fold shadows */}
        <linearGradient id="wfFolds" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#061020" stopOpacity="0.42" />
          <stop offset="0.08" stopColor="#061020" stopOpacity="0.04" />
          <stop offset="0.22" stopColor="#061020" stopOpacity="0.24" />
          <stop offset="0.36" stopColor="#061020" stopOpacity="0.03" />
          <stop offset="0.50" stopColor="#061020" stopOpacity="0.30" />
          <stop offset="0.64" stopColor="#061020" stopOpacity="0.05" />
          <stop offset="0.80" stopColor="#061020" stopOpacity="0.22" />
          <stop offset="0.90" stopColor="#061020" stopOpacity="0.04" />
          <stop offset="1"   stopColor="#061020" stopOpacity="0.18" />
        </linearGradient>
        {/* Light sheen from top-left */}
        <linearGradient id="wfSheen" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0"   stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity="0.10" />
          <stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0.03" />
          <stop offset="1"   stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        {/* Saffron inner glow */}
        <linearGradient id="wfSaffronGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFC060" stopOpacity="0.25" />
          <stop offset="1" stopColor="#FF9933" stopOpacity="0" />
        </linearGradient>
        {/* Green inner glow */}
        <linearGradient id="wfGreenGlow" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#44CC44" stopOpacity="0.18" />
          <stop offset="1" stopColor="#138808" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Flagpole shadow */}
      <rect x="14" y="44" width="5" height="360" rx="2.5" fill="#000000" opacity="0.18" />
      {/* Flagpole */}
      <rect x="10" y="40" width="7" height="368" rx="3.5" fill="url(#wfPole)" />
      {/* Gold finial cap */}
      <ellipse cx="13.5" cy="36" rx="7.5" ry="5" fill="#C8A22A" />
      <ellipse cx="13.5" cy="33" rx="4" ry="3.2" fill="#E8CC5A" />
      <ellipse cx="13.5" cy="31" rx="2" ry="1.8" fill="#F8E8A0" />

      {/* Fabric bands */}
      <path d={bandPath(0)} fill={bandColors[0]} />
      <path d={bandPath(1)} fill={bandColors[1]} />
      <path d={bandPath(2)} fill={bandColors[2]} />

      {/* Inner colour glows */}
      <path d={bandPath(0)} fill="url(#wfSaffronGlow)" />
      <path d={bandPath(2)} fill="url(#wfGreenGlow)" />

      {/* Ashoka Chakra — centred on white band */}
      <g transform={`translate(${chakraX.toFixed(1)} ${chakraY.toFixed(1)})`}>
        {/* Outer ring */}
        <circle r={chakraR} fill="none" stroke="#1A3580" strokeWidth="3.5" />
        {/* Inner ring hint */}
        <circle r={chakraR * 0.86} fill="none" stroke="#1A3580" strokeWidth="1.2" opacity="0.45" />
        {/* Hub */}
        <circle r="4.5" fill="#1A3580" />
        {/* 24 spokes */}
        {spokes.map((deg) => (
          <line
            key={deg}
            x1="0"
            y1="0"
            x2="0"
            y2={-(chakraR * 0.83)}
            stroke="#1A3580"
            strokeWidth="1.6"
            transform={`rotate(${deg})`}
          />
        ))}
      </g>

      {/* Fold shadows overlay */}
      <path d={bandPath(0)} fill="url(#wfFolds)" />
      <path d={bandPath(1)} fill="url(#wfFolds)" opacity="0.7" />
      <path d={bandPath(2)} fill="url(#wfFolds)" />

      {/* Top-left daylight sheen */}
      <path d={bandPath(0)} fill="url(#wfSheen)" />
      <path d={bandPath(1)} fill="url(#wfSheen)" opacity="0.6" />
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

/**
 * Detailed Rashtrapati Bhavan / Indian government architectural silhouette
 * for the right-side atmospheric element on the login page.
 */
export function ArchitectureSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 320"
      aria-hidden
      className={cn("pointer-events-none shrink-0", className)}
    >
      <g fill="white" opacity="0.9">
        {/* Central dome */}
        <path d="M190 160 Q210 80 230 160 Z" />
        <ellipse cx="210" cy="160" rx="44" ry="14" />
        {/* Dome lantern */}
        <rect x="203" y="80" width="14" height="30" rx="3" />
        <ellipse cx="210" cy="78" rx="10" ry="6" />
        <rect x="207" y="64" width="6" height="18" rx="2" />
        {/* Drum of dome */}
        <rect x="174" y="156" width="72" height="16" rx="2" />
        <rect x="166" y="168" width="88" height="10" rx="2" />

        {/* Left wing */}
        <rect x="80" y="185" width="88" height="8" rx="2" />
        <rect x="86" y="190" width="76" height="70" rx="2" />
        {/* Left wing colonnade */}
        {[94, 106, 118, 130, 142, 150].map((x) => (
          <rect key={x} x={x} y="198" width="6" height="54" rx="1.5" />
        ))}
        <rect x="80" y="257" width="88" height="5" rx="2" />
        <rect x="76" y="260" width="96" height="7" rx="2" />

        {/* Right wing */}
        <rect x="252" y="185" width="88" height="8" rx="2" />
        <rect x="258" y="190" width="76" height="70" rx="2" />
        {/* Right wing colonnade */}
        {[264, 276, 288, 300, 312, 320].map((x) => (
          <rect key={x} x={x} y="198" width="6" height="54" rx="1.5" />
        ))}
        <rect x="252" y="257" width="88" height="5" rx="2" />
        <rect x="248" y="260" width="96" height="7" rx="2" />

        {/* Central portico */}
        <rect x="176" y="178" width="68" height="10" rx="2" />
        <rect x="180" y="185" width="60" height="80" rx="2" />
        {/* Portico columns */}
        {[186, 198, 210, 222, 232].map((x) => (
          <rect key={x} x={x} y="192" width="5" height="66" rx="1.5" />
        ))}
        <rect x="176" y="262" width="68" height="5" rx="2" />
        <rect x="172" y="265" width="76" height="6" rx="2" />

        {/* Grand steps */}
        <rect x="148" y="270" width="124" height="5" rx="1" />
        <rect x="140" y="274" width="140" height="5" rx="1" />
        <rect x="128" y="278" width="164" height="5" rx="1" />
        <rect x="112" y="282" width="196" height="5" rx="1" />
        <rect x="80" y="286" width="260" height="5" rx="1" />
        <rect x="60" y="290" width="300" height="6" rx="1" />

        {/* Far left extension */}
        <rect x="22" y="220" width="60" height="6" rx="2" />
        <rect x="26" y="224" width="52" height="46" rx="2" />
        {[32, 42, 52, 60, 68].map((x) => (
          <rect key={x} x={x} y="230" width="4" height="34" rx="1" />
        ))}
        <rect x="22" y="268" width="60" height="5" rx="2" />
        <rect x="18" y="272" width="68" height="20" rx="1" />

        {/* Far right extension */}
        <rect x="338" y="220" width="60" height="6" rx="2" />
        <rect x="342" y="224" width="52" height="46" rx="2" />
        {[348, 358, 368, 376, 384].map((x) => (
          <rect key={x} x={x} y="230" width="4" height="34" rx="1" />
        ))}
        <rect x="338" y="268" width="60" height="5" rx="2" />
        <rect x="334" y="272" width="68" height="20" rx="1" />

        {/* Ground line */}
        <rect x="0" y="290" width="420" height="30" rx="0" />
      </g>
    </svg>
  );
}
