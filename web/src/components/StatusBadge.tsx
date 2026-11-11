import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import type { Status } from "@/lib/crew";

// Reserved status colors, always paired with an icon and a word.
const STYLE: Record<Status, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  good: { label: "Within normal", color: "#0ca30c", Icon: CheckCircle2 },
  warning: { label: "Watch", color: "#fab219", Icon: AlertTriangle },
  critical: { label: "Check now", color: "#d03b3b", Icon: OctagonAlert },
};

export function StatusBadge({ status, small = false }: { status: Status; small?: boolean }) {
  const { label, color, Icon } = STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/5 ${small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"} text-slate-100`}>
      <Icon className={small ? "h-3.5 w-3.5" : "h-4 w-4"} style={{ color }} aria-hidden />
      {label}
    </span>
  );
}

export const STATUS_COLOR: Record<Status, string> = { good: STYLE.good.color, warning: STYLE.warning.color, critical: STYLE.critical.color };
