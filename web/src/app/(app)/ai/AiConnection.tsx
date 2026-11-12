"use client";

import { useEffect, useId, useState } from "react";
import { CheckCircle2, ExternalLink, KeyRound, Trash2 } from "lucide-react";
import {
  AI_MODELS, AI_PROVIDERS, AI_STORAGE_KEY, providerInfo, providerName, readAiSettings, testConnection, validBaseUrl,
  type AiProvider, type AiSettings,
} from "@/lib/ai-analysis";

const field = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-400";

export function AiConnection() {
  const [saved, setSaved] = useState<AiSettings | null>(null);
  const [provider, setProvider] = useState<AiProvider>("anthropic");
  const [key, setKey] = useState("");
  const [model, setModel] = useState(providerInfo("anthropic").defaultModel);
  const [baseUrl, setBaseUrl] = useState("");
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<{ tone: "ok" | "error" | "busy"; text: string } | null>(null);
  const modelList = useId();
  const info = providerInfo(provider);
  // A saved key can be kept only when staying with the same provider (and, for Other, the same address).
  const canKeepKey = Boolean(saved && saved.provider === provider && (provider !== "custom" || saved.baseUrl === baseUrl.trim()));

  useEffect(() => {
    const s = readAiSettings();
    setSaved(s);
    if (s) {
      setProvider(s.provider);
      setModel(s.model);
      setBaseUrl(s.baseUrl ?? "");
      setLabel(s.label ?? "");
    }
  }, []);

  function pickProvider(p: AiProvider) {
    setProvider(p);
    setModel(saved?.provider === p ? saved.model : providerInfo(p).defaultModel);
    setStatus(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const settings: AiSettings = {
      provider,
      apiKey: key.trim() || (canKeepKey ? saved!.apiKey : ""),
      model: model.trim(),
      ...(provider === "custom" ? { baseUrl: baseUrl.trim(), label: label.trim().slice(0, 40) } : {}),
    };
    if (!settings.apiKey) return setStatus({ tone: "error", text: "Paste your API key first." });
    if (!settings.model) return setStatus({ tone: "error", text: "Enter the model name." });
    if (provider === "custom" && !validBaseUrl(settings.baseUrl!)) {
      return setStatus({ tone: "error", text: "Enter the service's base URL, starting with https:// (http:// only for a model on this computer)." });
    }
    setStatus({ tone: "busy", text: `Checking your key with ${providerName(settings)}…` });
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
          {saved ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden /> : <KeyRound className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />}
          {saved
            ? <>Connected on this device · {providerName(saved)} · {AI_MODELS.find((m) => m.id === saved.model)?.name ?? saved.model} · key ending {saved.apiKey.slice(-4)}</>
            : "Not connected on this device."}
        </p>
        {saved && (
          <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:border-rose-400/50 hover:text-rose-300">
            <Trash2 className="h-3.5 w-3.5" aria-hidden />Remove from this device
          </button>
        )}
      </div>

      <form onSubmit={save} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <fieldset>
          <legend className="text-sm text-slate-300">AI provider</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {AI_PROVIDERS.map((p) => (
              <label key={p.id} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sky-400 ${provider === p.id ? "border-sky-400 bg-sky-400/15 text-sky-100" : "border-white/15 text-slate-300 hover:bg-white/5"}`}>
                <input type="radio" name="provider" value={p.id} checked={provider === p.id} onChange={() => pickProvider(p.id)} className="sr-only" />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>

        {provider === "custom" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-sm text-slate-300">Name</span>
              <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} placeholder="For example OpenRouter" className={`mt-1 ${field}`} />
            </label>
            <label className="block"><span className="text-sm text-slate-300">Base URL</span>
              <input type="url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} spellCheck={false} placeholder="https://openrouter.ai/api/v1" className={`mt-1 ${field} font-mono`} />
              <span className="mt-1 block text-xs text-slate-500">The address before /chat/completions.</span>
            </label>
          </div>
        )}

        <label className="block"><span className="text-sm text-slate-300">API key</span>
          <input type="password" autoComplete="off" spellCheck={false} value={key} onChange={(e) => setKey(e.target.value)}
            placeholder={canKeepKey ? "Leave blank to keep your saved key" : info.keyPlaceholder} className={`mt-1 ${field} font-mono`} />
          <span className="mt-1 block text-xs text-slate-500">{info.keyHelp} Use a key just for AstroMed so you can revoke it any time.</span>
        </label>

        <label className="block"><span className="text-sm text-slate-300">Model</span>
          {provider === "anthropic" ? (
            <select value={model} onChange={(e) => setModel(e.target.value)} className={`mt-1 ${field} bg-slate-900`}>
              {AI_MODELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          ) : (
            <>
              <input value={model} onChange={(e) => setModel(e.target.value)} list={modelList} spellCheck={false} placeholder="Model name" className={`mt-1 ${field} font-mono`} />
              <datalist id={modelList}>{info.models.map((m) => <option key={m} value={m} />)}</datalist>
              <span className="mt-1 block text-xs text-slate-500">
                Pick one that can read images.{" "}
                {info.modelsUrl
                  ? <a href={info.modelsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-sky-300 hover:text-sky-200">See current model names <ExternalLink className="h-3 w-3" aria-hidden /></a>
                  : "Use the exact name your service lists."}
              </span>
            </>
          )}
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={status?.tone === "busy"} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60">{saved ? "Save changes" : "Connect"}</button>
          {status && <p role={status.tone === "error" ? "alert" : "status"} className={`text-sm ${status.tone === "error" ? "text-rose-300" : status.tone === "ok" ? "text-emerald-300" : "text-slate-300"}`}>{status.text}</p>}
        </div>
      </form>
    </div>
  );
}
