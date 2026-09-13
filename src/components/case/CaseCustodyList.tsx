import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, ShieldAlert } from "lucide-react";
import { IntegrityBadge, Mono, Td, Th } from "@/components/kit";
import { registerEvidenceForCase } from "@/lib/evidence-register";
import { useApp } from "@/lib/app-state";
import { useSupabaseRecords } from "@/lib/uploads-repository";

/**
 * Case-scoped custody evidence list — rows linking into each item's
 * append-only chain of custody view (evidence detail page).
 */
export function CaseCustodyEvidenceList({ caseId }: { caseId: string }) {
  const navigate = useNavigate();
  const { evidence: runtime } = useApp();
  const { evidence: dbEvidence } = useSupabaseRecords();
  const seeded = registerEvidenceForCase(caseId);
  const runtimeItems = runtime.filter((e) => e.caseId === caseId);
  const dbItems = dbEvidence.filter((e) => e.caseId === caseId);
  const total = seeded.length + runtimeItems.length + dbItems.length;

  if (total === 0) {
    return (
      <p className="py-6 text-center text-[13px] text-muted-foreground">
        No evidence with a custody trail is registered for this case yet. Documents registered as
        evidence automatically build a custody chain (Collected → Secured → Transfers).
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr>
            <Th className="px-4">Evidence</Th>
            <Th>Type</Th>
            <Th>Custodian</Th>
            <Th>Integrity</Th>
            <Th className="text-right">Custody Trail</Th>
          </tr>
        </thead>
        <tbody>
          {dbItems.map((e) => (
            <CustodyRow
              key={e.id}
              id={e.id}
              description={e.description}
              type={e.type}
              custodian={e.custodian}
              integrity={e.integrity}
              onOpen={() => navigate({ href: `/evidence/${e.id}` })}
            />
          ))}
          {seeded.map((e) => (
            <CustodyRow
              key={e.id}
              id={e.id}
              description={e.description}
              type={e.type}
              custodian={e.custodian}
              integrity={e.integrity}
              onOpen={() => navigate({ href: `/evidence/${e.id}` })}
            />
          ))}
          {runtimeItems.map((e) => (
            <CustodyRow
              key={e.id}
              id={e.id}
              description={e.name}
              type={e.type}
              custodian={e.custodian}
              integrity={e.integrity}
              onOpen={() => navigate({ href: `/evidence/${e.id}` })}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustodyRow({
  id,
  description,
  type,
  custodian,
  integrity,
  onOpen,
}: {
  id: string;
  description: string;
  type: string;
  custodian: string;
  integrity: "verified" | "pending" | "compromised";
  onOpen: () => void;
}) {
  return (
    <tr className="cursor-pointer hover:bg-secondary/50" onClick={onOpen}>
      <Td className="px-4">
        <Mono className="text-[12.5px] font-semibold">{id}</Mono>
        <span className="mt-0.5 block max-w-[320px] truncate text-[12.5px] text-muted-foreground">
          {description}
        </span>
      </Td>
      <Td className="whitespace-nowrap text-muted-foreground">{type}</Td>
      <Td className="whitespace-nowrap">{custodian}</Td>
      <Td>
        <span className="inline-flex items-center gap-1.5">
          {integrity === "compromised" ? (
            <ShieldAlert className="size-3.5 text-alert" />
          ) : (
            <ShieldCheck className="size-3.5 text-success" />
          )}
          <IntegrityBadge status={integrity} />
        </span>
      </Td>
      <Td>
        <div className="flex justify-end pr-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="inline-flex items-center gap-1 border border-border px-2 py-0.5 text-[12px] font-medium hover:bg-secondary"
          >
            View chain <ArrowRight className="size-3" />
          </button>
        </div>
      </Td>
    </tr>
  );
}
