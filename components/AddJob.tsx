"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import { addJob } from "@/lib/actions";
import { LIMITS, MODES, SOURCES, STAGES } from "@/lib/jobs";
import { addToast } from "@/lib/store";
import type { NewJob, Stage, WorkMode } from "@/lib/types";

/*
  "Add a job", in a pop-up window. Only the company and role are needed; everything else can be
  added later on the job's page. It's a native <dialog>, so Escape closes it and the keyboard
  stays inside it while it's open.
*/
export default function AddJob({ stage, onClose }: { stage: Stage; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [f, setF] = useState<Required<NewJob>>({ company: "", role: "", link: "", stage, location: "", mode: "", salary: "", source: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!f.company.trim() || !f.role.trim()) return setError("Add the company and the role.");
    addJob(f);
    addToast(`Added ${f.company.trim()} to ${STAGES.find((s) => s.id === f.stage)?.label}.`);
    dialog.current?.close();
  }

  const box = "field mt-1 font-normal";
  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="add-title"
      style={{ width: "min(34rem, calc(100vw - 2rem))" }}
      className="m-auto rounded-2xl border border-line bg-card p-0 text-ink shadow-2xl backdrop:bg-black/50"
    >
      <form onSubmit={submit} className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id="add-title" className="text-2xl font-extrabold">
            Add a job
          </h2>
          <button type="button" onClick={() => dialog.current?.close()} className="tool" aria-label="Close without adding">
            <Icon name="close" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Company
            <input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} maxLength={LIMITS.company} required autoFocus className={box} />
          </label>
          <label className="block text-sm font-semibold">
            Role
            <input value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} maxLength={LIMITS.role} required placeholder="e.g. Junior Developer" className={box} />
          </label>
          <label className="block text-sm font-semibold sm:col-span-2">
            Link to the advert (optional)
            <input type="url" inputMode="url" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} maxLength={LIMITS.link} placeholder="https://" className={box} />
          </label>
          <label className="block text-sm font-semibold">
            Where it is on your board
            <select value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value as Stage })} className={box}>
              {STAGES.filter((s) => s.id !== "closed").map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}: {s.hint.toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Found it on (optional)
            <input list="sources" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} maxLength={LIMITS.source} className={box} />
            <datalist id="sources">
              {SOURCES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="block text-sm font-semibold">
            Location (optional)
            <input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} maxLength={LIMITS.location} placeholder="e.g. Cape Town" className={box} />
          </label>
          <label className="block text-sm font-semibold">
            Working (optional)
            <select value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as WorkMode })} className={box}>
              <option value="">Not sure yet</option>
              {MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold sm:col-span-2">
            Salary (optional)
            <input value={f.salary} onChange={(e) => setF({ ...f, salary: e.target.value })} maxLength={LIMITS.salary} placeholder="e.g. R25 000 a month" className={box} />
          </label>
        </div>

        {f.stage === "applied" && <p className="mt-4 text-sm text-ink-soft">It&apos;ll be marked as applied today, with a reminder to follow up in a week.</p>}
        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="submit" className="btn">
            <Icon name="plus" className="h-4 w-4" />
            Add job
          </button>
          <button type="button" onClick={() => dialog.current?.close()} className="btn-quiet">
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  );
}
