import { Canvas as FabricCanvas, Textbox } from "fabric";
import jsPDF from "jspdf";
import { CertificateTemplate } from "@/types";
import { replaceVariables } from "@/components/editor/editor-utils";

export interface GeneratedCertificateResult {
  recipientId: string;
  recipientName: string;
  filename: string;
  dataUrl: string;
}

export interface FailedCertificateResult {
  recipientId: string;
  recipientName: string;
  error: string;
}

export interface BulkGenerationProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentRecipientName?: string;
  percentage: number;
}

/**
 * Clean and sanitize a filename for safe OS downloading/attachment
 */
export function sanitizeFilename(recipientName: string, prefix = "Certificate"): string {
  const cleanName = recipientName
    .replace(/[^\w\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "_");
  const cleanPrefix = prefix
    .replace(/[^\w\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "_");

  return `${cleanName || "Recipient"}_${cleanPrefix || "Certificate"}.png`;
}

/**
 * Render a single certificate from Template JSON + Recipient Record to a high-res PNG Data URL
 */
export async function renderCertificateDataUrl(
  template: CertificateTemplate,
  recipient: Record<string, string>
): Promise<string> {
  if (!template.canvasJSON) {
    throw new Error("Template does not contain canvas JSON data.");
  }

  // Create an offscreen HTML canvas element
  const offscreenCanvasEl = document.createElement("canvas");
  offscreenCanvasEl.width = template.width;
  offscreenCanvasEl.height = template.height;

  const fabricCanvas = new FabricCanvas(offscreenCanvasEl, {
    width: template.width,
    height: template.height,
    renderOnAddRemove: false,
  });

  try {
    // Load serialized template JSON
    await fabricCanvas.loadFromJSON(template.canvasJSON);

    // Replace dynamic variables
    fabricCanvas.getObjects().forEach((obj) => {
      const customObj = obj as unknown as {
        isVariable?: boolean;
        variableName?: string;
        originalText?: string;
      };

      if (
        (customObj.isVariable || obj.type === "textbox" || obj.type === "text") &&
        "text" in obj
      ) {
        const textObj = obj as Textbox;
        const basePattern = customObj.originalText || textObj.text || "";
        const replaced = replaceVariables(basePattern, recipient);
        textObj.set("text", replaced);
      }
    });

    fabricCanvas.requestRenderAll();

    // Export 1:1 scale PNG
    const dataUrl = fabricCanvas.toDataURL({
      format: "png",
      multiplier: 1,
    });

    return dataUrl;
  } finally {
    fabricCanvas.dispose();
  }
}

/**
 * Convert certificate PNG data URL into a vector-dimensioned PDF instance using jsPDF
 */
export function exportCertificatePdf(
  dataUrl: string,
  width: number,
  height: number,
  orientation: "landscape" | "portrait" = "landscape"
): jsPDF {
  const isLandscape = orientation === "landscape" || width >= height;
  const pdf = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "pt",
    format: [width, height],
    compress: true,
  });

  pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
  return pdf;
}

/**
 * Directly trigger a browser download of the certificate as a vector-scale PDF
 */
export function downloadCertificatePdf(
  dataUrl: string,
  filename: string,
  width: number,
  height: number,
  orientation: "landscape" | "portrait" = "landscape"
): void {
  const pdf = exportCertificatePdf(dataUrl, width, height, orientation);
  const pdfFilename = filename.replace(/\.(png|jpe?g|webp)$/i, "") + ".pdf";
  pdf.save(pdfFilename);
}

/**
 * Bulk generate certificates with non-blocking concurrency and progress reporting
 */
export async function generateBulkCertificates(
  template: CertificateTemplate,
  recipients: Array<Record<string, string> & { id: string; name: string }>,
  onProgress?: (progress: BulkGenerationProgress) => void,
  signal?: AbortSignal
): Promise<{
  successful: GeneratedCertificateResult[];
  failed: FailedCertificateResult[];
}> {
  const successful: GeneratedCertificateResult[] = [];
  const failed: FailedCertificateResult[] = [];
  const total = recipients.length;

  for (let i = 0; i < total; i++) {
    if (signal?.aborted) {
      break;
    }

    const recipient = recipients[i];

    try {
      // Yield to event loop to keep the UI interactive and avoid freezing
      await new Promise((resolve) => setTimeout(resolve, 20));

      const dataUrl = await renderCertificateDataUrl(template, recipient);
      const filename = sanitizeFilename(recipient.name, template.name);

      successful.push({
        recipientId: recipient.id,
        recipientName: recipient.name,
        filename,
        dataUrl,
      });
    } catch (err: unknown) {
      failed.push({
        recipientId: recipient.id,
        recipientName: recipient.name,
        error: err instanceof Error ? err.message : "Unknown rendering error",
      });
    }

    if (onProgress) {
      onProgress({
        total,
        processed: i + 1,
        successful: successful.length,
        failed: failed.length,
        currentRecipientName: recipient.name,
        percentage: Math.round(((i + 1) / total) * 100),
      });
    }
  }

  return { successful, failed };
}

