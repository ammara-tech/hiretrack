import { describe, expect, it } from "vitest";
import { addDays, dayLabel, daysBetween, isIsoDate, isTime, relativeDay, todayIso, weekStart } from "@/lib/dates";

describe("dates", () => {
  it("checks dates and times", () => {
    expect(isIsoDate("2026-11-09")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("9 Nov")).toBe(false);
    expect(isTime("14:30")).toBe(true);
    expect(isTime("24:00")).toBe(false);
  });
  it("adds days across months and years", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("counts days between dates", () => {
    expect(daysBetween("2026-11-01", "2026-11-15")).toBe(14);
    expect(daysBetween("2026-11-15", "2026-11-01")).toBe(-14);
  });
  it("starts weeks on Monday", () => {
    expect(weekStart("2026-11-08")).toBe("2026-11-02"); // a Sunday
    expect(weekStart("2026-11-09")).toBe("2026-11-09"); // a Monday
  });
  it("labels days, adding the year only when it isn't this year", () => {
    expect(dayLabel("2026-11-09", "2026-11-08")).toBe("Mon 9 Nov");
    expect(dayLabel("2027-01-04", "2026-11-08")).toBe("Mon 4 Jan 2027");
    expect(dayLabel("nonsense")).toBe("");
  });
  it("says how far away a day is", () => {
    expect(relativeDay("2026-11-08", "2026-11-08")).toBe("today");
    expect(relativeDay("2026-11-09", "2026-11-08")).toBe("tomorrow");
    expect(relativeDay("2026-11-07", "2026-11-08")).toBe("yesterday");
    expect(relativeDay("2026-11-11", "2026-11-08")).toBe("in 3 days");
    expect(relativeDay("2026-11-03", "2026-11-08")).toBe("5 days ago");
  });
  it("uses the phone's own date for today", () => {
    expect(todayIso(new Date(2026, 10, 8, 23, 30))).toBe("2026-11-08");
  });
});
