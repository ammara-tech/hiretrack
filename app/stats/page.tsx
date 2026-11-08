"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import { todayIso, shortLabel } from "@/lib/dates";
import { docUsage } from "@/lib/documents";
import { jobsCsv } from "@/lib/csv";
import { OUTCOMES } from "@/lib/jobs";
import { bySource, goalText, jobStats, perWeek } from "@/lib/stats";
import { useApp } from "@/lib/store";

/*
  /stats: how your job hunt is going.
  The main numbers, the weekly goal, the path from applying to an offer, applications per week,
  which places and which CVs lead to interviews, and why jobs closed. Everything counts from
  the day you applied (lib/stats.ts). The charts are plain HTML bars with the numbers written
  on them, so they work with a screen reader too.
*/
export default function StatsPage() {
  const { jobs, docs, profile } = useApp();
  const today = todayIso();
  const s = jobStats(jobs, today);
  const weeks = perWeek(jobs, today, 8);
  const most = Math.max(1, ...weeks.map((w) => w.count));
  const sources = bySource(jobs);
  const use = docUsage(docs, jobs);
  const usedDocs = docs.filter((d) => use[d.id]?.sent).sort((a, b) => (use[b.id].rate ?? 0) - (use[a.id].rate ?? 0));
  const closedTotal = Object.values(s.outcomes).reduce((a, b) => a + b, 0);

  function download() {
    const url = URL.createObjectURL(new Blob([jobsCsv(jobs, docs)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-jobs-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (s.applied === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight">Stats</h1>
        <div className="panel mt-6 text-center">
          <Icon name="chart" className="mx-auto h-10 w-10 text-brand" />
          <h2 className="mt-2 text-xl font-extrabold">Your stats start when you apply</h2>
          <p className="mt-1 text-ink-soft">Move a job to Applied, and this page shows how many hear back, how long it takes, and what leads to interviews.</p>
          <Link href="/" className="btn mt-5">
            Go to your board
          </Link>
        </div>
      </div>
    );
  }

  const funnel = [
    { label: "Applied", value: s.applied, colour: "bg-applied" },
    { label: "Heard back", value: s.heardBack, colour: "bg-saved" },
    { label: "Interview", value: s.interviews, colour: "bg-interview" },
    { label: "Offer", value: s.offers, colour: "bg-offer" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-3xl font-extrabold tracking-tight">Stats</h1>
          <p className="mt-1 text-ink-soft">How your job hunt is going, from the day you applied.</p>
        </div>
        <button type="button" onClick={download} className="btn-quiet">
          <Icon name="download" className="h-4 w-4" />
          Download my jobs
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Applications" value={String(s.applied)} note={`${s.waiting} waiting to hear`} />
        <Tile label="Heard back" value={s.responseRate === null ? "–" : `${s.responseRate}%`} note={`${s.heardBack} of ${s.applied}`} />
        <Tile label="Reached an interview" value={s.interviewRate === null ? "–" : `${s.interviewRate}%`} note={`${s.interviews} job${s.interviews === 1 ? "" : "s"}`} />
        <Tile label="Days to hear back" value={s.avgDaysToHear === null ? "–" : String(s.avgDaysToHear)} note="on average" />
      </div>

      {profile.weeklyGoal > 0 && (
        <p className="panel mt-4 flex items-center gap-3 py-3 text-sm">
          <Icon name="star" className="h-4 w-4 shrink-0 text-brand" />
          <span className="font-semibold">{goalText(s.thisWeek, profile.weeklyGoal)}</span>
          <Link href="/settings" className="ml-auto text-brand hover:underline">
            Change goal
          </Link>
        </p>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section className="panel" aria-labelledby="funnel">
          <h2 id="funnel" className="text-lg font-extrabold">
            From applying to an offer
          </h2>
          <ul className="mt-4 space-y-3">
            {funnel.map((f) => (
              <li key={f.label}>
                <p className="flex justify-between text-sm">
                  <span className="font-semibold">{f.label}</span>
                  <span className="tabular-nums">{f.value}</span>
                </p>
                <span className="mt-1 block h-3 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <span className={`block h-full rounded-full ${f.colour}`} style={{ width: `${(f.value / s.applied) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel" aria-labelledby="weeks">
          <h2 id="weeks" className="text-lg font-extrabold">
            Applications per week
          </h2>
          <ol className="mt-4 flex h-40 items-end gap-2" aria-label="Applications in each of the last 8 weeks">
            {weeks.map((w) => (
              <li key={w.monday} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs font-bold tabular-nums">{w.count || ""}</span>
                <span className="w-full rounded-t-md bg-applied" style={{ height: `${(w.count / most) * 100}%`, minHeight: w.count ? 4 : 0 }} aria-hidden="true" />
                <span className="text-[10px] text-ink-soft">
                  <span className="sr-only">Week of </span>
                  {shortLabel(w.monday)}
                  <span className="sr-only">: {w.count}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel" aria-labelledby="sources">
          <h2 id="sources" className="text-lg font-extrabold">
            Where you found them
          </h2>
          <table className="mt-3 w-full text-sm">
            <caption className="sr-only">Applications and interviews by where you found the job</caption>
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-ink-soft">
                <th scope="col" className="py-1">
                  Place
                </th>
                <th scope="col" className="py-1 text-right">
                  Applied
                </th>
                <th scope="col" className="py-1 text-right">
                  Interviews
                </th>
              </tr>
            </thead>
            <tbody>
              {sources.map((r) => (
                <tr key={r.source} className="border-t border-line">
                  <th scope="row" className="py-2 text-left font-semibold">
                    {r.source}
                  </th>
                  <td className="py-2 text-right tabular-nums">{r.applied}</td>
                  <td className="py-2 text-right tabular-nums">{r.interviews}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel" aria-labelledby="cvs">
          <h2 id="cvs" className="text-lg font-extrabold">
            Which CV or letter works best
          </h2>
          {usedDocs.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">
              Add your CVs on the{" "}
              <Link href="/documents" className="font-semibold text-brand hover:underline">
                CVs page
              </Link>{" "}
              and choose which one you sent on each job, to see which gets more interviews.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {usedDocs.map((d) => (
                <li key={d.id}>
                  <p className="flex justify-between gap-2 text-sm">
                    <span className="font-semibold">{d.name}</span>
                    <span className="shrink-0 tabular-nums">
                      {use[d.id].interviews} of {use[d.id].sent} ({use[d.id].rate}%)
                    </span>
                  </p>
                  <span className="mt-1 block h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
                    <span className="block h-full rounded-full bg-interview" style={{ width: `${use[d.id].rate}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {closedTotal > 0 && (
        <section className="panel mt-5" aria-labelledby="closed">
          <h2 id="closed" className="text-lg font-extrabold">
            Why jobs closed
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {OUTCOMES.filter((o) => s.outcomes[o.id]).map((o) => (
              <li key={o.id} className="rounded-full bg-closed-soft px-3 py-1.5 text-sm">
                <span className="font-semibold">{o.label}</span> <span className="tabular-nums">{s.outcomes[o.id]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-soft">Every no is a step closer. Most people apply for many jobs before they get an offer.</p>
        </section>
      )}
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <p className="panel p-4">
      <span className="block text-sm font-semibold text-ink-soft">{label}</span>
      <span className="block text-3xl font-extrabold tabular-nums">{value}</span>
      <span className="block text-xs text-ink-soft">{note}</span>
    </p>
  );
}
