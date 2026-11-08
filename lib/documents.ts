import { cleanLink, reached } from "@/lib/jobs";
import type { Doc, DocKind, Job } from "@/lib/types";

/*
  CV versions and cover letters. HireTrack keeps each one's name, a link to the file (in Google
  Drive or OneDrive, for example) and notes, not the file itself. Each job remembers which CV and
  cover letter you sent, so you can see which version gets you more interviews.
  Tested in tests/documents.test.ts.
*/

export const DOC_LIMITS = { name: 80, link: 500, notes: 500, count: 30 } as const;

export const kindName = (k: DocKind) => (k === "cv" ? "CV" : "Cover letter");

export function cleanDoc(fields: Pick<Doc, "kind" | "name" | "link" | "notes">) {
  return {
    kind: fields.kind === "cover" ? ("cover" as const) : ("cv" as const),
    name: fields.name.trim().slice(0, DOC_LIMITS.name),
    link: cleanLink(fields.link),
    notes: fields.notes.trim().slice(0, DOC_LIMITS.notes),
  };
}

export type DocUse = { sent: number; interviews: number; rate: number | null };

/** For each document: how many applications it went with, and how many of those reached an interview */
export function docUsage(docs: Doc[], jobs: Job[]): Record<string, DocUse> {
  const out: Record<string, DocUse> = {};
  for (const d of docs) {
    const used = jobs.filter((j) => j.appliedOn && (j.cvId === d.id || j.coverId === d.id));
    const interviews = used.filter((j) => reached(j, "interview") || reached(j, "offer")).length;
    out[d.id] = { sent: used.length, interviews, rate: used.length ? Math.round((interviews / used.length) * 100) : null };
  }
  return out;
}

/** The documents of one kind, newest first, for the "Which CV did you send?" boxes */
export function docsOfKind(docs: Doc[], kind: DocKind) {
  return docs.filter((d) => d.kind === kind).sort((a, b) => b.createdAt - a.createdAt);
}

/** "3 applications, 1 interview" */
export function usageText(use: DocUse | undefined) {
  if (!use || use.sent === 0) return "Not sent with an application yet";
  const apps = `${use.sent} application${use.sent === 1 ? "" : "s"}`;
  const ints = `${use.interviews} interview${use.interviews === 1 ? "" : "s"}`;
  return `${apps}, ${ints} (${use.rate}%)`;
}
