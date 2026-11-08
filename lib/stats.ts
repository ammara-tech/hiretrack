import { addDays, daysBetween, weekStart } from "@/lib/dates";
import { reached } from "@/lib/jobs";
import type { Job, Outcome } from "@/lib/types";

/*
  The Stats page: how your job hunt is going, in numbers.
  Everything counts from the day you applied, so saved jobs you haven't applied for aren't in
  the rates. Tested in tests/stats.test.ts.
*/

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : null);

export type Stats = {
  applied: number;
  heardBack: number;
  interviews: number;
  offers: number;
  responseRate: number | null; // % of applications that got any answer
  interviewRate: number | null; // % that reached an interview
  avgDaysToHear: number | null;
  thisWeek: number; // applications this week (Monday to Sunday)
  waiting: number; // applied, no answer yet
  outcomes: Record<Exclude<Outcome, "">, number>;
};

export function jobStats(jobs: Job[], today: string): Stats {
  const applied = jobs.filter((j) => j.appliedOn);
  const heard = applied.filter((j) => j.heardBackOn);
  const days = heard.map((j) => daysBetween(j.appliedOn, j.heardBackOn)).filter((d) => d >= 0);
  const interviews = applied.filter((j) => reached(j, "interview") || reached(j, "offer")).length;
  const monday = weekStart(today);
  const outcomes = { rejected: 0, noReply: 0, withdrew: 0, declined: 0 };
  for (const j of jobs) if (j.stage === "closed" && j.outcome) outcomes[j.outcome]++;
  return {
    applied: applied.length,
    heardBack: heard.length,
    interviews,
    offers: applied.filter((j) => reached(j, "offer")).length,
    responseRate: pct(heard.length, applied.length),
    interviewRate: pct(interviews, applied.length),
    avgDaysToHear: days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : null,
    thisWeek: applied.filter((j) => j.appliedOn >= monday && j.appliedOn <= addDays(monday, 6)).length,
    waiting: applied.filter((j) => j.stage === "applied" && !j.heardBackOn).length,
    outcomes,
  };
}

/** Applications per week for the last `weeks` weeks, oldest first: [{ monday, count }] */
export function perWeek(jobs: Job[], today: string, weeks = 8) {
  const first = addDays(weekStart(today), -7 * (weeks - 1));
  return Array.from({ length: weeks }, (_, i) => {
    const monday = addDays(first, i * 7);
    const sunday = addDays(monday, 6);
    return { monday, count: jobs.filter((j) => j.appliedOn >= monday && j.appliedOn <= sunday).length };
  });
}

/** Where your applications came from, and which places led to interviews: most applications first */
export function bySource(jobs: Job[]) {
  const rows = new Map<string, { source: string; applied: number; interviews: number }>();
  for (const j of jobs) {
    if (!j.appliedOn) continue;
    const source = j.source.trim() || "Not noted";
    const key = source.toLowerCase();
    const row = rows.get(key) ?? { source, applied: 0, interviews: 0 };
    row.applied++;
    if (reached(j, "interview") || reached(j, "offer")) row.interviews++;
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => b.applied - a.applied || b.interviews - a.interviews || a.source.localeCompare(b.source));
}

/** Words for the weekly goal: "3 of 5 this week", or "Goal reached" */
export function goalText(thisWeek: number, goal: number) {
  if (!goal) return "";
  return thisWeek >= goal ? `Goal reached: ${thisWeek} of ${goal} this week` : `${thisWeek} of ${goal} this week`;
}
