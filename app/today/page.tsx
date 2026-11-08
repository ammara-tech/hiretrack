"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import { followUpDone, moveJob, updateJob } from "@/lib/actions";
import { addDays, dayLabel, daysBetween, relativeDay, todayIso } from "@/lib/dates";
import { jobTitle, kindLabel } from "@/lib/jobs";
import { prepProgress } from "@/lib/prep";
import { calendarFile, followUpEmail, mailtoLink, todayList, QUIET_DAYS } from "@/lib/reminders";
import { useApp } from "@/lib/store";
import type { Job } from "@/lib/types";

/*
  /today: what needs doing in your job hunt, so nothing slips.
  Follow-ups that are due (with Done, Email them and Later), the next week's interviews (with
  how ready you are, and a calendar file), applications that have gone quiet, and follow-ups
  coming up. lib/reminders.ts works out the lists.
*/
export default function TodayPage() {
  const { jobs, profile } = useApp();
  const today = todayIso();
  const list = todayList(jobs, today);
  const nothing = !list.due.length && !list.interviews.length && !list.quiet.length && !list.comingUp.length;

  function downloadAll() {
    const url = URL.createObjectURL(new Blob([calendarFile(list.interviews, new Date())], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "interviews.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Today</h1>
      <p className="mt-1 text-ink-soft">{dayLabel(today)}. Follow-ups, interviews and applications that need a nudge.</p>

      {nothing && (
        <div className="panel mt-6 text-center">
          <Icon name="check" className="mx-auto h-10 w-10 text-brand" />
          <h2 className="mt-2 text-xl font-extrabold">Nothing needs you today</h2>
          <p className="mt-1 text-ink-soft">When you apply for a job, HireTrack reminds you to follow up a week later. Interviews you add show here too.</p>
          <Link href="/" className="btn mt-5">
            Go to your board
          </Link>
        </div>
      )}

      {list.due.length > 0 && (
        <Section title="Follow up" count={list.due.length} icon="bell" tone="text-coral">
          {list.due.map((job) => (
            <Row key={job.id} job={job}>
              <p className="text-sm font-semibold text-coral">
                {job.followUpOn === today ? "Due today" : `Due ${relativeDay(job.followUpOn, today)}`}
                {job.followUpNote ? `: ${job.followUpNote}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => followUpDone(job)} className="btn py-1.5 text-sm">
                  <Icon name="check" className="h-4 w-4" />
                  Done
                </button>
                {job.contactEmail && (
                  <a href={mailtoLink(job.contactEmail, followUpEmail(job, profile.name))} className="btn-quiet py-1.5 text-sm">
                    <Icon name="mail" className="h-4 w-4" />
                    Email them
                  </a>
                )}
                <button type="button" onClick={() => updateJob(job, { followUpOn: addDays(today, 3) })} className="btn-quiet py-1.5 text-sm">
                  In 3 days
                </button>
              </div>
            </Row>
          ))}
        </Section>
      )}

      {list.interviews.length > 0 && (
        <Section
          title="Interviews this week"
          count={list.interviews.length}
          icon="calendar"
          tone="text-interview"
          action={
            <button type="button" onClick={downloadAll} className="btn-quiet ml-auto px-3 py-1.5 text-sm">
              <Icon name="download" className="h-4 w-4" />
              Add all to my calendar
            </button>
          }
        >
          {list.interviews.map(({ job, interview: i }) => {
            const prep = prepProgress(job);
            return (
              <Row key={`${job.id}-${i.id}`} job={job}>
                <p className="text-sm font-semibold text-interview">
                  {i.date === today ? "Today" : dayLabel(i.date, today)}
                  {i.time ? ` at ${i.time}` : ""} · {kindLabel(i.kind)}
                  {i.with ? ` with ${i.with}` : ""}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {prep.total ? `Prep: ${prep.done} of ${prep.total} ready.` : "No prep yet."}{" "}
                  <Link href={`/job?id=${job.id}`} className="font-semibold text-brand hover:underline">
                    {prep.total ? "Keep preparing" : "Start preparing"}
                  </Link>
                </p>
              </Row>
            );
          })}
        </Section>
      )}

      {list.quiet.length > 0 && (
        <Section title="Gone quiet" count={list.quiet.length} icon="warn" tone="text-ink-soft">
          <p className="-mt-1 mb-3 text-sm text-ink-soft">No answer for {QUIET_DAYS} days or more, and no reminder set. Follow up once, or close it so your stats stay right.</p>
          {list.quiet.map((job) => (
            <Row key={job.id} job={job}>
              <p className="text-sm text-ink-soft">Applied {daysBetween(job.appliedOn, today)} days ago</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => updateJob(job, { followUpOn: today, followUpNote: "One last follow-up" })} className="btn-quiet py-1.5 text-sm">
                  <Icon name="bell" className="h-4 w-4" />
                  Follow up today
                </button>
                <button
                  type="button"
                  onClick={() => moveJob(job, "closed", 0, "noReply")}
                  className="btn-quiet py-1.5 text-sm"
                >
                  Close: no reply
                </button>
              </div>
            </Row>
          ))}
        </Section>
      )}

      {list.comingUp.length > 0 && (
        <Section title="Coming up" count={list.comingUp.length} icon="today" tone="text-ink-soft">
          {list.comingUp.map((job) => (
            <Row key={job.id} job={job}>
              <p className="text-sm text-ink-soft">
                Follow up {dayLabel(job.followUpOn, today)} ({relativeDay(job.followUpOn, today)})
                {job.followUpNote ? `: ${job.followUpNote}` : ""}
              </p>
            </Row>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, count, icon, tone, action, children }: { title: string; count: number; icon: "bell" | "calendar" | "warn" | "today"; tone: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <Icon name={icon} className={`h-5 w-5 ${tone}`} />
        <h2 className="text-xl font-extrabold">{title}</h2>
        <span className="rounded-full bg-card px-2 text-sm font-bold tabular-nums text-ink-soft">{count}</span>
        {action}
      </div>
      <ul className="space-y-3">{children}</ul>
    </section>
  );
}

function Row({ job, children }: { job: Job; children: React.ReactNode }) {
  return (
    <li className="panel p-4">
      <Link href={`/job?id=${job.id}`} className="font-bold hover:underline">
        {jobTitle(job)}
      </Link>
      <div className="mt-1">{children}</div>
    </li>
  );
}
