"use client";

import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc, writeBatch, type WriteBatch } from "firebase/firestore";
import { firebase } from "@/lib/firebase";
import { todayIso } from "@/lib/dates";
import { cleanDoc, DOC_LIMITS } from "@/lib/documents";
import { blankJob, cleanEdits, columns, moveTo, orderAt, setOutcome } from "@/lib/jobs";
import { MAX_GOAL } from "@/lib/read";
import { exampleJobs } from "@/lib/samples";
import { addToast, getApp, reportProblem } from "@/lib/store";
import type { Doc, Job, NewJob, Outcome, Stage } from "@/lib/types";

/*
  Every change HireTrack makes to Firestore. Everything is saved under users/{your id}, and
  firestore.rules on Google's servers makes sure only you can read or change it, and checks
  each job's fields and sizes.

  Changes are not awaited: Firestore shows them straight away and sends them when it can, so
  everything works offline. Deleting your account's data needs a connection, so that one waits.
*/

const db = () => firebase().db;
const me = () => {
  const uid = getApp().uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
};
const jobRef = (id: string) => doc(db(), "users", me(), "jobs", id);
const docRef = (id: string) => doc(db(), "users", me(), "docs", id);

/** For writes we don't wait for: say so if the server refuses one */
function quietly(promise: Promise<unknown>) {
  promise.catch(() => reportProblem("A change couldn't be saved. Check your connection and refresh to see your latest jobs."));
}

// ---------- Jobs ----------

/** Adds a job at the top of its column. Returns its id, so the app can open it. */
export function addJob(fields: NewJob) {
  const stage = fields.stage;
  const column = columns(getApp().jobs)[stage];
  const ref = doc(collection(db(), "users", me(), "jobs"));
  quietly(setDoc(ref, blankJob(fields, todayIso(), Date.now(), orderAt(column, 0))));
  return ref.id;
}

/** Saves changes typed on a job's page. Only the fields a form owns are sent (lib/jobs.ts cleanEdits). */
export function updateJob(job: Job, fields: Partial<Job>) {
  const changes = cleanEdits(fields);
  if (Object.keys(changes).length === 0) return;
  quietly(updateDoc(jobRef(job.id), { ...changes, updatedAt: Date.now() }));
}

/**
 * Moves a card: to another stage, and/or to a new place in a column (`index`, counted without the
 * card itself). Leave `index` out to put it at the top.
 */
export function moveJob(job: Job, stage: Stage, index = 0, outcome: Outcome = "") {
  const column = columns(getApp().jobs)[stage].filter((j) => j.id !== job.id);
  const changes = { ...moveTo(job, stage, todayIso(), outcome), order: orderAt(column, index), updatedAt: Date.now() };
  quietly(updateDoc(jobRef(job.id), changes));
  if (stage === "offer" && job.stage !== "offer") addToast(`An offer from ${job.company || "them"}! Well done.`);
}

export function chooseOutcome(job: Job, outcome: Outcome) {
  quietly(updateDoc(jobRef(job.id), { ...setOutcome(job, outcome, todayIso()), updatedAt: Date.now() }));
}

/** Deletes a job, with Undo on the message that pops up */
export function deleteJob(job: Job) {
  quietly(deleteDoc(jobRef(job.id)));
  const { id, ...rest } = job;
  addToast(`Deleted ${job.company || "the job"}.`, () => quietly(setDoc(jobRef(id), rest)));
}

/** Marks a follow-up as done: the reminder goes, and a note is added to the job's notes */
export function followUpDone(job: Job) {
  const line = `${todayIso()}: followed up${job.followUpNote ? ` (${job.followUpNote})` : ""}.`;
  const notes = (job.notes ? `${job.notes}\n${line}` : line).slice(-2000);
  quietly(updateDoc(jobRef(job.id), { followUpOn: "", followUpNote: "", notes, updatedAt: Date.now() }));
}

// ---------- Example jobs ----------

export function addExamples() {
  const batch = writeBatch(db());
  for (const job of exampleJobs(todayIso(), Date.now())) batch.set(doc(collection(db(), "users", me(), "jobs")), job);
  quietly(batch.commit());
}

export function removeExamples() {
  const examples = getApp().jobs.filter((j) => j.example);
  const batch = writeBatch(db());
  examples.forEach((j) => batch.delete(jobRef(j.id)));
  quietly(batch.commit());
}

// ---------- CVs and cover letters ----------

export function addDoc(fields: Pick<Doc, "kind" | "name" | "link" | "notes">) {
  if (getApp().docs.length >= DOC_LIMITS.count) return reportProblem(`You can keep up to ${DOC_LIMITS.count} CVs and cover letters. Delete an old one first.`);
  const clean = cleanDoc(fields);
  if (!clean.name) return;
  quietly(setDoc(doc(collection(db(), "users", me(), "docs")), { ...clean, createdAt: Date.now() }));
}

export function updateDocument(d: Doc, fields: Pick<Doc, "kind" | "name" | "link" | "notes">) {
  const clean = cleanDoc(fields);
  if (!clean.name) return;
  quietly(updateDoc(docRef(d.id), clean));
}

/** Deletes a CV or cover letter, and takes it off any job it was sent with */
export function deleteDocument(d: Doc) {
  const batch = writeBatch(db());
  batch.delete(docRef(d.id));
  for (const j of getApp().jobs) {
    if (j.cvId === d.id) batch.update(jobRef(j.id), { cvId: "" });
    if (j.coverId === d.id) batch.update(jobRef(j.id), { coverId: "" });
  }
  quietly(batch.commit());
}

// ---------- You ----------

export function saveProfile(name: string, weeklyGoal: number) {
  const clean = {
    name: name.replace(/\s+/g, " ").trim().slice(0, 40),
    weeklyGoal: Math.max(0, Math.min(MAX_GOAL, Math.round(weeklyGoal) || 0)),
  };
  quietly(setDoc(doc(db(), "users", me()), clean, { merge: true }));
}

/** Deletes everything you've saved in HireTrack: jobs, documents and profile. Needs a connection. */
export async function deleteEverything() {
  const uid = me();
  const jobs = await getDocs(collection(db(), "users", uid, "jobs"));
  const docs = await getDocs(collection(db(), "users", uid, "docs"));
  const refs = [...jobs.docs, ...docs.docs];
  const chunks: (typeof refs)[] = [];
  for (let i = 0; i < refs.length; i += 450) chunks.push(refs.slice(i, i + 450)); // Firestore allows 500 changes per batch
  if (chunks.length === 0) chunks.push([]);
  for (let c = 0; c < chunks.length; c++) {
    const batch: WriteBatch = writeBatch(db());
    chunks[c].forEach((d) => batch.delete(d.ref));
    if (c === chunks.length - 1) batch.delete(doc(db(), "users", uid));
    await batch.commit();
  }
}
