import { addDays } from "@/lib/dates";
import { blankJob, moveTo, itemId } from "@/lib/jobs";
import type { Job } from "@/lib/types";

/*
  Example jobs to try HireTrack with, on a new board. The companies are made up. They're marked
  as examples, so "Remove the examples" takes them all away at once, and they're never mixed up
  with your real jobs.
*/

type Example = Omit<Job, "id">;

export function exampleJobs(today: string, now: number): Example[] {
  const at = (days: number) => addDays(today, days);
  const make = (fields: Parameters<typeof blankJob>[0], order: number, extra: Partial<Example> = {}): Example => ({
    ...blankJob(fields, at(-20), now, order),
    ...extra,
    example: true,
  });

  // Moves an example along as if it happened on certain days
  const along = (job: Example, steps: [Job["stage"], number][]): Example => {
    let j = { ...job, id: "" } as Job;
    for (const [stage, days] of steps) j = { ...j, ...moveTo(j, stage, at(days)) };
    const { id: _id, ...rest } = j;
    void _id;
    return rest;
  };

  const saved = make({ company: "Bluegum Software", role: "Junior Front-end Developer", link: "", stage: "saved", location: "Cape Town", mode: "hybrid", source: "LinkedIn" }, 0, {
    notes: "Uses React and Next.js. Closes at the end of the month.",
    history: [{ stage: "saved", on: at(-2) }],
  });

  const applied = along(make({ company: "Fynbos Digital", role: "Graduate Web Developer", link: "", stage: "saved", location: "Stellenbosch", mode: "onsite", salary: "R22 000 a month", source: "PNet" }, 0), [["applied", -9]]);

  const quiet = {
    ...along(make({ company: "Karoo Data", role: "IT Support Intern", link: "", stage: "saved", location: "Johannesburg", mode: "onsite", source: "Careers24" }, 1000), [["applied", -17]]),
    followUpOn: "",
    followUpNote: "",
  };

  const interview = {
    ...along(make({ company: "Umoya Health", role: "Junior Full-stack Developer", link: "", stage: "saved", location: "Remote", mode: "remote", salary: "R25 000 – R30 000", source: "Company website" }, 0), [
      ["applied", -14],
      ["interview", -4],
    ]),
    contactName: "Naledi Mokoena",
    contactEmail: "careers@example.com",
    followUpOn: today,
    followUpNote: "Send a thank-you email after the first interview",
    interviews: [
      { id: itemId(), date: at(-3), time: "10:00", kind: "video" as const, with: "Naledi (recruiter)", where: "Google Meet", notes: "Went well. They asked about my portfolio." },
      { id: itemId(), date: at(2), time: "14:00", kind: "inPerson" as const, with: "Thabo, the team lead", where: "12 Long Street, Cape Town", notes: "" },
    ],
    checklist: [
      { id: itemId(), text: "Look up what the company does and any recent news", done: true },
      { id: itemId(), text: "Prepare two questions to ask them", done: false },
    ],
    questions: [
      { id: itemId(), question: "Tell me about a project you're proud of.", answer: "My portfolio site: Next.js, Supabase, 155 automated tests." },
      { id: itemId(), question: "Why do you want to work here?", answer: "" },
    ],
  };

  const offer = along(make({ company: "Sunbird Studio", role: "Web Developer", link: "", stage: "saved", location: "Durban", mode: "hybrid", salary: "R28 000 a month", source: "Someone I know" }, 0), [
    ["applied", -24],
    ["interview", -18],
    ["offer", -1],
  ]);

  const closed = along(make({ company: "Marula Bank", role: "Junior Software Engineer", link: "", stage: "saved", location: "Pretoria", mode: "onsite", source: "LinkedIn" }, 0), [
    ["applied", -30],
    ["closed", -12],
  ]);
  closed.outcome = "rejected";
  closed.heardBackOn = at(-12);

  return [saved, applied, quiet, interview, offer, closed];
}
