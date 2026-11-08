import { describe, expect, it } from "vitest";
import { defaultName, readDoc, readJob, readProfile } from "@/lib/read";

describe("reading saved data", () => {
  it("gives a broken job safe defaults", () => {
    const j = readJob("x", { company: 5, stage: "hired", interviews: "lots", history: [{ stage: "nope", on: "x" }], order: "first" });
    expect(j.company).toBe("");
    expect(j.stage).toBe("saved");
    expect(j.interviews).toEqual([]);
    expect(j.history).toEqual([{ stage: "saved", on: "1970-01-01" }]);
    expect(j.order).toBe(0);
  });
  it("keeps a good job as it was saved", () => {
    const j = readJob("x", {
      company: "Bluegum",
      stage: "closed",
      outcome: "withdrew",
      accepted: true,
      appliedOn: "2026-11-01",
      interviews: [{ id: "i", date: "2026-11-05", time: "09:30", kind: "phone", with: "HR", where: "", notes: "" }, { date: "bad" }],
      history: [{ stage: "applied", on: "2026-11-01" }],
    });
    expect(j.outcome).toBe("withdrew");
    expect(j.accepted).toBe(false); // only an offer can be accepted
    expect(j.interviews).toHaveLength(1);
    expect(j.interviews[0].kind).toBe("phone");
    expect(j.history).toEqual([{ stage: "applied", on: "2026-11-01" }]);
  });
  it("reads documents and profiles", () => {
    expect(readDoc("d", { kind: "letter" })).toEqual({ id: "d", kind: "cv", name: "Untitled", link: "", notes: "", createdAt: 0 });
    expect(readProfile({ name: "", weeklyGoal: 500 }, "Ammara")).toEqual({ name: "Ammara", weeklyGoal: 0 });
    expect(readProfile({ name: "Amy", weeklyGoal: 5 }, "Ammara")).toEqual({ name: "Amy", weeklyGoal: 5 });
  });
  it("starts with a friendly name", () => {
    expect(defaultName({ displayName: "Ammara Badat" })).toBe("Ammara");
    expect(defaultName({ email: "ammara.badat@example.com" })).toBe("Ammara");
    expect(defaultName({})).toBe("Me");
  });
});
