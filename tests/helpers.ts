import { blankJob } from "@/lib/jobs";
import type { Job } from "@/lib/types";

/** A job for the tests, with any fields changed */
export function job(fields: Partial<Job> = {}): Job {
  return { ...blankJob({ company: "Bluegum", role: "Developer", link: "", stage: "saved" }, "2026-11-01", 1, 0), id: "j1", ...fields };
}
