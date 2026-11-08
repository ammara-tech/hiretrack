import { describe, expect, it } from "vitest";
import { COMMON_QUESTIONS, prepProgress, SUGGESTED_CHECKLIST, withCommonQuestions, withSuggestedChecklist } from "@/lib/prep";

describe("interview prep", () => {
  it("adds the suggested checklist without doubling up", () => {
    const once = withSuggestedChecklist([{ id: "a", text: "Prepare two questions to ask them", done: true }]);
    expect(once).toHaveLength(SUGGESTED_CHECKLIST.length);
    expect(once[0].done).toBe(true);
    expect(withSuggestedChecklist(once)).toHaveLength(SUGGESTED_CHECKLIST.length);
  });
  it("adds the common questions without doubling up", () => {
    const once = withCommonQuestions([]);
    expect(once).toHaveLength(COMMON_QUESTIONS.length);
    expect(withCommonQuestions(once)).toHaveLength(COMMON_QUESTIONS.length);
  });
  it("counts ticked items and written answers", () => {
    const p = prepProgress({
      checklist: [{ id: "a", text: "x", done: true }, { id: "b", text: "y", done: false }],
      questions: [{ id: "q", question: "Why us?", answer: "Because" }, { id: "r", question: "Salary?", answer: "  " }],
    });
    expect(p).toEqual({ done: 2, total: 4, percent: 50 });
    expect(prepProgress({ checklist: [], questions: [] }).percent).toBe(0);
  });
});
