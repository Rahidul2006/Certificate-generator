"use client";

import {
  Trash2,
  Copy,
  Variable,
  Layers,
  Keyboard,
} from "lucide-react";
import { SelectedElementProperties } from "@/types";
import { TextProperties } from "./properties/text-properties";
import { ColorProperties } from "./properties/color-properties";
import { ShapeProperties } from "./properties/shape-properties";
import { TransformProperties } from "./properties/transform-properties";
import { AlignmentProperties } from "./properties/alignment-properties";
import { LayerControls } from "./properties/layer-controls";

interface EditorSidebarRightProps {
  selected: SelectedElementProperties | null;
  onUpdateProperty: (
    property: keyof SelectedElementProperties,
    value: string | number | boolean | undefined
  ) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAlignCanvas: (
    alignment: "left" | "center-h" | "right" | "top" | "center-v" | "bottom"
  ) => void;
  onLayerChange: (
    action: "bring-front" | "bring-forward" | "send-backward" | "send-back"
  ) => void;
}

export function EditorSidebarRight({
  selected,
  onUpdateProperty,
  onDuplicate,
  onDelete,
  onAlignCanvas,
  onLayerChange,
}: EditorSidebarRightProps) {
  if (!selected) {
    return (
      <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-card/70 p-4 backdrop-blur-md">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Inspector
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-zinc-950/20 p-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-zinc-900 text-muted-foreground">
            <Layers size={18} />
          </div>
          <p className="mt-3 text-xs font-semibold text-foreground">
            No element selected
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Click on any text, shape, image, or variable on the canvas to customize its styling and position.
          </p>

          <div className="mt-6 w-full rounded-lg border border-border/60 bg-zinc-900/40 p-3 text-left text-[10px] text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-foreground pb-0.5">
              <Keyboard size={12} />
              <span>Keyboard Shortcuts</span>
            </div>
            <div className="flex justify-between">
              <span>Duplicate</span>
              <kbd className="font-mono text-zinc-400">Ctrl+D</kbd>
            </div>
            <div className="flex justify-between">
              <span>Delete</span>
              <kbd className="font-mono text-zinc-400">Del / Backspace</kbd>
            </div>
            <div className="flex justify-between">
              <span>Undo / Redo</span>
              <kbd className="font-mono text-zinc-400">Ctrl+Z / Ctrl+Y</kbd>
            </div>
            <div className="flex justify-between">
              <span>Nudge / 10px</span>
              <kbd className="font-mono text-zinc-400">Arrows / Shift+Arr</kbd>
            </div>
            <div className="flex justify-between">
              <span>Deselect</span>
              <kbd className="font-mono text-zinc-400">Esc</kbd>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const isText = selected.type === "text" || selected.type === "textbox";
  const isShape =
    selected.type === "rect" ||
    selected.type === "circle" ||
    selected.type === "line";
  const isImage = selected.type === "image";

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-card/70 backdrop-blur-md">
      {/* Header with element type and quick actions */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {selected.isVariable ? (
            <span className="inline-flex items-center gap-1 rounded bg-blue-950/60 px-1.5 py-0.5 font-mono text-[10px] text-blue-400 border border-blue-800/50">
              <Variable size={10} />
              {`{{${selected.variableName || "variable"}}}`}
            </span>
          ) : (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {selected.type} Properties
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded p-1.5 text-muted-foreground transition hover:bg-zinc-800 hover:text-foreground"
            title="Duplicate (Ctrl+D)"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1.5 text-muted-foreground transition hover:bg-rose-950/50 hover:text-rose-400"
            title="Delete (Delete / Backspace)"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Property Controls Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* TEXT PROPERTIES */}
        {isText && (
          <>
            <TextProperties
              selected={selected}
              onUpdateProperty={onUpdateProperty}
            />
            <div className="h-[1px] bg-border/60" />
            <ColorProperties
              selected={selected}
              onUpdateProperty={onUpdateProperty}
              label="Color & Opacity"
              propertyKey="fill"
            />
          </>
        )}

        {/* SHAPE PROPERTIES */}
        {isShape && (
          <ShapeProperties
            selected={selected}
            onUpdateProperty={onUpdateProperty}
          />
        )}

        {/* IMAGE PROPERTIES */}
        {isImage && (
          <div className="space-y-3">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Image Opacity
            </label>
            <ColorProperties
              selected={selected}
              onUpdateProperty={onUpdateProperty}
              label="Opacity"
              propertyKey="fill"
            />
          </div>
        )}

        <div className="h-[1px] bg-border/60" />

        {/* POSITION & TRANSFORM */}
        <TransformProperties
          selected={selected}
          onUpdateProperty={onUpdateProperty}
        />

        <div className="h-[1px] bg-border/60" />

        {/* ALIGNMENT HELPERS */}
        <AlignmentProperties onAlignCanvas={onAlignCanvas} />

        <div className="h-[1px] bg-border/60" />

        {/* LAYER HIERARCHY */}
        <LayerControls onLayerChange={onLayerChange} />
      </div>
    </aside>
  );
}
