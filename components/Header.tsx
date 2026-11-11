"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import Logo from "@/components/Logo";
import SyncBadge from "@/components/SyncBadge";
import ThemeToggle from "@/components/ThemeToggle";
import { todayIso } from "@/lib/dates";
import { STAGES } from "@/lib/jobs";
import { needsYou, todayList } from "@/lib/reminders";
import { useApp } from "@/lib/store";

/*
  How you get around HireTrack.
  On a laptop: a charcoal sidebar on the left with the four pages and "Your pipeline", which
  counts the jobs in each stage, with a bar for each, so you see your whole job hunt at a glance.
  Under it, whether everything is saved, the theme and your settings.
  On a phone or tablet: a bar at the top, with the four pages as a row of tabs under it.
  Today shows a number when something needs you today: a follow-up that's due, or an interview.
*/
const PAGES: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Board", icon: "board" },
  { href: "/today", label: "Today", icon: "bell" },
  { href: "/documents", label: "CVs", icon: "file" },
  { href: "/stats", label: "Stats", icon: "chart" },
];

// The stage colours for the sidebar, which is dark in both themes (the dark-mode stage colours)
const ON_RAIL: Record<string, string> = {
  saved: "#b3bacb",
  applied: "#93b4f4",
  interview: "#c4a6f5",
  offer: "#7fd9a8",
  closed: "#a3a7b1",
};

export default function Header() {
  const { jobs } = useApp();
  const path = usePathname();
  const today = todayIso();
  const waiting = needsYou(todayList(jobs, today), today);
  const isCurrent = (href: string) => (href === "/" ? path === "/" || path.startsWith("/job") : path.startsWith(href));
  const counts = STAGES.map((s) => ({ ...s, n: jobs.filter((j) => j.stage === s.id).length }));
  const most = Math.max(1, ...counts.map((c) => c.n));

  const badge = (
    <span className="rounded-full bg-coral px-1.5 text-xs font-bold text-white dark:text-[#121117]">
      {waiting}
      <span className="sr-only"> need you today</span>
    </span>
  );

  return (
    <>
      {/* Laptops: the sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto bg-rail px-4 py-5 text-rail-ink lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-2 text-lg font-bold" aria-label="HireTrack: back to your board">
          <Logo />
          <span>HireTrack</span>
        </Link>

        <nav aria-label="Pages" className="mt-8">
          <ul className="space-y-1">
            {PAGES.map((p) => {
              const current = isCurrent(p.href);
              return (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    aria-current={current ? "page" : undefined}
                    className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                      current ? "bg-white/10 text-rail-ink" : "text-rail-soft hover:bg-white/5 hover:text-rail-ink"
                    }`}
                  >
                    {current && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-full bg-rail-coral" />}
                    <Icon name={p.icon} className={`h-5 w-5 ${current ? "text-rail-coral" : ""}`} />
                    <span className="flex-1">{p.label}</span>
                    {p.href === "/today" && waiting > 0 && badge}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <section aria-labelledby="pipeline" className="mt-8 rounded-2xl border border-rail-line p-4">
          <h2 id="pipeline" className="flex items-baseline justify-between text-xs font-bold uppercase tracking-[0.14em] text-rail-soft">
            Your pipeline
            <span className="text-sm normal-case tracking-normal text-rail-ink">
              {jobs.length} <span className="sr-only">jobs in all</span>
            </span>
          </h2>
          <ul className="mt-3 space-y-2.5">
            {counts.map((c) => (
              <li key={c.id} className="text-sm">
                <p className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-rail-soft">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: ON_RAIL[c.id] }} />
                    {c.label}
                  </span>
                  <span className="font-bold tabular-nums">{c.n}</span>
                </p>
                <span aria-hidden="true" className="mt-1 block h-1 rounded-full bg-white/5">
                  <span className="block h-1 rounded-full transition-[width]" style={{ width: `${(c.n / most) * 100}%`, background: ON_RAIL[c.id] }} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* The tools sit on a small card in the page's colours, so they look the same as everywhere else */}
        <div className="mt-auto flex items-center gap-1 rounded-2xl bg-card px-3 py-1.5 text-ink">
          <SyncBadge />
          <span className="ml-auto" />
          <ThemeToggle />
          <Link href="/settings" className="tool" aria-label="Settings" aria-current={path.startsWith("/settings") ? "page" : undefined} title="Settings">
            <Icon name="settings" />
          </Link>
        </div>
      </aside>

      {/* Phones and tablets: a bar at the top and tabs */}
      <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur lg:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold" aria-label="HireTrack: back to your board">
            <Logo />
            <span>HireTrack</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <SyncBadge />
            <ThemeToggle />
            <Link href="/settings" className="tool" aria-label="Settings" aria-current={path.startsWith("/settings") ? "page" : undefined} title="Settings">
              <Icon name="settings" />
            </Link>
          </div>
        </div>
        <nav aria-label="Pages" className="mx-auto max-w-6xl px-4 pb-2.5">
          <ul className="flex gap-1 rounded-2xl bg-card p-1 shadow-sm ring-1 ring-line">
            {PAGES.map((p) => {
              const current = isCurrent(p.href);
              return (
                <li key={p.href} className="flex-1">
                  <Link
                    href={p.href}
                    aria-current={current ? "page" : undefined}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-semibold ${
                      current ? "bg-rail text-rail-ink" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    <Icon name={p.icon} className={`h-4 w-4 ${current ? "text-rail-coral" : ""}`} />
                    {p.label}
                    {p.href === "/today" && waiting > 0 && badge}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
    </>
  );
}
