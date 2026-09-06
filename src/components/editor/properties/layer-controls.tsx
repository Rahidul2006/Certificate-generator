"use client";

import { BringToFront, SendToBack, ArrowUp, ArrowDown } from "lucide-react";

interface LayerControlsProps {
  onLayerChange: (
    action: "bring-front" | "bring-forward" | "send-backward" | "send-back"
  ) => void;
}

export function LayerControls({ onLayerChange }: LayerControlsProps) {
  return (
    <div className="space-y-2">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Layer Hierarchy
      </label>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onLayerChange("bring-front")}
          className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-xs text-muted-foreground transition hover:bg-zinc-800 hover:text-foreground"
          title="Bring to Front"
        >
          <BringToFront size={13} />
          <span className="text-[11px]">To Front</span>
        </button>

        <button
          type="button"
          onClick={() => onLayerChange("bring-forward")}
          className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-xs text-muted-foreground transition hover:bg-zinc-800 hover:text-foreground"
          title="Bring Forward"
        >
          <ArrowUp size={13} />
          <span className="text-[11px]">Forward</span>
        </button>

        <button
          type="button"
          onClick={() => onLayerChange("send-backward")}
          className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-xs text-muted-foreground transition hover:bg-zinc-800 hover:text-foreground"
          title="Send Backward"
        >
          <ArrowDown size={13} />
          <span className="text-[11px]">Backward</span>
        </button>

        <button
          type="button"
          onClick={() => onLayerChange("send-back")}
          className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-xs text-muted-foreground transition hover:bg-zinc-800 hover:text-foreground"
          title="Send to Back (behind content, in front of backdrop)"
        >
          <SendToBack size={13} />
          <span className="text-[11px]">To Back</span>
        </button>
      </div>
    </div>
  );
}
