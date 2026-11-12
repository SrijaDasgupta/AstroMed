import { requireViewer } from "@/lib/session";
import { AiConnection } from "./AiConnection";

export default async function AiPage() {
  const viewer = await requireViewer();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
        <h1 className="mt-1 text-2xl font-semibold">AI connection</h1>
        <p className="mt-1 max-w-3xl text-slate-400">
          AstroMed works without AI. If you want photos of a problem analyzed, connect your own AI account here. You pay your AI provider directly for what you use; AstroMed itself never charges for it.
        </p>
      </div>

      {viewer.kind === "demo"
        ? <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">Photo analysis needs an account, because photos are only stored for signed-in users.</p>
        : <AiConnection />}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
          <h2 className="font-medium text-white">How your key is kept</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Saved only in this browser on this device. It is never sent to AstroMed&apos;s servers or stored in your account.</li>
            <li>Each device needs its own connection. Removing it, or clearing your browser data, deletes it.</li>
            <li>Anyone who uses this browser could use your key, so only connect on your own device.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
          <h2 className="font-medium text-white">What is sent, and where</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Only when you press <strong className="text-white">Analyze photo</strong>: that photo, the earlier photo of the same problem if there is one, and what you wrote about it.</li>
            <li>It goes straight from your device to Anthropic under your account and its terms. AstroMed then saves the result with the problem.</li>
            <li>The analysis can raise how urgent a problem looks, never lower it. It isn&apos;t a diagnosis and never suggests medicines.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
