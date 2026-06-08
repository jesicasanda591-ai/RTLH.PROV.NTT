import type { Status } from "@/lib/api";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: Status }) {
  // Map untuk menentukan warna
  const map: Record<Status, string> = {
    selesai: "bg-success/10 text-success ring-success/20",
    proses: "bg-info/10 text-info ring-info/20",
    verifikasi: "bg-warning/15 text-warning-foreground ring-warning/30",
    pending: "bg-muted text-muted-foreground ring-muted",
  };

  // Label untuk tampilan (Capitalized)
  const labels: Record<Status, string> = {
    selesai: "Selesai",
    proses: "Dalam Proses",
    verifikasi: "Verifikasi",
    pending: "Pending",
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", map[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}