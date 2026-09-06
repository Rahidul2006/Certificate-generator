"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Award,
  Download,
  FileText,
  Copy,
  Check,
  ArrowLeft,
  AlertCircle,
  Calendar,
  User,
  Building,
} from "lucide-react";
import { GeneratedCertificateRecord } from "@/types";
import { downloadCertificatePdf } from "@/lib/certificate-engine";

interface StoredCampaign {
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

export default function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const certId = decodeURIComponent(resolvedParams.id).toUpperCase();

  const [cert] = useState<GeneratedCertificateRecord | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      // Look in generated certificates list
      const stored = localStorage.getItem("certimail_generated_certificates");
      if (stored) {
        const list: GeneratedCertificateRecord[] = JSON.parse(stored);
        const match = list.find(
          (c) =>
            c.verificationCode.toUpperCase() === certId ||
            c.id.toUpperCase() === certId ||
            c.id.toUpperCase().includes(certId)
        );
        if (match) {
          return match;
        }
      }

      // Look in campaigns
      const storedCampaigns = localStorage.getItem("certimail_campaigns");
      if (storedCampaigns) {
        const campaigns: StoredCampaign[] = JSON.parse(storedCampaigns);
        for (const camp of campaigns) {
          if (camp.recipients && Array.isArray(camp.recipients)) {
            const recMatch = camp.recipients.find(
              (r) =>
                r.id.toUpperCase().includes(certId) ||
                certId.includes(r.id.toUpperCase())
            );
            if (recMatch && recMatch.certificateDataUrl) {
              return {
                id: certId,
                recipientId: recMatch.id,
                recipientName: recMatch.name,
                recipientEmail: recMatch.email,
                campaignId: camp.id,
                campaignName: camp.name,
                templateId: camp.templateId,
                templateName: camp.templateName,
                issueDate:
                  camp.createdAt?.split(" ")[0] ||
                  new Date().toISOString().split("T")[0],
                verificationCode: certId,
                certificateFilename: recMatch.certificateFilename,
                certificateDataUrl: recMatch.certificateDataUrl,
                format: "png",
                dimensions: { width: 1123, height: 794 },
              };
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [copied, setCopied] = useState(false);

  const maskEmail = (email: string) => {
    const parts = email.split("@");
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    const maskedName =
      name.length > 2
        ? name.slice(0, 1) + "***" + name.slice(-1)
        : name.slice(0, 1) + "***";
    return `${maskedName}@${domain}`;
  };

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPng = () => {
    if (!cert) return;
    const link = document.createElement("a");
    link.download = cert.certificateFilename;
    link.href = cert.certificateDataUrl;
    link.click();
  };

  const handleDownloadPdf = () => {
    if (!cert) return;
    const w = cert.dimensions?.width || 1123;
    const h = cert.dimensions?.height || 794;
    downloadCertificatePdf(cert.certificateDataUrl, cert.certificateFilename, w, h, "landscape");
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
          href="/verify"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Verify Another
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-6 lg:p-12">
        {!cert ? (
          <div className="max-w-md text-center rounded-2xl border border-dashed border-border bg-card/50 p-8 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-red-900/50 bg-red-950/30 text-rose-400 mb-4">
              <AlertCircle size={22} />
            </div>
            <h2 className="text-lg font-bold text-foreground">Credential Not Found</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              We could not find an authentic certificate matching code:
              <br />
              <code className="mt-1 inline-block font-mono text-zinc-300 font-semibold">{certId}</code>
            </p>
            <div className="mt-6">
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-zinc-200"
              >
                Search Again
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl space-y-6">
            {/* Authenticity Verification Banner */}
            <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/20 p-6 backdrop-blur-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-700/60 text-emerald-400">
                    <ShieldCheck size={26} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-bold text-foreground sm:text-xl">
                        Verified & Authentic Credential
                      </h1>
                      <span className="rounded-full bg-emerald-950 border border-emerald-800/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                        Valid
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Issued via CertiMail Certified Credential System
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-zinc-900 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-zinc-800"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copied ? "Copied Link!" : "Share Link"}
                  </button>

                  <button
                    onClick={handleDownloadPng}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-zinc-900 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-zinc-800"
                  >
                    <Download size={13} />
                    PNG
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-medium text-zinc-950 hover:bg-zinc-200"
                  >
                    <FileText size={13} />
                    Download PDF
                  </button>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-emerald-900/40 pt-4 sm:grid-cols-4 text-xs">
                <div>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wider">
                    <User size={12} /> Recipient
                  </span>
                  <div className="mt-1 font-semibold text-foreground">
                    {cert.recipientName}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    {maskEmail(cert.recipientEmail)}
                  </div>
                </div>

                <div>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wider">
                    <Building size={12} /> Program / Event
                  </span>
                  <div className="mt-1 font-semibold text-foreground">
                    {cert.campaignName || "Official Program"}
                  </div>
                </div>

                <div>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wider">
                    <Calendar size={12} /> Issue Date
                  </span>
                  <div className="mt-1 font-semibold font-mono text-foreground">
                    {cert.issueDate}
                  </div>
                </div>

                <div>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wider">
                    <ShieldCheck size={12} /> Credential ID
                  </span>
                  <div className="mt-1 font-mono text-xs font-semibold text-zinc-300">
                    {cert.verificationCode}
                  </div>
                </div>
              </div>
            </div>

            {/* High Resolution Preview Card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl p-4 sm:p-8 flex items-center justify-center bg-zinc-950/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cert.certificateDataUrl}
                alt={`Certificate for ${cert.recipientName}`}
                className="max-h-[70vh] w-auto rounded-lg shadow-2xl object-contain border border-border/60"
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        CertiMail Credential Verification Service • Secure & Authenticated
      </footer>
    </div>
  );
}
