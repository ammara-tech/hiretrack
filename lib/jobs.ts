import { addDays, isIsoDate, isTime } from "@/lib/dates";
import type { InterviewKind, Job, NewJob, Outcome, Stage, Step, WorkMode } from "@/lib/types";

/*
  The rules of the board: the five stages, what happens when a job moves between them, where a
  card goes when you drag it, and cleaning what's typed before it's saved.
  Plain functions with no Firebase, so tests/jobs.test.ts checks them all.
*/

export const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: "saved", label: "Saved", hint: "Jobs you might apply for" },
  { id: "applied", label: "Applied", hint: "Waiting to hear back" },
  { id: "interview", label: "Interview", hint: "Talking to them" },
  { id: "offer", label: "Offer", hint: "They want you" },
  { id: "closed", label: "Closed", hint: "Not this time" },
];

export const stageLabel = (s: Stage) => STAGES.find((x) => x.id === s)?.label ?? "Saved";
export const isStage = (v: unknown): v is Stage => STAGES.some((s) => s.id === v);

export const OUTCOMES: { id: Exclude<Outcome, "">; label: string }[] = [
  { id: "rejected", label: "They said no" },
  { id: "noReply", label: "No reply" },
  { id: "withdrew", label: "I withdrew" },
  { id: "declined", label: "I turned down the offer" },
];
export const outcomeLabel = (o: Outcome) => OUTCOMES.find((x) => x.id === o)?.label ?? "Closed";
export const isOutcome = (v: unknown): v is Outcome => v === "" || OUTCOMES.some((o) => o.id === v);

export const MODES: { id: Exclude<WorkMode, "">; label: string }[] = [
  { id: "onsite", label: "At the office" },
  { id: "hybrid", label: "Hybrid" },
  { id: "remote", label: "Remote" },
];
export const isMode = (v: unknown): v is WorkMode => v === "" || MODES.some((m) => m.id === v);

export const INTERVIEW_KINDS: { id: InterviewKind; label: string }[] = [
  { id: "phone", label: "Phone call" },
  { id: "video", label: "Video call" },
  { id: "inPerson", label: "In person" },
  { id: "assessment", label: "Test or assessment" },
];
export const kindLabel = (k: InterviewKind) => INTERVIEW_KINDS.find((x) => x.id === k)?.label ?? "Interview";
export const isKind = (v: unknown): v is InterviewKind => INTERVIEW_KINDS.some((k) => k.id === v);

/** Places people often find jobs in South Africa, offered as suggestions (anything can be typed) */
export const SOURCES = ["LinkedIn", "PNet", "Careers24", "Indeed", "Company website", "Recruiter", "Someone I know", "Graduate programme"];

/** The longest each piece of text can be. The security rules check the same limits. */
export const LIMITS = {
  company: 80,
  role: 100,
  link: 500,
  location: 80,
  salary: 60,
  source: 40,
  followUpNote: 140,
  contactName: 80,
  contactEmail: 120,
  notes: 2000,
  research: 2000,
  interviews: 10,
  checklist: 30,
  questions: 30,
  history: 40,
  short: 200, // an interview's "with" and "where", a checklist item, a question
  answer: 1000, // notes for an answer, or for an interview
} as const;

/** The number of days after applying that HireTrack suggests following up */
export const FOLLOW_UP_DAYS = 7;
/** The note on that automatic reminder. Once they answer, it's cleared. */
export const AUTO_FOLLOW_UP = "Follow up on your application";

const trim = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** A web address someone typed, made safe to link to: only http(s), "www.x.co.za" gets https:// */
export function cleanLink(v: unknown) {
  const s = trim(v, LIMITS.link);
  if (!s) return "";
  const withScheme = /^https?:\/\//i.test(s) ? s : /^[\w-]+(\.[\w-]+)+/.test(s) ? `https://${s}` : "";
  try {
    return withScheme ? new URL(withScheme).toString().slice(0, LIMITS.link) : "";
  } catch {
    return "";
  }
}

export const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/** A new job card */
export function blankJob(fields: NewJob, today: string, now: number, order: number): Omit<Job, "id"> {
  const stage = isStage(fields.stage) ? fields.stage : "saved";
  const job: Omit<Job, "id"> = {
    company: trim(fields.company, LIMITS.company),
    role: trim(fields.role, LIMITS.role),
    link: cleanLink(fields.link),
    location: trim(fields.location, LIMITS.location),
    mode: isMode(fields.mode) ? fields.mode : "",
    salary: trim(fields.salary, LIMITS.salary),
    source: trim(fields.source, LIMITS.source),
    stage: "saved",
    outcome: "",
    accepted: false,
    appliedOn: "",
    heardBackOn: "",
    followUpOn: "",
    followUpNote: "",
    contactName: "",
    contactEmail: "",
    cvId: "",
    coverId: "",
    notes: "",
    research: "",
    interviews: [],
    checklist: [],
    questions: [],
    history: [{ stage: "saved", on: today }],
    order,
    example: false,
    createdAt: now,
    updatedAt: now,
  };
  return stage === "saved" ? job : { ...job, ...moveTo({ ...job, id: "" }, stage, today) };
}

const REACHED_ORDER: Stage[] = ["saved", "applied", "interview", "offer"];

/**
 * What changes when a job moves to another stage:
 * - Applying (or jumping straight to an interview or offer) fills in the date you applied,
 *   and sets a reminder to follow up a week later if you don't have one.
 * - The first answer after applying (an interview, an offer, or a no) is saved as the day you
 *   heard back, for "average days to hear back" on the Stats page.
 * - Once they answer with an interview or offer, that automatic reminder is cleared (your own stay).
 * - Closing a job clears its reminder. Leaving Closed clears the reason; leaving Offer clears "accepted".
 * - Every move is added to the job's story (history).
 */
export function moveTo(job: Job, stage: Stage, today: string, outcome: Outcome = ""): Partial<Job> {
  if (job.stage === stage && stage !== "closed") return {};
  const changes: Partial<Job> = { stage };
  const appliedNow = !job.appliedOn && REACHED_ORDER.indexOf(stage) >= 1;
  if (appliedNow) changes.appliedOn = today;
  const appliedOn = changes.appliedOn ?? job.appliedOn;

  if (stage === "applied" && !job.followUpOn) {
    changes.followUpOn = addDays(today, FOLLOW_UP_DAYS);
    changes.followUpNote = AUTO_FOLLOW_UP;
  }
  if ((stage === "interview" || stage === "offer") && job.followUpNote === AUTO_FOLLOW_UP) {
    changes.followUpOn = "";
    changes.followUpNote = "";
  }
  if (stage === "closed") {
    changes.outcome = outcome;
    changes.followUpOn = "";
    changes.followUpNote = "";
  } else if (job.outcome) changes.outcome = "";
  if (stage !== "offer" && job.accepted) changes.accepted = false;

  const answered = stage === "interview" || stage === "offer" || (stage === "closed" && outcome === "rejected");
  if (answered && appliedOn && !job.heardBackOn && !appliedNow) changes.heardBackOn = today;

  if (job.stage !== stage) changes.history = addStep(job.history, { stage, on: today });
  return changes;
}

/** Changing why a closed job was closed. "They said no" also counts as hearing back. */
export function setOutcome(job: Job, outcome: Outcome, today: string): Partial<Job> {
  const changes: Partial<Job> = { outcome };
  if (outcome === "rejected" && job.appliedOn && !job.heardBackOn) changes.heardBackOn = today;
  return changes;
}

function addStep(history: Step[], step: Step) {
  return [...history, step].slice(-LIMITS.history);
}

/** Whether a job ever got to a stage (closed jobs remember how far they got) */
export function reached(job: Pick<Job, "stage" | "history" | "appliedOn">, stage: Stage) {
  if (stage === "applied" && job.appliedOn) return true;
  return job.stage === stage || job.history.some((s) => s.stage === stage);
}

/** The board: each stage's jobs in their order (cards you placed), newest first if equal */
export function columns(jobs: Job[]): Record<Stage, Job[]> {
  const out: Record<Stage, Job[]> = { saved: [], applied: [], interview: [], offer: [], closed: [] };
  for (const j of jobs) out[j.stage].push(j);
  for (const s of STAGES) out[s.id].sort((a, b) => a.order - b.order || b.createdAt - a.createdAt);
  return out;
}

/**
 * The order number for a card dropped at `index` in a column (the column's cards, without the
 * card being moved). It goes halfway between its new neighbours, so no other card has to change.
 */
export function orderAt(column: Pick<Job, "order">[], index: number) {
  if (column.length === 0) return 0;
  const i = Math.max(0, Math.min(index, column.length));
  if (i === 0) return column[0].order - 1000;
  if (i === column.length) return column[column.length - 1].order + 1000;
  return (column[i - 1].order + column[i].order) / 2;
}

/** Search on the board: company, role, location, source and notes, ignoring capitals and accents */
export function matches(job: Job, words: string) {
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const hay = norm([job.company, job.role, job.location, job.source, job.notes].join(" "));
  return norm(words)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

/** "Junior Developer at Karoo Labs" */
export function jobTitle(job: Pick<Job, "role" | "company">) {
  if (job.role && job.company) return `${job.role} at ${job.company}`;
  return job.role || job.company || "A job";
}

/**
 * The fields of a job that can be changed from its page, cleaned: text trimmed to its limit, links
 * made safe, dates and choices checked. Anything else (its stage, story and order) is left out, so a
 * form can never save something it doesn't own.
 */
export function cleanEdits(fields: Partial<Job>): Partial<Job> {
  const out: Partial<Job> = {};
  const textFields = ["company", "role", "location", "salary", "source", "followUpNote", "contactName", "notes", "research"] as const;
  for (const k of textFields) if (k in fields) out[k] = trim(fields[k], LIMITS[k]);
  if ("link" in fields) out.link = cleanLink(fields.link);
  if ("contactEmail" in fields) {
    const e = trim(fields.contactEmail, LIMITS.contactEmail);
    out.contactEmail = looksLikeEmail(e) ? e : "";
  }
  if ("mode" in fields) out.mode = isMode(fields.mode) ? fields.mode : "";
  if ("followUpOn" in fields) out.followUpOn = typeof fields.followUpOn === "string" && isIsoDate(fields.followUpOn) ? fields.followUpOn : "";
  if ("appliedOn" in fields) out.appliedOn = typeof fields.appliedOn === "string" && isIsoDate(fields.appliedOn) ? fields.appliedOn : "";
  if ("cvId" in fields) out.cvId = trim(fields.cvId, 40);
  if ("coverId" in fields) out.coverId = trim(fields.coverId, 40);
  if ("accepted" in fields) out.accepted = fields.accepted === true;
  if ("interviews" in fields && Array.isArray(fields.interviews)) {
    out.interviews = fields.interviews
      .filter((i) => isIsoDate(i.date))
      .slice(0, LIMITS.interviews)
      .map((i) => ({
        id: trim(i.id, 20),
        date: i.date,
        time: isTime(i.time) ? i.time : "",
        kind: isKind(i.kind) ? i.kind : "video",
        with: trim(i.with, LIMITS.short),
        where: trim(i.where, LIMITS.short),
        notes: trim(i.notes, LIMITS.answer),
      }));
  }
  if ("checklist" in fields && Array.isArray(fields.checklist)) {
    out.checklist = fields.checklist
      .map((c) => ({ id: trim(c.id, 20), text: trim(c.text, LIMITS.short), done: c.done === true }))
      .filter((c) => c.text)
      .slice(0, LIMITS.checklist);
  }
  if ("questions" in fields && Array.isArray(fields.questions)) {
    out.questions = fields.questions
      .map((q) => ({ id: trim(q.id, 20), question: trim(q.question, LIMITS.short), answer: trim(q.answer, LIMITS.answer) }))
      .filter((q) => q.question)
      .slice(0, LIMITS.questions);
  }
  return out;
}

/** A short random ID for an interview, checklist item or question inside a job */
export function itemId() {
  return Math.random().toString(36).slice(2, 10);
}
