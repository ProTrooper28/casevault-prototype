import { useState } from "react";
import { UserPlus, X, MinusCircle } from "lucide-react";
import { Badge, Btn, Mono, Td, Th } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLES } from "@/lib/mock-data";
import { addGrant, logAudit, revokeGrant, useApp } from "@/lib/app-state";
import { cn } from "@/lib/utils";

export function CaseAccessTab({ caseId }: { caseId: string }) {
  const { grants } = useApp();
  const scoped = grants.filter((g) => g.scope === caseId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ user: "", role: ROLES[0]?.name ?? "Police Investigator" });

  function grant() {
    if (!form.user.trim()) return;
    addGrant({
      user: form.user.trim(),
      role: form.role,
      scope: caseId,
      granted: "Today",
      expires: "31 Mar 2026",
      status: "Active",
    });
    logAudit({
      user: "Rahul Mehta",
      role: "Police Investigator",
      action: `Access granted to ${form.user.trim()} (${form.role})`,
      document: "Access management",
      caseId,
      status: "Success",
    });
    setOpen(false);
    setForm({ user: "", role: ROLES[0]?.name ?? "Police Investigator" });
  }

  function revoke(user: string) {
    revokeGrant(user, caseId);
    logAudit({
      user: "Rahul Mehta",
      role: "Police Investigator",
      action: `Access revoked for ${user}`,
      document: "Access management",
      caseId,
      status: "Success",
    });
  }

  return (
    <div className="border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div>
          <h2 className="text-sm font-semibold">Access Control — {caseId}</h2>
          <p className="text-[11.5px] text-muted-foreground">
            Grants are scoped to this case only and are audit-logged
          </p>
        </div>
        <Btn size="sm" onClick={() => setOpen(true)}>
          <UserPlus className="size-3.5" /> Grant Access
        </Btn>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr>
              <Th className="px-4">User</Th>
              <Th>Role</Th>
              <Th>Access Level</Th>
              <Th>Granted On</Th>
              <Th>Granted By</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {scoped.map((g) => (
              <tr key={`${g.user}-${g.scope}`} className="hover:bg-secondary/50">
                <Td className="px-4 font-medium">{g.user}</Td>
                <Td className="text-muted-foreground">{g.role}</Td>
                <Td>
                  <Badge tone={g.status === "Active" ? "success" : "warning"}>
                    {g.status === "Active" ? "Case access" : "Expiring"}
                  </Badge>
                </Td>
                <Td className="whitespace-nowrap text-muted-foreground">{g.granted}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">Rahul Mehta</Td>
                <Td>
                  <div className="flex justify-end pr-4">
                    <button
                      onClick={() => revoke(g.user)}
                      className="flex items-center gap-1 px-2 py-0.5 text-[12px] font-medium text-alert hover:underline"
                    >
                      <MinusCircle className="size-3.5" /> Revoke Access
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
            {scoped.length === 0 ? (
              <tr>
                <Td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No grants recorded for this case.
                </Td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button aria-label="Close" className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm border border-border bg-card shadow-xl">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Grant Access</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-1 hover:bg-secondary">
                <X className="size-4" />
              </button>
            </header>
            <div className="space-y-3.5 px-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="ga-user">User</Label>
                <Input
                  id="ga-user"
                  value={form.user}
                  onChange={(e) => setForm({ ...form, user: e.target.value })}
                  placeholder="e.g. A. Sharma"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ga-role">Role</Label>
                <select
                  id="ga-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="h-9 w-full border border-input bg-card px-2.5 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11.5px] text-muted-foreground">
                Scope is fixed to <Mono>{caseId}</Mono> in the case workspace.
              </p>
            </div>
            <footer className="flex justify-end gap-2 border-t border-border px-4 py-3">
              <Btn variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Btn>
              <Btn onClick={grant} disabled={!form.user.trim()}>
                <UserPlus className="size-3.5" /> Grant Access
              </Btn>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
