import { bodyNoteItemAction } from "@/app/actions";

function Op({ id, op, children, danger = false }: { id: string; op: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <form action={bodyNoteItemAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <button type="submit" className={`rounded-lg border border-white/15 px-2.5 py-1 text-xs ${danger ? "text-slate-400 hover:border-rose-400/50 hover:text-rose-300" : "text-slate-300 hover:bg-white/5"}`}>{children}</button>
    </form>
  );
}

export function NoteOps({ id, resolved }: { id: string; resolved: boolean }) {
  return (
    <span className="flex gap-2">
      {resolved ? <Op id={id} op="reopen">Reopen</Op> : <Op id={id} op="resolve">Mark resolved</Op>}
      <Op id={id} op="delete" danger>Delete</Op>
    </span>
  );
}
