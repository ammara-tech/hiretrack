/*
  Dates for HireTrack. Dates are "YYYY-MM-DD" strings, worked out in UTC, so they never move by
  a day because of a phone's time zone or daylight saving. Weeks run Monday to Sunday.
  Plain functions with no Firebase, so tests/dates.test.ts checks them.
*/

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);

export const isIsoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && toIso(toDate(s)) === s;
export const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

/** Today's date where the phone is, as "YYYY-MM-DD" */
export function todayIso(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number) {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

/** Whole days from `a` to `b` (negative if b is earlier) */
export function daysBetween(a: string, b: string) {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000);
}

/** The Monday of the week a date is in */
export function weekStart(iso: string) {
  const day = (toDate(iso).getUTCDay() + 6) % 7; // Monday = 0 … Sunday = 6
  return addDays(iso, -day);
}

/** "Mon 9 Nov", with the year added when it isn't this year */
export function dayLabel(iso: string, today?: string) {
  if (!isIsoDate(iso)) return "";
  const d = toDate(iso);
  const label = `${DAY_NAMES[(d.getUTCDay() + 6) % 7]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  return today && today.slice(0, 4) !== iso.slice(0, 4) ? `${label} ${iso.slice(0, 4)}` : label;
}

/** "9 Nov" (for short labels such as the weeks on a chart) */
export function shortLabel(iso: string) {
  const d = toDate(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "today", "tomorrow", "yesterday", "in 3 days", "5 days ago" */
export function relativeDay(iso: string, today: string) {
  const n = daysBetween(today, iso);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

/** A moment (milliseconds) as the phone's local date */
export function isoFromMs(ms: number) {
  return todayIso(new Date(ms));
}
