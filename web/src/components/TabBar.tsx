"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, LayoutDashboard, MessageCircle, Stethoscope } from "lucide-react";

const TABS = [
  { href: "/start", label: "Home", icon: Home },
  { href: "/log", label: "Log", icon: ClipboardList },
  { href: "/problems", label: "Problems", icon: Stethoscope },
  { href: "/summary", label: "Summary", icon: LayoutDashboard },
  { href: "/assistant", label: "Ask", icon: MessageCircle },
];

/** Thumb-reach shortcuts on phones. The full menu stays behind the Menu button. */
export function TabBar() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Shortcuts" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden md:hidden">
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "text-sky-300" : "text-slate-400"}`}>
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
