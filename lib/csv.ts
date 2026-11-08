import { outcomeLabel, stageLabel } from "@/lib/jobs";
import type { Doc, Job } from "@/lib/types";

/*
  Download my jobs: every job as a CSV file that Excel or Google Sheets opens, to keep a copy
  or share your progress. Tested in tests/csv.test.ts.
*/

/**
 * One cell. Cells with commas, quotes or new lines are wrapped in quotes. A cell starting with
 * = + - or @ gets a ' in front, so a spreadsheet shows it as text instead of running it as a
 * formula (a job advert could contain anything).
 */
export function cell(value: string | number) {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function jobsCsv(jobs: Job[], docs: Doc[]) {
  const docName = (id: string) => docs.find((d) => d.id === id)?.name ?? "";
  const head = ["Company", "Role", "Stage", "Closed because", "Applied on", "Heard back on", "Follow up on", "Interviews", "Location", "Salary", "Found on", "CV", "Cover letter", "Contact", "Advert", "Notes"];
  const rows = [...jobs]
    .sort((a, b) => (b.appliedOn || "0").localeCompare(a.appliedOn || "0") || a.company.localeCompare(b.company))
    .map((j) => [
      j.company,
      j.role,
      stageLabel(j.stage),
      j.stage === "closed" && j.outcome ? outcomeLabel(j.outcome) : "",
      j.appliedOn,
      j.heardBackOn,
      j.followUpOn,
      j.interviews.map((i) => `${i.date}${i.time ? ` ${i.time}` : ""}`).join("; "),
      j.location,
      j.salary,
      j.source,
      docName(j.cvId),
      docName(j.coverId),
      [j.contactName, j.contactEmail].filter(Boolean).join(" "),
      j.link,
      j.notes,
    ]);
  // The ﻿ at the start tells Excel the file is UTF-8, so names like "Zoë" show correctly
  return "﻿" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
