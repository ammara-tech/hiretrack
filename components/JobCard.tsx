"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import { STAGE_STYLE } from "@/components/stageStyle";
import { moveJob } from "@/lib/actions";
import { daysBetween, dayLabel, relativeDay } from "@/lib/dates";
import { MODES, outcomeLabel, STAGES } from "@/lib/jobs";
import { prepProgress } from "@/lib/prep";
import { nextInterview } from "@/lib/reminders";
import type { Job, Stage } from "@/lib/types";

/*
  One job on the board. The company and role link to the job's page. Underneath, what matters
  most right now: a follow-up that's due, the next interview and how ready you are, or how long
  you've been waiting. On a laptop the card can be dragged to another column; everywhere, the
  "Move to" box moves it too (it works with a keyboard and on a phone).
*/
export default function JobCard({
  job,
  today,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  job: Job;
  today: string;
  dragging: boolean;
  onDragStart: (job: Job) => void;
  onDragEnd: () => void;
}) {
  const style = STAGE_STYLE[job.stage];
  const next = nextInterview(job, today);
  const prep = prepProgress(job);
  const due = job.stage !== "closed" && job.followUpOn && job.followUpOn <= today;
  const mode = MODES.find((m) => m.id === job.mode)?.label;
  const where = [job.location, mode && mode !== job.location ? mode : ""].filter(Boolean).join(" · ");

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", job.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(job);
      }}
      onDragEnd={onDragEnd}
      data-job={job.id}
      className={`relative rounded-xl border border-line border-l-4 bg-card p-3 shadow-sm transition-shadow hover:shadow-md ${style.edge} ${dragging ? "opacity-40" : ""}`}
    >
      <h3 className="pr-6 text-[15px] font-bold leading-snug">
        <Link href={`/job?id=${job.id}`} className="after:absolute after:inset-0 after:rounded-xl after:content-[''] hover:underline">
          {job.company || "No company yet"}
        </Link>
      </h3>
      <p className="text-sm text-ink-soft">{job.role || "No role yet"}</p>
      {job.stage === "offer" && job.accepted && (
        <Icon name="star" label="Accepted" className="absolute right-3 top-3 h-5 w-5 fill-current text-offer" />
      )}

      {(where || job.salary) && (
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
          {where && (
            <span className="flex items-center gap-1">
              <Icon name="pin" className="h-3.5 w-3.5" />
              {where}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1">
              <Icon name="money" className="h-3.5 w-3.5" />
              {job.salary}
            </span>
          )}
        </p>
      )}

      <div className="mt-2 space-y-1 text-xs font-semibold">
        {due && (
          <p className="flex items-center gap-1 rounded-md bg-coral-soft px-2 py-1 text-coral">
            <Icon name="bell" className="h-3.5 w-3.5 shrink-0" />
            Follow up {job.followUpOn === today ? "today" : `(due ${relativeDay(job.followUpOn, today)})`}
          </p>
        )}
        {next && job.stage !== "closed" && (
          <p className="flex items-center gap-1 text-interview">
            <Icon name="calendar" className="h-3.5 w-3.5 shrink-0" />
            Interview {next.date === today ? "today" : dayLabel(next.date, today)}
            {next.time ? ` at ${next.time}` : ""}
          </p>
        )}
        {job.stage === "interview" && prep.total > 0 && (
          <p className="flex items-center gap-2 font-normal text-ink-soft">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <span className="block h-full rounded-full bg-interview" style={{ width: `${prep.percent}%` }} />
            </span>
            Prep {prep.done}/{prep.total}
          </p>
        )}
        {job.stage === "applied" && job.appliedOn && !due && (
          <p className="font-normal text-ink-soft">
            Applied {relativeDay(job.appliedOn, today)}
            {daysBetween(job.appliedOn, today) >= 14 && !job.heardBackOn ? ", no reply yet" : ""}
          </p>
        )}
        {job.stage === "closed" && <p className="font-normal text-ink-soft">{outcomeLabel(job.outcome)}</p>}
      </div>

      <div className="relative z-10 mt-3 flex items-center gap-2">
        {job.example && <span className="rounded-full bg-page px-2 py-0.5 text-[11px] font-semibold text-ink-soft">Example</span>}
        <label className="ml-auto flex min-w-0 flex-1 justify-end text-xs text-ink-soft">
          <span className="sr-only">Move {job.company || "this job"} to</span>
          <select
            value={job.stage}
            onChange={(e) => moveJob(job, e.target.value as Stage)}
            className="w-full min-w-0 max-w-[9rem] rounded-lg border border-line bg-card px-1.5 py-1 text-xs font-semibold text-ink"
          >
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id === job.stage ? s.label : `Move to ${s.label}`}
              </option>
            ))}
          </select>
        </label>
      </div>
    </article>
  );
}
