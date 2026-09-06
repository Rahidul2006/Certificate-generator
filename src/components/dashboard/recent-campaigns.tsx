import Link from "next/link";
import { Send, Plus, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";

export interface CampaignSummary {
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

interface RecentCampaignsProps {
  campaigns?: CampaignSummary[];
}

export function RecentCampaigns({ campaigns = [] }: RecentCampaignsProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Recent Campaigns
          </h2>
          <p className="text-xs text-muted-foreground">
            Monitor certificate generation and delivery campaigns.
          </p>
        </div>
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          View all
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="p-8">
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-zinc-900/20 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-zinc-900 text-muted-foreground">
              <Send size={20} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              No campaigns launched yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Select a certificate template and upload an attendee list to launch your first delivery run.
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/campaigns/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-200"
              >
                <Plus size={13} />
                Create Campaign
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-zinc-950/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold">Campaign</th>
                <th className="px-4 py-3 font-semibold">Recipients</th>
                <th className="px-4 py-3 font-semibold">Certificates</th>
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
                  <td className="px-6 py-3.5">
                    <div className="font-medium text-foreground">{camp.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {camp.templateName}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">{camp.recipientsCount}</td>
                  <td className="px-4 py-3.5">{camp.certificatesGenerated}</td>
                  <td className="px-4 py-3.5 text-emerald-400 font-medium">
                    {camp.emailsSent}
                  </td>
                  <td className="px-4 py-3.5 text-rose-400 font-medium">
                    {camp.emailsFailed}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        camp.status === "completed"
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                          : camp.status === "sending"
                          ? "bg-blue-950/60 text-blue-400 border border-blue-800/50"
                          : "bg-zinc-800 text-zinc-400 border border-border"
                      }`}
                    >
                      {camp.status === "completed" ? (
                        <CheckCircle2 size={10} />
                      ) : (
                        <Clock size={10} />
                      )}
                      {camp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground font-mono text-[11px]">
                    {camp.createdAt}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link
                      href={`/campaigns/${camp.id}`}
                      className="rounded border border-border bg-zinc-900 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-zinc-800"
                    >
                      View Logs
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
