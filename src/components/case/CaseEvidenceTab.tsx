import { useNavigate } from "@tanstack/react-router";
import { IntegrityBadge, Mono, Td, Th } from "@/components/kit";
import { registerEvidenceForCase } from "@/lib/evidence-register";
import { useApp } from "@/lib/app-state";
import { useSupabaseRecords } from "@/lib/uploads-repository";

export function CaseEvidenceTab({ caseId }: { caseId: string }) {
  const { evidence: runtime } = useApp();
  const { evidence: dbEvidence } = useSupabaseRecords();
  const navigate = useNavigate();
  const seeded = registerEvidenceForCase(caseId);
  const runtimeItems = runtime.filter((e) => e.caseId === caseId);
  const dbItems = dbEvidence.filter((e) => e.caseId === caseId);

  function open(id: string) {
    navigate({ href: `/evidence/${id}` });
  }

  return (
    <div className="border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div>
          <h2 className="text-sm font-semibold">Evidence Register</h2>
          <p className="text-[11.5px] text-muted-foreground">
            {seeded.length + runtimeItems.length + dbItems.length} items registered for this case
          </p>
        </div>
        <span className="text-[11.5px] text-muted-foreground">
          Items added from the Timeline appear here automatically
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr>
              <Th className="px-4">Evidence ID</Th>
              <Th>Description</Th>
              <Th>Type</Th>
              <Th>Collected</Th>
              <Th>Submitted By</Th>
              <Th>Current Custodian</Th>
              <Th>Integrity</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {dbItems.map((e) => (
              <tr
                key={e.id}
                className="cursor-pointer hover:bg-secondary/50"
                onClick={() => open(e.id)}
              >
                <Td className="px-4">
                  <Mono className="text-[12.5px] font-semibold">{e.id}</Mono>
                </Td>
                <Td className="font-medium">{e.description}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{e.type}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{e.collected}</Td>
                <Td className="whitespace-nowrap">{e.submittedBy}</Td>
                <Td className="whitespace-nowrap">{e.custodian}</Td>
                <Td>
                  <IntegrityBadge status={e.integrity} />
                </Td>
                <Td>
                  <span className="text-[12.5px]">{e.status}</span>
                </Td>
              </tr>
            ))}
            {seeded.map((e) => (
              <tr
                key={e.id}
                className="cursor-pointer hover:bg-secondary/50"
                onClick={() => open(e.id)}
              >
                <Td className="px-4">
                  <Mono className="text-[12.5px] font-semibold">{e.id}</Mono>
                </Td>
                <Td className="font-medium">{e.description}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{e.type}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{e.collected}</Td>
                <Td className="whitespace-nowrap">{e.submittedBy}</Td>
                <Td className="whitespace-nowrap">{e.custodian}</Td>
                <Td>
                  <IntegrityBadge status={e.integrity} />
                </Td>
                <Td>
                  <span className="text-[12.5px]">{e.status}</span>
                </Td>
              </tr>
            ))}
            {runtimeItems.map((e) => (
              <tr
                key={e.id}
                className="cursor-pointer hover:bg-secondary/50"
                onClick={() => open(e.id)}
              >
                <Td className="px-4">
                  <Mono className="text-[12.5px] font-semibold">{e.id}</Mono>
                </Td>
                <Td className="font-medium">{e.name}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{e.type}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{e.collectedDate}</Td>
                <Td className="whitespace-nowrap">{e.submittedBy}</Td>
                <Td className="whitespace-nowrap">{e.custodian}</Td>
                <Td>
                  <IntegrityBadge status={e.integrity} />
                </Td>
                <Td>
                  <span className="text-[12.5px]">{e.status}</span>
                </Td>
              </tr>
            ))}
            {seeded.length + runtimeItems.length + dbItems.length === 0 ? (
              <tr>
                <Td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No evidence registered for this case yet.
                </Td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
