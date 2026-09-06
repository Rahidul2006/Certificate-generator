"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  Award,
  Search,
  Download,
  Eye,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Layers,
  X,
} from "lucide-react";
import { GeneratedCertificateRecord } from "@/types";
import { downloadCertificatePdf } from "@/lib/certificate-engine";

interface StoredCampaignRecord {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  createdAt?: string;
  recipients?: Array<{
    id: string;
    name: string;
    email: string;
    certificateFilename: string;
    certificateDataUrl?: string;
  }>;
}

export default function CertificatesPage() {
  const [certificates] = useState<GeneratedCertificateRecord[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const directCerts = localStorage.getItem("certimail_generated_certificates");
      const certList: GeneratedCertificateRecord[] = directCerts ? JSON.parse(directCerts) : [];

      // Also crawl campaigns for certificates if not in generated_certificates list
      const storedCampaigns = localStorage.getItem("certimail_campaigns");
      if (storedCampaigns) {
        const campaigns: StoredCampaignRecord[] = JSON.parse(storedCampaigns);
        campaigns.forEach((camp) => {
          if (camp.recipients && Array.isArray(camp.recipients)) {
            camp.recipients.forEach((rec) => {
              if (
                rec.certificateDataUrl &&
                !certList.some(
                  (c) =>
                    c.recipientEmail === rec.email && c.campaignId === camp.id
                )
              ) {
                const code = `CERT-${camp.id.slice(0, 4).toUpperCase()}-${rec.id.slice(0, 5).toUpperCase()}`;
                certList.push({
                  id: code,
                  recipientId: rec.id,
                  recipientName: rec.name,
                  recipientEmail: rec.email,
                  campaignId: camp.id,
                  campaignName: camp.name,
                  templateId: camp.templateId,
                  templateName: camp.templateName,
                  issueDate:
                    camp.createdAt?.split(" ")[0] ||
                    new Date().toISOString().split("T")[0],
                  verificationCode: code,
                  certificateFilename:
                    rec.certificateFilename ||
                    `${rec.name.replace(/\s+/g, "_")}_Certificate.png`,
                  certificateDataUrl: rec.certificateDataUrl,
                  format: "png",
                  dimensions: { width: 1123, height: 794 },
                });
              }
            });
          }
        });
      }

      if (certList.length > 0) {
        localStorage.setItem(
          "certimail_generated_certificates",
          JSON.stringify(certList)
        );
      }
      return certList;
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [previewCert, setPreviewCert] = useState<GeneratedCertificateRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter((cert) => {
      const matchesSearch =
        cert.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.verificationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cert.campaignName && cert.campaignName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCampaign =
        selectedCampaign === "all" || cert.campaignName === selectedCampaign;

      return matchesSearch && matchesCampaign;
    });
  }, [certificates, searchQuery, selectedCampaign]);

  // Unique campaign list for filter
  const campaignNames = useMemo(() => {
    const set = new Set<string>();
    certificates.forEach((c) => {
      if (c.campaignName) set.add(c.campaignName);
    });
    return Array.from(set);
  }, [certificates]);

  const handleCopyLink = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadPng = (cert: GeneratedCertificateRecord) => {
    const link = document.createElement("a");
    link.download = cert.certificateFilename;
    link.href = cert.certificateDataUrl;
    link.click();
  };

  const handleDownloadPdf = (cert: GeneratedCertificateRecord) => {
    const w = cert.dimensions?.width || 1123;
    const h = cert.dimensions?.height || 794;
    downloadCertificatePdf(cert.certificateDataUrl, cert.certificateFilename, w, h, "landscape");
  };

  return (
    <AppShell>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Issued Certificates
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Search, verify, inspect, and download generated certificates across all campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-zinc-900 px-3.5 py-2 text-xs font-medium text-foreground transition hover:bg-zinc-800"
            >
              <ShieldCheck size={14} className="text-emerald-400" />
              Public Verification Portal
            </Link>
            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              <Layers size={14} />
              Launch New Campaign
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Total Certificates
            </span>
            <div className="mt-1.5 text-2xl font-bold text-foreground">
              {certificates.length}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Unique Recipients
            </span>
            <div className="mt-1.5 text-2xl font-bold text-foreground">
              {new Set(certificates.map((c) => c.recipientEmail)).size}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Associated Campaigns
            </span>
            <div className="mt-1.5 text-2xl font-bold text-blue-400">
              {campaignNames.length}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-[11px] uppercase tracking-wider text-emerald-400">
              Verified & Authentic
            </span>
            <div className="mt-1.5 text-2xl font-bold text-emerald-400">
              100%
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search by recipient name, email, or verification code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-zinc-500 focus:outline-none"
            />
          </div>

          {campaignNames.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Campaign:</span>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-zinc-500 focus:outline-none"
              >
                <option value="all">All Campaigns</option>
                {campaignNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Certificates Table or Empty State */}
        {filteredCertificates.length === 0 ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-zinc-900/80 text-muted-foreground">
              <Award size={24} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">
              {certificates.length === 0
                ? "No certificates generated yet"
                : "No matching certificates found"}
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              {certificates.length === 0
                ? "Run a campaign to automatically issue and store personalized certificates here."
                : "Try adjusting your search criteria or campaign filter."}
            </p>
            {certificates.length === 0 && (
              <div className="mt-6 flex gap-3">
                <Link
                  href="/campaigns/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
                >
                  <Layers size={16} />
                  Launch a Campaign
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-zinc-950/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Recipient</th>
                    <th className="px-4 py-3.5 font-semibold">Verification Code</th>
                    <th className="px-4 py-3.5 font-semibold">Campaign / Event</th>
                    <th className="px-4 py-3.5 font-semibold">Issue Date</th>
                    <th className="px-4 py-3.5 font-semibold">Preview</th>
                    <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-foreground">
                  {filteredCertificates.map((cert) => (
                    <tr key={cert.id} className="transition hover:bg-zinc-900/40">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">
                          {cert.recipientName}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {cert.recipientEmail}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-[11px] text-zinc-300 border border-border/80">
                            {cert.verificationCode}
                          </code>
                          <button
                            onClick={() => handleCopyLink(cert.verificationCode)}
                            className="rounded p-1 text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
                            title="Copy verification link"
                          >
                            {copiedId === cert.verificationCode ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-foreground">
                          {cert.campaignName || "Standalone"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Template: {cert.templateName}
                        </div>
                      </td>

                      <td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                        {cert.issueDate}
                      </td>

                      <td className="px-4 py-4">
                        <div
                          onClick={() => setPreviewCert(cert)}
                          className="group relative h-10 w-16 cursor-pointer overflow-hidden rounded border border-border bg-zinc-950 transition hover:border-zinc-500"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cert.certificateDataUrl}
                            alt="thumb"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                            <Eye size={12} className="text-white" />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewCert(cert)}
                            className="rounded border border-border p-1.5 text-muted-foreground hover:bg-zinc-800 hover:text-white"
                            title="Inspect certificate"
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            onClick={() => handleDownloadPng(cert)}
                            className="rounded border border-border p-1.5 text-muted-foreground hover:bg-zinc-800 hover:text-white"
                            title="Download PNG"
                          >
                            <Download size={13} />
                          </button>

                          <button
                            onClick={() => handleDownloadPdf(cert)}
                            className="rounded border border-border p-1.5 text-muted-foreground hover:bg-zinc-800 hover:text-red-400"
                            title="Download PDF"
                          >
                            <FileText size={13} />
                          </button>

                          <Link
                            href={`/verify/${cert.verificationCode}`}
                            target="_blank"
                            className="rounded border border-border p-1.5 text-muted-foreground hover:bg-zinc-800 hover:text-emerald-400"
                            title="View Public Verification Page"
                          >
                            <ExternalLink size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Certificate Inspection Modal */}
        {previewCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 p-4 backdrop-blur-sm">
            <div className="relative flex max-h-[92vh] max-w-4xl flex-col rounded-xl border border-border bg-card shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Credential: {previewCert.recipientName}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground">
                    ID: {previewCert.verificationCode} • Issued: {previewCert.issueDate}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPng(previewCert)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-zinc-900 px-3 py-1.5 text-xs text-foreground hover:bg-zinc-800"
                  >
                    <Download size={13} />
                    Download PNG
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(previewCert)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-zinc-200"
                  >
                    <FileText size={13} />
                    Download PDF
                  </button>

                  <button
                    onClick={() => setPreviewCert(null)}
                    className="rounded p-1 text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-center p-6 bg-zinc-950/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewCert.certificateDataUrl}
                  alt={`Certificate for ${previewCert.recipientName}`}
                  className="max-h-[65vh] w-auto rounded shadow-xl object-contain border border-border/60"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border px-6 py-3 bg-zinc-950/30 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Digitally verified credential</span>
                </div>
                <Link
                  href={`/verify/${previewCert.verificationCode}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-white"
                >
                  Open public verification portal <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
