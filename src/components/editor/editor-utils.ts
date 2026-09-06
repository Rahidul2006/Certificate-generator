import { DocumentSizePreset, SampleRecipient, CertificateVariable } from "@/types";

export const DOCUMENT_PRESETS: DocumentSizePreset[] = [
  {
    id: "a4-landscape",
    name: "A4 Landscape",
    width: 3508,
    height: 2480,
    orientation: "landscape",
    description: "Standard Certificate (300 DPI, 297 × 210 mm)",
  },
  {
    id: "a4-portrait",
    name: "A4 Portrait",
    width: 2480,
    height: 3508,
    orientation: "portrait",
    description: "Vertical Certificate (300 DPI, 210 × 297 mm)",
  },
  {
    id: "a5-landscape",
    name: "A5 Landscape",
    width: 2480,
    height: 1748,
    orientation: "landscape",
    description: "Compact Award (300 DPI, 210 × 148 mm)",
  },
  {
    id: "a5-portrait",
    name: "A5 Portrait",
    width: 1748,
    height: 2480,
    orientation: "portrait",
    description: "Compact Vertical (300 DPI, 148 × 210 mm)",
  },
  {
    id: "screen-16-9",
    name: "16:9 Landscape",
    width: 1920,
    height: 1080,
    orientation: "landscape",
    description: "Full HD Digital Display (1920 × 1080)",
  },
  {
    id: "custom",
    name: "Custom Dimensions",
    width: 3508,
    height: 2480,
    orientation: "landscape",
    description: "User Defined Width & Height",
  },
];

export const ZOOM_PRESETS = [0.1, 0.2, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0];

export const STANDARD_VARIABLES: CertificateVariable[] = [
  { key: "name", label: "Recipient Name", placeholder: "{{name}}", category: "recipient" },
  { key: "email", label: "Email Address", placeholder: "{{email}}", category: "recipient" },
  { key: "event", label: "Event Name", placeholder: "{{event}}", category: "event" },
  { key: "date", label: "Issue Date", placeholder: "{{date}}", category: "event" },
  { key: "position", label: "Rank / Position", placeholder: "{{position}}", category: "event" },
  { key: "certificate_id", label: "Certificate ID", placeholder: "{{certificate_id}}", category: "meta" },
];

export const FONT_FAMILIES = [
  { label: "Inter (Modern Sans)", value: "Inter, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Georgia (Classic Serif)", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New (Monospace)", value: "'Courier New', Courier, monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
];

export const SAMPLE_RECIPIENTS: SampleRecipient[] = [
  {
    id: "rec-1",
    name: "Rahidul Khan",
    email: "rahidul@example.com",
    event: "CodeCraft Hackathon 2026",
    date: "September 5, 2026",
    position: "First Place Winner",
    certificate_id: "CC-2026-8891",
  },
  {
    id: "rec-2",
    name: "Sarah Jenkins",
    email: "sarah.j@techcorp.io",
    event: "Global AI Summit",
    date: "August 18, 2026",
    position: "Keynote Speaker",
    certificate_id: "GAI-2026-4412",
  },
  {
    id: "rec-3",
    name: "Alex Morgan",
    email: "alex.m@devnetwork.org",
    event: "Full Stack Mastery Workshop",
    date: "July 24, 2026",
    position: "Honor Graduate",
    certificate_id: "FSM-2026-1029",
  },
];

/**
 * Replace all {{key}} placeholders in a text string with values from recipient data
 */
export function replaceVariables(templateText: string, recipient: Record<string, string>): string {
  let result = templateText;
  Object.keys(recipient).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "gi");
    result = result.replace(regex, recipient[key]);
  });
  return result;
}

/**
 * Extracts all {{variable}} keys from an array of strings or canvas text
 */
export function extractVariables(text: string): string[] {
  const matches = text.match(/{{([a-zA-Z0-9_-]+)}}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, ""))));
}
