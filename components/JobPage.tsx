"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import Prep from "@/components/Prep";
import Interviews from "@/components/Interviews";
import { STAGE_STYLE } from "@/components/stageStyle";
import { chooseOutcome, deleteJob, followUpDone, moveJob, updateJob } from "@/lib/actions";
import { addDays, dayLabel, daysBetween, relativeDay, todayIso } from "@/lib/dates";
import { docsOfKind } from "@/lib/documents";
import { LIMITS, MODES, OUTCOMES, SOURCES, STAGES, stageLabel } from "@/lib/jobs";
import { followUpEmail, mailtoLink } from "@/lib/reminders";
import { useApp } from "@/lib/store";
import type { Job, WorkMode } from "@/lib/types";

/*
  One job's page (/job?id=…). Everything about it in one place:
  - its stage, as a row of buttons, and why it closed or whether you accepted the offer
  - the details: company, role, advert, location, salary, where you found it, the contact
  - a follow-up reminder, with a ready-written email
  - which CV and cover letter you sent
  - interviews, and interview prep
  - its story: when it moved from stage to stage
  Text is saved when you press Save; ticks and choices are saved straight away.
*/
export default function JobPage({ id }: { id: string }) {
  const { jobs, status } = useApp();
  const job = jobs.find((j) => j.id === id);
  if (!job) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-3xl font-extrabold">{status === "ready" ? "That job isn't on your board" : "Loading…"}</h1>
        <p className="mt-3 text-ink-soft">It may have been deleted.</p>
        <Link href="/" className="btn mt-8">
          Back to your board
        </Link>
      </div>
    );
  }
  return <JobView key={job.id} job={job} />;
}

function JobView({ job }: { job: Job }) {
  const today = todayIso();
  const style = STAGE_STYLE[job.stage];

  return (
    <div>
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-brand">
        <Icon name="left" className="h-4 w-4" />
        Board
      </Link>

      <div className="mt-3 flex flex-wrap items-start gap-3">
        <div className="mr-auto min-w-0">
          <p className={`text-sm font-bold uppercase tracking-wider ${style.text}`}>{stageLabel(job.stage)}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{job.role || "No role yet"}</h1>
          <p className="mt-1 text-lg text-ink-soft">
            {job.company || "No company yet"}
            {job.example && <span className="ml-2 rounded-full bg-card px-2 py-0.5 align-middle text-xs font-semibold">Example</span>}
          </p>
        </div>
        {job.link && (
          <a href={job.link} target="_blank" rel="noopener noreferrer" className="btn-quiet">
            <Icon name="external" className="h-4 w-4" />
            Open the advert
          </a>
        )}
        <button type="button" onClick={() => deleteJob(job)} className="btn-quiet !text-alert hover:!border-alert">
          <Icon name="trash" className="h-4 w-4" />
          Delete
        </button>
      </div>

      <StageButtons job={job} />

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Details job={job} />
          <Interviews job={job} today={today} />
          <Prep job={job} />
        </div>
        <div className="space-y-5">
          <FollowUp job={job} today={today} />
          <SentWith job={job} />
          <Story job={job} today={today} />
        </div>
      </div>
    </div>
  );
}

/** The stages as a row of buttons; the current one is pressed */
function StageButtons({ job }: { job: Job }) {
  return (
    <div className="mt-5">
      <div role="group" aria-label="Stage" className="flex flex-wrap gap-2">
        {STAGES.map((s) => {
          const current = job.stage === s.id;
          const st = STAGE_STYLE[s.id];
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={current}
              onClick={() => !current && moveJob(job, s.id)}
              className={`rounded-full border px-4 py-2 text-sm font-bold ${current ? `${st.soft} ${st.text} ${st.border}` : "border-line bg-card text-ink-soft hover:text-ink"}`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      {job.stage === "closed" && (
        <fieldset className="mt-3">
          <legend className="text-sm font-semibold">Why did it close?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {OUTCOMES.map((o) => (
              <label key={o.id} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold ${job.outcome === o.id ? "border-brand bg-brand-soft text-brand" : "border-line bg-card"}`}>
                <input type="radio" name="outcome" className="sr-only" checked={job.outcome === o.id} onChange={() => chooseOutcome(job, o.id)} />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {job.stage === "offer" && (
        <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-sm font-semibold">
          <input type="checkbox" checked={job.accepted} onChange={(e) => updateJob(job, { accepted: e.target.checked })} className="h-4 w-4 accent-[var(--color-brand)]" />
          I accepted this offer
        </label>
      )}
    </div>
  );
}

function Details({ job }: { job: Job }) {
  const start = {
    company: job.company,
    role: job.role,
    link: job.link,
    location: job.location,
    mode: job.mode,
    salary: job.salary,
    source: job.source,
    appliedOn: job.appliedOn,
    contactName: job.contactName,
    contactEmail: job.contactEmail,
    notes: job.notes,
  };
  const [f, setF] = useState(start);
  const [saved, setSaved] = useState(false);
  const changed = (Object.keys(start) as (keyof typeof start)[]).some((k) => f[k] !== start[k]);

  function submit(e: FormEvent) {
    e.preventDefault();
    updateJob(job, f);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const box = "field mt-1 font-normal";
  return (
    <form onSubmit={submit} className="panel">
      <h2 className="text-lg font-extrabold">Details</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Company
          <input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} maxLength={LIMITS.company} className={box} />
        </label>
        <label className="block text-sm font-semibold">
          Role
          <input value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} maxLength={LIMITS.role} className={box} />
        </label>
        <label className="block text-sm font-semibold sm:col-span-2">
          Link to the advert
          <input type="url" inputMode="url" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} maxLength={LIMITS.link} placeholder="https://" className={box} />
        </label>
        <label className="block text-sm font-semibold">
          Location
          <input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} maxLength={LIMITS.location} className={box} />
        </label>
        <label className="block text-sm font-semibold">
          Working
          <select value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as WorkMode })} className={box}>
            <option value="">Not sure yet</option>
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Salary
          <input value={f.salary} onChange={(e) => setF({ ...f, salary: e.target.value })} maxLength={LIMITS.salary} placeholder="e.g. R25 000 a month" className={box} />
        </label>
        <label className="block text-sm font-semibold">
          Found it on
          <input list="job-sources" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} maxLength={LIMITS.source} className={box} />
          <datalist id="job-sources">
            {SOURCES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label className="block text-sm font-semibold">
          Contact person
          <input value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} maxLength={LIMITS.contactName} placeholder="e.g. the recruiter" className={box} />
        </label>
        <label className="block text-sm font-semibold">
          Their email
          <input type="email" value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} maxLength={LIMITS.contactEmail} className={box} />
        </label>
        <label className="block text-sm font-semibold">
          Applied on
          <input type="date" value={f.appliedOn} onChange={(e) => setF({ ...f, appliedOn: e.target.value })} className={box} />
        </label>
        <label className="block text-sm font-semibold sm:col-span-2">
          Notes
          <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} maxLength={LIMITS.notes} rows={4} placeholder="Anything to remember: what they're looking for, what you liked…" className={box} />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={!changed} className="btn">
          <Icon name="check" className="h-4 w-4" />
          Save
        </button>
        <span role="status" className="text-sm font-semibold text-brand">
          {saved ? "Saved" : ""}
        </span>
      </div>
    </form>
  );
}

function FollowUp({ job, today }: { job: Job; today: string }) {
  const { profile } = useApp();
  const [on, setOn] = useState(job.followUpOn);
  const [note, setNote] = useState(job.followUpNote);
  const due = job.followUpOn && job.followUpOn <= today;
  const email = followUpEmail(job, profile.name);

  function save(date: string, text = note) {
    setOn(date);
    updateJob(job, { followUpOn: date, followUpNote: text });
  }

  if (job.stage === "closed") return null;
  return (
    <section className={`panel ${due ? "border-coral/50" : ""}`} aria-labelledby="follow-up">
      <h2 id="follow-up" className="flex items-center gap-2 text-lg font-extrabold">
        <Icon name="bell" className={`h-5 w-5 ${due ? "text-coral" : "text-ink-soft"}`} />
        Follow-up reminder
      </h2>
      {job.followUpOn ? (
        <p className={`mt-2 text-sm font-semibold ${due ? "text-coral" : ""}`}>
          {dayLabel(job.followUpOn, today)} ({relativeDay(job.followUpOn, today)}){job.followUpNote ? `: ${job.followUpNote}` : ""}
        </p>
      ) : (
        <p className="mt-2 text-sm text-ink-soft">No reminder. Set one so this job doesn&apos;t go quiet.</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(on);
        }}
        className="mt-3 space-y-3"
      >
        <div className="flex flex-wrap gap-2">
          {[
            ["Tomorrow", 1],
            ["In 3 days", 3],
            ["In a week", 7],
          ].map(([label, days]) => (
            <button key={label} type="button" onClick={() => save(addDays(today, days as number))} className="btn-quiet px-3 py-1.5 text-sm">
              {label}
            </button>
          ))}
        </div>
        <label className="block text-sm font-semibold">
          Date
          <input type="date" value={on} onChange={(e) => setOn(e.target.value)} className="field mt-1 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          What to do
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={LIMITS.followUpNote} placeholder="e.g. Ask about next steps" className="field mt-1 font-normal" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn py-2 text-sm">
            Save reminder
          </button>
          {job.followUpOn && (
            <button
              type="button"
              onClick={() => {
                followUpDone(job);
                setOn("");
                setNote("");
              }}
              className="btn-quiet py-2 text-sm"
            >
              <Icon name="check" className="h-4 w-4" />
              Done
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 border-t border-line pt-4">
        {job.contactEmail ? (
          <a href={mailtoLink(job.contactEmail, email)} className="btn-quiet w-full text-sm">
            <Icon name="mail" className="h-4 w-4" />
            Email {job.contactName ? job.contactName.split(/\s+/)[0] : "them"}
          </a>
        ) : (
          <p className="text-sm text-ink-soft">Add the contact&apos;s email in Details to get a ready-written follow-up email.</p>
        )}
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-brand">See the email</summary>
          <p className="mt-2 font-semibold">{email.subject}</p>
          <p className="mt-1 whitespace-pre-line text-ink-soft">{email.body}</p>
        </details>
      </div>
    </section>
  );
}

function SentWith({ job }: { job: Job }) {
  const { docs } = useApp();
  const cvs = docsOfKind(docs, "cv");
  const covers = docsOfKind(docs, "cover");
  return (
    <section className="panel" aria-labelledby="sent-with">
      <h2 id="sent-with" className="flex items-center gap-2 text-lg font-extrabold">
        <Icon name="file" className="h-5 w-5 text-ink-soft" />
        CV and cover letter
      </h2>
      {docs.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">
          Add your CV versions and cover letters on the{" "}
          <Link href="/documents" className="font-semibold text-brand hover:underline">
            CVs page
          </Link>
          , then choose here which ones you sent. The Stats page shows which gets you more interviews.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="block text-sm font-semibold">
            CV I sent
            <select value={job.cvId} onChange={(e) => updateJob(job, { cvId: e.target.value })} className="field mt-1 font-normal">
              <option value="">Not chosen</option>
              {cvs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Cover letter I sent
            <select value={job.coverId} onChange={(e) => updateJob(job, { coverId: e.target.value })} className="field mt-1 font-normal">
              <option value="">None</option>
              {covers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </section>
  );
}

function Story({ job, today }: { job: Job; today: string }) {
  return (
    <section className="panel" aria-labelledby="story">
      <h2 id="story" className="text-lg font-extrabold">
        Its story
      </h2>
      <ol className="mt-3 space-y-2">
        {[...job.history].reverse().map((s, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STAGE_STYLE[s.stage].dot}`} aria-hidden="true" />
            <span className="font-semibold">{stageLabel(s.stage)}</span>
            <span className="ml-auto text-ink-soft">{s.on === "1970-01-01" ? "" : dayLabel(s.on, today)}</span>
          </li>
        ))}
      </ol>
      {job.heardBackOn && job.appliedOn && <p className="mt-3 text-sm text-ink-soft">{waitText(daysBetween(job.appliedOn, job.heardBackOn))}</p>}
    </section>
  );
}

function waitText(days: number) {
  if (days <= 0) return "They answered the same day you applied.";
  return `They first answered ${days} day${days === 1 ? "" : "s"} after you applied.`;
}
