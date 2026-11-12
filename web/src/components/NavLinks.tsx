"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Bot, Compass, Stethoscope, Calculator, Dumbbell, ClipboardCheck, ClipboardList, FolderOpen, Globe2, HeartPulse, LayoutDashboard, LineChart, MessageCircle, NotebookPen, PersonStanding, Pill, ShieldAlert, User, UserCog } from "lucide-react";

const GROUPS = [
  {
    label: "Start here",
    links: [{ href: "/guide", label: "Getting started", icon: Compass }],
  },
  {
    label: "General",
    links: [
      { href: "/log", label: "Daily log", icon: ClipboardList },
      { href: "/checkups", label: "Checkups", icon: ClipboardCheck },
      { href: "/tools", label: "Health tools", icon: Calculator },
      { href: "/tips", label: "Health tips", icon: BookOpen },
      { href: "/mission", label: "Mission", icon: Globe2 },
    ],
  },
  {
    label: "Personalized",
    links: [
      { href: "/summary", label: "My summary", icon: LayoutDashboard },
      { href: "/problems", label: "Problems & advice", icon: Stethoscope },
      { href: "/me", label: "My space", icon: User },
      { href: "/vitals", label: "My vitals", icon: HeartPulse },
      { href: "/history", label: "Long-term history", icon: LineChart },
      { href: "/reminders", label: "Medicines & reminders", icon: Pill },
      { href: "/exercise", label: "Exercise plan", icon: Dumbbell },
      { href: "/journal", label: "Journal", icon: NotebookPen },
      { href: "/body", label: "My body", icon: PersonStanding },
      { href: "/hazards", label: "My exposure", icon: ShieldAlert },
      { href: "/assistant", label: "Ask AstroMed", icon: MessageCircle },
      { href: "/records", label: "My records", icon: FolderOpen },
      { href: "/profile", label: "My profile", icon: UserCog },
      { href: "/ai", label: "AI connection", icon: Bot },
    ],
  },
];

export function NavLinks() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="flex flex-col gap-5" aria-label="Main">
      {GROUPS.map((g) => (
        <div key={g.label} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-widest text-slate-500">{g.label}</p>
          {g.links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-sky-400/15 text-sky-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
