"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bot, Send } from "lucide-react";
import { askAssistant } from "@/app/actions";
import { MetricChart } from "@/components/MetricChart";
import { TipCard } from "@/components/TipCard";
import type { Answer, Block } from "@/lib/assistant";
import { TIPS } from "@/lib/tips";

type Message = { role: "user"; text: string } | { role: "assistant"; answer: Answer };

function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case "text":
      return <p className={b.tone === "warning" ? "text-amber-100" : b.tone === "muted" ? "text-xs text-slate-400" : "text-slate-100"}>{b.text}</p>;
    case "stats":
      return (
        <dl className="grid gap-x-6 gap-y-2 rounded-xl bg-white/[0.03] p-3 sm:grid-cols-2">
          {b.items.map((i) => (
            <div key={i.label} className="flex justify-between gap-3 text-sm">
              <dt className="text-slate-400">{i.label}</dt>
              <dd className="text-right tabular-nums text-slate-100">{i.value}</dd>
            </div>
          ))}
        </dl>
      );
    case "chart":
      return <MetricChart {...b.chart} />;
    case "tips":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          {b.tipIds.map((id) => TIPS.find((t) => t.id === id)).filter(Boolean).map((t) => <TipCard key={t!.id} tip={t!} compact />)}
        </div>
      );
    case "links":
      return (
        <div className="flex flex-wrap gap-3 text-sm">
          {b.links.map((l) => <Link key={l.href} href={l.href} className="text-sky-300 hover:text-sky-200">{l.label} →</Link>)}
        </div>
      );
  }
}

export function Chat({ starters }: { starters: string[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  function ask(text: string) {
    const q = text.trim();
    if (!q || pending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    start(async () => {
      const answer = await askAssistant(q);
      setMessages((m) => [...m, { role: "assistant", answer }]);
    });
  }

  const lastSuggestions = [...messages].reverse().find((m) => m.role === "assistant");
  const chips = lastSuggestions && lastSuggestions.role === "assistant" ? lastSuggestions.answer.suggestions : starters;

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <Bot className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden />
            <p>Hi! Ask me about your vitals, checkups, radiation, bone loss or progress. For example, &ldquo;give me the details for my blood pressure&rdquo; or &ldquo;how did I sleep this week?&rdquo;</p>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-sky-500 px-4 py-2 text-sm text-slate-950">{m.text}</p>
            </div>
          ) : (
            <div key={i} className="flex gap-3">
              <Bot className="mt-1 h-5 w-5 shrink-0 text-sky-300" aria-hidden />
              <div className="min-w-0 flex-1 space-y-3 rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.03] p-4 text-sm">
                {m.answer.blocks.map((b, j) => <BlockView key={j} b={b} />)}
              </div>
            </div>
          ),
        )}
        {pending && <p className="flex items-center gap-2 text-sm text-slate-400"><Bot className="h-5 w-5 text-sky-300" aria-hidden /> Looking at your data…</p>}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 space-y-3 bg-[var(--background)] pb-2 pt-2">
        <div className="flex flex-wrap gap-2" aria-label="Suggested questions">
          {chips.map((s) => (
            <button key={s} type="button" onClick={() => ask(s)} disabled={pending} className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50">{s}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2">
          <label htmlFor="ask" className="sr-only">Ask a question about your health data</label>
          <input
            id="ask"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={300}
            placeholder="Ask about your vitals, e.g. “details for my heart rate last 14 days”"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-sky-400"
          />
          <button type="submit" disabled={pending || !input.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50">
            <Send className="h-4 w-4" aria-hidden /> Ask
          </button>
        </form>
      </div>
    </div>
  );
}
