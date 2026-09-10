import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/app-state";
import { IntegrityBadge, Mono, PageIntro, Td, Th } from "@/components/kit";
import { AppShell } from "@/components/AppShell";
import { EVIDENCE_REGISTER } from "@/lib/evidence-register";

export const Route = createFileRoute("/evidence/")({
  component: EvidencePage,
});

function EvidencePage() {
  const navigate = useNavigate();
  const { evidence: runtime } = useApp();
  return (
    <AppShell title="Evidence">
      <PageIntro
        title="Evidence Register"
        description="All registered evidence across cases. Open an item to view its chain of custody."
      />
      <div className="overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr>
              <Th className="px-4">Evidence ID</Th>
              <Th>Case</Th>
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
            {runtime.map((e) => (
              <tr
                key={e.id}
                className="cursor-pointer hover:bg-secondary/50"
                onClick={() => navigate({ href: `/evidence/${e.id}` })}
              >
                <Td className="px-4">
                  <Mono className="text-[12.5px] font-semibold">{e.id}</Mono>
                </Td>
                <Td>
                  <Mono className="text-[12px]">{e.caseId}</Mono>
                </Td>
                <Td className="font-medium">{e.name}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{e.type}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{e.collectedDate}</Td>
                <Td className="whitespace-nowrap">{e.submittedBy}</Td>
                <Td className="whitespace-nowrap">{e.custodian}</Td>
                <Td>
                  <IntegrityBadge status={e.integrity} />
                </Td>
                <Td className="whitespace-nowrap">{e.status}</Td>
              </tr>
            ))}
            {EVIDENCE_REGISTER.map((e) => (
              <tr
                key={e.id}
                className="cursor-pointer hover:bg-secondary/50"
                onClick={() => navigate({ href: `/evidence/${e.id}` })}
              >
                <Td className="px-4">
                  <Mono className="text-[12.5px] font-semibold">{e.id}</Mono>
                </Td>
                <Td>
                  <Mono className="text-[12px]">{e.caseId}</Mono>
                </Td>
                <Td className="font-medium">{e.description}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{e.type}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{e.collected}</Td>
                <Td className="whitespace-nowrap">{e.submittedBy}</Td>
                <Td className="whitespace-nowrap">{e.custodian}</Td>
                <Td>
                  <IntegrityBadge status={e.integrity} />
                </Td>
                <Td className="whitespace-nowrap">{e.status}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
