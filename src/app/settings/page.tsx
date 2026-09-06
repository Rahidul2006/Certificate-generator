import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Mail, Shield, User } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="min-h-screen p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account preferences, SMTP email dispatch configurations, and organization profile.
          </p>
        </div>

        <div className="grid max-w-4xl gap-4">
          <Link
            href="/settings/smtp"
            className="flex items-start justify-between rounded-xl border border-border bg-card p-5 transition hover:border-zinc-700 hover:bg-zinc-900/50"
          >
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-zinc-900 text-foreground">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  SMTP Configuration
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure custom SMTP servers (Gmail, Outlook, Amazon SES, SendGrid) to send bulk emails securely.
                </p>
              </div>
            </div>
            <span className="rounded-md border border-border bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Configure
            </span>
          </Link>

          <div className="flex items-start justify-between rounded-xl border border-border bg-card p-5 opacity-75">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-zinc-900 text-foreground">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Security & API Keys
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage encryption secrets, session policies, and API keys.
                </p>
              </div>
            </div>
            <span className="rounded-md border border-border bg-zinc-800/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Coming Soon
            </span>
          </div>

          <div className="flex items-start justify-between rounded-xl border border-border bg-card p-5 opacity-75">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-zinc-900 text-foreground">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Organization & Profile
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Organization branding, issuer signatures, and default sender identity.
                </p>
              </div>
            </div>
            <span className="rounded-md border border-border bg-zinc-800/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
