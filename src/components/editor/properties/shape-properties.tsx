"use client";

import { Minus, Plus } from "lucide-react";
import { SelectedElementProperties } from "@/types";
import { ColorProperties } from "./color-properties";

interface ShapePropertiesProps {
  selected: SelectedElementProperties;
  onUpdateProperty: (
    property: keyof SelectedElementProperties,
    value: string | number | boolean | undefined
  ) => void;
}

export function ShapeProperties({
  selected,
  onUpdateProperty,
}: ShapePropertiesProps) {
  const isLine = selected.type === "line";
  const strokeWidth = selected.strokeWidth ?? (isLine ? 3 : 1);

  return (
    <div className="space-y-4">
      {/* FILL COLOR (only for rect / circle) */}
      {!isLine && (
        <ColorProperties
          selected={selected}
          onUpdateProperty={onUpdateProperty}
          label="Fill Color"
          propertyKey="fill"
        />
      )}

      {/* STROKE COLOR */}
      <ColorProperties
        selected={selected}
        onUpdateProperty={onUpdateProperty}
        label="Stroke / Border Color"
        propertyKey="stroke"
      />

      {/* STROKE WIDTH */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Stroke Width
        </label>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-lg border border-border bg-background overflow-hidden">
            <button
              type="button"
              onClick={() => onUpdateProperty("strokeWidth", Math.max(0, strokeWidth - 1))}
              className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
            >
              <Minus size={13} />
            </button>
            <input
              type="number"
              min={0}
              max={50}
              value={strokeWidth}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  onUpdateProperty("strokeWidth", Math.max(0, val));
                }
              }}
              className="w-full text-center bg-transparent text-xs font-mono text-foreground focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onUpdateProperty("strokeWidth", Math.min(50, strokeWidth + 1))}
              className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
            >
              <Plus size={13} />
            </button>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">px</span>
        </div>
      </div>
    </div>
  );
}
