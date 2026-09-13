import { Badge, Mono, Td, Th } from "@/components/kit";
import { BtnLink } from "@/components/kit";
import { useAuditEvents } from "@/lib/audit-repository";
import { ArrowRight, ScrollText, ShieldCheck } from "lucide-react";

/**
 * Case audit trail — REAL rows from public.audit_trail for this case only.
 * Read-only by design: there is no edit/delete path anywhere in the UI.
 */
export function CaseAuditTab({ caseId }: { caseId: string }) {
  const { events, loading, error, refresh } = useAuditEvents({ caseId });

  function tone(status: string) {
    return status === "Success" ? "success" : status === "Blocked" ? "alert" : "warning";
  }

  return (
    <div className="border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ScrollText className="size-4" /> Case Audit Trail
          </h2>
          <p className="text-[11.5px] text-muted-foreground">
            {events.length} recorded events for {caseId} — every entry is a real row in{" "}
            <Mono>public.audit_trail</Mono>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" /> Read-only · append-only
          </span>
          <BtnLink to="/audit" variant="outline" size="sm">
            Full vault trail <ArrowRight className="size-3.5" />
          </BtnLink>
        </div>
      </header>

      {error ? (
        <p className="px-4 py-3 text-[12.5px] text-alert">
          Could not load audit events from the database: {error}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              <Th className="px-4">Date</Th>
              <Th>Time</Th>
              <Th>Action</Th>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Related Document</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {loading && events.length === 0 ? (
              <tr>
                <Td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Loading audit events from Supabase…
                </Td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <Td colSpan={7} className="px-4 py-10 text-center">
                  <p className="text-[13px] font-medium">No audit events recorded yet</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Actions like FIR creation, document uploads, integrity verification and forensic
                    handoffs on this case are written here automatically.
                  </p>
                  <button
                    onClick={refresh}
                    className="mt-3 border border-border px-2.5 py-1 text-[12.5px] font-medium hover:bg-secondary"
                  >
                    Refresh
                  </button>
                </Td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} className="hover:bg-secondary/50">
                  <Td className="px-4 whitespace-nowrap text-muted-foreground">{e.date}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground tabular-nums">{e.time}</Td>
                  <Td className="font-medium">{e.action}</Td>
                  <Td className="whitespace-nowrap">{e.user}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{e.role}</Td>
                  <Td className="text-muted-foreground">{e.document ?? "—"}</Td>
                  <Td>
                    <Badge tone={tone(e.status)}>{e.status}</Badge>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
