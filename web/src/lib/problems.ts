import { adviceFor, areaOf, BODY_AREAS, NOTE_KINDS, noteTitle, pinOf } from "@/lib/body-notes";
import { listBodyNotes, photoLinks } from "@/lib/body-notes-store";
import { localDate } from "@/lib/dates";
import type { Viewer } from "@/lib/session";
import type { ProblemView } from "@/components/problems/ProblemCard";

const RANK = { now: 3, today: 2, routine: 1, none: 0 } as const;

/** The user's problems with advice, most urgent first, plus photo links and form options. */
export async function loadProblems(viewer: Viewer) {
  const today = localDate();
  const { notes, problem } = await listBodyNotes(viewer);
  const photos = await photoLinks(viewer, notes);
  const views: ProblemView[] = notes.map((n) => ({ ...n, title: noteTitle(n), part: areaOf(n.area)?.part ?? "skin", pin: pinOf(n), advice: adviceFor(n, notes, today) }));
  views.sort((a, b) => Number(Boolean(a.resolvedOn)) - Number(Boolean(b.resolvedOn)) || RANK[b.advice.level] - RANK[a.advice.level] || b.createdAt.localeCompare(a.createdAt));
  return {
    today,
    problem,
    views,
    photos,
    areas: BODY_AREAS.map((a) => ({ id: a.id, name: a.name, sided: a.sided, part: a.part })),
    kinds: NOTE_KINDS.map((k) => ({ id: k.id, name: k.name })),
    canAttach: viewer.kind === "user",
  };
}
