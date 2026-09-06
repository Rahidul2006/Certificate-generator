"use client";

import { useState } from "react";
import { SelectedElementProperties } from "@/types";

interface ColorPropertiesProps {
  selected: SelectedElementProperties;
  onUpdateProperty: (
    property: keyof SelectedElementProperties,
    value: string | number | boolean | undefined
  ) => void;
  label?: string;
  propertyKey?: "fill" | "stroke";
}

export function ColorProperties({
  selected,
  onUpdateProperty,
  label = "Color",
  propertyKey = "fill",
}: ColorPropertiesProps) {
  const currentColor =
    (selected[propertyKey] as string) ||
    (propertyKey === "fill" ? "#18181b" : "#000000");

  const [localHex, setLocalHex] = useState<string | null>(null);
  const displayHex = localHex !== null ? localHex : currentColor;

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("#")) {
      val = "#" + val;
    }
    setLocalHex(val);

    // Validate 3, 6, or 8 digit hex color
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(val)) {
      onUpdateProperty(propertyKey, val);
    }
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalHex(null);
    onUpdateProperty(propertyKey, val);
  };

  const currentOpacity = Math.round((selected.opacity ?? 1) * 100);

  return (
    <div className="space-y-3">
      {/* COLOR PICKER & HEX INPUT */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {/* Swatch picker button wrapping native color input */}
          <div className="relative h-8 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-background shadow-xs">
            <input
              type="color"
              value={
                currentColor.startsWith("#") &&
                (currentColor.length === 7 || currentColor.length === 4)
                  ? currentColor
                  : "#18181b"
              }
              onChange={handleNativePickerChange}
              className="absolute -inset-2 h-12 w-14 cursor-pointer opacity-0"
              title="Pick color"
            />
            <div
              className="h-full w-full rounded"
              style={{ backgroundColor: currentColor }}
            />
          </div>

          {/* Hex Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={displayHex}
              onChange={handleHexChange}
              onBlur={() => setLocalHex(null)}
              placeholder="#000000"
              maxLength={9}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground uppercase focus:border-zinc-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* OPACITY SLIDER */}
      {propertyKey === "fill" && (
        <div className="pt-1">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">
              Opacity
            </span>
            <span className="font-mono text-foreground font-medium">
              {currentOpacity}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              value={currentOpacity}
              onChange={(e) => {
                const percent = Number(e.target.value);
                onUpdateProperty("opacity", percent / 100);
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
