"use client";

import { useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  Plus,
  Variable,
} from "lucide-react";
import { SelectedElementProperties } from "@/types";
import { FONT_FAMILIES } from "../editor-utils";

interface TextPropertiesProps {
  selected: SelectedElementProperties;
  onUpdateProperty: (
    property: keyof SelectedElementProperties,
    value: string | number | boolean | undefined
  ) => void;
}

export function TextProperties({ selected, onUpdateProperty }: TextPropertiesProps) {
  const [localText, setLocalText] = useState<string | null>(null);

  const displayText = localText !== null ? localText : (selected.text || "");

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalText(val);
    onUpdateProperty("text", val);
  };

  const handleFontSizeChange = (delta: number) => {
    const current = selected.fontSize || 32;
    const next = Math.max(8, Math.min(300, current + delta));
    onUpdateProperty("fontSize", next);
  };

  const isBold =
    selected.fontWeight === "bold" ||
    selected.fontWeight === 700 ||
    selected.fontWeight === "700";
  const isItalic = selected.fontStyle === "italic";
  const isUnderline = Boolean(selected.underline);
  const isStrikethrough = Boolean(selected.linethrough);

  return (
    <div className="space-y-4">
      {/* TEXT CONTENT */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Text Content
          </label>
          {selected.isVariable && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">
              <Variable size={10} />
              {`{{${selected.variableName || "var"}}}`}
            </span>
          )}
        </div>
        <textarea
          rows={3}
          value={displayText}
          onChange={handleTextChange}
          onBlur={() => setLocalText(null)}
          placeholder="Enter text..."
          className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-zinc-500 focus:outline-none resize-y"
        />
      </div>

      {/* TYPOGRAPHY */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Typography
        </label>
        <div className="space-y-2">
          {/* Font Family Selector */}
          <div>
            <select
              value={selected.fontFamily || "Inter, sans-serif"}
              onChange={(e) => onUpdateProperty("fontFamily", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:border-zinc-500 focus:outline-none"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size & Steppers */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12">Size:</span>
            <div className="flex flex-1 items-center rounded-lg border border-border bg-background overflow-hidden">
              <button
                type="button"
                onClick={() => handleFontSizeChange(-2)}
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
                title="Decrease font size"
              >
                <Minus size={13} />
              </button>
              <input
                type="number"
                min={8}
                max={300}
                value={selected.fontSize || 32}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    onUpdateProperty("fontSize", Math.max(8, Math.min(300, val)));
                  }
                }}
                className="w-full text-center bg-transparent text-xs font-mono text-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleFontSizeChange(2)}
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
                title="Increase font size"
              >
                <Plus size={13} />
              </button>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">px</span>
          </div>

          {/* Font Styles: [B] [I] [U] [S] */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => onUpdateProperty("fontWeight", isBold ? "normal" : "bold")}
              className={`flex h-8 flex-1 items-center justify-center rounded-lg border text-xs font-bold transition ${
                isBold
                  ? "border-zinc-500 bg-zinc-800 text-foreground shadow-xs"
                  : "border-border bg-background text-muted-foreground hover:bg-zinc-800/60 hover:text-foreground"
              }`}
              title="Bold"
            >
              <Bold size={13} />
            </button>

            <button
              type="button"
              onClick={() => onUpdateProperty("fontStyle", isItalic ? "normal" : "italic")}
              className={`flex h-8 flex-1 items-center justify-center rounded-lg border text-xs italic transition ${
                isItalic
                  ? "border-zinc-500 bg-zinc-800 text-foreground shadow-xs"
                  : "border-border bg-background text-muted-foreground hover:bg-zinc-800/60 hover:text-foreground"
              }`}
              title="Italic"
            >
              <Italic size={13} />
            </button>

            <button
              type="button"
              onClick={() => onUpdateProperty("underline", !isUnderline)}
              className={`flex h-8 flex-1 items-center justify-center rounded-lg border text-xs transition ${
                isUnderline
                  ? "border-zinc-500 bg-zinc-800 text-foreground shadow-xs"
                  : "border-border bg-background text-muted-foreground hover:bg-zinc-800/60 hover:text-foreground"
              }`}
              title="Underline"
            >
              <Underline size={13} />
            </button>

            <button
              type="button"
              onClick={() => onUpdateProperty("linethrough", !isStrikethrough)}
              className={`flex h-8 flex-1 items-center justify-center rounded-lg border text-xs transition ${
                isStrikethrough
                  ? "border-zinc-500 bg-zinc-800 text-foreground shadow-xs"
                  : "border-border bg-background text-muted-foreground hover:bg-zinc-800/60 hover:text-foreground"
              }`}
              title="Strikethrough"
            >
              <Strikethrough size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* TEXT ALIGNMENT */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Text Alignment
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateProperty("textAlign", "left")}
            className={`flex h-8 items-center justify-center rounded-lg border text-xs transition ${
              selected.textAlign === "left"
                ? "border-zinc-500 bg-zinc-800 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-zinc-800/60 hover:text-foreground"
            }`}
            title="Align Left"
          >
            <AlignLeft size={14} />
          </button>

          <button
            type="button"
            onClick={() => onUpdateProperty("textAlign", "center")}
            className={`flex h-8 items-center justify-center rounded-lg border text-xs transition ${
              selected.textAlign === "center" || !selected.textAlign
                ? "border-zinc-500 bg-zinc-800 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-zinc-800/60 hover:text-foreground"
            }`}
            title="Align Center"
          >
            <AlignCenter size={14} />
          </button>

          <button
            type="button"
            onClick={() => onUpdateProperty("textAlign", "right")}
            className={`flex h-8 items-center justify-center rounded-lg border text-xs transition ${
              selected.textAlign === "right"
                ? "border-zinc-500 bg-zinc-800 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-zinc-800/60 hover:text-foreground"
            }`}
            title="Align Right"
          >
            <AlignRight size={14} />
          </button>

          <button
            type="button"
            onClick={() => onUpdateProperty("textAlign", "justify")}
            className={`flex h-8 items-center justify-center rounded-lg border text-xs transition ${
              selected.textAlign === "justify"
                ? "border-zinc-500 bg-zinc-800 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-zinc-800/60 hover:text-foreground"
            }`}
            title="Justify"
          >
            <AlignJustify size={14} />
          </button>
        </div>
      </div>

      {/* LINE HEIGHT & LETTER SPACING */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="mb-1 block text-[11px] text-muted-foreground">
            Line Height
          </label>
          <input
            type="number"
            step="0.1"
            min="0.5"
            max="3.0"
            value={selected.lineHeight || 1.2}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                onUpdateProperty("lineHeight", Math.max(0.5, Math.min(3.0, val)));
              }
            }}
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-zinc-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-muted-foreground">
            Letter Spacing
          </label>
          <input
            type="number"
            step="10"
            min="-50"
            max="500"
            value={selected.charSpacing || 0}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) {
                onUpdateProperty("charSpacing", Math.max(-50, Math.min(500, val)));
              }
            }}
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-zinc-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
