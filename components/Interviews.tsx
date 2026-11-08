"use client";

import { useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import { moveJob, updateJob } from "@/lib/actions";
import { addToast } from "@/lib/store";
import { dayLabel, isIsoDate } from "@/lib/dates";
import { INTERVIEW_KINDS, itemId, kindLabel, LIMITS } from "@/lib/jobs";
import { calendarFile } from "@/lib/reminders";
import type { Interview, InterviewKind, Job } from "@/lib/types";

/*
  A job's interviews: when, what kind, who you're meeting and where, with notes afterwards.
  Each one can go into your phone's calendar. Adding an interview to a job that's still in Saved
  or Applied moves it to Interview, since they've clearly answered.
*/

const empty = (): Omit<Interview, "id"> => ({ date: "", time: "", kind: "video", with: "", where: "", notes: "" });

export default function Interviews({ job, today }: { job: Job; today: string }) {
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const list = [...job.interviews].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  function save(e: FormEvent) {
    e.preventDefault();
    if (!isIsoDate(f.date)) return;
    const interviews = editing ? job.interviews.map((i) => (i.id === editing ? { ...i, ...f } : i)) : [...job.interviews, { id: itemId(), ...f }];
    updateJob(job, { interviews });
    if (!editing && (job.stage === "saved" || job.stage === "applied")) {
      moveJob(job, "interview");
      addToast(`Moved ${job.company || "the job"} to Interview.`);
    }
    setAdding(false);
    setEditing(null);
    setF(empty());
  }

  function download(i: Interview) {
    const url = URL.createObjectURL(new Blob([calendarFile([{ job, interview: i }], new Date())], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-${i.date}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const box = "field mt-1 font-normal";
  const form = (
    <form onSubmit={save} className="mt-4 grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-2">
      <label className="block text-sm font-semibold">
        Day
        <input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={box} />
      </label>
      <label className="block text-sm font-semibold">
        Time (optional)
        <input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} className={box} />
      </label>
      <label className="block text-sm font-semibold">
        Kind
        <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as InterviewKind })} className={box}>
          {INTERVIEW_KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Who I&apos;m meeting
        <input value={f.with} onChange={(e) => setF({ ...f, with: e.target.value })} maxLength={LIMITS.short} placeholder="e.g. Thabo, the team lead" className={box} />
      </label>
      <label className="block text-sm font-semibold sm:col-span-2">
        Where
        <input value={f.where} onChange={(e) => setF({ ...f, where: e.target.value })} maxLength={LIMITS.short} placeholder="An address, or the meeting link" className={box} />
      </label>
      <label className="block text-sm font-semibold sm:col-span-2">
        Notes
        <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} maxLength={LIMITS.answer} rows={2} placeholder="How it went, what they asked" className={box} />
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="btn py-2 text-sm">
          {editing ? "Save interview" : "Add interview"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAdding(false);
            setEditing(null);
            setF(empty());
          }}
          className="btn-quiet py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <section className="panel" aria-labelledby="interviews">
      <div className="flex items-center gap-2">
        <h2 id="interviews" className="flex items-center gap-2 text-lg font-extrabold">
          <Icon name="calendar" className="h-5 w-5 text-interview" />
          Interviews
        </h2>
        {!adding && !editing && job.interviews.length < LIMITS.interviews && (
          <button type="button" onClick={() => setAdding(true)} className="btn-quiet ml-auto px-3 py-1.5 text-sm">
            <Icon name="plus" className="h-4 w-4" />
            Add
          </button>
        )}
      </div>

      {list.length === 0 && !adding && <p className="mt-2 text-sm text-ink-soft">No interviews yet. When they invite you, add it here and it&apos;ll show on your Today page.</p>}

      <ul className="mt-3 space-y-3">
        {list.map((i) =>
          editing === i.id ? (
            <li key={i.id}>{form}</li>
          ) : (
            <li key={i.id} className={`rounded-xl border border-line p-3 ${i.date < today ? "opacity-75" : ""}`}>
              <p className="flex flex-wrap items-center gap-x-2 font-bold">
                {dayLabel(i.date, today)}
                {i.time && <span>{i.time}</span>}
                <span className="rounded-full bg-interview-soft px-2 py-0.5 text-xs text-interview">{kindLabel(i.kind)}</span>
                {i.date < today && <span className="text-xs font-semibold text-ink-soft">Done</span>}
              </p>
              {(i.with || i.where) && (
                <p className="mt-1 text-sm text-ink-soft">
                  {i.with && <span>With {i.with}</span>}
                  {i.with && i.where && " · "}
                  {i.where && (/^https?:\/\//.test(i.where) ? <a href={i.where} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">Meeting link</a> : <span>{i.where}</span>)}
                </p>
              )}
              {i.notes && <p className="mt-1 whitespace-pre-line text-sm">{i.notes}</p>}
              <div className="mt-2 flex flex-wrap gap-1">
                {i.date >= today && (
                  <button type="button" onClick={() => download(i)} className="btn-quiet px-2.5 py-1 text-xs">
                    <Icon name="download" className="h-3.5 w-3.5" />
                    Add to my calendar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditing(i.id);
                    setAdding(false);
                    setF({ date: i.date, time: i.time, kind: i.kind, with: i.with, where: i.where, notes: i.notes });
                  }}
                  className="btn-quiet px-2.5 py-1 text-xs"
                >
                  <Icon name="pencil" className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button type="button" onClick={() => updateJob(job, { interviews: job.interviews.filter((x) => x.id !== i.id) })} className="btn-quiet px-2.5 py-1 text-xs !text-alert">
                  <Icon name="trash" className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
      {adding && form}
    </section>
  );
}
