import { requireViewer } from "@/lib/session";
import { Chat } from "./Chat";

export default async function AssistantPage() {
  await requireViewer();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
        <h1 className="mt-1 text-2xl font-semibold">Ask AstroMed</h1>
        <p className="mt-1 text-slate-400">Questions answered from your own data in AstroMed. No AI model is used yet, so it works best with short questions about one measure or topic.</p>
      </div>
      <Chat starters={["How am I doing?", "Give me the details for my blood pressure", "What was my temperature yesterday?", "How did I sleep this week?", "How much radiation have I had?", "Which checkups are due?"]} />
      <p className="text-xs text-slate-500">Answers summarize your data and NASA-based tips.</p>
    </div>
  );
}
