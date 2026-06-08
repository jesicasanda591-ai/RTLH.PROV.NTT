import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;
  tone?: "primary" | "gold" | "success" | "warning" | "info";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary text-primary-foreground",
    gold: "bg-gradient-gold text-accent-gold-foreground",
    success: "bg-success text-success-foreground",
    warning: "bg-warning text-warning-foreground",
    info: "bg-info text-info-foreground",
  };
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-extrabold text-primary-deep">{value}</div>
          {delta && <div className="mt-1 text-xs font-semibold text-success">{delta}</div>}
        </div>
        <div className={cn("grid h-11 w-11 place-items-center rounded-xl shadow-soft", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}