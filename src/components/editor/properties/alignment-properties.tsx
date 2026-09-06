"use client";

import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
} from "lucide-react";

interface AlignmentPropertiesProps {
  onAlignCanvas: (
    alignment: "left" | "center-h" | "right" | "top" | "center-v" | "bottom"
  ) => void;
}

export function AlignmentProperties({ onAlignCanvas }: AlignmentPropertiesProps) {
  return (
    <div className="space-y-2">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Align to Document
      </label>

      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => onAlignCanvas("left")}
          className="flex h-8 items-center justify-center gap-1 rounded-lg border border-border bg-background text-xs text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
          title="Align to Left edge of certificate"
        >
          <AlignStartVertical size={13} />
          <span className="text-[10px]">Left</span>
        </button>

        <button
          type="button"
          onClick={() => onAlignCanvas("center-h")}
          className="flex h-8 items-center justify-center gap-1 rounded-lg border border-border bg-background text-xs text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
          title="Center Horizontally on certificate"
        >
          <AlignCenterHorizontal size={13} />
          <span className="text-[10px]">Center H</span>
        </button>

        <button
          type="button"
          onClick={() => onAlignCanvas("right")}
          className="flex h-8 items-center justify-center gap-1 rounded-lg border border-border bg-background text-xs text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
          title="Align to Right edge of certificate"
        >
          <AlignEndVertical size={13} />
          <span className="text-[10px]">Right</span>
        </button>

        <button
          type="button"
          onClick={() => onAlignCanvas("top")}
          className="flex h-8 items-center justify-center gap-1 rounded-lg border border-border bg-background text-xs text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
          title="Align to Top edge of certificate"
        >
          <AlignStartHorizontal size={13} />
          <span className="text-[10px]">Top</span>
        </button>

        <button
          type="button"
          onClick={() => onAlignCanvas("center-v")}
          className="flex h-8 items-center justify-center gap-1 rounded-lg border border-border bg-background text-xs text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
          title="Center Vertically on certificate"
        >
          <AlignCenterVertical size={13} />
          <span className="text-[10px]">Center V</span>
        </button>

        <button
          type="button"
          onClick={() => onAlignCanvas("bottom")}
          className="flex h-8 items-center justify-center gap-1 rounded-lg border border-border bg-background text-xs text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
          title="Align to Bottom edge of certificate"
        >
          <AlignEndHorizontal size={13} />
          <span className="text-[10px]">Bottom</span>
        </button>
      </div>
    </div>
  );
}
