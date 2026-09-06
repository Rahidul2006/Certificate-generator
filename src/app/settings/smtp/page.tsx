"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  ArrowLeft,
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  HelpCircle,
} from "lucide-react";
import { SmtpConfig } from "@/types";

export default function SmtpSettingsPage() {
  const [config, setConfig] = useState<SmtpConfig>(() => {
    if (typeof window === "undefined") {
      return {
        host: "",
        port: 587,
        secure: false,
        user: "",
        pass: "",
        fromName: "CertiMail Dispatcher",
        fromEmail: "certificates@event.internal",
      };
    }
    try {
      const stored = localStorage.getItem("certimail_smtp_settings");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return {
      host: "",
      port: 587,
      secure: false,
      user: "",
      pass: "",
      fromName: "CertiMail Dispatcher",
      fromEmail: "certificates@event.internal",
    };
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Send Test Email State
  const [testRecipient, setTestRecipient] = useState("");
  const [sendingTestMail, setSendingTestMail] = useState(false);
  const [testMailStatus, setTestMailStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      localStorage.setItem("certimail_smtp_settings", JSON.stringify(config));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.user,
          pass: config.pass,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || "Connection verified successfully!",
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Failed to establish SMTP connection.",
        });
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message:
          err instanceof Error ? err.message : "Network error during SMTP test.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient) return;
    setSendingTestMail(true);
    setTestMailStatus(null);

    try {
      const res = await fetch("/api/smtp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp: config,
          to: testRecipient,
          subject: "CertiMail Test Dispatch",
          html: `
            <div style="font-family: sans-serif; padding: 20px; background-color: #f9fafb; color: #111827;">
              <h2 style="color: #0284c7;">CertiMail SMTP Configuration Verified</h2>
              <p>Hello,</p>
              <p>Your SMTP credentials configured in <strong>CertiMail</strong> are working smoothly and ready for bulk certificate delivery.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="font-size: 12px; color: #6b7280;">Sent via CertiMail Automation Platform</p>
            </div>
          `,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestMailStatus({
          success: true,
          message: `Sample email successfully dispatched to ${testRecipient}!`,
        });
      } else {
        setTestMailStatus({
          success: false,
          message: data.error || "Failed to dispatch test email.",
        });
      }
    } catch (err: unknown) {
      setTestMailStatus({
        success: false,
        message: err instanceof Error ? err.message : "Error sending test email.",
      });
    } finally {
      setSendingTestMail(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">
              SMTP Transport Configuration
            </h1>
            <p className="text-xs text-muted-foreground">
              Define the outbound email server used to dispatch personalized certificates directly to recipients.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Config Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-3 text-xs text-emerald-400">
                <ShieldCheck size={16} className="shrink-0" />
                <span>
                  SMTP passwords and API credentials are submitted securely to the local backend and never exposed in client bundles.
                </span>
              </div>

              {testResult && (
                <div
                  className={`mb-6 flex items-start gap-3 rounded-lg border p-3.5 text-xs ${
                    testResult.success
                      ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-300"
                      : "border-red-800/60 bg-red-950/30 text-red-300"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="font-semibold block mb-0.5">
                      {testResult.success ? "Connection Successful" : "Connection Failed"}
                    </span>
                    <span>{testResult.message}</span>
                  </div>
                </div>
              )}

              {savedSuccess && (
                <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-800/60 bg-emerald-950/30 p-3 text-xs text-emerald-300">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>Configuration saved successfully!</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Sender From Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CodeCraft Organizer"
                      value={config.fromName}
                      onChange={(e) =>
                        setConfig({ ...config, fromName: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Sender From Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. certificates@event.com"
                      value={config.fromEmail}
                      onChange={(e) =>
                        setConfig({ ...config, fromEmail: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      placeholder="smtp.gmail.com or smtp.mailgun.org"
                      value={config.host}
                      onChange={(e) =>
                        setConfig({ ...config, host: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      placeholder="587"
                      value={config.port}
                      onChange={(e) =>
                        setConfig({ ...config, port: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="secure-toggle"
                    checked={config.secure}
                    onChange={(e) =>
                      setConfig({ ...config, secure: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border bg-background text-zinc-900 focus:ring-zinc-500"
                  />
                  <label
                    htmlFor="secure-toggle"
                    className="text-xs text-foreground cursor-pointer"
                  >
                    Use TLS/SSL Encryption (Required for Port 465)
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      SMTP Username
                    </label>
                    <input
                      type="text"
                      placeholder="Username / API Key"
                      value={config.user}
                      onChange={(e) =>
                        setConfig({ ...config, user: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      SMTP Password / App Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={config.pass}
                      onChange={(e) =>
                        setConfig({ ...config, pass: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing || !config.host}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-zinc-900 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {testing ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Server size={15} />
                    )}
                    {testing ? "Testing Connection..." : "Test Connection"}
                  </button>

                  <button
                    type="submit"
                    className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
                  >
                    Save Settings
                  </button>
                </div>
              </form>
            </div>

            {/* Test Email Dispatch Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Send size={16} />
                Send Test Email
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Dispatch an actual live verification message to confirm deliverability and inbox filtering.
              </p>

              {testMailStatus && (
                <div
                  className={`mt-4 flex items-start gap-3 rounded-lg border p-3.5 text-xs ${
                    testMailStatus.success
                      ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-300"
                      : "border-red-800/60 bg-red-950/30 text-red-300"
                  }`}
                >
                  {testMailStatus.success ? (
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  )}
                  <span>{testMailStatus.message}</span>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  placeholder="Enter your personal email address"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestMail || !testRecipient || !config.host}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-foreground hover:bg-zinc-700 disabled:opacity-50"
                >
                  {sendingTestMail ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  {sendingTestMail ? "Sending..." : "Send Test Email"}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Guide & Presets */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <HelpCircle size={15} />
                Common Provider Configurations
              </h3>

              <div className="mt-3 space-y-3 text-xs text-muted-foreground">
                <div className="rounded-lg border border-border/60 bg-zinc-900/50 p-3">
                  <div className="font-medium text-foreground">Gmail / Google Workspace</div>
                  <div className="mt-1">Host: <code className="text-zinc-300">smtp.gmail.com</code></div>
                  <div>Port: <code className="text-zinc-300">587</code> (STARTTLS) or <code className="text-zinc-300">465</code> (SSL)</div>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    *Requires a 16-character Google <em>App Password</em> (under Google Account Security).
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-zinc-900/50 p-3">
                  <div className="font-medium text-foreground">SendGrid</div>
                  <div className="mt-1">Host: <code className="text-zinc-300">smtp.sendgrid.net</code></div>
                  <div>Port: <code className="text-zinc-300">587</code></div>
                  <div>User: <code className="text-zinc-300">apikey</code></div>
                </div>

                <div className="rounded-lg border border-border/60 bg-zinc-900/50 p-3">
                  <div className="font-medium text-foreground">Mailgun</div>
                  <div className="mt-1">Host: <code className="text-zinc-300">smtp.mailgun.org</code></div>
                  <div>Port: <code className="text-zinc-300">587</code></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
