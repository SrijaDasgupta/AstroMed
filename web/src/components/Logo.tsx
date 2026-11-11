import { Orbit } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <Orbit className="h-5 w-5 text-sky-400" aria-hidden />
      AstroMed
    </span>
  );
}
