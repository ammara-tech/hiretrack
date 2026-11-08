import { describe, expect, it } from "vitest";
import { bySource, goalText, jobStats, perWeek } from "@/lib/stats";
import { job } from "./helpers";

const today = "2026-11-08"; // a Sunday: the week is 2 – 8 Nov
const jobs = [
  job({ id: "a", stage: "applied", appliedOn: "2026-11-03", source: "LinkedIn" }),
  job({ id: "b", stage: "interview", appliedOn: "2026-10-20", heardBackOn: "2026-10-30", source: "linkedin", history: [{ stage: "interview", on: "2026-10-30" }] }),
  job({ id: "c", stage: "closed", outcome: "rejected", appliedOn: "2026-10-12", heardBackOn: "2026-10-16", source: "PNet" }),
  job({ id: "d", stage: "offer", appliedOn: "2026-10-01", heardBackOn: "2026-10-05", history: [{ stage: "interview", on: "2026-10-05" }, { stage: "offer", on: "2026-10-20" }] }),
  job({ id: "e", stage: "saved" }),
];

describe("stats", () => {
  const s = jobStats(jobs, today);
  it("counts from the day you applied", () => {
    expect(s.applied).toBe(4);
    expect(s.heardBack).toBe(3);
    expect(s.interviews).toBe(2);
    expect(s.offers).toBe(1);
    expect(s.waiting).toBe(1);
  });
  it("works out the rates and the average wait", () => {
    expect(s.responseRate).toBe(75);
    expect(s.interviewRate).toBe(50);
    expect(s.avgDaysToHear).toBe(6); // (10 + 4 + 4) / 3
  });
  it("counts this week's applications and closed reasons", () => {
    expect(s.thisWeek).toBe(1);
    expect(s.outcomes.rejected).toBe(1);
  });
  it("has nothing to divide by on an empty board", () => {
    const e = jobStats([], today);
    expect(e.responseRate).toBe(null);
    expect(e.avgDaysToHear).toBe(null);
  });
  it("counts applications per week, oldest first", () => {
    const w = perWeek(jobs, today, 3);
    expect(w.map((x) => x.monday)).toEqual(["2026-10-19", "2026-10-26", "2026-11-02"]);
    expect(w.map((x) => x.count)).toEqual([1, 0, 1]);
  });
  it("groups sources whatever their capitals", () => {
    expect(bySource(jobs)).toEqual([
      { source: "LinkedIn", applied: 2, interviews: 1 },
      { source: "Not noted", applied: 1, interviews: 1 },
      { source: "PNet", applied: 1, interviews: 0 },
    ]);
  });
  it("describes the weekly goal", () => {
    expect(goalText(2, 5)).toBe("2 of 5 this week");
    expect(goalText(5, 5)).toBe("Goal reached: 5 of 5 this week");
    expect(goalText(3, 0)).toBe("");
  });
});
