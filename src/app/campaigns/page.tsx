"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Plus, Send, Clock, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

interface CampaignItem {
  id: string;
  name: string;
  templateName: string;
  recipientsCount: number;
  certificatesGenerated: number;
  emailsSent: number;
  emailsFailed: number;
  status: "draft" | "generating" | "sending" | "completed" | "failed";
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("certimail_campaigns");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleDelete = (id: string) => {
    const updated = campaigns.filter((c) => c.id !== id);
    setCampaigns(updated);
    try {
      localStorage.setItem("certimail_campaigns", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.emailsSent || 0), 0);
  const totalFailed = campaigns.reduce((acc, c) => acc + (c.emailsFailed || 0), 0);
  const totalActive = campaigns.filter(
    (c) => c.status === "generating" || c.status === "sending"
  ).length;

  return (
    <AppShell>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Campaigns
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Automate certificate issuance and bulk email delivery.
            </p>
          </div>

          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
          >
            <Plus size={16} />
            Create Campaign
          </Link>
        </div>

        {/* Quick Campaign Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Campaigns
              </span>
              <Send size={18} className="text-muted-foreground" />
            </div>
            <div className="mt-3 text-2xl font-bold text-foreground">
              {campaigns.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{totalActive} active</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Delivered
              </span>
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
            <div className="mt-3 text-2xl font-bold text-foreground">
              {totalDelivered}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Successfully sent</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                In Queue
              </span>
              <Clock size={18} className="text-amber-500" />
            </div>
            <div className="mt-3 text-2xl font-bold text-foreground">
              {totalActive}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Processing runs</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Failed
              </span>
              <AlertCircle size={18} className="text-rose-500" />
            </div>
            <div className="mt-3 text-2xl font-bold text-foreground">
              {totalFailed}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">0 bounce errors</p>
          </div>
        </div>

        {/* Campaign List or Empty state */}
        {campaigns.length === 0 ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-zinc-900/80 text-muted-foreground">
              <Send size={24} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">
              No certificate campaigns yet
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              Connect a certificate template with an attendee list and deliver personalized PDF/PNG certificates straight to participant inboxes.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/campaigns/new"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
              >
                <Plus size={16} />
                New Campaign
              </Link>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-zinc-900 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-zinc-800"
              >
                Manage Templates
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-zinc-950/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Campaign</th>
                    <th className="px-4 py-3 font-semibold">Template</th>
                    <th className="px-4 py-3 font-semibold">Recipients</th>
                    <th className="px-4 py-3 font-semibold">Sent</th>
                    <th className="px-4 py-3 font-semibold">Failed</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-foreground">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="transition hover:bg-zinc-900/40">
                      <td className="px-6 py-3.5 font-medium text-foreground">
                        <Link
                          href={`/campaigns/${camp.id}`}
                          className="hover:underline text-white"
                        >
                          {camp.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {camp.templateName}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-zinc-300">
                        {camp.recipientsCount}
                      </td>
                      <td className="px-4 py-3.5 text-emerald-400 font-medium font-mono">
                        {camp.emailsSent}
                      </td>
                      <td className="px-4 py-3.5 text-rose-400 font-medium font-mono">
                        {camp.emailsFailed}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            camp.status === "completed"
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                              : camp.status === "sending" || camp.status === "generating"
                              ? "bg-blue-950/60 text-blue-400 border border-blue-800/50"
                              : "bg-zinc-800 text-zinc-300 border border-border"
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-muted-foreground">
                        {camp.createdAt}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/campaigns/${camp.id}`}
                            className="rounded border border-border bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-zinc-800"
                          >
                            Live Progress
                          </Link>
                          <button
                            onClick={() => handleDelete(camp.id)}
                            className="rounded p-1 text-muted-foreground hover:bg-rose-950/50 hover:text-rose-400"
                            title="Delete campaign"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
