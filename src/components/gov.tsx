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
