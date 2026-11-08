import { addDays, daysBetween, isIsoDate } from "@/lib/dates";
import { jobTitle, kindLabel } from "@/lib/jobs";
import type { Interview, Job } from "@/lib/types";

/*
  The Today page: what needs doing in your job hunt.
  - Follow-ups that are due today, or overdue
  - Interviews in the next week
  - Applications with no answer for two weeks or more and no reminder set, so they don't
    quietly go stale
  - Follow-ups coming up later in the week
  Plus a ready-written follow-up email and calendar files for interviews.
  Tested in tests/reminders.test.ts.
*/

/** Days with no answer after which an application is called "quiet" */
export const QUIET_DAYS = 14;

export type InterviewItem = { job: Job; interview: Interview };

export type TodayList = {
  due: Job[]; // follow-ups due today or overdue, oldest first
  interviews: InterviewItem[]; // the next 7 days, soonest first
  quiet: Job[]; // applied, no answer for QUIET_DAYS+, no reminder
  comingUp: Job[]; // follow-ups in the next 7 days
};

const open = (j: Job) => j.stage !== "closed";

export function todayList(jobs: Job[], today: string): TodayList {
  const weekAhead = addDays(today, 7);
  const due = jobs.filter((j) => open(j) && isIsoDate(j.followUpOn) && j.followUpOn <= today).sort((a, b) => a.followUpOn.localeCompare(b.followUpOn));
  const comingUp = jobs
    .filter((j) => open(j) && isIsoDate(j.followUpOn) && j.followUpOn > today && j.followUpOn <= weekAhead)
    .sort((a, b) => a.followUpOn.localeCompare(b.followUpOn));
  const interviews = jobs
    .filter(open)
    .flatMap((job) => job.interviews.filter((i) => i.date >= today && i.date <= weekAhead).map((interview) => ({ job, interview })))
    .sort((a, b) => (a.interview.date + (a.interview.time || "99")).localeCompare(b.interview.date + (b.interview.time || "99")));
  const quiet = jobs
    .filter((j) => j.stage === "applied" && !j.heardBackOn && !j.followUpOn && j.appliedOn && daysBetween(j.appliedOn, today) >= QUIET_DAYS)
    .sort((a, b) => a.appliedOn.localeCompare(b.appliedOn));
  return { due, interviews, quiet, comingUp };
}

/** How many things need you today, for the number on the Today tab */
export function needsYou(list: TodayList, today: string) {
  return list.due.length + list.interviews.filter((i) => i.interview.date === today).length;
}

/** The next interview of a job that hasn't happened yet */
export function nextInterview(job: Job, today: string) {
  return [...job.interviews].filter((i) => i.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0] ?? null;
}

/**
 * A polite follow-up email to start from, for the Email them button. After an interview it's a
 * thank-you; otherwise it asks about the application. You edit it in your own email app.
 */
export function followUpEmail(job: Job, myName: string) {
  const hi = job.contactName ? `Hi ${job.contactName.split(/\s+/)[0]},` : "Good day,";
  const role = job.role || "the position";
  const company = job.company || "your company";
  const sign = `Kind regards,\n${myName}`;
  if (job.stage === "interview") {
    return {
      subject: `Thank you: ${role} interview`,
      body: `${hi}\n\nThank you for taking the time to speak with me about the ${role} role at ${company}. I enjoyed learning more about the team, and I'm even more excited about the opportunity.\n\nPlease let me know if there's anything else you need from me.\n\n${sign}`,
    };
  }
  const when = job.appliedOn ? ` on ${job.appliedOn}` : "";
  return {
    subject: `Following up: ${role} application`,
    body: `${hi}\n\nI applied for the ${role} role at ${company}${when}, and I wanted to follow up and say that I'm still very interested. Is there any news on the next steps?\n\nThank you for your time.\n\n${sign}`,
  };
}

/** A mailto: link that opens the person's email app with the follow-up email filled in */
export function mailtoLink(to: string, email: { subject: string; body: string }) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
}

// Calendar files (.ics) follow a strict text format: commas, semicolons and new lines are escaped
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsDate = (iso: string) => iso.replace(/-/g, "");

/**
 * A calendar file with your coming interviews, which a phone or laptop opens in its calendar app.
 * Times are local "floating" times (no time zone), so 14:00 stays 14:00. Interviews without a
 * time become all-day events. Each one is set to an hour.
 */
export function calendarFile(items: InterviewItem[], now: Date) {
  const stamp = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const events = items.map(({ job, interview: i }) => {
    const when = i.time
      ? [`DTSTART:${icsDate(i.date)}T${i.time.replace(":", "")}00`, `DTEND:${icsDate(i.date)}T${endTime(i.time)}00`]
      : [`DTSTART;VALUE=DATE:${icsDate(i.date)}`, `DTEND;VALUE=DATE:${icsDate(addDays(i.date, 1))}`];
    const details = [i.with && `With: ${i.with}`, i.where && `Where: ${i.where}`, job.link && `Advert: ${job.link}`].filter(Boolean).join("\n");
    return [
      "BEGIN:VEVENT",
      `UID:${job.id}-${i.id}@hiretrack`,
      `DTSTAMP:${stamp}`,
      ...when,
      `SUMMARY:${icsText(`${kindLabel(i.kind)}: ${jobTitle(job)}`)}`,
      ...(i.where ? [`LOCATION:${icsText(i.where)}`] : []),
      ...(details ? [`DESCRIPTION:${icsText(details)}`] : []),
      "END:VEVENT",
    ].join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//HireTrack//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR", ""].join("\r\n");
}

/** An hour later, stopping at 23:59 so it stays on the same day */
function endTime(time: string) {
  const h = Number(time.slice(0, 2)) + 1;
  return h > 23 ? "2359" : `${String(h).padStart(2, "0")}${time.slice(3, 5)}`;
}
