"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Trash2 } from "lucide-react";
import { AI_MODELS, AI_STORAGE_KEY, readAiSettings, testConnection, type AiModel, type AiSettings } from "@/lib/ai-analysis";

const field = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-400";

export function AiConnection() {
  const [saved, setSaved] = useState<AiSettings | null>(null);
  const [key, setKey] = useState("");
  const [model, setModel] = useState<AiModel>("claude-opus-5-5");
  const [status, setStatus] = useState<{ tone: "ok" | "error" | "busy"; text: string } | null>(null);

  useEffect(() => {
    const s = readAiSettings();
    setSaved(s);
    if (s) setModel(s.model);
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const settings: AiSettings = { provider: "anthropic", apiKey: key.trim() || saved?.apiKey || "", model };
    if (!settings.apiKey) return setStatus({ tone: "error", text: "Paste your API key first." });
    setStatus({ tone: "busy", text: "Checking your key with Anthropic…" });
    try {
      await testConnection(settings);
      localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(settings));
      setSaved(settings);
      setKey("");
      setStatus({ tone: "ok", text: "Connected. Your key is saved on this device only." });
    } catch (err) {
      setStatus({ tone: "error", text: err instanceof Error ? err.message : "That didn't work." });
    }
  }

  function remove() {
    localStorage.removeItem(AI_STORAGE_KEY);
    setSaved(null);
    setStatus({ tone: "ok", text: "Removed from this device." });
  }

  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${saved ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"}`}>
        <p className="flex items-center gap-2 text-sm">
          {saved ? <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden /> : <KeyRound className="h-5 w-5 text-slate-400" aria-hidden />}
          {saved ? <>Connected on this device · {AI_MODELS.find((m) => m.id === saved.model)?.name ?? saved.model} · key ending {saved.apiKey.slice(-4)}</> : "Not connected on this device."}
        </p>
        {saved && (
          <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:border-rose-400/50 hover:text-rose-300">
            <Trash2 className="h-3.5 w-3.5" aria-hidden />Remove from this device
          </button>
        )}
      </div>

      <form onSubmit={save} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <label className="block"><span className="text-sm text-slate-300">Your Anthropic API key</span>
          <input type="password" autoComplete="off" spellCheck={false} value={key} onChange={(e) => setKey(e.target.value)}
            placeholder={saved ? "Leave blank to keep your saved key" : "sk-ant-…"} className={`mt-1 ${field} font-mono`} />
          <span className="mt-1 block text-xs text-slate-500">Create one at console.anthropic.com → API keys. Use a key just for AstroMed so you can revoke it any time.</span>
        </label>
        <label className="block"><span className="text-sm text-slate-300">Model</span>
          <select value={model} onChange={(e) => setModel(e.target.value as AiModel)} className={`mt-1 ${field} bg-slate-900`}>
            {AI_MODELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={status?.tone === "busy"} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60">{saved ? "Save changes" : "Connect"}</button>
          {status && <p role={status.tone === "error" ? "alert" : "status"} className={`text-sm ${status.tone === "error" ? "text-rose-300" : status.tone === "ok" ? "text-emerald-300" : "text-slate-300"}`}>{status.text}</p>}
        </div>
      </form>
    </div>
  );
}
