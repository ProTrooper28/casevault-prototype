import { Td, Th } from "@/components/kit";
import { getCase } from "@/lib/mock-data";

const ACCESS_LEVEL: Record<string, string> = {
  Complainant: "Statement access",
  Witness: "Statement access",
  Accused: "No direct access",
  "Missing Person": "Case subject",
  Informant: "Statement access",
};

export function CasePeopleTab({ caseId }: { caseId: string }) {
  const c = getCase(caseId)!;

  const rows = [
    // officers first
    ...c.officers.map((o) => ({
      role: o.role,
      name: o.name,
      contact: o.unit,
      relationship: "Assigned to case",
      access:
        o.role === "Police Investigator"
          ? "Full Access"
          : o.role === "Forensic Officer"
            ? "Evidence Access"
            : o.role === "Legal Officer" || o.role === "Prosecutor"
              ? "Legal Documents"
              : "Read Access",
    })),
    ...c.people.map((p) => ({
      role: p.role,
      name: p.name,
      contact: p.detail,
      relationship: p.role === "Complainant" ? "Reported the case" : "Case party",
      access: ACCESS_LEVEL[p.role] ?? "Limited",
    })),
  ];

  return (
    <div className="border border-border bg-card">
      <header className="border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-semibold">People Associated with Case</h2>
        <p className="text-[11.5px] text-muted-foreground">
          Officers, parties and contacts recorded on the case file
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <Th className="px-4">Role</Th>
              <Th>Name</Th>
              <Th>Contact / Identifier</Th>
              <Th>Relationship to Case</Th>
              <Th>Access Level</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.role}-${r.name}`} className="hover:bg-secondary/50">
                <Td className="px-4 font-medium">{r.role}</Td>
                <Td>{r.name}</Td>
                <Td className="text-muted-foreground">{r.contact}</Td>
                <Td className="text-muted-foreground">{r.relationship}</Td>
                <Td>{r.access}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
