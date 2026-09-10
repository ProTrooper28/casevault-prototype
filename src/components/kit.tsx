import { Link, createLink } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { IntegrityStatus } from "@/lib/mock-data";
import { CheckCircle2, Clock, ShieldAlert, Info } from "lucide-react";

/* ---------------------------------- Button --------------------------------- */

type BtnVariant = "primary" | "outline" | "ghost" | "subtle" | "danger" | "ai";
type BtnSize = "sm" | "md";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap";

const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  outline: "border border-border-strong bg-card text-foreground hover:bg-secondary",
  ghost: "text-foreground hover:bg-secondary",
  subtle: "bg-secondary text-secondary-foreground hover:bg-accent",
  danger: "bg-alert text-alert-foreground hover:opacity-90",
  ai: "bg-ai text-ai-foreground hover:opacity-90",
};

const btnSizes: Record<BtnSize, string> = {
  sm: "h-8 px-2.5 text-[13px]",
  md: "h-9 px-3.5",
};

export function Btn({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: BtnVariant; size?: BtnSize }) {
  return (
    <button
      type={props.type ?? "button"}
      className={cn(btnBase, btnVariants[variant], btnSizes[size], className)}
      {...props}
    />
  );
}

/**
 * Router-aware styled link. Built with createLink so `to` / `params` / `search`
 * keep TanStack Router's full type-safety (a plain ComponentProps<typeof Link>
 * wrapper would degrade to AnyRouter and break `params` typing).
 */
export const BtnLink = createLink(function BtnLinkHost({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"a"> & { variant?: BtnVariant; size?: BtnSize }) {
  return <a className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} {...props} />;
});

/* ---------------------------------- Panel ---------------------------------- */

export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-md border border-border bg-card shadow-[0_1px_2px_0_oklch(0.25_0.05_258/0.06)]",
        className,
      )}
    >
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/* --------------------------------- Badges ---------------------------------- */

type Tone = "neutral" | "info" | "success" | "warning" | "alert" | "ai";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground border-border-strong",
  info: "bg-info-soft text-info border-info/25",
  success: "bg-success-soft text-success border-success/25",
  warning: "bg-warning-soft text-warning border-warning/30",
  alert: "bg-alert-soft text-alert border-alert/30",
  ai: "bg-ai-soft text-ai border-ai/25",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function IntegrityBadge({ status }: { status: IntegrityStatus }) {
  if (status === "verified")
    return (
      <Badge tone="success">
        <CheckCircle2 className="size-3" /> Verified
      </Badge>
    );
  if (status === "pending")
    return (
      <Badge tone="warning">
        <Clock className="size-3" /> Pending
      </Badge>
    );
  return (
    <Badge tone="alert">
      <ShieldAlert className="size-3" /> Compromised
    </Badge>
  );
}

export function CaseStatusBadge({ status }: { status: string }) {
  const tone: Tone =
    status === "Active" ? "info" : status === "Under Review" ? "warning" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

/* -------------------------------- Page intro ------------------------------- */

export function PageIntro({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function DemoNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <p>
        {children ??
          "Prototype build — all records, counts and timestamps on this screen are fabricated demo data, not real NCRB or Ministry of Home Affairs records."}
      </p>
    </div>
  );
}

/* ------------------------------- Field / table ------------------------------ */

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="label-caps">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words text-foreground">{value}</dd>
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "label-caps border-b border-border bg-muted/60 px-3 py-2 text-left whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td className={cn("border-b border-border px-3 py-2.5 text-sm align-middle", className)} {...props} />
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[12.5px] tracking-tight", className)}>{children}</span>
  );
}
