import { describe, expect, it } from "vitest";
import { calendarFile, followUpEmail, mailtoLink, needsYou, nextInterview, todayList } from "@/lib/reminders";
import { job } from "./helpers";

const today = "2026-11-08";
const interview = (date: string, time = "10:00") => ({ id: date, date, time, kind: "video" as const, with: "Naledi", where: "Google Meet", notes: "" });

describe("the Today page", () => {
  const jobs = [
    job({ id: "due", stage: "applied", appliedOn: "2026-10-30", followUpOn: "2026-11-06" }),
    job({ id: "dueToday", stage: "interview", followUpOn: today }),
    job({ id: "later", stage: "applied", appliedOn: "2026-11-05", followUpOn: "2026-11-12" }),
    job({ id: "farLater", stage: "applied", appliedOn: "2026-11-05", followUpOn: "2026-12-01" }),
    job({ id: "closed", stage: "closed", followUpOn: "2026-11-01" }),
    job({ id: "quiet", stage: "applied", appliedOn: "2026-10-20" }),
    job({ id: "quietButHeard", stage: "applied", appliedOn: "2026-10-20", heardBackOn: "2026-10-25" }),
    job({ id: "int", stage: "interview", interviews: [interview("2026-11-10", "14:00"), interview(today, "09:00"), interview("2026-11-30")] }),
  ];
  const list = todayList(jobs, today);
  it("lists follow-ups that are due, oldest first, but not for closed jobs", () => {
    expect(list.due.map((j) => j.id)).toEqual(["due", "dueToday"]);
  });
  it("lists follow-ups coming up this week", () => {
    expect(list.comingUp.map((j) => j.id)).toEqual(["later"]);
  });
  it("lists the next week's interviews, soonest first", () => {
    expect(list.interviews.map((i) => i.interview.date)).toEqual([today, "2026-11-10"]);
  });
  it("finds applications that have gone quiet", () => {
    expect(list.quiet.map((j) => j.id)).toEqual(["quiet"]);
  });
  it("counts what needs you today", () => {
    expect(needsYou(list, today)).toBe(3);
  });
  it("finds a job's next interview", () => {
    expect(nextInterview(jobs[7], "2026-11-09")?.date).toBe("2026-11-10");
    expect(nextInterview(jobs[0], today)).toBe(null);
  });
});

describe("follow-up emails", () => {
  it("asks about an application, using the contact's first name", () => {
    const e = followUpEmail(job({ stage: "applied", role: "Developer", company: "Bluegum", appliedOn: "2026-11-01", contactName: "Naledi Mokoena" }), "Ammara");
    expect(e.subject).toBe("Following up: Developer application");
    expect(e.body).toMatch(/^Hi Naledi,/);
    expect(e.body).toContain("on 2026-11-01");
    expect(e.body).toMatch(/Ammara$/);
  });
  it("says thank you after an interview", () => {
    expect(followUpEmail(job({ stage: "interview" }), "Ammara").subject).toMatch(/^Thank you/);
  });
  it("makes a safe email link", () => {
    expect(mailtoLink("a@b.co", { subject: "Hi & bye", body: "Line 1\nLine 2" })).toBe("mailto:a%40b.co?subject=Hi%20%26%20bye&body=Line%201%0ALine%202");
  });
});

describe("calendar files", () => {
  it("adds timed and all-day interviews, escaping text", () => {
    const j = job({ id: "j9", role: "Dev, junior", company: "Bluegum" });
    const ics = calendarFile([{ job: j, interview: interview("2026-11-10", "23:30") }, { job: j, interview: { ...interview("2026-11-11"), time: "" } }], new Date(Date.UTC(2026, 10, 8)));
    expect(ics).toContain("DTSTART:20261110T233000");
    expect(ics).toContain("DTEND:20261110T235900");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261111");
    expect(ics).toContain("DTEND;VALUE=DATE:20261112");
    expect(ics).toContain("SUMMARY:Video call: Dev\\, junior at Bluegum");
    expect(ics).toContain("\r\n");
  });
});
