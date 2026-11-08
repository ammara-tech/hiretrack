"use client";

import { useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import { addExamples, deleteEverything, removeExamples, saveProfile } from "@/lib/actions";
import { signOutUser } from "@/lib/auth";
import { jobsCsv } from "@/lib/csv";
import { todayIso } from "@/lib/dates";
import { MAX_GOAL } from "@/lib/read";
import { useApp } from "@/lib/store";

/*
  /settings: your name (used to sign follow-up emails), a weekly goal for applications, example
  jobs, downloading your jobs, signing out, and deleting everything HireTrack has saved for you.
*/
export default function SettingsPage() {
  const { profile, jobs, docs } = useApp();
  const [name, setName] = useState(profile.name);
  const [goal, setGoal] = useState(String(profile.weeklyGoal || ""));
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const examples = jobs.filter((j) => j.example).length;

  function submit(e: FormEvent) {
    e.preventDefault();
    saveProfile(name, Number(goal) || 0);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([jobsCsv(jobs, docs)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-jobs-${todayIso()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAll() {
    setDeleting(true);
    setError("");
    try {
      await deleteEverything();
      await signOutUser();
    } catch {
      setError("Couldn't delete everything. Check your connection and try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>

      <form onSubmit={submit} className="panel space-y-4">
        <h2 className="text-lg font-extrabold">You</h2>
        <label className="block text-sm font-semibold">
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required className="field mt-1 font-normal" />
          <span className="mt-1 block text-xs font-normal text-ink-soft">Used to sign the follow-up emails HireTrack writes for you.</span>
        </label>
        <label className="block text-sm font-semibold">
          Applications a week (your goal)
          <input type="number" min={0} max={MAX_GOAL} inputMode="numeric" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. 5" className="field mt-1 max-w-[8rem] font-normal" />
          <span className="mt-1 block text-xs font-normal text-ink-soft">Shown on your board and Stats page. Leave it empty for no goal.</span>
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn">
            <Icon name="check" className="h-4 w-4" />
            Save
          </button>
          <span role="status" className="text-sm font-semibold text-brand">
            {saved ? "Saved" : ""}
          </span>
        </div>
      </form>

      <section className="panel" aria-labelledby="examples">
        <h2 id="examples" className="text-lg font-extrabold">
          Example jobs
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          {examples ? `You have ${examples} example jobs on your board. Removing them doesn't touch your own jobs.` : "Add six made-up jobs to try every part of HireTrack. They're marked as examples and can be removed in one press."}
        </p>
        <button type="button" onClick={examples ? removeExamples : addExamples} className="btn-quiet mt-3">
          <Icon name={examples ? "trash" : "sparkle"} className="h-4 w-4" />
          {examples ? "Remove the examples" : "Add example jobs"}
        </button>
      </section>

      <section className="panel" aria-labelledby="your-data">
        <h2 id="your-data" className="text-lg font-extrabold">
          Your data
        </h2>
        <p className="mt-1 text-sm text-ink-soft">Only you can see your jobs. Download them as a spreadsheet any time.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={download} disabled={jobs.length === 0} className="btn-quiet">
            <Icon name="download" className="h-4 w-4" />
            Download my jobs
          </button>
          <button type="button" onClick={() => signOutUser()} className="btn-quiet">
            <Icon name="logout" className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </section>

      <section className="panel border-alert/40" aria-labelledby="danger">
        <h2 id="danger" className="text-lg font-extrabold text-alert">
          Delete everything
        </h2>
        <p className="mt-1 text-sm text-ink-soft">Deletes all your jobs, CVs, cover letters and settings from HireTrack, then signs you out. This can&apos;t be undone.</p>
        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="btn-quiet mt-3 !text-alert hover:!border-alert">
            <Icon name="trash" className="h-4 w-4" />
            Delete everything…
          </button>
        ) : (
          <div className="mt-3 rounded-xl bg-alert-soft p-3">
            <p className="text-sm font-semibold">
              Delete {jobs.length} job{jobs.length === 1 ? "" : "s"} and {docs.length} document{docs.length === 1 ? "" : "s"} for good?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={deleteAll} disabled={deleting} className="btn !bg-alert !text-white dark:!text-[#12141a]">
                {deleting ? "Deleting…" : "Yes, delete everything"}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="btn-quiet">
                Keep my data
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-2 text-sm font-semibold text-alert">
                {error}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
