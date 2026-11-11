"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Globe2, LayoutDashboard, ShieldAlert, Users } from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mission", label: "Mission", icon: Globe2 },
  { href: "/crew", label: "Crew", icon: Users },
  { href: "/hazards", label: "Hazards", icon: ShieldAlert },
  { href: "/tips", label: "Health tips", icon: BookOpen },
];


export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 md:flex-col">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
              active ? "bg-sky-400/15 text-sky-200" : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
