import { itemId, LIMITS } from "@/lib/jobs";
import type { Job, PrepItem, PrepQuestion } from "@/lib/types";

/*
  Interview prep for each job: a checklist, questions to practise with notes for your answers,
  and what you've found out about the company. The suggestions below can be added with one press
  and changed to suit you. Tested in tests/prep.test.ts.
*/

export const SUGGESTED_CHECKLIST = [
  "Read the job advert again and match it to my CV",
  "Look up what the company does and any recent news",
  "Look up the people I'm meeting on LinkedIn",
  "Plan the route, or test the video link",
  "Prepare two questions to ask them",
  "Have my CV and ID ready",
];

export const COMMON_QUESTIONS = [
  "Tell me about yourself.",
  "Why do you want to work here?",
  "Tell me about a project you're proud of.",
  "Tell me about a time something went wrong, and what you did.",
  "What are your strengths, and what are you working on?",
  "Where do you see yourself in a few years?",
  "What are your salary expectations?",
  "Do you have any questions for us?",
];

/** Adds the suggested checklist items you don't have yet (it never doubles up) */
export function withSuggestedChecklist(list: PrepItem[]) {
  const have = new Set(list.map((i) => i.text.toLowerCase()));
  const added = SUGGESTED_CHECKLIST.filter((t) => !have.has(t.toLowerCase())).map((text) => ({ id: itemId(), text, done: false }));
  return [...list, ...added].slice(0, LIMITS.checklist);
}

/** Adds the common questions you don't have yet */
export function withCommonQuestions(list: PrepQuestion[]) {
  const have = new Set(list.map((q) => q.question.toLowerCase()));
  const added = COMMON_QUESTIONS.filter((q) => !have.has(q.toLowerCase())).map((question) => ({ id: itemId(), question, answer: "" }));
  return [...list, ...added].slice(0, LIMITS.questions);
}

/** How ready you are: checklist items ticked, and questions with an answer written */
export function prepProgress(job: Pick<Job, "checklist" | "questions">) {
  const done = job.checklist.filter((i) => i.done).length + job.questions.filter((q) => q.answer.trim()).length;
  const total = job.checklist.length + job.questions.length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}
