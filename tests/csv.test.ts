import { describe, expect, it } from "vitest";
import { cell, jobsCsv } from "@/lib/csv";
import { job } from "./helpers";

describe("downloading my jobs", () => {
  it("quotes cells that need it", () => {
    expect(cell("plain")).toBe("plain");
    expect(cell('Say "hi", please')).toBe('"Say ""hi"", please"');
    expect(cell("two\nlines")).toBe('"two\nlines"');
  });
  it("stops a cell being run as a formula", () => {
    expect(cell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(cell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(cell("-5")).toBe("'-5");
  });
  it("writes a header and one row per job, with document names", () => {
    const csv = jobsCsv([job({ company: "Bluegum", stage: "closed", outcome: "noReply", appliedOn: "2026-11-01", cvId: "cv1" })], [{ id: "cv1", kind: "cv", name: "CV Nov", link: "", notes: "", createdAt: 0 }]);
    const lines = csv.split("\r\n");
    expect(lines[0].startsWith("﻿Company,Role,Stage")).toBe(true);
    expect(lines[1]).toContain("Bluegum,Developer,Closed,No reply,2026-11-01");
    expect(lines[1]).toContain("CV Nov");
  });
});
