import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, UserPlus, Users, ShieldCheck, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  Badge,
  Btn,
  BtnLink,
  DemoNotice,
  Mono,
  PageIntro,
  Panel,
  Td,
  Th,
} from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCESS_GRANTS, CASES, PERMISSION_KEYS, ROLES } from "@/lib/mock-data";
import { addGrant, currentActor, logAudit, useApp } from "@/lib/app-state";

export const Route = createFileRoute("/access")({
  component: AccessManagement,
});

function AccessManagement() {
  const navigate = useNavigate();
  const { grants } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ user: string; role: string; scope: string; expires: string }>({
    user: "",
    role: ROLES[0]?.name ?? "Police Investigator",
    scope: CASES[0]?.id ?? "FIR-2026-00124",
    expires: "",
  });

  const filteredGrants = useMemo(() => {
    const q = query.trim().toLowerCase();
    return grants.filter((g) =>
      !q || [g.user, g.role, g.scope, g.status].join(" ").toLowerCase().includes(q),
    );
  }, [grants, query]);

  const totalUsers = ROLES.reduce((sum, r) => sum + r.users, 0);

  function grant() {
    if (!form.user.trim()) return;
    addGrant({
      user: form.user.trim(),
      role: form.role,
      scope: form.scope,
      granted: "Today",
      expires: form.expires.trim() || "31 Mar 2026",
      status: "Active",
    });
    logAudit({
      user: currentActor().name,
      role: currentActor().role,
      action: `Access granted to ${form.user.trim()} (${form.role})`,
      document: "Access management",
      caseId: form.scope,
      status: "Success",
    });
    setOpen(false);
    setForm({
      user: "",
      role: ROLES[0]?.name ?? "Police Investigator",
      scope: CASES[0]?.id ?? "FIR-2026-00124",
      expires: "",
    });
  }

  return (
    <AppShell title="Access Management">
      <PageIntro
        title="Access Management"
        description="Role-based access control across the vault. Grants are scoped to a case and expire automatically; every grant is audit-logged."
        actions={
          <Btn onClick={() => setOpen(true)}>
            <UserPlus className="size-3.5" /> Grant Access
          </Btn>
        }
      />
      <DemoNotice>
        Grant access writes to frontend state only in this prototype — the new grant appears in the
        table below and in the audit trail immediately.
      </DemoNotice>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Workspace users", value: totalUsers, icon: Users },
          { label: "Roles defined", value: ROLES.length, icon: ShieldCheck },
          { label: "Active grants", value: grants.filter((g) => g.status === "Active").length, icon: UserPlus },
          { label: "Expiring grants", value: grants.filter((g) => g.status !== "Active").length, icon: X },
        ].map((s) => (
          <div key={s.label} className="rounded-sm border border-border bg-card px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="label-caps">{s.label}</span>
              <s.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-1 text-xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Roles & permissions matrix */}
      <Panel title={`Roles & permissions (${ROLES.length} roles)`} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <Th>Role</Th>
                <Th>Users</Th>
                {PERMISSION_KEYS.map((k) => (
                  <Th key={k} className="text-center">
                    {k}
                  </Th>
                ))}
                <Th />
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.name} className="transition-colors hover:bg-secondary/60">
                  <Td>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-[11.5px] text-muted-foreground">{r.description}</p>
                  </Td>
                  <Td className="whitespace-nowrap tabular-nums">{r.users}</Td>
                  {PERMISSION_KEYS.map((k) => (
                    <Td key={k} className="text-center">
                      {r.permissions[k] ? (
                        <Badge tone="success">✓</Badge>
                      ) : (
                        <Badge tone="neutral">—</Badge>
                      )}
                    </Td>
                  ))}
                  <Td>
                    <div className="flex justify-end">
                      <Btn
                        variant="subtle"
                        size="sm"
                        onClick={() => {
                          setForm((f) => ({ ...f, role: String(r.name) }));
                          setOpen(true);
                        }}
                      >
                        Assign
                      </Btn>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Access grants */}
      <Panel title={`Active access grants (${grants.length})`}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 md:max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search user, role, scope…"
              className="pl-9"
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Scope</Th>
                <Th>Granted</Th>
                <Th>Expires</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filteredGrants.map((g) => (
                <tr key={`${g.user}-${g.scope}`} className="transition-colors hover:bg-secondary/60">
                  <Td className="font-medium">{g.user}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{g.role}</Td>
                  <Td>
                    <Mono className="text-[12px]">{g.scope}</Mono>
                  </Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{g.granted}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{g.expires}</Td>
                  <Td>
                    <Badge tone={g.status === "Active" ? "success" : "warning"}>{g.status}</Badge>
                  </Td>
                </tr>
              ))}
              {filteredGrants.length === 0 ? (
                <tr>
                  <Td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No grants match “{query}”.
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Grant dialog */}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Close dialog"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-sm border border-border bg-card p-5 shadow-xl">
            <h3 className="text-sm font-semibold">Grant access</h3>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Adds a scoped grant to frontend state and writes an audit entry.
            </p>
            <div className="mt-4 space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="grant-user">User name</Label>
                <Input
                  id="grant-user"
                  value={form.user}
                  onChange={(e) => setForm({ ...form, user: e.target.value })}
                  placeholder="e.g. Insp. R. Sarma"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="grant-role">Role</Label>
                  <select
                    id="grant-role"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm"
                  >
                    {ROLES.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="grant-scope">Case scope</Label>
                  <select
                    id="grant-scope"
                    value={form.scope}
                    onChange={(e) => setForm({ ...form, scope: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm"
                  >
                    {CASES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grant-expires">Expires (optional)</Label>
                <Input
                  id="grant-expires"
                  value={form.expires}
                  onChange={(e) => setForm({ ...form, expires: e.target.value })}
                  placeholder="e.g. 30 Apr 2026"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Btn>
              <Btn onClick={grant} disabled={!form.user.trim()}>
                <UserPlus className="size-3.5" /> Grant access
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
