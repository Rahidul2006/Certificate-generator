"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Server,
  Send,
  Variable,
  CheckCircle2,
} from "lucide-react";
import { CertificateTemplate } from "@/types";
import { renderCertificateDataUrl } from "@/lib/certificate-engine";

interface RecipientItem {
  id: string;
  name: string;
  email: string;
  event: string;
  date?: string;
  position?: string;
  [key: string]: string | undefined;
}

export function CampaignWizard() {
  const router = useRouter();

  // Wizard Steps
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Campaign Info
  const [campaignName, setCampaignName] = useState("CodeCraft 2026 Certificate Delivery");
  const [campaignDescription, setCampaignDescription] = useState(
    "Automated certificate generation and email dispatch for event participants."
  );

  // Step 2: Template Selection
  const [templates] = useState<CertificateTemplate[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("certimail_templates");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    return templates[0]?.id || "";
  });

  // Step 3: Recipients
  const [recipients] = useState<RecipientItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("certimail_recipients");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>(() => {
    return recipients.map((r) => r.id);
  });

  // Step 4: Variable Mapping
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const templateVariables = selectedTemplate?.variables || ["name", "event", "date"];
  const [variableMap, setVariableMap] = useState<Record<string, string>>({
    name: "name",
    email: "email",
    event: "event",
    date: "date",
    position: "position",
  });

  // Step 5: Preview
  const [previewRecipientIdx, setPreviewRecipientIdx] = useState(0);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Step 6: Email Composer
  const [fromName, setFromName] = useState("CertiMail Team");
  const [emailSubject, setEmailSubject] = useState("Certificate of Participation — {{event}}");
  const [emailBody, setEmailBody] = useState(
    "Hello {{name}},\n\nCongratulations on completing {{event}}!\n\nPlease find your official certificate of achievement attached to this email.\n\nBest regards,\nCertiMail Team"
  );

  // Step 7: SMTP Config
  const [smtpAccount, setSmtpAccount] = useState("default-smtp");

  // Step 8: Launching
  const [isLaunching, setIsLaunching] = useState(false);

  const steps = [
    { num: 1, label: "Info" },
    { num: 2, label: "Template" },
    { num: 3, label: "Recipients" },
    { num: 4, label: "Mapping" },
    { num: 5, label: "Preview" },
    { num: 6, label: "Email" },
    { num: 7, label: "SMTP" },
    { num: 8, label: "Review & Send" },
  ];

  const handleNext = async () => {
    if (currentStep === 4) {
      // Generate live preview when moving to step 5
      setIsPreviewLoading(true);
      setCurrentStep(5);
      try {
        const targetRec = recipients[previewRecipientIdx] || {
          name: "Rahidul Khan",
          event: "CodeCraft Hackathon",
          date: "2026-09-05",
        };
        if (selectedTemplate) {
          const url = await renderCertificateDataUrl(
            selectedTemplate,
            targetRec as Record<string, string>
          );
          setPreviewDataUrl(url);
        }
      } catch (err) {
        console.error("Preview render failed:", err);
      } finally {
        setIsPreviewLoading(false);
      }
      return;
    }

    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleLaunchCampaign = () => {
    setIsLaunching(true);

    const activeRecipients = recipients.filter((r) =>
      selectedRecipientIds.includes(r.id)
    );

    const campaignId = `camp-${Date.now()}`;
    const newCampaign = {
      id: campaignId,
      name: campaignName,
      templateId: selectedTemplateId,
      templateName: selectedTemplate?.name || "Certificate Template",
      recipientsCount: activeRecipients.length,
      certificatesGenerated: 0,
      emailsSent: 0,
      emailsFailed: 0,
      status: "generating",
      createdAt: new Date().toISOString().split("T")[0],
      emailSubject,
      emailBody,
      fromName,
      recipients: activeRecipients.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        event: r.event,
        status: "pending",
        certificateFilename: `${r.name.replace(/\s+/g, "_")}_Certificate.png`,
      })),
    };

    try {
      const stored = localStorage.getItem("certimail_campaigns");
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newCampaign);
      localStorage.setItem("certimail_campaigns", JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }

    // Direct to the live campaign status page
    router.push(`/campaigns/${campaignId}`);
  };

  return (
    <AppShell>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Topbar navigation */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/campaigns"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">
                Create Certificate Campaign
              </h1>
              <p className="text-xs text-muted-foreground">
                Step {currentStep} of 8: {steps[currentStep - 1]?.label}
              </p>
            </div>
          </div>
        </div>

        {/* Step Progress Pills */}
        <div className="mb-8 flex overflow-x-auto border-b border-border/80 pb-3">
          <div className="flex items-center gap-1 sm:gap-2">
            {steps.map((s) => {
              const isPast = s.num < currentStep;
              const isCurrent = s.num === currentStep;
              return (
                <div key={s.num} className="flex items-center gap-2">
                  <button
                    onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                    disabled={s.num > currentStep}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      isCurrent
                        ? "border border-zinc-700 bg-zinc-800 text-foreground"
                        : isPast
                        ? "text-zinc-300 hover:text-white"
                        : "text-zinc-600 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                        isPast
                          ? "bg-emerald-500 text-zinc-950 font-bold"
                          : isCurrent
                          ? "bg-white text-zinc-950 font-bold"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {isPast ? <Check size={10} /> : s.num}
                    </span>
                    <span className="hidden md:inline">{s.label}</span>
                  </button>
                  {s.num < steps.length && (
                    <ChevronRight size={12} className="text-zinc-700" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Container */}
        <div className="max-w-4xl rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* STEP 1: CAMPAIGN INFO */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">
                Campaign Information
              </h2>
              <p className="text-xs text-muted-foreground">
                Give your certificate delivery campaign a distinct title and description.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={campaignDescription}
                    onChange={(e) => setCampaignDescription(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT TEMPLATE */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">
                Select Certificate Template
              </h2>
              <p className="text-xs text-muted-foreground">
                Choose the certificate layout to personalize for your recipients.
              </p>

              {templates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                  No templates found. Please create a template in the Certificate Editor first.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  {templates.map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`cursor-pointer rounded-xl border p-4 transition ${
                          isSelected
                            ? "border-zinc-300 bg-zinc-900/90 shadow-md"
                            : "border-border bg-background/50 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">
                            {tpl.name}
                          </span>
                          {isSelected && (
                            <CheckCircle2 size={16} className="text-emerald-400" />
                          )}
                        </div>
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          Dimensions: {tpl.width} × {tpl.height}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {tpl.variables?.map((v) => (
                            <span
                              key={v}
                              className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300"
                            >
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: RECIPIENTS */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Select Attendees ({selectedRecipientIds.length} Selected)
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Choose participants who will receive their personalized certificate.
                  </p>
                </div>
                <Link
                  href="/recipients"
                  target="_blank"
                  className="text-xs text-blue-400 hover:underline"
                >
                  Manage / Import More
                </Link>
              </div>

              <div className="max-h-80 overflow-y-auto rounded-lg border border-border bg-background">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-zinc-950/40 text-muted-foreground">
                    <tr>
                      <th className="w-10 px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={
                            selectedRecipientIds.length > 0 &&
                            selectedRecipientIds.length === recipients.length
                          }
                          onChange={() => {
                            if (selectedRecipientIds.length === recipients.length) {
                              setSelectedRecipientIds([]);
                            } else {
                              setSelectedRecipientIds(recipients.map((r) => r.id));
                            }
                          }}
                        />
                      </th>
                      <th className="px-4 py-2.5 font-semibold">Name</th>
                      <th className="px-4 py-2.5 font-semibold">Email</th>
                      <th className="px-4 py-2.5 font-semibold">Event</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {recipients.map((r) => {
                      const isChecked = selectedRecipientIds.includes(r.id);
                      return (
                        <tr key={r.id} className="hover:bg-zinc-900/30">
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setSelectedRecipientIds((prev) =>
                                  prev.includes(r.id)
                                    ? prev.filter((id) => id !== r.id)
                                    : [...prev, r.id]
                                )
                              }
                            />
                          </td>
                          <td className="px-4 py-2 font-medium text-foreground">
                            {r.name}
                          </td>
                          <td className="px-4 py-2 font-mono text-zinc-400">
                            {r.email}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {r.event}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: VARIABLE MAPPING */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">
                Map Certificate Variables
              </h2>
              <p className="text-xs text-muted-foreground">
                Connect the template placeholders with participant properties.
              </p>

              <div className="space-y-2 rounded-lg border border-border bg-background p-4">
                {templateVariables.map((variableKey) => (
                  <div
                    key={variableKey}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <div className="flex items-center gap-2">
                      <Variable size={13} className="text-blue-400" />
                      <span className="font-mono text-foreground font-semibold">
                        {`{{${variableKey}}}`}
                      </span>
                    </div>
                    <select
                      value={variableMap[variableKey] || variableKey}
                      onChange={(e) =>
                        setVariableMap((prev) => ({
                          ...prev,
                          [variableKey]: e.target.value,
                        }))
                      }
                      className="w-48 rounded border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:outline-none"
                    >
                      <option value="name">Recipient Name</option>
                      <option value="email">Email Address</option>
                      <option value="event">Event Name</option>
                      <option value="date">Date</option>
                      <option value="position">Position / Rank</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: PREVIEW */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Personalized Certificate Preview
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Testing variable interpolation for:{" "}
                    <span className="font-semibold text-white">
                      {recipients[previewRecipientIdx]?.name || "Participant"}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={async () => {
                      const next =
                        previewRecipientIdx > 0
                          ? previewRecipientIdx - 1
                          : recipients.length - 1;
                      setPreviewRecipientIdx(next);
                      if (selectedTemplate && recipients[next]) {
                        const url = await renderCertificateDataUrl(
                          selectedTemplate,
                          recipients[next] as Record<string, string>
                        );
                        setPreviewDataUrl(url);
                      }
                    }}
                    className="rounded border border-border bg-zinc-900 px-2 py-1 text-muted-foreground hover:text-white"
                  >
                    Prev
                  </button>
                  <span className="text-muted-foreground">
                    {previewRecipientIdx + 1} of {recipients.length}
                  </span>
                  <button
                    onClick={async () => {
                      const next =
                        previewRecipientIdx < recipients.length - 1
                          ? previewRecipientIdx + 1
                          : 0;
                      setPreviewRecipientIdx(next);
                      if (selectedTemplate && recipients[next]) {
                        const url = await renderCertificateDataUrl(
                          selectedTemplate,
                          recipients[next] as Record<string, string>
                        );
                        setPreviewDataUrl(url);
                      }
                    }}
                    className="rounded border border-border bg-zinc-900 px-2 py-1 text-muted-foreground hover:text-white"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-border bg-zinc-950 p-4">
                {isPreviewLoading ? (
                  <span className="text-xs text-muted-foreground">
                    Rendering high-resolution preview...
                  </span>
                ) : previewDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewDataUrl}
                    alt="Certificate Preview"
                    className="max-h-72 w-auto object-contain rounded shadow-lg"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Preview generated.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: EMAIL COMPOSER */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">
                Email Message Composer
              </h2>
              <p className="text-xs text-muted-foreground">
                Craft the personalized email accompanying each attendee&apos;s certificate attachment.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    Sender From Name
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-zinc-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">
                      Email Body
                    </label>
                    <div className="flex gap-1.5">
                      {["{{name}}", "{{event}}", "{{date}}"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setEmailBody((prev) => `${prev} ${t}`)}
                          className="rounded border border-border bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 hover:text-white"
                        >
                          +{t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-zinc-500 focus:outline-none font-sans"
                  />
                </div>

                <div className="rounded-lg border border-border/80 bg-zinc-900/30 p-3 text-xs text-muted-foreground">
                  Attachment: <span className="text-white font-mono">[Participant_Name]_Certificate.png</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: SMTP CONFIG */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">
                SMTP Sender Configuration
              </h2>
              <p className="text-xs text-muted-foreground">
                Choose the outbound email server responsible for transmitting the certificates.
              </p>

              <div className="space-y-3 pt-2">
                <div
                  onClick={() => setSmtpAccount("default-smtp")}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    smtpAccount === "default-smtp"
                      ? "border-zinc-300 bg-zinc-900/90"
                      : "border-border bg-background/50 hover:border-zinc-700"
                  }`}
                >
                  <Server size={18} className="mt-0.5 text-zinc-400" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      Default CertiMail Cloud Sender
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reliable simulated relay with detailed dispatch metrics and retry policies.
                    </p>
                  </div>
                </div>

                <Link
                  href="/settings/smtp"
                  target="_blank"
                  className="inline-block text-xs text-blue-400 hover:underline"
                >
                  Configure Custom SMTP Server (Gmail / SES / SendGrid) →
                </Link>
              </div>
            </div>
          )}

          {/* STEP 8: REVIEW & DISPATCH */}
          {currentStep === 8 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-foreground">
                Review & Confirm Dispatch
              </h2>
              <p className="text-xs text-muted-foreground">
                Verify campaign details before starting the automated certificate generation and bulk sending pipeline.
              </p>

              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-lg border border-border bg-background p-3">
                  <span className="text-muted-foreground block mb-1">Campaign</span>
                  <span className="font-semibold text-foreground">{campaignName}</span>
                </div>

                <div className="rounded-lg border border-border bg-background p-3">
                  <span className="text-muted-foreground block mb-1">Template</span>
                  <span className="font-semibold text-foreground">
                    {selectedTemplate?.name || "Certificate Template"}
                  </span>
                </div>

                <div className="rounded-lg border border-border bg-background p-3">
                  <span className="text-muted-foreground block mb-1">Recipients</span>
                  <span className="font-semibold text-emerald-400">
                    {selectedRecipientIds.length} Verified Participants
                  </span>
                </div>

                <div className="rounded-lg border border-border bg-background p-3">
                  <span className="text-muted-foreground block mb-1">Subject</span>
                  <span className="font-semibold text-foreground">{emailSubject}</span>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-4 text-xs text-emerald-300">
                Each participant will receive their exact personalized certificate generated at 1:1 original scale.
              </div>
            </div>
          )}

          {/* Wizard Footer Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              disabled={currentStep === 1 || isLaunching}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-zinc-800 hover:text-foreground disabled:opacity-30"
            >
              Previous
            </button>

            {currentStep < 8 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-200"
              >
                Next Step
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLaunchCampaign}
                disabled={isLaunching}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                <Send size={14} />
                Launch Campaign
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function NewCampaignPage() {
  return <CampaignWizard />;
}
