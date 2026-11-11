import { Database } from "lucide-react";

export function SetupNotice({ problem }: { problem: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">
      <Database className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>{problem}</p>
    </div>
  );
}
