"use client";

import { useState, type DragEvent } from "react";
import AddJob from "@/components/AddJob";
import Icon from "@/components/Icon";
import JobCard from "@/components/JobCard";
import { STAGE_STYLE } from "@/components/stageStyle";
import { addExamples, chooseOutcome, moveJob, removeExamples } from "@/lib/actions";
import { todayIso } from "@/lib/dates";
import { columns, matches, OUTCOMES, STAGES } from "@/lib/jobs";
import { goalText, jobStats } from "@/lib/stats";
import { useApp } from "@/lib/store";
import type { Job, Stage } from "@/lib/types";

/*
  The board: your jobs in five columns, from Saved to Closed.
  - On a laptop, drag a card to another column, or up and down in its column. A dashed outline
    shows where it will land.
  - On a phone, the stages are tabs (with how many jobs each has), showing one column at a time.
  - Every card also has a "Move to" box, for keyboards and phones.
  - Search filters every column at once.
  A job dropped in Closed asks why it closed (they said no, no reply…), for the stats.
*/
export default function Board() {
  const { jobs, profile } = useApp();
  const today = todayIso();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Stage>("applied");
  const [adding, setAdding] = useState<Stage | null>(null);
  const [dragging, setDragging] = useState<Job | null>(null);
  const [over, setOver] = useState<Stage | null>(null);

  const shown = search.trim() ? jobs.filter((j) => matches(j, search)) : jobs;
  const cols = columns(shown);
  const hasExamples = jobs.some((j) => j.example);
  const stats = jobStats(jobs, today);
  const goal = goalText(stats.thisWeek, profile.weeklyGoal);

  /** Where in the column the card would land: after every card whose middle is above the pointer */
  function dropIndex(e: DragEvent<HTMLElement>) {
    const cards = [...e.currentTarget.querySelectorAll<HTMLElement>("[data-job]")].filter((c) => c.dataset.job !== dragging?.id);
    return cards.filter((c) => {
      const r = c.getBoundingClientRect();
      return r.top + r.height / 2 < e.clientY;
    }).length;
  }

  function drop(e: DragEvent<HTMLElement>, stage: Stage) {
    e.preventDefault();
    const job = dragging ?? jobs.find((j) => j.id === e.dataTransfer.getData("text/plain"));
    setOver(null);
    setDragging(null);
    if (job) moveJob(job, stage, dropIndex(e));
  }

  if (jobs.length === 0) return <EmptyBoard onAdd={() => setAdding("saved")} adding={adding} onClose={() => setAdding(null)} />;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-3xl font-extrabold tracking-tight">Your job hunt</h1>
          <p className="mt-1 text-ink-soft">
            {jobs.length} job{jobs.length === 1 ? "" : "s"} · {stats.applied} applied · {stats.interviews} interview{stats.interviews === 1 ? "" : "s"}
          </p>
        </div>
        <label className="relative w-full sm:w-64">
          <span className="sr-only">Search your jobs</span>
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs" className="field py-2 pl-9" />
        </label>
        <button type="button" onClick={() => setAdding("saved")} className="btn">
          <Icon name="plus" className="h-4 w-4" />
          Add a job
        </button>
      </div>

      {goal && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-2.5 text-sm">
          <Icon name="star" className="h-4 w-4 shrink-0 text-brand" />
          <span className="font-semibold">{goal}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (stats.thisWeek / profile.weeklyGoal) * 100)}%` }} />
          </span>
        </div>
      )}

      {hasExamples && (
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-line bg-card px-4 py-2.5 text-sm">
          <Icon name="sparkle" className="h-4 w-4 text-brand" />
          <span className="flex-1">These are example jobs, so you can try everything. Add your own whenever you&apos;re ready.</span>
          <button type="button" onClick={removeExamples} className="font-bold text-brand hover:underline">
            Remove the examples
          </button>
        </p>
      )}

      {/* Phones: one column at a time */}
      <div role="tablist" aria-label="Stages" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
        {STAGES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={tab === s.id}
            onClick={() => setTab(s.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold ${
              tab === s.id ? `${STAGE_STYLE[s.id].soft} ${STAGE_STYLE[s.id].text} ${STAGE_STYLE[s.id].border}` : "border-line bg-card text-ink-soft"
            }`}
          >
            {s.label}
            <span className="tabular-nums opacity-80">{cols[s.id].length}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 md:mt-6 md:grid md:grid-flow-col md:gap-4 md:overflow-x-auto md:pb-4" style={{ gridAutoColumns: "minmax(200px, 1fr)" }}>
        {STAGES.map((s) => {
          const style = STAGE_STYLE[s.id];
          return (
            <section
              key={s.id}
              aria-labelledby={`col-${s.id}`}
              className={`${tab === s.id ? "flex" : "hidden"} min-h-[12rem] flex-col rounded-2xl p-2 md:flex ${over === s.id ? "drop-target" : "bg-black/[0.03] dark:bg-white/[0.03]"}`}
              onDragOver={(e) => {
                if (!dragging) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (over !== s.id) setOver(s.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null);
              }}
              onDrop={(e) => drop(e, s.id)}
            >
              <div className="flex min-h-10 items-center gap-2 px-1.5 pb-2 pt-1">
                <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden="true" />
                <h2 id={`col-${s.id}`} className={`text-sm font-extrabold uppercase tracking-wider ${style.text}`}>
                  {s.label}
                </h2>
                <span className="text-sm font-semibold tabular-nums text-ink-soft">{cols[s.id].length}</span>
                {s.id !== "closed" ? (
                  <button type="button" onClick={() => setAdding(s.id)} className="tool ml-auto h-8 min-w-8" aria-label={`Add a job to ${s.label}`}>
                    <Icon name="plus" className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="ml-auto h-8" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {cols[s.id].map((job) => (
                  <div key={job.id}>
                    <JobCard job={job} today={today} dragging={dragging?.id === job.id} onDragStart={setDragging} onDragEnd={() => (setDragging(null), setOver(null))} />
                    {job.stage === "closed" && !job.outcome && (
                      <div className="mt-1 rounded-xl border border-line bg-card p-2 text-xs">
                        <p className="font-semibold">Why did it close?</p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {OUTCOMES.filter((o) => o.id !== "declined" || job.history.some((h) => h.stage === "offer")).map((o) => (
                            <button key={o.id} type="button" onClick={() => chooseOutcome(job, o.id)} className="rounded-full border border-line px-2 py-1 font-semibold hover:border-brand hover:text-brand">
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {cols[s.id].length === 0 && (
                  <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-ink-soft">{search ? "No matches" : s.hint}</p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {adding && <AddJob stage={adding} onClose={() => setAdding(null)} />}
    </div>
  );
}

function EmptyBoard({ onAdd, adding, onClose }: { onAdd: () => void; adding: Stage | null; onClose: () => void }) {
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <div className="mx-auto flex w-fit gap-2" aria-hidden="true">
        {STAGES.slice(0, 4).map((s) => (
          <span key={s.id} className={`h-16 w-10 rounded-lg border-t-4 ${STAGE_STYLE[s.id].border} ${STAGE_STYLE[s.id].soft}`} />
        ))}
      </div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Start your board</h1>
      <p className="mt-3 text-lg text-ink-soft">
        Add the jobs you&apos;re interested in and the ones you&apos;ve applied for. HireTrack reminds you to follow up, helps you prepare for interviews, and shows how your job hunt is going.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onAdd} className="btn">
          <Icon name="plus" className="h-4 w-4" />
          Add your first job
        </button>
        <button type="button" onClick={addExamples} className="btn-quiet">
          <Icon name="sparkle" className="h-4 w-4" />
          Try it with example jobs
        </button>
      </div>
      <p className="mt-4 text-sm text-ink-soft">The examples are made-up companies, and you can remove them all with one press.</p>
      {adding && <AddJob stage={adding} onClose={onClose} />}
    </div>
  );
}
