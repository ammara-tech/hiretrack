"use client";

import { useSyncExternalStore } from "react";
import { collection, doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { firebase } from "@/lib/firebase";
import { readDoc, readJob, readProfile } from "@/lib/read";
import type { Doc, Job, Profile } from "@/lib/types";

/*
  The app's live copy of your job hunt, kept up to date by Firestore.

  connect(uid) listens to three things, all inside users/{uid}, which only you can read:
    1. your profile: your name and weekly goal
    2. your jobs
    3. your CV versions and cover letters
  If you change something on your laptop, your phone shows it within a moment.

  Changes show straight away, even offline: Firestore saves them on the device first
  ("pending") and sends them when the connection is back.
*/

export type Toast = { id: number; text: string; undo?: () => void };

export type AppState = {
  uid: string | null;
  status: "loading" | "ready";
  profile: Profile;
  jobs: Job[];
  docs: Doc[];
  pending: boolean; // changes saved on this device but not yet sent
  online: boolean;
  toasts: Toast[];
  problem: string | null;
};

const emptyProfile: Profile = { name: "", weeklyGoal: 0 };

let state: AppState = {
  uid: null,
  status: "loading",
  profile: emptyProfile,
  jobs: [],
  docs: [],
  pending: false,
  online: true,
  toasts: [],
  problem: null,
};

const listeners = new Set<() => void>();
function set(change: Partial<AppState>) {
  state = { ...state, ...change };
  listeners.forEach((l) => l());
}

let stops: Unsubscribe[] = [];
let pendingParts = { profile: false, jobs: false, docs: false };
let loaded = { profile: false, jobs: false };
let toastId = 0;

function setPending(part: keyof typeof pendingParts, value: boolean) {
  pendingParts = { ...pendingParts, [part]: value };
  set({ pending: Object.values(pendingParts).some(Boolean) });
}

function markLoaded(part: keyof typeof loaded) {
  loaded = { ...loaded, [part]: true };
  if (loaded.profile && loaded.jobs && state.status !== "ready") set({ status: "ready" });
}

/** A message at the bottom of the screen. With `undo`, it has an Undo button and stays a little longer. */
export function addToast(text: string, undo?: () => void) {
  const toast = { id: ++toastId, text, undo };
  set({ toasts: [...state.toasts, toast].slice(-3) });
  setTimeout(() => dismissToast(toast.id), undo ? 7000 : 4500);
}

export function dismissToast(id: number) {
  set({ toasts: state.toasts.filter((t) => t.id !== id) });
}

export function reportProblem(problem: string | null) {
  set({ problem });
}

const onOnline = () => set({ online: navigator.onLine });

export function connect(uid: string, name: string) {
  if (state.uid === uid) return;
  disconnect();
  set({ uid, status: "loading", online: navigator.onLine });
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOnline);
  const { db } = firebase();
  const failed = () => reportProblem("Couldn't load your jobs. Check your connection and refresh.");

  stops = [
    onSnapshot(
      doc(db, "users", uid),
      { includeMetadataChanges: true },
      (snap) => {
        setPending("profile", snap.metadata.hasPendingWrites);
        set({ profile: readProfile(snap.data(), name) });
        markLoaded("profile");
      },
      () => {
        set({ profile: readProfile(undefined, name) });
        markLoaded("profile");
        failed();
      },
    ),
    onSnapshot(
      collection(db, "users", uid, "jobs"),
      { includeMetadataChanges: true },
      (snap) => {
        setPending("jobs", snap.metadata.hasPendingWrites);
        set({ jobs: snap.docs.map((d) => readJob(d.id, d.data())) });
        markLoaded("jobs");
      },
      () => {
        markLoaded("jobs");
        failed();
      },
    ),
    onSnapshot(
      collection(db, "users", uid, "docs"),
      { includeMetadataChanges: true },
      (snap) => {
        setPending("docs", snap.metadata.hasPendingWrites);
        set({ docs: snap.docs.map((d) => readDoc(d.id, d.data())) });
      },
      () => set({ docs: [] }),
    ),
  ];
}

export function disconnect() {
  stops.forEach((stop) => stop());
  stops = [];
  if (typeof window !== "undefined") {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOnline);
  }
  pendingParts = { profile: false, jobs: false, docs: false };
  loaded = { profile: false, jobs: false };
  set({ uid: null, status: "loading", profile: emptyProfile, jobs: [], docs: [], pending: false, toasts: [], problem: null });
}

export function getApp() {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useApp(): AppState {
  return useSyncExternalStore(subscribe, getApp, getApp);
}
