import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldHalf, Lock, ArrowRight, Fingerprint } from "lucide-react";
import { Badge, Btn } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/app-state";

export const Route = createFileRoute("/")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function login() {
    if (!email.trim() || !password.trim()) {
      setError("Enter an email and password to continue (any value works in this prototype).");
      return;
    }
    signIn("Rahul Mehta", "Police Investigator");
    navigate({ to: "/cases" });
  }

  function guest() {
    signIn("Guest Investigator", "Police Investigator");
    navigate({ to: "/cases" });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand / narrative panel */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.95 0.01 250 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.95 0.01 250 / 0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded bg-sidebar-active">
            <ShieldHalf className="size-5" />
          </span>
          <div>
            <p className="text-base font-semibold">CaseVault AI</p>
            <p className="text-[11.5px] tracking-wide text-sidebar-muted uppercase">
              NCRB · SIH26190
            </p>
          </div>
        </div>

        <div className="relative">
          <Badge tone="ai" className="mb-4">
            SIH 2026 Prototype
          </Badge>
          <h2 className="max-w-md text-3xl leading-tight font-semibold">
            Tamper-evident case files with an audit trail on every action.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-sidebar-muted">
            CaseVault AI ingests FIRs, forensic reports and evidence records, fingerprints each
            document with SHA-256 and keeps every read, grant and verification on the record.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-sidebar-muted">
            {[
              "AI document pipeline — OCR, classification, entity extraction",
              "Chain-of-custody timeline for every evidence item",
              "Hash-verified integrity with simulated tamper detection",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <Fingerprint className="mt-0.5 size-4 shrink-0 opacity-70" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-sidebar-muted">
          Prototype build · fabricated demo data only · not connected to any real NCRB system
        </p>
      </div>

      {/* Login form */}
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded bg-primary text-primary-foreground">
              <ShieldHalf className="size-4.5" />
            </span>
            <p className="text-base font-semibold">CaseVault AI</p>
          </div>

          <h1 className="text-xl font-semibold">Sign in to CaseVault AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Central investigation document vault — prototype access.
          </p>

          <form
            className="mt-7 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="investigator@ncrb.gov.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
              />
            </div>

            {error ? <p className="text-xs font-medium text-alert">{error}</p> : null}

            <Btn type="submit" className="w-full">
              <Lock className="size-3.5" /> Login
            </Btn>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="label-caps">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Btn variant="outline" className="w-full" onClick={guest}>
            Continue as Guest <ArrowRight className="size-3.5" />
          </Btn>
          <p className="mt-3 text-center text-[11.5px] text-muted-foreground">
            Guest mode opens the demo workspace with read-only-style prototype data.
          </p>
        </div>
      </div>
    </div>
  );
}
