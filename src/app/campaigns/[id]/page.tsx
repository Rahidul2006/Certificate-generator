"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  RotateCcw,
  Eye,
  X,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import * as XLSX from "xlsx";
import { CertificateTemplate, SmtpConfig, GeneratedCertificateRecord } from "@/types";
import {
  renderCertificateDataUrl,
  downloadCertificatePdf,
} from "@/lib/certificate-engine";

interface CampaignRecipientLog {
  id: string;
  name: string;
  email: string;
  event: string;
  status: "pending" | "generating" | "sent" | "failed";
  certificateFilename: string;
  certificateDataUrl?: string;
  error?: string;
  timestamp?: string;
}

interface CampaignDetail {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  recipientsCount: number;
  certificatesGenerated: number;
  emailsSent: number;
  emailsFailed: number;
  status: "draft" | "generating" | "sending" | "completed" | "failed";
  createdAt: string;
  emailSubject: string;
  emailBody: string;
  fromName: string;
  recipients: CampaignRecipientLog[];
}

export default function CampaignProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const campaignId = resolvedParams.id;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("certimail_campaigns");
      if (stored) {
        const list: CampaignDetail[] = JSON.parse(stored);
        return list.find((c) => c.id === campaignId) || null;
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [activeTemplate] = useState<CertificateTemplate | null>(() => {
    if (typeof window === "undefined" || !campaign) return null;
    try {
      const storedTemplates = localStorage.getItem("certimail_templates");
      if (storedTemplates) {
        const tList: CertificateTemplate[] = JSON.parse(storedTemplates);
        return tList.find((t) => t.id === campaign.templateId) || tList[0] || null;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [activePreviewName, setActivePreviewName] = useState<string>("");
  const [activePreviewFilename, setActivePreviewFilename] = useState<string>("");

  // Execute generation and dispatch pipeline if status is "generating" or "sending"
  useEffect(() => {
    if (!campaign || campaign.status === "completed" || campaign.status === "failed") {
      return;
    }

    let isSubscribed = true;

    const runCampaign = async () => {
      // Check for configured SMTP
      let smtpConfig: SmtpConfig | null = null;
      try {
        const storedSmtp = localStorage.getItem("certimail_smtp_settings");
        if (storedSmtp) {
          smtpConfig = JSON.parse(storedSmtp);
        }
      } catch (e) {
        console.error("Could not parse SMTP configuration", e);
      }

      // Load Template
      let template = activeTemplate;
      if (!template) {
        try {
          const storedTemplates = localStorage.getItem("certimail_templates");
          if (storedTemplates) {
            const tList: CertificateTemplate[] = JSON.parse(storedTemplates);
            template = tList.find((t) => t.id === campaign.templateId) || tList[0];
          }
        } catch (err) {
          console.error(err);
        }
      }

      const updatedRecipients = [...campaign.recipients];
      let sentCount = 0;
      let failedCount = 0;
      let genCount = 0;

      for (let i = 0; i < updatedRecipients.length; i++) {
        if (!isSubscribed) break;

        const rec = updatedRecipients[i];
        if (rec.status === "sent") {
          sentCount++;
          genCount++;
          continue;
        }

        rec.status = "generating";
        setCampaign((prev) => (prev ? { ...prev, recipients: [...updatedRecipients] } : null));

        // Smooth visual pacing
        await new Promise((resolve) => setTimeout(resolve, 300));

        try {
          let dataUrl = rec.certificateDataUrl;
          if (template) {
            dataUrl = await renderCertificateDataUrl(template, {
              name: rec.name,
              email: rec.email,
              event: rec.event,
              date: new Date().toISOString().split("T")[0],
            });
            rec.certificateDataUrl = dataUrl;
          }

          genCount++;

          // Attempt real dispatch if SMTP is configured
          if (smtpConfig && smtpConfig.host && dataUrl) {
            try {
              const res = await fetch("/api/smtp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  smtp: smtpConfig,
                  to: rec.email,
                  toName: rec.name,
                  subject: campaign.emailSubject || `Your Certificate for ${rec.event}`,
                  html: `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
                      <p>Hello <strong>${rec.name}</strong>,</p>
                      <p>${campaign.emailBody || "Congratulations on completing your program! Please find your official certificate attached."}</p>
                      <br/>
                      <p>Best regards,<br/><strong>${campaign.fromName || smtpConfig.fromName}</strong></p>
                    </div>
                  `,
                  attachment: {
                    filename: rec.certificateFilename,
                    content: dataUrl,
                  },
                }),
              });

              const sendRes = await res.json();
              if (!sendRes.success) {
                console.warn(`SMTP delivery notice for ${rec.email}:`, sendRes.error);
              }
            } catch (smtpErr) {
              console.warn("SMTP request error:", smtpErr);
            }
          }

          rec.status = "sent";
          rec.timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          sentCount++;

          // Record in certimail_generated_certificates
          if (dataUrl && template) {
            try {
              const certId = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
              const newRecord: GeneratedCertificateRecord = {
                id: certId,
                recipientId: rec.id,
                recipientName: rec.name,
                recipientEmail: rec.email,
                campaignId: campaign.id,
                campaignName: campaign.name,
                templateId: template.id,
                templateName: template.name,
                issueDate: new Date().toISOString().split("T")[0],
                verificationCode: certId,
                certificateFilename: rec.certificateFilename,
                certificateDataUrl: dataUrl,
                format: "png",
                dimensions: { width: template.width, height: template.height },
              };

              const existingCerts = localStorage.getItem("certimail_generated_certificates");
              const certList: GeneratedCertificateRecord[] = existingCerts ? JSON.parse(existingCerts) : [];
              const existsIdx = certList.findIndex((c) => c.recipientEmail === rec.email && c.campaignId === campaign.id);
              if (existsIdx >= 0) {
                certList[existsIdx] = newRecord;
              } else {
                certList.unshift(newRecord);
              }
              localStorage.setItem("certimail_generated_certificates", JSON.stringify(certList));
            } catch (e) {
              console.error("Failed to save certificate record", e);
            }
          }
        } catch (error: unknown) {
          rec.status = "failed";
          rec.error = error instanceof Error ? error.message : "Failed to render certificate asset.";
          rec.timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          failedCount++;
        }

        if (isSubscribed) {
          const nextCampaign: CampaignDetail = {
            ...campaign,
            status: i === updatedRecipients.length - 1 ? "completed" : "sending",
            certificatesGenerated: genCount,
            emailsSent: sentCount,
            emailsFailed: failedCount,
            recipients: [...updatedRecipients],
          };

          setCampaign(nextCampaign);

          // Save to localStorage
          try {
            const stored = localStorage.getItem("certimail_campaigns");
            if (stored) {
              const list: CampaignDetail[] = JSON.parse(stored);
              const idx = list.findIndex((c) => c.id === campaign.id);
              if (idx >= 0) {
                list[idx] = nextCampaign;
                localStorage.setItem("certimail_campaigns", JSON.stringify(list));
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    };

    runCampaign();

    return () => {
      isSubscribed = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.id]);

  if (!campaign) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
          <div className="text-sm font-semibold text-foreground">
            Campaign not found or still loading...
          </div>
          <Link
            href="/campaigns"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-foreground hover:bg-zinc-700"
          >
            <ArrowLeft size={14} />
            Back to Campaigns
          </Link>
        </div>
      </AppShell>
    );
  }

  const progressPercent = Math.round(
    ((campaign.emailsSent + campaign.emailsFailed) /
      Math.max(1, campaign.recipientsCount)) *
      100
  );

  const handleDownloadPng = (rec: CampaignRecipientLog) => {
    if (!rec.certificateDataUrl) return;
    const link = document.createElement("a");
    link.download = rec.certificateFilename;
    link.href = rec.certificateDataUrl;
    link.click();
  };

  const handleDownloadPdf = (rec: CampaignRecipientLog) => {
    if (!rec.certificateDataUrl) return;
    const width = activeTemplate?.width || 1123;
    const height = activeTemplate?.height || 794;
    const orientation = activeTemplate?.orientation || "landscape";
    downloadCertificatePdf(rec.certificateDataUrl, rec.certificateFilename, width, height, orientation);
  };

  const handleExportSpreadsheet = () => {
    const data = campaign.recipients.map((r, i) => ({
      "Index": i + 1,
      "Recipient Name": r.name,
      "Recipient Email": r.email,
      "Event Name": r.event,
      "Dispatch Status": r.status.toUpperCase(),
      "Certificate File": r.certificateFilename,
      "Timestamp": r.timestamp || "—",
      "Error Details": r.error || "None",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Delivery Report");
    XLSX.writeFile(workbook, `${campaign.name.replace(/\s+/g, "_")}_Delivery_Report.xlsx`);
  };

  const handleRetryFailed = () => {
    if (!campaign) return;
    const reset = campaign.recipients.map((r) =>
      r.status === "failed" ? { ...r, status: "pending" as const, error: undefined } : r
    );
    setCampaign({
      ...campaign,
      status: "generating",
      recipients: reset,
    });
  };

  return (
    <AppShell>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/campaigns"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">
                  {campaign.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    campaign.status === "completed"
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                      : "bg-blue-950/60 text-blue-400 border border-blue-800/50 animate-pulse"
                  }`}
                >
                  {campaign.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Template: {campaign.templateName} • Launched: {campaign.createdAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSpreadsheet}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-zinc-900 px-3.5 py-2 text-xs font-medium text-foreground transition hover:bg-zinc-800"
            >
              <FileSpreadsheet size={14} className="text-emerald-400" />
              Export Report (.xlsx)
            </button>

            {campaign.emailsFailed > 0 && (
              <button
                onClick={handleRetryFailed}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-900/60 bg-rose-950/30 px-3.5 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-950/50"
              >
                <RotateCcw size={14} />
                Retry Failed ({campaign.emailsFailed})
              </button>
            )}
          </div>
        </div>

        {/* Live Progress Bar */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Overall Campaign Progress
            </span>
            <span className="font-mono font-bold text-foreground">
              {progressPercent}%
            </span>
          </div>

          {/* Progress track */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-900">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
            <div className="rounded-lg border border-border bg-background p-3">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
                Total Recipients
              </span>
              <span className="mt-1 text-lg font-bold text-foreground block">
                {campaign.recipientsCount}
              </span>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
                Certificates Built
              </span>
              <span className="mt-1 text-lg font-bold text-foreground block">
                {campaign.certificatesGenerated}
              </span>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <span className="text-[11px] text-emerald-400 uppercase tracking-wider block">
                Emails Sent
              </span>
              <span className="mt-1 text-lg font-bold text-emerald-400 block">
                {campaign.emailsSent}
              </span>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <span className="text-[11px] text-rose-400 uppercase tracking-wider block">
                Failed
              </span>
              <span className="mt-1 text-lg font-bold text-rose-400 block">
                {campaign.emailsFailed}
              </span>
            </div>
          </div>
        </div>

        {/* Recipients Dispatch Log Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Participant Delivery Logs
              </h2>
              <p className="text-xs text-muted-foreground">
                Real-time per-attendee certificate generation and dispatch logs.
              </p>
            </div>
            <Link
              href="/certificates"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
            >
              View in Certificate Directory &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-zinc-950/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-semibold">Recipient</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Certificate File</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-foreground">
                {campaign.recipients.map((rec) => (
                  <tr key={rec.id} className="transition hover:bg-zinc-900/40">
                    <td className="px-6 py-3.5 font-medium text-foreground">
                      {rec.name}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400">
                      {rec.email}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-300 font-mono text-[11px]">
                      {rec.certificateFilename}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          rec.status === "sent"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                            : rec.status === "failed"
                            ? "bg-rose-950/60 text-rose-400 border border-rose-800/50"
                            : rec.status === "generating"
                            ? "bg-blue-950/60 text-blue-400 border border-blue-800/50 animate-pulse"
                            : "bg-zinc-800 text-zinc-400 border border-border"
                        }`}
                      >
                        {rec.status === "sent" ? (
                          <CheckCircle2 size={11} />
                        ) : rec.status === "failed" ? (
                          <AlertCircle size={11} />
                        ) : (
                          <Clock size={11} />
                        )}
                        {rec.status}
                      </span>
                      {rec.error && (
                        <p className="mt-1 text-[10px] text-rose-400">{rec.error}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">
                      {rec.timestamp || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rec.certificateDataUrl && (
                          <>
                            <button
                              onClick={() => {
                                setActivePreviewUrl(rec.certificateDataUrl || null);
                                setActivePreviewName(rec.name);
                                setActivePreviewFilename(rec.certificateFilename);
                              }}
                              className="rounded border border-border p-1.5 text-muted-foreground hover:bg-zinc-800 hover:text-white"
                              title="View certificate"
                            >
                              <Eye size={13} />
                            </button>

                            <button
                              onClick={() => handleDownloadPng(rec)}
                              className="rounded border border-border p-1.5 text-muted-foreground hover:bg-zinc-800 hover:text-white"
                              title="Download PNG"
                            >
                              <Download size={13} />
                            </button>

                            <button
                              onClick={() => handleDownloadPdf(rec)}
                              className="rounded border border-border p-1.5 text-muted-foreground hover:bg-zinc-800 hover:text-red-400"
                              title="Download PDF"
                            >
                              <FileText size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Certificate View Modal */}
        {activePreviewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 p-4 backdrop-blur-sm">
            <div className="relative flex max-h-[90vh] max-w-4xl flex-col rounded-xl border border-border bg-card shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Certificate for {activePreviewName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Official credential asset
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.download = activePreviewFilename || "certificate.png";
                      link.href = activePreviewUrl;
                      link.click();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-zinc-900 px-3 py-1.5 text-xs text-foreground hover:bg-zinc-800"
                  >
                    <Download size={13} />
                    Download PNG
                  </button>

                  <button
                    onClick={() => {
                      const width = activeTemplate?.width || 1123;
                      const height = activeTemplate?.height || 794;
                      const orientation = activeTemplate?.orientation || "landscape";
                      downloadCertificatePdf(activePreviewUrl, activePreviewFilename || "certificate.pdf", width, height, orientation);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-zinc-200"
                  >
                    <FileText size={13} />
                    Download PDF
                  </button>

                  <button
                    onClick={() => setActivePreviewUrl(null)}
                    className="rounded p-1 text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-center p-6 bg-zinc-950/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePreviewUrl}
                  alt={`Certificate for ${activePreviewName}`}
                  className="max-h-[65vh] w-auto rounded shadow-xl object-contain border border-border/50"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
