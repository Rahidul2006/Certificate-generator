"use client";

import { Lock, Unlock, RotateCw } from "lucide-react";
import { SelectedElementProperties } from "@/types";

interface TransformPropertiesProps {
  selected: SelectedElementProperties;
  onUpdateProperty: (
    property: keyof SelectedElementProperties,
    value: string | number | boolean | undefined
  ) => void;
}

export function TransformProperties({
  selected,
  onUpdateProperty,
}: TransformPropertiesProps) {
  const aspectLocked = Boolean(selected.lockAspectRatio);

  const toggleAspectLock = () => {
    onUpdateProperty("lockAspectRatio", !aspectLocked);
  };

  const handleWidthChange = (newWidth: number) => {
    if (isNaN(newWidth) || newWidth <= 0) return;
    const currentW = selected.width || 1;
    const currentH = selected.height || 1;

    onUpdateProperty("width", newWidth);

    if (aspectLocked && currentW > 0) {
      const ratio = currentH / currentW;
      const newHeight = Math.round(newWidth * ratio);
      onUpdateProperty("height", newHeight);
    }
  };

  const handleHeightChange = (newHeight: number) => {
    if (isNaN(newHeight) || newHeight <= 0) return;
    const currentW = selected.width || 1;
    const currentH = selected.height || 1;

    onUpdateProperty("height", newHeight);

    if (aspectLocked && currentH > 0) {
      const ratio = currentW / currentH;
      const newWidth = Math.round(newHeight * ratio);
      onUpdateProperty("width", newWidth);
    }
  };

  // Position is strictly in document coordinates
  const displayX = Math.round(selected.left ?? 0);
  const displayY = Math.round(selected.top ?? 0);
  const displayW = Math.round(selected.width ?? 0);
  const displayH = Math.round(selected.height ?? 0);
  const displayAngle = Math.round(((selected.angle ?? 0) % 360 + 360) % 360);

  return (
    <div className="space-y-4">
      {/* POSITION (DOCUMENT COORDINATES) */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Position (Document Coordinates)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center rounded-lg border border-border bg-background px-2.5 py-1.5">
            <span className="text-[11px] font-mono text-muted-foreground w-4">X</span>
            <input
              type="number"
              value={displayX}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) onUpdateProperty("left", val);
              }}
              className="w-full bg-transparent text-right font-mono text-xs text-foreground focus:outline-none"
            />
            <span className="ml-1 text-[10px] text-zinc-500 font-mono">px</span>
          </div>

          <div className="flex items-center rounded-lg border border-border bg-background px-2.5 py-1.5">
            <span className="text-[11px] font-mono text-muted-foreground w-4">Y</span>
            <input
              type="number"
              value={displayY}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) onUpdateProperty("top", val);
              }}
              className="w-full bg-transparent text-right font-mono text-xs text-foreground focus:outline-none"
            />
            <span className="ml-1 text-[10px] text-zinc-500 font-mono">px</span>
          </div>
        </div>
      </div>

      {/* SIZE & ASPECT RATIO */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Dimensions
          </label>
          <button
            type="button"
            onClick={toggleAspectLock}
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition ${
              aspectLocked
                ? "bg-zinc-800 text-foreground border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={aspectLocked ? "Aspect Ratio Locked" : "Aspect Ratio Unlocked"}
          >
            {aspectLocked ? <Lock size={11} className="text-emerald-400" /> : <Unlock size={11} />}
            <span>{aspectLocked ? "Locked" : "Unlocked"}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center rounded-lg border border-border bg-background px-2.5 py-1.5">
            <span className="text-[11px] font-mono text-muted-foreground w-4">W</span>
            <input
              type="number"
              min={1}
              value={displayW}
              onChange={(e) => handleWidthChange(parseInt(e.target.value, 10))}
              className="w-full bg-transparent text-right font-mono text-xs text-foreground focus:outline-none"
            />
            <span className="ml-1 text-[10px] text-zinc-500 font-mono">px</span>
          </div>

          <div className="flex items-center rounded-lg border border-border bg-background px-2.5 py-1.5">
            <span className="text-[11px] font-mono text-muted-foreground w-4">H</span>
            <input
              type="number"
              min={1}
              value={displayH}
              onChange={(e) => handleHeightChange(parseInt(e.target.value, 10))}
              className="w-full bg-transparent text-right font-mono text-xs text-foreground focus:outline-none"
            />
            <span className="ml-1 text-[10px] text-zinc-500 font-mono">px</span>
          </div>
        </div>
      </div>

      {/* ROTATION */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Rotation
        </label>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-lg border border-border bg-background px-2.5 py-1.5">
            <RotateCw size={13} className="text-muted-foreground mr-1.5" />
            <input
              type="number"
              min={0}
              max={360}
              value={displayAngle}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  onUpdateProperty("angle", ((val % 360) + 360) % 360);
                }
              }}
              className="w-full bg-transparent text-right font-mono text-xs text-foreground focus:outline-none"
            />
            <span className="ml-1 text-[11px] font-mono text-zinc-500">°</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateProperty("angle", ((displayAngle - 90) % 360 + 360) % 360)}
              className="rounded border border-border bg-zinc-900 px-2 py-1.5 text-xs text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
              title="-90 degrees"
            >
              -90°
            </button>
            <button
              type="button"
              onClick={() => onUpdateProperty("angle", 0)}
              className="rounded border border-border bg-zinc-900 px-2 py-1.5 text-xs text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
              title="Reset rotation to 0"
            >
              0°
            </button>
            <button
              type="button"
              onClick={() => onUpdateProperty("angle", (displayAngle + 90) % 360)}
              className="rounded border border-border bg-zinc-900 px-2 py-1.5 text-xs text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
              title="+90 degrees"
            >
              +90°
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
