"use client";

import { X, ChevronLeft, ChevronRight, Download, UserCheck, FileText } from "lucide-react";
import { SAMPLE_RECIPIENTS } from "./editor-utils";

interface EditorPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  renderedPreviewUrl: string | null;
  currentRecipientIndex: number;
  onSelectRecipientIndex: (index: number) => void;
  onDownloadPNG: () => void;
  onDownloadPDF?: () => void;
  templateName: string;
}

export function EditorPreviewModal({
  isOpen,
  onClose,
  renderedPreviewUrl,
  currentRecipientIndex,
  onSelectRecipientIndex,
  onDownloadPNG,
  onDownloadPDF,
  templateName,
}: EditorPreviewModalProps) {
  if (!isOpen) return null;

  const currentRecipient = SAMPLE_RECIPIENTS[currentRecipientIndex] || SAMPLE_RECIPIENTS[0];

  const handlePrev = () => {
    onSelectRecipientIndex(
      currentRecipientIndex > 0 ? currentRecipientIndex - 1 : SAMPLE_RECIPIENTS.length - 1
    );
  };

  const handleNext = () => {
    onSelectRecipientIndex(
      currentRecipientIndex < SAMPLE_RECIPIENTS.length - 1 ? currentRecipientIndex + 1 : 0
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/90 backdrop-blur-md">
      {/* Preview Topbar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/90 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-foreground">
            <UserCheck size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Certificate Preview: {templateName || "Untitled Template"}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Dynamic variable rendering check
            </p>
          </div>
        </div>

        {/* Recipient switcher */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 p-1">
          <button
            onClick={handlePrev}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
            title="Previous recipient"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="px-2 text-center">
            <span className="text-xs font-semibold text-foreground">
              {currentRecipient.name}
            </span>
            <span className="mx-2 text-[10px] text-zinc-500">•</span>
            <span className="text-[10px] text-muted-foreground">
              {currentRecipientIndex + 1} of {SAMPLE_RECIPIENTS.length}
            </span>
          </div>

          <button
            onClick={handleNext}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
            title="Next recipient"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDownloadPNG}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-zinc-800"
          >
            <Download size={14} />
            Download PNG
          </button>

          {onDownloadPDF && (
            <button
              onClick={onDownloadPDF}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              <FileText size={14} />
              Download PDF
            </button>
          )}

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Preview Viewport */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-6 lg:p-12">
        <div className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-xl border border-zinc-800 bg-white shadow-2xl">
          {renderedPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={renderedPreviewUrl}
              alt="Certificate Preview"
              className="max-h-[80vh] w-auto object-contain"
            />
          ) : (
            <div className="flex h-[500px] w-[800px] items-center justify-center text-zinc-400">
              Generating high-resolution preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
