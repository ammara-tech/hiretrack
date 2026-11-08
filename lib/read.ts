import { isIsoDate, isTime } from "@/lib/dates";
import { isKind, isMode, isOutcome, isStage, LIMITS } from "@/lib/jobs";
import { DOC_LIMITS } from "@/lib/documents";
import type { Doc, Interview, Job, PrepItem, PrepQuestion, Profile, Step } from "@/lib/types";

/*
  Reading jobs, documents and your profile from Firestore, checked, so one broken or old
  document can't break a screen: anything missing or the wrong type gets a safe default.
  Tested in tests/read.test.ts.
*/

const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const date = (v: unknown) => (typeof v === "string" && isIsoDate(v) ? v : "");
const list = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object").slice(0, max) : []);

function readInterview(d: Record<string, unknown>): Interview | null {
  const on = date(d.date);
  if (!on) return null;
  return {
    id: text(d.id, 20),
    date: on,
    time: typeof d.time === "string" && isTime(d.time) ? d.time : "",
    kind: isKind(d.kind) ? d.kind : "video",
    with: text(d.with, LIMITS.short),
    where: text(d.where, LIMITS.short),
    notes: text(d.notes, LIMITS.answer),
  };
}

export function readJob(id: string, d: Record<string, unknown>): Job {
  const stage = isStage(d.stage) ? d.stage : "saved";
  const history: Step[] = list(d.history, LIMITS.history)
    .filter((s) => isStage(s.stage) && date(s.on))
    .map((s) => ({ stage: s.stage as Step["stage"], on: date(s.on) }));
  return {
    id,
    company: text(d.company, LIMITS.company),
    role: text(d.role, LIMITS.role),
    link: text(d.link, LIMITS.link),
    location: text(d.location, LIMITS.location),
    mode: isMode(d.mode) ? d.mode : "",
    salary: text(d.salary, LIMITS.salary),
    source: text(d.source, LIMITS.source),
    stage,
    outcome: stage === "closed" && isOutcome(d.outcome) ? d.outcome : "",
    accepted: stage === "offer" && d.accepted === true,
    appliedOn: date(d.appliedOn),
    heardBackOn: date(d.heardBackOn),
    followUpOn: date(d.followUpOn),
    followUpNote: text(d.followUpNote, LIMITS.followUpNote),
    contactName: text(d.contactName, LIMITS.contactName),
    contactEmail: text(d.contactEmail, LIMITS.contactEmail),
    cvId: text(d.cvId, 40),
    coverId: text(d.coverId, 40),
    notes: text(d.notes, LIMITS.notes),
    research: text(d.research, LIMITS.research),
    interviews: list(d.interviews, LIMITS.interviews)
      .map(readInterview)
      .filter((i): i is Interview => i !== null),
    checklist: list(d.checklist, LIMITS.checklist).map((c): PrepItem => ({ id: text(c.id, 20), text: text(c.text, LIMITS.short), done: c.done === true })),
    questions: list(d.questions, LIMITS.questions).map((q): PrepQuestion => ({ id: text(q.id, 20), question: text(q.question, LIMITS.short), answer: text(q.answer, LIMITS.answer) })),
    history: history.length ? history : [{ stage, on: date(d.appliedOn) || "1970-01-01" }],
    order: num(d.order),
    example: d.example === true,
    createdAt: num(d.createdAt),
    updatedAt: num(d.updatedAt),
  };
}

export function readDoc(id: string, d: Record<string, unknown>): Doc {
  return {
    id,
    kind: d.kind === "cover" ? "cover" : "cv",
    name: text(d.name, DOC_LIMITS.name) || "Untitled",
    link: text(d.link, DOC_LIMITS.link),
    notes: text(d.notes, DOC_LIMITS.notes),
    createdAt: num(d.createdAt),
  };
}

export const MAX_GOAL = 50;

export function readProfile(d: Record<string, unknown> | undefined, fallbackName: string): Profile {
  const goal = Math.round(num(d?.weeklyGoal));
  return {
    name: text(d?.name, 40) || fallbackName,
    weeklyGoal: goal >= 0 && goal <= MAX_GOAL ? goal : 0,
  };
}

/** A starting name from the sign-in: the Google first name, or the start of the email address */
export function defaultName(user: { displayName?: string | null; email?: string | null }) {
  const fromGoogle = user.displayName?.trim().split(/\s+/)[0];
  if (fromGoogle) return fromGoogle.slice(0, 40);
  const local = user.email?.split("@")[0]?.split(/[._+-]/)[0] ?? "";
  return local ? (local[0].toUpperCase() + local.slice(1)).slice(0, 40) : "Me";
}
