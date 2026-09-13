import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { signOut, useApp, isForensicSession } from "@/lib/app-state";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Boxes,
  Search,
  ShieldCheck,
  ScrollText,
  Users,
  UserCircle,
  Settings,
  Bell,
  Menu,
  X,
  Sparkles,
  LogOut,
  ArrowLeftRight,
} from "lucide-react";
import { BrandLockup, BrandMark } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import { CURRENT_USER, NOTIFICATIONS } from "@/lib/mock-data";
import { Badge } from "@/components/kit";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, policeOnly: false },
  { to: "/cases", label: "Cases", icon: FolderOpen, policeOnly: false },
  { to: "/documents", label: "Documents", icon: FileText, policeOnly: false },
  { to: "/evidence", label: "Evidence", icon: Boxes, policeOnly: false },
  { to: "/handoffs", label: "Forensic Handoffs", icon: ArrowLeftRight, policeOnly: false },
  { to: "/search", label: "Smart Search", icon: Search, policeOnly: true },
  { to: "/ai-processing", label: "AI Processing", icon: Sparkles, policeOnly: true },
  { to: "/integrity", label: "Integrity", icon: ShieldCheck, policeOnly: false },
  { to: "/audit", label: "Audit Trail", icon: ScrollText, policeOnly: false },
  { to: "/access", label: "Access Management", icon: Users, policeOnly: true },
] as const;

const BOTTOM_NAV = [
  { to: "/profile", label: "Profile", icon: UserCircle },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const linkBase =
  "flex items-center gap-2.5 rounded px-2.5 py-2 text-[13.5px] font-medium text-sidebar-muted transition-colors hover:bg-sidebar-active hover:text-sidebar-foreground";
const linkActive = "bg-sidebar-active text-sidebar-foreground";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center border-b border-sidebar-border px-4 py-3">
        <BrandLockup tone="light" markClassName="size-8" tagline />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        <p className="px-2.5 pb-1.5 text-[10.5px] font-semibold tracking-[0.08em] text-sidebar-muted/80 uppercase">
          Workspace
        </p>
        {NAV.map(({ to, label, icon: Icon, policeOnly }) =>
          policeOnly && isForensicSession() ? null : (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={linkBase}
              activeProps={{ className: linkActive }}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          ),
        )}
      </nav>

      <div className="space-y-0.5 border-t border-sidebar-border px-2 py-3">
        {BOTTOM_NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={linkBase}
            activeProps={{ className: linkActive }}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
        <button
          onClick={() => {
            signOut();
            onNavigate?.();
            navigate({ to: "/" });
          }}
          className={linkBase}
        >
          <LogOut className="size-4 shrink-0" />
          <span className="truncate">Sign out</span>
        </button>
      </div>
    </div>
  );
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { session } = useApp();
  const userName = session?.name ?? CURRENT_USER.name;
  const userRole = session?.roleLabel ?? CURRENT_USER.role;
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-primary/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-border bg-card">
          <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
            <button
              className="rounded p-2 text-muted-foreground hover:bg-secondary lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>

            <h1 className="truncate text-sm font-semibold text-foreground sm:text-[15px]">
              {title}
            </h1>

            <form
              className="ml-auto hidden max-w-sm flex-1 items-center gap-2 rounded-md border border-input bg-muted px-2.5 py-1.5 md:flex"
              onSubmit={(e) => {
                e.preventDefault();
                navigate({ to: "/search", search: { q: query } });
              }}
            >
              <Search className="size-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cases, documents, people…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </form>

            <div className="relative ml-auto md:ml-0">
              <button
                className="relative rounded p-2 text-muted-foreground hover:bg-secondary"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-warning" />
              </button>
              {notifOpen ? (
                <div className="absolute right-0 z-30 mt-2 w-72 rounded-md border border-border bg-card shadow-lg">
                  <p className="border-b border-border px-3 py-2 text-xs font-semibold">
                    Notifications
                  </p>
                  <ul className="divide-y divide-border">
                    {NOTIFICATIONS.map((n) => (
                      <li key={n.title} className="px-3 py-2.5">
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              "mt-1.5 size-1.5 shrink-0 rounded-full",
                              n.tone === "alert" && "bg-alert",
                              n.tone === "warning" && "bg-warning",
                              n.tone === "info" && "bg-info",
                            )}
                          />
                          <div>
                            <p className="text-[13px] leading-snug">{n.title}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{n.time}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <Link
              to="/profile"
              className="flex items-center gap-2 rounded border border-border px-2 py-1.5 hover:bg-secondary"
            >
              <span className="flex size-6 items-center justify-center rounded bg-primary text-[11px] font-semibold text-primary-foreground">
                {initials}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-[12.5px] font-semibold">{userName}</span>
                <span className="block text-[11px] text-muted-foreground">{userRole}</span>
              </span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] space-y-4 px-3 py-4 sm:px-5 sm:py-5">
          {children}
        </main>

        <footer className="border-t border-border px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <BrandMark className="size-4" /> CaseVault AI — SIH 2026 prototype (SIH26190).
              Demo data only.
            </span>
            <Badge tone="ai">Prototype</Badge>
          </div>
        </footer>
      </div>
    </div>
  );
}
