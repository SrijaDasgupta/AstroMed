import { Rocket } from "lucide-react";
import { startDemo } from "@/app/actions";

export function DemoButton({ className = "" }: { className?: string }) {
  return (
    <form action={startDemo}>
      <button
        type="submit"
        className={`inline-flex items-center justify-center gap-2 rounded-lg border border-sky-400/40 px-4 py-2.5 text-sm font-medium text-sky-200 transition hover:bg-sky-400/10 ${className}`}
      >
        <Rocket className="h-4 w-4" aria-hidden />
        Try the demo
      </button>
    </form>
  );
}
