import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  Send,
  FileImage,
  Users,
  MailCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Upload,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentCampaigns } from "@/components/dashboard/recent-campaigns";

export default function DashboardPage() {
  const metrics = [
    {
      title: "Total Campaigns",
      value: "0",
      description: "0 active runs",
      icon: Send,
    },
    {
      title: "Certificates Generated",
      value: "0",
      description: "Across all designs",
      icon: FileImage,
    },
    {
      title: "Total Recipients",
      value: "0",
      description: "In participant directory",
      icon: Users,
    },
    {
      title: "Emails Sent",
      value: "0",
      description: "Delivered via SMTP",
      icon: MailCheck,
    },
    {
      title: "Successful Deliveries",
      value: "0",
      description: "100% health rate",
      icon: CheckCircle2,
      accentColor: "text-emerald-400",
    },
    {
      title: "Failed Emails",
      value: "0",
      description: "0 bounce errors",
      icon: AlertCircle,
      accentColor: "text-rose-400",
    },
  ];

  return (
    <AppShell>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Header & Quick Actions */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Automated certificate generation and personalized email delivery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/templates/new"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 shadow-xs"
            >
              <Plus size={15} />
              Create Certificate
            </Link>
            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-zinc-900 px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-zinc-800"
            >
              <Send size={15} />
              Create Campaign
            </Link>
            <Link
              href="/recipients"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-zinc-900 px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-zinc-800"
            >
              <Upload size={15} />
              Import Recipients
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metrics.map((item) => (
            <StatCard
              key={item.title}
              title={item.title}
              value={item.value}
              description={item.description}
              icon={item.icon}
              accentColor={item.accentColor}
            />
          ))}
        </div>

        {/* Recent Campaigns Section */}
        <div className="mt-8">
          <RecentCampaigns campaigns={[]} />
        </div>
      </div>
    </AppShell>
  );
}