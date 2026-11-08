/*
  The shapes of HireTrack's data, as saved in Firestore. Everything belongs to one person:

    users/{uid}              your profile: name and weekly goal
    users/{uid}/jobs/{id}    one job you're interested in or applied for
    users/{uid}/docs/{id}    one CV version or cover letter you send out

  Dates without a time ("2026-11-09") are saved as text, so a date means the same day on every
  phone, whatever its time zone. Moments (when something was made or changed) are milliseconds.
*/

/** The columns of the board, in order */
export type Stage = "saved" | "applied" | "interview" | "offer" | "closed";

/** Why a job was closed */
export type Outcome = "" | "rejected" | "noReply" | "withdrew" | "declined";

export type WorkMode = "" | "onsite" | "hybrid" | "remote";

export type InterviewKind = "phone" | "video" | "inPerson" | "assessment";

export type Interview = {
  id: string;
  date: string; // "2026-11-12"
  time: string; // "14:30", or "" if not known yet
  kind: InterviewKind;
  with: string; // who you're meeting
  where: string; // an address or a meeting link
  notes: string;
};

/** A checklist item in interview prep ("Read their latest annual report") */
export type PrepItem = { id: string; text: string; done: boolean };

/** A question to practise, with notes for your answer */
export type PrepQuestion = { id: string; question: string; answer: string };

/** One step in a job's story, for the timeline and the stats */
export type Step = { stage: Stage; on: string };

export type Job = {
  id: string;
  company: string;
  role: string;
  link: string; // the job advert
  location: string;
  mode: WorkMode;
  salary: string; // free text: "R25 000 a month", "R300k a year"
  source: string; // where you found it: LinkedIn, PNet, a friend…
  stage: Stage;
  outcome: Outcome; // only for closed jobs
  accepted: boolean; // an offer you said yes to
  appliedOn: string; // "" until you apply
  heardBackOn: string; // the first time they answered after you applied
  followUpOn: string; // a reminder date, or ""
  followUpNote: string;
  contactName: string;
  contactEmail: string;
  cvId: string; // the CV version you sent (a doc's id), or ""
  coverId: string; // the cover letter you sent, or ""
  notes: string;
  research: string; // interview prep: what you know about the company
  interviews: Interview[];
  checklist: PrepItem[];
  questions: PrepQuestion[];
  history: Step[];
  order: number; // the card's place in its column
  example: boolean; // one of the example jobs you can try the app with
  createdAt: number;
  updatedAt: number;
};

/** What you can type in the Add a job form */
export type NewJob = Pick<Job, "company" | "role" | "link" | "stage"> & Partial<Pick<Job, "location" | "mode" | "salary" | "source">>;

export type DocKind = "cv" | "cover";

/** A CV version or cover letter. HireTrack keeps its name and a link to it, not the file itself. */
export type Doc = {
  id: string;
  kind: DocKind;
  name: string; // "CV: junior developer, Nov"
  link: string; // e.g. a Google Drive or OneDrive link
  notes: string;
  createdAt: number;
};

export type Profile = {
  name: string;
  weeklyGoal: number; // applications a week; 0 means no goal
};
