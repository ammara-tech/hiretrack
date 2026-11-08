import { describe, expect, it } from "vitest";
import { cleanDoc, docsOfKind, docUsage, usageText } from "@/lib/documents";
import { job } from "./helpers";

const cv = { id: "cv1", kind: "cv" as const, name: "CV Nov", link: "", notes: "", createdAt: 1 };
const cv2 = { id: "cv2", kind: "cv" as const, name: "CV Oct", link: "", notes: "", createdAt: 0 };
const cover = { id: "cl1", kind: "cover" as const, name: "Letter", link: "", notes: "", createdAt: 2 };

describe("CVs and cover letters", () => {
  it("cleans what's typed", () => {
    expect(cleanDoc({ kind: "cover", name: "  My letter ", link: "javascript:x", notes: "" })).toEqual({ kind: "cover", name: "My letter", link: "", notes: "" });
  });
  it("counts applications and interviews per document", () => {
    const jobs = [
      job({ id: "a", appliedOn: "2026-11-01", stage: "interview", cvId: "cv1", coverId: "cl1", history: [{ stage: "interview", on: "2026-11-03" }] }),
      job({ id: "b", appliedOn: "2026-11-01", stage: "applied", cvId: "cv1" }),
      job({ id: "c", stage: "saved", cvId: "cv1" }), // not applied yet, so it doesn't count
    ];
    const use = docUsage([cv, cv2, cover], jobs);
    expect(use.cv1).toEqual({ sent: 2, interviews: 1, rate: 50 });
    expect(use.cl1).toEqual({ sent: 1, interviews: 1, rate: 100 });
    expect(use.cv2).toEqual({ sent: 0, interviews: 0, rate: null });
    expect(usageText(use.cv1)).toBe("2 applications, 1 interview (50%)");
    expect(usageText(use.cv2)).toBe("Not sent with an application yet");
  });
  it("lists one kind, newest first", () => {
    expect(docsOfKind([cv2, cover, cv], "cv").map((d) => d.id)).toEqual(["cv1", "cv2"]);
  });
});
