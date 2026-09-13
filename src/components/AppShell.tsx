import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { signOut, useApp, type DemoRole } from "@/lib/app-state";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  ShieldCheck,
  ScrollText,
  Settings,
  Menu,
  X,
  LogOut,
  ArrowLeftRight,
  PlusCircle,
  Sparkles,
  Repeat,
} from "lucide-react";
import { BrandMark } from "@/components/BrandLogo";
import { Emblem, FlagChip, GovFooterLine } from "@/components/gov";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/kit";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  policeOnly?: boolean;
  forensicOnly?: boolean;
  search?: Record<string, unknown>;
};

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cases", label: "Create FIR", icon: PlusCircle, policeOnly: true, search: { create: true } },
  { to: "/cases", label: "Cases", icon: FolderOpen },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/ai-processing", label: "AI Processing", icon: Sparkles, policeOnly: true },
  { to: "/integrity", label: "Integrity Verification", icon: ShieldCheck },
  {
    to: "/handoffs",
    label: "Send to Forensic",
    icon: ArrowLeftRight,
    policeOnly: true,
  },
  {
    to: "/handoffs",
    label: "Incoming Handoffs",
    icon: ArrowLeftRight,
    forensicOnly: true,
  },
  { to: "/audit", label: "Audit Trail", icon: ScrollText },
];

const linkBase =
  "flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13.5px] font-medium text-sidebar-muted transition-colors hover:bg-sidebar-active hover:text-sidebar-foreground";
const linkActive = "bg-sidebar-active text-sidebar-foreground";

function SidebarContent({
  role,
  onNavigate,
}: {
  role: DemoRole | null;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const forensic = role === "FORENSIC_OFFICER";
  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Brand + emblem */}
      <div className="border-b border-sidebar-border px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-white/95 p-1 ring-1 ring-white/10">
            <BrandMark className="size-full" />
          </span>
          <div className="min-w-0 leading-none">
            <p className="text-[15px] font-bold tracking-tight text-sidebar-foreground">
              CaseVault <span className="text-[#7FB0F0]">AI</span>
            </p>
            <p className="mt-1 text-[9px] font-semibold tracking-[0.14em] text-sidebar-muted uppercase">
              Secure Case Management
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        <p className="px-2.5 pb-1.5 text-[10.5px] font-semibold tracking-[0.08em] text-sidebar-muted/80 uppercase">
          Workspace
        </p>
        {NAV.map(({ to, label, icon: Icon, policeOnly, forensicOnly, search }) => {
          if (policeOnly && forensic) return null;
          if (forensicOnly && !forensic) return null;
          return (
            <Link
              key={label}
              to={to}
              search={search as never}
              onClick={onNavigate}
              className={linkBase}
              activeProps={{ className: linkActive }}
              activeOptions={{ includeSearch: false }}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Institutional foot */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2 text-sidebar-muted">
          <Emblem className="size-4 text-gold" />
          <span className="text-[9.5px] leading-tight font-semibold tracking-[0.12em] uppercase">
            Govt. of India · SIH 2026
          </span>
        </div>
      </div>

      <div className="space-y-0.5 border-t border-sidebar-border px-2 py-2">
        <Link
          to="/settings"
          onClick={onNavigate}
          className={linkBase}
          activeProps={{ className: linkActive }}
        >
          <Settings className="size-4 shrink-0" />
          <span className="truncate">Settings</span>
        </Link>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { session } = useApp();
  const role = session?.role ?? null;
  const userName = session?.name ?? "Investigation Officer";
  const userRole = session?.roleLabel ?? "Police Officer";
  const RoleGlyph = role === "FORENSIC_OFFICER" ? Repeat : ArrowLeftRight;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border lg:block">
        <SidebarContent role={role} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-primary/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
            <SidebarContent role={role} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-60">
        {/* Government application header */}
        <header className="sticky top-0 z-20 border-b border-border bg-card">
          <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
            <button
              className="rounded-sm p-2 text-muted-foreground hover:bg-secondary lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>

            <h1 className="truncate text-sm font-semibold text-foreground sm:text-[15px]">
              {title}
            </h1>

            {/* Demo role identity — flag accent + dropdown */}
            <div className="relative ml-auto">
              <button
                className="flex items-center gap-2.5 rounded-sm border border-border px-2.5 py-1.5 transition-colors hover:bg-secondary"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <FlagChip />
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-[12.5px] font-semibold">{userName}</span>
                  <span className="block text-[10.5px] tracking-wide text-muted-foreground uppercase">
                    {role === "FORENSIC_OFFICER" ? "Forensic Department" : "Police Department"}
                  </span>
                </span>
                <span className="flex size-6 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                  <RoleGlyph className="size-3.5" />
                </span>
              </button>

              {menuOpen ? (
                <div className="absolute right-0 z-30 mt-1.5 w-60 rounded-sm border border-border bg-card py-1 shadow-lg">
                  <div className="border-b border-border px-3 py-2">
                    <p className="text-[12.5px] font-semibold">{userName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {userRole} · demo role, not authentication
                    </p>
                  </div>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-secondary"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate({ to: "/profile" });
                    }}
                  >
                    <ShieldCheck className="size-3.5 text-muted-foreground" /> Profile & session
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-secondary"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate({ to: "/" });
                    }}
                  >
                    <Repeat className="size-3.5 text-muted-foreground" /> Change role
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-alert hover:bg-alert-soft"
                    onClick={() => {
                      signOut();
                      setMenuOpen(false);
                      navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="size-3.5" /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div aria-hidden className="tricolour-bar h-[2px] w-full opacity-80" />
        </header>

        <main className="mx-auto max-w-[1400px] space-y-4 px-3 py-4 sm:px-5 sm:py-5">{children}</main>

        <footer className="border-t border-border px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
            <GovFooterLine />
            <Badge tone="gold">SIH 2026 Prototype</Badge>
          </div>
        </footer>
      </div>
    </div>
  );
}
