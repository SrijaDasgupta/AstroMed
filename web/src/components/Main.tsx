"use client";

import { usePathname } from "next/navigation";

/** Page content area. Dashboard-style pages get more width. */
export function Main({ children }: { children: React.ReactNode }) {
  const wide = (usePathname() ?? "").startsWith("/body");
  return <main className={`mx-auto px-4 pb-24 pt-5 sm:px-6 md:pb-6 md:pt-6 ${wide ? "max-w-[1400px]" : "max-w-5xl"}`}>{children}</main>;
}
