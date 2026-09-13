import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge, BtnLink, IntegrityBadge, Mono, Td, Th } from "@/components/kit";
import { DOCUMENTS, shortHash, type Document } from "@/lib/mock-data";
import { CheckCircle2 } from "lucide-react";

/* -------------------------------- Timeline -------------------------------- */

export type TimelineItem = {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  tone?: "default" | "success" | "warning" | "alert" | "info";
  active?: boolean;
};

const dotTone: Record<NonNullable<TimelineItem["tone"]>, string> = {
  default: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-warning",
  alert: "bg-alert",
  info: "bg-info",
};

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("relative space-y-4", className)}>
      {items.map((item, i) => (
        <li key={i} className="relative flex gap-3 pl-7">
          {i < items.length - 1 ? (
            <span className="absolute top-6 bottom-[-1rem] left-[9px] w-px bg-border" />
          ) : null}
          <span
            className={cn(
              "absolute top-0.5 left-0 flex size-[19px] items-center justify-center rounded-full border-2 border-card",
              item.active
                ? dotTone[item.tone ?? "default"]
                : item.tone && item.tone !== "default"
                  ? cn(dotTone[item.tone], "opacity-40")
                  : "bg-border-strong",
            )}
          >
            {item.icon ?? (item.active ? <CheckCircle2 className="size-3 text-white" /> : null)}
          </span>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className={cn("text-sm font-medium", !item.active && "text-muted-foreground")}>
                {item.title}
              </p>
              {item.meta ? (
                <span className="text-[11.5px] whitespace-nowrap text-muted-foreground">
                  {item.meta}
                </span>
              ) : null}
            </div>
            {item.subtitle ? (
              <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                {item.subtitle}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------ Documents table ---------------------------- */

export function DocumentsTable({ documents }: { documents: Document[] }) {
  if (documents.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border-strong px-4 py-10 text-center text-sm text-muted-foreground">
        No documents match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-border bg-card">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr>
            <Th>Document</Th>
            <Th>Type</Th>
            <Th>Case</Th>
            <Th>Uploaded by</Th>
            <Th>Date</Th>
            <Th>Version</Th>
            <Th>Integrity</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="transition-colors hover:bg-secondary/60">
              <Td>
                <p className="font-medium text-foreground">{doc.name}</p>
                <Mono className="text-[11px] text-muted-foreground">{doc.id}</Mono>
              </Td>
              <Td className="whitespace-nowrap text-muted-foreground">{doc.type}</Td>
              <Td>
                <Mono className="text-[12px]">{doc.caseId}</Mono>
              </Td>
              <Td className="whitespace-nowrap text-muted-foreground">{doc.uploadedBy}</Td>
              <Td className="whitespace-nowrap text-muted-foreground">{doc.date}</Td>
              <Td className="whitespace-nowrap">v{doc.version}</Td>
              <Td>
                <IntegrityBadge status={doc.integrity} />
              </Td>
              <Td>
                <div className="flex justify-end gap-1.5">
                  <BtnLink to="/documents/$docId" params={{ docId: doc.id }} variant="subtle" size="sm">
                    View
                  </BtnLink>
                  <BtnLink to="/documents/$docId" params={{ docId: doc.id }} variant="outline" size="sm">
                    Verify
                  </BtnLink>
                  <BtnLink
                    to="/documents/$docId"
                    params={{ docId: doc.id }}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    History
                  </BtnLink>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Small helper for the hash rows shown on integrity / viewer screens. */
export function HashRow({ hash }: { hash: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Mono className="text-[12px] break-all">{hash}</Mono>
      <Badge tone="neutral">SHA-256</Badge>
      <span className="text-[11px] text-muted-foreground">({shortHash(hash)} shortened)</span>
    </div>
  );
}
