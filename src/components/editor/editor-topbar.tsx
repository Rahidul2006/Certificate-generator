"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  Clock,
  ChevronDown,
} from "lucide-react";
import { ZOOM_PRESETS } from "./editor-utils";

interface EditorTopbarProps {
  templateName: string;
  onTemplateNameChange: (name: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onFitToScreen: () => void;
  isPreviewMode: boolean;
  onTogglePreviewMode: () => void;
  onOpenPreview: () => void;
  saveStatus: "saved" | "saving" | "unsaved";
  onSave: () => void;
}

export function EditorTopbar({
  templateName,
  onTemplateNameChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFitToScreen,
  isPreviewMode,
  onTogglePreviewMode,
  onOpenPreview,
  saveStatus,
  onSave,
}: EditorTopbarProps) {
  const [zoomDropdownOpen, setZoomDropdownOpen] = useState(false);

  const currentPercent = Math.round(zoom * 100);

  // Steppers through zoom presets
  const handleZoomOut = () => {
    // Find closest lower preset
    const lower = [...ZOOM_PRESETS]
      .reverse()
      .find((p) => p < zoom - 0.01);
    onZoomChange(lower ?? 0.1);
  };

  const handleZoomIn = () => {
    // Find closest higher preset
    const higher = ZOOM_PRESETS.find((p) => p > zoom + 0.01);
    onZoomChange(higher ?? 2.0);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md">
      {/* Left section: Back + Name */}
      <div className="flex items-center gap-3">
        <Link
          href="/templates"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-zinc-800 hover:text-foreground"
          title="Back to Templates"
        >
          <ArrowLeft size={16} />
        </Link>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={templateName}
            onChange={(e) => onTemplateNameChange(e.target.value)}
            placeholder="Untitled Template"
            className="h-8 max-w-[220px] rounded border border-transparent bg-transparent px-2 text-sm font-semibold text-foreground transition hover:border-border focus:border-zinc-500 focus:bg-background focus:outline-none sm:max-w-xs"
          />
        </div>
      </div>

      {/* Center section: Undo/Redo & Zoom Controls */}
      <div className="hidden items-center gap-1 sm:flex">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo || isPreviewMode}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-zinc-800 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo || isPreviewMode}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-zinc-800 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>

        <div className="mx-2 h-4 w-[1px] bg-border" />

        {/* Zoom Out [-] */}
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= 0.1}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-zinc-800 hover:text-foreground disabled:opacity-30"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>

        {/* Zoom Percentage Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setZoomDropdownOpen(!zoomDropdownOpen)}
            className="flex h-8 items-center gap-1 rounded-md px-2 font-mono text-xs text-foreground hover:bg-zinc-800"
            title="Zoom percentage"
          >
            <span>{currentPercent}%</span>
            <ChevronDown size={12} className="text-muted-foreground" />
          </button>

          {zoomDropdownOpen && (
            <div className="absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 rounded-lg border border-border bg-card p-1 shadow-xl">
              <div className="w-32 space-y-0.5 text-xs">
                {ZOOM_PRESETS.map((p) => {
                  const pct = Math.round(p * 100);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        onZoomChange(p);
                        setZoomDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded px-2 py-1 text-left ${
                        pct === currentPercent
                          ? "bg-zinc-800 text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-zinc-800/60 hover:text-foreground"
                      }`}
                    >
                      <span>{pct}%</span>
                      {pct === currentPercent && <span className="text-[10px] text-emerald-400">●</span>}
                    </button>
                  );
                })}
                <div className="h-[1px] bg-border my-1" />
                <button
                  type="button"
                  onClick={() => {
                    onFitToScreen();
                    setZoomDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-muted-foreground hover:bg-zinc-800/60 hover:text-foreground"
                >
                  <Maximize2 size={12} />
                  <span>Fit to Screen</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Zoom In [+] */}
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= 2.0}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-zinc-800 hover:text-foreground disabled:opacity-30"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>

        {/* Fit to Screen Button */}
        <button
          type="button"
          onClick={onFitToScreen}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-zinc-800 hover:text-foreground"
          title="Fit Canvas to Viewport"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Right section: Status, In-Canvas Preview, Full Preview, Save */}
      <div className="flex items-center gap-2.5">
        {/* Autosave status badge */}
        <div className="hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-amber-400">
              <Clock size={13} className="animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-zinc-400">
              <CheckCircle2 size={13} className="text-emerald-500" />
              Saved
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="text-zinc-500">Unsaved changes</span>
          )}
        </div>

        {/* In-Canvas Preview Mode Toggle */}
        <button
          type="button"
          onClick={onTogglePreviewMode}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            isPreviewMode
              ? "border-emerald-600/70 bg-emerald-950/40 text-emerald-400 shadow-xs"
              : "border-border bg-zinc-900 text-foreground hover:bg-zinc-800"
          }`}
          title={isPreviewMode ? "Exit clean preview mode" : "Enter clean canvas preview mode"}
        >
          {isPreviewMode ? <EyeOff size={14} /> : <Eye size={14} />}
          {isPreviewMode ? "Exit Preview" : "Preview"}
        </button>

        {/* Full Resolution Preview & Download Modal */}
        <button
          type="button"
          onClick={onOpenPreview}
          className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-border bg-zinc-900 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-zinc-800"
          title="Open high-res export preview with sample recipient"
        >
          Export Preview
        </button>

        {/* Save Template Button */}
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-200 shadow-xs"
        >
          <Save size={14} />
          Save
        </button>
      </div>
    </header>
  );
}
