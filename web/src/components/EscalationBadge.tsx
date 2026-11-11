import { CheckCircle2, MessageCircle, OctagonAlert, PhoneCall } from "lucide-react";
import type { Escalation } from "@/lib/checkups";

const STYLE: Record<Escalation, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  none: { label: "No action", color: "#0ca30c", Icon: CheckCircle2 },
  routine: { label: "Next conference", color: "#fab219", Icon: MessageCircle },
  today: { label: "Contact today", color: "#ec835a", Icon: PhoneCall },
  now: { label: "Contact now", color: "#d03b3b", Icon: OctagonAlert },
};

export function EscalationBadge({ level }: { level: Escalation }) {
  const { label, color, Icon } = STYLE[level];
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-100">
      <Icon className="h-3.5 w-3.5" style={{ color }} aria-hidden />
      {label}
    </span>
  );
}

export const ESCALATION_COLOR: Record<Escalation, string> = {
  none: STYLE.none.color, routine: STYLE.routine.color, today: STYLE.today.color, now: STYLE.now.color,
};
