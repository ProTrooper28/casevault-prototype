import { useMemo } from "react";
import { Field, Mono, Td, Th } from "@/components/kit";
import { Timeline } from "@/components/shared";
import { allCases } from "@/lib/cases-repository";
import { caseTimeline } from "@/lib/case-timeline";
import { fullAuditTrail } from "@/lib/app-state";

export function CaseOverviewTab({ caseId }: { caseId: string }) {
  // Supabase-aware lookup: mock-data's getCase() only knows the demo cases,
  // which crashed real FIR workspaces (undefined.people). The route loader
  // warms this repository cache on cold SSR, so the hit is synchronous here.
  const c = allCases().find((x) => x.id === caseId);
  const events = caseTimeline(caseId);
  const audit = useMemo(() => fullAuditTrail().filter((a) => a.caseId === caseId), [caseId]);

  if (!c) {
    return (
      <div className="rounded-sm border border-border bg-card px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Case record for <Mono>{caseId}</Mono> could not be loaded. Try refreshing — if it persists,
          the case may not exist in the connected database.
        </p>
      </div>
    );
  }

  const rolesShown = c.people.map((p) => ({
    name: p.name,
    role: p.role,
    detail: p.detail,
    access:
      p.role === "Complainant"
        ? "Notified"
        : p.role === "Witness"
          ? "Statement on file"
          : p.role === "Accused"
            ? "Person of interest"
            : "Case party",
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Case information */}
        <div className="rounded-sm border border-border bg-card lg:col-span-2">
          <header className="border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">Case Information</h2>
          </header>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4 sm:grid-cols-3">
            <Field label="Case ID" value={<Mono>{c.id}</Mono>} />
            <Field label="Case Type" value={c.type} />
            <Field label="Location" value={c.location} />
            <Field label="Date Opened" value={c.openedOn} />
            <Field label="Assigned Investigator" value={c.investigator} />
            <Field label="Status" value={c.status} />
            <Field label="Priority" value={c.priority} />
            <Field label="Last Updated" value={c.lastUpdated} />
            <Field label="Sections Invoked" value={c.sections.join(", ")} />
          </dl>

          <div className="border-t border-border px-4 py-4">
            <h3 className="label-caps">Case Summary</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed">{c.summary}</p>
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-sm border border-border bg-card">
          <header className="border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
          </header>
          <div className="px-4 py-4">
            {audit.length > 0 ? (
              <Timeline
                items={audit
                  .slice(0, 6)
                  .map((a) => ({
                    title: a.action,
                    subtitle: `${a.user} · ${a.role}`,
                    meta: `${a.date}, ${a.time}`,
                    tone:
                      a.status === "Success"
                        ? ("success" as const)
                        : a.status === "Blocked"
                          ? ("alert" as const)
                          : ("warning" as const),
                  }))}
              />
            ) : (
              <p className="text-[12.5px] text-muted-foreground">
                No vault events recorded for this case yet. Verify a document or register evidence
                and the entry appears here.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Key people */}
      <div className="rounded-sm border border-border bg-card">
        <header className="border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-semibold">Key People</h2>
        </header>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th className="px-4">Role</Th>
              <Th>Name</Th>
              <Th>Detail / Identifier</Th>
              <Th>Relationship to Case</Th>
            </tr>
          </thead>
          <tbody>
            {rolesShown.map((p) => (
              <tr key={p.name} className="hover:bg-secondary/50">
                <Td className="px-4 font-medium">{p.role}</Td>
                <Td>{p.name}</Td>
                <Td className="text-muted-foreground">{p.detail}</Td>
                <Td className="text-muted-foreground">{p.access}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Latest chronology preview */}
      <div className="rounded-sm border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-semibold">Chronology Preview</h2>
          <span className="text-[11.5px] text-muted-foreground">{events.length} recorded events</span>
        </header>
        <div className="px-4 py-4">
          <Timeline
            items={events.slice(0, 4).map((e) => ({
              title: e.title,
              subtitle: e.description,
              meta: `${e.date}, ${e.time}`,
              tone: "info" as const,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
