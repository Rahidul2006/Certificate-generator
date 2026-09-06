import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  accentColor?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accentColor,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-zinc-700/80">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-zinc-900/60">
          <Icon size={16} className={accentColor || "text-muted-foreground"} />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
