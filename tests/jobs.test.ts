import { describe, expect, it } from "vitest";
import { AUTO_FOLLOW_UP, blankJob, cleanEdits, cleanLink, columns, jobTitle, matches, moveTo, orderAt, reached, setOutcome } from "@/lib/jobs";
import { job } from "./helpers";

const today = "2026-11-08";

describe("a new job", () => {
  it("starts as Saved, trimmed, with its story begun", () => {
    const j = blankJob({ company: "  Bluegum  ", role: "Developer", link: "bluegum.co.za/jobs", stage: "saved" }, today, 5, 0);
    expect(j.company).toBe("Bluegum");
    expect(j.link).toBe("https://bluegum.co.za/jobs");
    expect(j.stage).toBe("saved");
    expect(j.history).toEqual([{ stage: "saved", on: today }]);
    expect(j.appliedOn).toBe("");
  });
  it("added straight to Applied gets today's date and a follow-up a week later", () => {
    const j = blankJob({ company: "Bluegum", role: "Dev", link: "", stage: "applied" }, today, 5, 0);
    expect(j.stage).toBe("applied");
    expect(j.appliedOn).toBe(today);
    expect(j.followUpOn).toBe("2026-11-15");
    expect(j.followUpNote).toBe(AUTO_FOLLOW_UP);
  });
});

describe("moving a job", () => {
  it("applying fills in the date and a reminder", () => {
    const c = moveTo(job(), "applied", today);
    expect(c.appliedOn).toBe(today);
    expect(c.followUpOn).toBe("2026-11-15");
    expect(c.history?.at(-1)).toEqual({ stage: "applied", on: today });
  });
  it("keeps a reminder you already set", () => {
    const c = moveTo(job({ followUpOn: "2026-11-10", followUpNote: "Call Naledi" }), "applied", today);
    expect(c.followUpOn).toBe(undefined);
  });
  it("an interview counts as hearing back, and clears the automatic reminder", () => {
    const j = job({ stage: "applied", appliedOn: "2026-11-01", followUpOn: "2026-11-08", followUpNote: AUTO_FOLLOW_UP });
    const c = moveTo(j, "interview", today);
    expect(c.heardBackOn).toBe(today);
    expect(c.followUpOn).toBe("");
  });
  it("keeps your own reminder when they answer", () => {
    const c = moveTo(job({ stage: "applied", appliedOn: "2026-11-01", followUpOn: "2026-11-09", followUpNote: "Send my portfolio" }), "interview", today);
    expect(c.followUpOn).toBe(undefined);
  });
  it("only the first answer counts as hearing back", () => {
    const c = moveTo(job({ stage: "interview", appliedOn: "2026-11-01", heardBackOn: "2026-11-03" }), "offer", today);
    expect(c.heardBackOn).toBe(undefined);
  });
  it("a no counts as hearing back, but no reply doesn't", () => {
    const j = job({ stage: "applied", appliedOn: "2026-11-01" });
    expect(moveTo(j, "closed", today, "rejected").heardBackOn).toBe(today);
    expect(moveTo(j, "closed", today, "noReply").heardBackOn).toBe(undefined);
  });
  it("closing clears the reminder and saves the reason", () => {
    const c = moveTo(job({ stage: "applied", appliedOn: "2026-11-01", followUpOn: "2026-11-09" }), "closed", today, "withdrew");
    expect(c.outcome).toBe("withdrew");
    expect(c.followUpOn).toBe("");
  });
  it("leaving Closed clears the reason, and leaving Offer clears accepted", () => {
    expect(moveTo(job({ stage: "closed", outcome: "rejected" }), "applied", today).outcome).toBe("");
    expect(moveTo(job({ stage: "offer", accepted: true }), "closed", today).accepted).toBe(false);
  });
  it("moving within the same column changes nothing", () => {
    expect(moveTo(job({ stage: "applied" }), "applied", today)).toEqual({});
  });
  it("saying no later still counts as hearing back", () => {
    expect(setOutcome(job({ stage: "closed", appliedOn: "2026-11-01" }), "rejected", today).heardBackOn).toBe(today);
    expect(setOutcome(job({ stage: "closed", appliedOn: "2026-11-01" }), "noReply", today).heardBackOn).toBe(undefined);
  });
  it("remembers how far a closed job got", () => {
    const j = job({ stage: "closed", appliedOn: "2026-11-01", history: [{ stage: "saved", on: "2026-11-01" }, { stage: "applied", on: "2026-11-01" }, { stage: "interview", on: "2026-11-04" }, { stage: "closed", on: today }] });
    expect(reached(j, "interview")).toBe(true);
    expect(reached(j, "offer")).toBe(false);
  });
});

describe("the board", () => {
  it("groups jobs into columns in their order", () => {
    const cols = columns([job({ id: "a", order: 10 }), job({ id: "b", order: -5 }), job({ id: "c", stage: "applied" })]);
    expect(cols.saved.map((j) => j.id)).toEqual(["b", "a"]);
    expect(cols.applied.map((j) => j.id)).toEqual(["c"]);
    expect(cols.offer).toEqual([]);
  });
  it("puts a dropped card between its neighbours", () => {
    const col = [{ order: 0 }, { order: 1000 }];
    expect(orderAt([], 0)).toBe(0);
    expect(orderAt(col, 0)).toBe(-1000);
    expect(orderAt(col, 1)).toBe(500);
    expect(orderAt(col, 2)).toBe(2000);
    expect(orderAt(col, 99)).toBe(2000);
  });
  it("searches company, role and notes, ignoring capitals and accents", () => {
    const j = job({ company: "Café Noir", role: "Junior Developer", notes: "React" });
    expect(matches(j, "cafe")).toBe(true);
    expect(matches(j, "junior react")).toBe(true);
    expect(matches(j, "senior")).toBe(false);
  });
  it("names a job", () => {
    expect(jobTitle({ role: "Developer", company: "Bluegum" })).toBe("Developer at Bluegum");
    expect(jobTitle({ role: "", company: "Bluegum" })).toBe("Bluegum");
    expect(jobTitle({ role: "", company: "" })).toBe("A job");
  });
});

describe("cleaning what's typed", () => {
  it("only allows http and https links", () => {
    expect(cleanLink("javascript:alert(1)")).toBe("");
    expect(cleanLink("www.pnet.co.za/job/1")).toBe("https://www.pnet.co.za/job/1");
    expect(cleanLink("http://example.com")).toBe("http://example.com/");
    expect(cleanLink("not a link")).toBe("");
  });
  it("keeps only the fields a form owns", () => {
    const c = cleanEdits({ company: " Bluegum ", stage: "offer", history: [], order: 5, example: true } as never);
    expect(c).toEqual({ company: "Bluegum" });
  });
  it("trims text to its limit and checks emails, dates and interviews", () => {
    const c = cleanEdits({
      notes: "x".repeat(5000),
      contactEmail: "not-an-email",
      followUpOn: "next week",
      interviews: [
        { id: "i1", date: "2026-11-12", time: "25:00", kind: "nonsense" as never, with: "Thabo", where: "", notes: "" },
        { id: "i2", date: "bad", time: "", kind: "video", with: "", where: "", notes: "" },
      ],
    });
    expect(c.notes?.length).toBe(2000);
    expect(c.contactEmail).toBe("");
    expect(c.followUpOn).toBe("");
    expect(c.interviews).toEqual([{ id: "i1", date: "2026-11-12", time: "", kind: "video", with: "Thabo", where: "", notes: "" }]);
  });
  it("drops empty checklist items and questions", () => {
    const c = cleanEdits({ checklist: [{ id: "a", text: "  ", done: false }, { id: "b", text: "Research", done: true }], questions: [{ id: "q", question: "", answer: "x" }] });
    expect(c.checklist).toEqual([{ id: "b", text: "Research", done: true }]);
    expect(c.questions).toEqual([]);
  });
});
