"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Search, Award, CheckCircle2, ArrowRight } from "lucide-react";

export default function VerifyLookupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter a valid certificate ID or verification code.");
      return;
    }
    router.push(`/verify/${cleanCode}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Navbar */}
      <header className="flex h-16 items-center justify-between border-b border-border px-6 lg:px-12 bg-card/60 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-foreground border border-border">
            <Award size={18} />
          </div>
          <span className="text-base font-bold tracking-tight">CertiMail</span>
        </Link>

        <Link
          href="/dashboard"
          className="rounded-lg border border-border bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-zinc-800"
        >
          Go to Dashboard
        </Link>
      </header>

      {/* Main Verification Input Form */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-800/60 bg-emerald-950/40 text-emerald-400 mb-6 shadow-lg shadow-emerald-950/40">
            <ShieldCheck size={28} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-foreground">
            Verify Issued Certificate
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            Confirm the authenticity, issuance date, and integrity of any certificate issued through CertiMail.
          </p>

          <form onSubmit={handleVerify} className="mt-8 space-y-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Enter Certificate ID (e.g. CERT-2026-X89J)..."
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                className="w-full rounded-xl border border-border bg-card pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:border-zinc-400 focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 text-left pl-1">{error}</p>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-zinc-950 shadow-md transition hover:bg-zinc-200"
            >
              Verify Credential
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick trust metrics */}
          <div className="mt-12 grid grid-cols-3 gap-4 border-t border-border pt-8 text-xs text-muted-foreground">
            <div className="flex flex-col items-center">
              <CheckCircle2 size={16} className="text-emerald-400 mb-1" />
              <span className="font-semibold text-foreground">Cryptographic</span>
              <span>Tamper-proof IDs</span>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle2 size={16} className="text-emerald-400 mb-1" />
              <span className="font-semibold text-foreground">Instant</span>
              <span>Live validation</span>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle2 size={16} className="text-emerald-400 mb-1" />
              <span className="font-semibold text-foreground">Global</span>
              <span>Publicly accessible</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        CertiMail Credential Verification Service • Secure & Tamper-Resistant
      </footer>
    </div>
  );
}
