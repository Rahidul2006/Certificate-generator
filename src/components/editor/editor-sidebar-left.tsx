"use client";

import { useState } from "react";
import {
  Upload,
  ImagePlus,
  X,
  Type,
  Heading1,
  Heading2,
  Square,
  Circle as CircleIcon,
  Minus,
  Variable,
  Layers,
  Settings2,
  Plus,
} from "lucide-react";
import { DocumentSizePreset } from "@/types";
import { DOCUMENT_PRESETS, STANDARD_VARIABLES } from "./editor-utils";

interface EditorSidebarLeftProps {
  currentPreset: DocumentSizePreset;
  onSelectPreset: (preset: DocumentSizePreset) => void;
  customWidth: number;
  customHeight: number;
  onCustomDimensionsChange: (width: number, height: number) => void;
  backgroundName: string | null;
  onBackgroundUpload: (file: File) => void;
  onRemoveBackground: () => void;
  onAddText: (type: "heading" | "subheading" | "body") => void;
  onAddShape: (shape: "rect" | "circle" | "line") => void;
  onAddImage: (file: File) => void;
  onAddVariable: (variableKey: string) => void;
}

type TabType = "elements" | "variables" | "background" | "settings";

export function EditorSidebarLeft({
  currentPreset,
  onSelectPreset,
  customWidth,
  customHeight,
  onCustomDimensionsChange,
  backgroundName,
  onBackgroundUpload,
  onRemoveBackground,
  onAddText,
  onAddShape,
  onAddImage,
  onAddVariable,
}: EditorSidebarLeftProps) {
  const [activeTab, setActiveTab] = useState<TabType>("elements");
  const [customVarInput, setCustomVarInput] = useState("");

  const handleCustomVariableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customVarInput.trim().replace(/[{}]/g, "");
    if (clean) {
      onAddVariable(clean);
      setCustomVarInput("");
    }
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card/70 backdrop-blur-md">
      {/* Category Tab Bar */}
      <div className="flex border-b border-border bg-zinc-950/40 p-1">
        <button
          onClick={() => setActiveTab("elements")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition ${
            activeTab === "elements"
              ? "bg-zinc-800 text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers size={13} />
          Elements
        </button>

        <button
          onClick={() => setActiveTab("variables")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition ${
            activeTab === "variables"
              ? "bg-zinc-800 text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Variable size={13} />
          Variables
        </button>

        <button
          onClick={() => setActiveTab("background")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition ${
            activeTab === "background"
              ? "bg-zinc-800 text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ImagePlus size={13} />
          Backdrop
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition ${
            activeTab === "settings"
              ? "bg-zinc-800 text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings2 size={13} />
          Canvas
        </button>
      </div>

      {/* Content scroll area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* TAB: ELEMENTS */}
        {activeTab === "elements" && (
          <div className="space-y-6">
            {/* Text elements */}
            <div>
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Typography
              </p>
              <div className="space-y-1.5">
                <button
                  onClick={() => onAddText("heading")}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background/50 px-3 py-2 text-left text-xs font-medium text-foreground transition hover:border-zinc-700 hover:bg-zinc-800"
                >
                  <Heading1 size={15} className="text-zinc-400" />
                  <span>Add Heading</span>
                </button>

                <button
                  onClick={() => onAddText("subheading")}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background/50 px-3 py-2 text-left text-xs font-medium text-foreground transition hover:border-zinc-700 hover:bg-zinc-800"
                >
                  <Heading2 size={14} className="text-zinc-400" />
                  <span>Add Subheading</span>
                </button>

                <button
                  onClick={() => onAddText("body")}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background/50 px-3 py-2 text-left text-xs font-medium text-foreground transition hover:border-zinc-700 hover:bg-zinc-800"
                >
                  <Type size={14} className="text-zinc-400" />
                  <span>Add Body Paragraph</span>
                </button>
              </div>
            </div>

            {/* Shapes */}
            <div>
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Geometric Shapes
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onAddShape("rect")}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-background/50 p-3 text-xs text-foreground transition hover:border-zinc-700 hover:bg-zinc-800"
                >
                  <Square size={18} className="text-zinc-400" />
                  <span>Rectangle</span>
                </button>

                <button
                  onClick={() => onAddShape("circle")}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-background/50 p-3 text-xs text-foreground transition hover:border-zinc-700 hover:bg-zinc-800"
                >
                  <CircleIcon size={18} className="text-zinc-400" />
                  <span>Circle</span>
                </button>

                <button
                  onClick={() => onAddShape("line")}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-background/50 p-3 text-xs text-foreground transition hover:border-zinc-700 hover:bg-zinc-800"
                >
                  <Minus size={18} className="text-zinc-400" />
                  <span>Line</span>
                </button>
              </div>
            </div>

            {/* Graphic Uploads (Logo, Signature, Seal) */}
            <div>
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Graphics & Signature
              </p>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-zinc-900/30 p-4 text-center transition hover:border-zinc-600 hover:bg-zinc-900/60">
                <Upload size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Upload Image
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Logo, Signature, Seal (PNG, JPG, WebP)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onAddImage(file);
                      e.target.value = "";
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB: VARIABLES */}
        {activeTab === "variables" && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Dynamic Variables
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Click any placeholder to drop it onto your certificate template.
              </p>

              <div className="space-y-1.5">
                {STANDARD_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => onAddVariable(v.key)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2 text-left text-xs transition hover:border-zinc-700 hover:bg-zinc-800"
                  >
                    <div className="flex items-center gap-2">
                      <Variable size={13} className="text-blue-400" />
                      <span className="font-medium text-foreground">{v.label}</span>
                    </div>
                    <code className="font-mono text-[10px] text-zinc-400">
                      {v.placeholder}
                    </code>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom variable creation */}
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Add Custom Variable
              </p>
              <form onSubmit={handleCustomVariableSubmit} className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. gpa, grade, track"
                  value={customVarInput}
                  onChange={(e) => setCustomVarInput(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-zinc-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-zinc-700"
                >
                  <Plus size={13} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB: BACKGROUND */}
        {activeTab === "background" && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Certificate Backdrop
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Upload your high-resolution certificate parchment or border design.
              </p>

              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-zinc-900/30 p-6 text-center transition hover:border-zinc-600 hover:bg-zinc-900/60">
                <Upload size={22} className="text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {backgroundName ? "Replace Background" : "Upload Background"}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    PNG, JPG, WebP (scales to fit background)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onBackgroundUpload(file);
                      e.target.value = "";
                    }
                  }}
                  className="hidden"
                />
              </label>

              {backgroundName && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-background p-2.5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <ImagePlus size={14} className="shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs font-medium text-foreground">
                      {backgroundName}
                    </span>
                  </div>
                  <button
                    onClick={onRemoveBackground}
                    className="rounded p-1 text-muted-foreground hover:bg-zinc-800 hover:text-rose-400"
                    title="Remove background"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: SETTINGS & DIMENSIONS */}
        {activeTab === "settings" && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Document Presets
              </p>
              <div className="space-y-1.5">
                {DOCUMENT_PRESETS.map((preset) => {
                  const isSelected = currentPreset.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => onSelectPreset(preset)}
                      className={`flex w-full flex-col rounded-lg border p-2.5 text-left transition ${
                        isSelected
                          ? "border-zinc-500 bg-zinc-800 text-foreground"
                          : "border-border bg-background/50 text-muted-foreground hover:border-zinc-700 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{preset.name}</span>
                        <span className="font-mono text-[10px]">
                          {preset.width} × {preset.height}
                        </span>
                      </div>
                      {preset.description && (
                        <span className="mt-0.5 text-[10px] opacity-70">
                          {preset.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {currentPreset.id === "custom" && (
              <div className="border-t border-border pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Custom Resolution (px)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] text-muted-foreground">
                      Width
                    </label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) =>
                        onCustomDimensionsChange(
                          parseInt(e.target.value) || 800,
                          customHeight
                        )
                      }
                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-muted-foreground">
                      Height
                    </label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) =>
                        onCustomDimensionsChange(
                          customWidth,
                          parseInt(e.target.value) || 600
                        )
                      }
                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
