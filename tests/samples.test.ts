import { describe, expect, it } from "vitest";
import { exampleJobs } from "@/lib/samples";
import { todayList } from "@/lib/reminders";
import { jobStats } from "@/lib/stats";
import type { Job } from "@/lib/types";

describe("example jobs", () => {
  const today = "2026-11-08";
  const examples = exampleJobs(today, 1).map((j, i) => ({ ...j, id: `e${i}` }) as Job);
  it("are all marked as examples, one or more in every column", () => {
    expect(examples.every((j) => j.example)).toBe(true);
    for (const stage of ["saved", "applied", "interview", "offer", "closed"]) expect(examples.some((j) => j.stage === stage)).toBe(true);
  });
  it("fill the Today page and the stats", () => {
    const list = todayList(examples, today);
    expect(list.due.length).toBeGreaterThan(0);
    expect(list.interviews.length).toBe(1);
    expect(list.quiet.length).toBe(1);
    expect(jobStats(examples, today).applied).toBe(5);
  });
});
