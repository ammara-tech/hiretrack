"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import Logo from "@/components/Logo";
import SyncBadge from "@/components/SyncBadge";
import ThemeToggle from "@/components/ThemeToggle";
import { todayIso } from "@/lib/dates";
import { needsYou, todayList } from "@/lib/reminders";
import { useApp } from "@/lib/store";

/*
  The bar at the top: logo, whether everything is saved, the theme and your settings.
  Under it, the four pages. Today shows a number when something needs you today: a follow-up
  that's due, or an interview.
*/
const PAGES: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Board", icon: "board" },
  { href: "/today", label: "Today", icon: "bell" },
  { href: "/documents", label: "CVs", icon: "file" },
  { href: "/stats", label: "Stats", icon: "chart" },
];

export default function Header() {
  const { jobs } = useApp();
  const path = usePathname();
  const today = todayIso();
  const waiting = needsYou(todayList(jobs, today), today);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight" aria-label="HireTrack: back to your board">
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
      <nav aria-label="Pages" className="mx-auto max-w-6xl px-2">
        <ul className="flex">
          {PAGES.map((p) => {
            const current = p.href === "/" ? path === "/" || path.startsWith("/job") : path.startsWith(p.href);
            return (
              <li key={p.href} className="flex-1 sm:flex-none">
                <Link
                  href={p.href}
                  aria-current={current ? "page" : undefined}
                  className={`flex items-center justify-center gap-1.5 border-b-[3px] px-3 py-2.5 text-sm font-bold sm:px-4 ${
                    current ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  <Icon name={p.icon} className="h-4 w-4" />
                  {p.label}
                  {p.href === "/today" && waiting > 0 && (
                    <span className="rounded-full bg-coral px-1.5 text-xs font-bold text-white dark:text-[#12141a]">
                      {waiting}
                      <span className="sr-only"> need you today</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
