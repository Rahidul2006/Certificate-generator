"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  Plus,
  FileImage,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  ExternalLink,
  Calendar,
  Maximize2,
} from "lucide-react";
import { CertificateTemplate } from "@/types";

function generateCopyId(baseId: string): string {
  return `tpl-${baseId}-copy`;
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

const DEFAULT_TEMPLATES: CertificateTemplate[] = [
  {
    id: "tpl-default-1",
    name: "Classic Achievement Certificate",
    width: 1123,
    height: 794,
    orientation: "landscape",
    variables: ["name", "event", "date"],
    createdAt: "2026-03-01",
    updatedAt: "2026-03-01",
    canvasJSON: null,
  },
  {
    id: "tpl-default-2",
    name: "Modern Participation Award",
    width: 1280,
    height: 720,
    orientation: "landscape",
    variables: ["name", "event", "date", "position"],
    createdAt: "2026-03-02",
    updatedAt: "2026-03-02",
    canvasJSON: null,
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>(() => {
    if (typeof window === "undefined") return DEFAULT_TEMPLATES;
    try {
      const stored = localStorage.getItem("certimail_templates");
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEFAULT_TEMPLATES;
  });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    try {
      localStorage.setItem("certimail_templates", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setActiveMenu(null);
  };

  const handleDuplicate = (template: CertificateTemplate) => {
    const today = getTodayString();
    const duplicated: CertificateTemplate = {
      ...template,
      id: generateCopyId(template.id),
      name: `${template.name} (Copy)`,
      createdAt: today,
      updatedAt: today,
    };
    const updated = [duplicated, ...templates];
    setTemplates(updated);
    try {
      localStorage.setItem("certimail_templates", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setActiveMenu(null);
  };

  return (
    <AppShell>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Templates
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create, configure, and manage dynamic certificate designs.
            </p>
          </div>

          <Link
            href="/templates/new"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 shadow-xs"
          >
            <Plus size={16} />
            Create Template
          </Link>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-zinc-900/80 text-muted-foreground">
              <FileImage size={24} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">
              No certificate templates yet
            </h2>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              Start designing custom certificate layouts with dynamic variables, background graphics, and fonts.
            </p>
            <Link
              href="/templates/new"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              <Plus size={16} />
              Create your first template
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-zinc-700/80 hover:shadow-lg"
              >
                {/* Thumbnail Preview Area */}
                <div className="relative flex aspect-[16/10] w-full items-center justify-center bg-zinc-950/80 p-4 border-b border-border/60">
                  {tpl.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tpl.thumbnailUrl}
                      alt={tpl.name}
                      className="h-full w-full object-contain rounded"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-600">
                      <FileImage size={32} className="opacity-40" />
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                        {tpl.width} × {tpl.height}
                      </span>
                    </div>
                  )}

                  <div className="absolute right-2 top-2">
                    <button
                      onClick={() =>
                        setActiveMenu(activeMenu === tpl.id ? null : tpl.id)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-zinc-900/90 text-zinc-400 backdrop-blur-sm transition hover:text-white"
                    >
                      <MoreVertical size={14} />
                    </button>

                    {activeMenu === tpl.id && (
                      <div className="absolute right-0 top-8 z-30 w-44 rounded-lg border border-border bg-zinc-900 p-1.5 shadow-xl">
                        <Link
                          href={`/templates/new?id=${tpl.id}`}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground transition hover:bg-zinc-800"
                        >
                          <Edit2 size={13} />
                          Edit Template
                        </Link>
                        <button
                          onClick={() => handleDuplicate(tpl)}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground transition hover:bg-zinc-800"
                        >
                          <Copy size={13} />
                          Duplicate
                        </button>
                        <Link
                          href="/campaigns/new"
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground transition hover:bg-zinc-800"
                        >
                          <ExternalLink size={13} />
                          Use in Campaign
                        </Link>
                        <div className="my-1 border-t border-border/60" />
                        <button
                          onClick={() => handleDelete(tpl.id)}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-rose-400 transition hover:bg-rose-950/30"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                      {tpl.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {tpl.variables?.map((v) => (
                        <span
                          key={v}
                          className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 border border-border/40"
                        >
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Maximize2 size={12} />
                      {tpl.width}×{tpl.height}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {tpl.updatedAt}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}