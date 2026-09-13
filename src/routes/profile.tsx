import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldCheck, ScrollText, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Btn, Panel, PageIntro, Field, DemoNotice, Mono } from "@/components/kit";
import { CURRENT_USER, ROLES, ACCESS_GRANTS } from "@/lib/mock-data";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  const navigate = useNavigate();
  const { session, audit } = useApp();
  const name = session?.name ?? CURRENT_USER.name;
  const role = session?.roleLabel ?? CURRENT_USER.role;
  const roleDef = ROLES.find((r) => r.name === role);
  const myGrants = ACCESS_GRANTS.filter((g) => g.user === name);

  return (
    <AppShell title="Profile">
      <PageIntro
        title="Profile"
        description="Session identity, role capabilities and personal access grants."
        actions={
          <Btn
            variant="outline"
            onClick={() => {
              navigate({ to: "/" });
            }}
          >
            <LogOut className="size-3.5" /> Sign out
          </Btn>
        }
      />
      <DemoNotice>
        Sessions live in frontend state only for this prototype — signing out returns to the login
        screen.
      </DemoNotice>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-1" title="Identity">
          <div className="flex items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded bg-primary text-lg font-semibold text-primary-foreground">
              {name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="text-[12px] text-muted-foreground">{role}</p>
              <Badge tone="ai" className="mt-1">
                Demo session
              </Badge>
            </div>
          </div>
          <dl className="mt-4 space-y-3 border-t border-border pt-4">
            <Field label="Badge number" value={<Mono>{CURRENT_USER.badge}</Mono>} />
            <Field label="Unit" value={CURRENT_USER.unit} />
            <Field
              label="Sign-in mode"
              value={session ? `Demo role — ${session.roleLabel}` : "Demo role selection"}
            />
          </dl>
        </Panel>

        <Panel className="lg:col-span-2" title="Role capabilities">
          {roleDef ? (
            <>
              <p className="text-[13px] text-muted-foreground">{roleDef.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(Object.entries(roleDef.permissions) as [string, boolean][]).map(([k, v]) => (
                  <Badge key={k} tone={v ? "success" : "neutral"}>
                    {v ? "✓" : "—"} {k}
                  </Badge>
                ))}
              </div>
            </>
          ) : null}
          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
            <div className="rounded border border-border px-3 py-2.5">
              <p className="label-caps">Session actions logged</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{audit.length}</p>
              <Btn
                variant="ghost"
                size="sm"
                className="mt-1 px-0 text-info"
                onClick={() => navigate({ to: "/audit" })}
              >
                <ScrollText className="size-3.5" /> View audit trail
              </Btn>
            </div>
            <div className="rounded border border-border px-3 py-2.5">
              <p className="label-caps">Personal grants</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {myGrants.length > 0 ? myGrants.length : "—"}
              </p>
              <Btn
                variant="ghost"
                size="sm"
                className="mt-1 px-0 text-info"
                onClick={() => navigate({ to: "/access" })}
              >
                <Users className="size-3.5" /> Access management
              </Btn>
            </div>
            <div className="rounded border border-border px-3 py-2.5">
              <p className="label-caps">Integrity duty</p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
                Verify pending baselines after every upload.
              </p>
              <Btn
                variant="ghost"
                size="sm"
                className="mt-1 px-0 text-info"
                onClick={() => navigate({ to: "/integrity" })}
              >
                <ShieldCheck className="size-3.5" /> Integrity page
              </Btn>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
