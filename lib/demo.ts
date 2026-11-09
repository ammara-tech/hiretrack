"use client";

import { deleteUser } from "firebase/auth";
import { firebase } from "@/lib/firebase";
import { deleteEverything, seedDemo } from "@/lib/actions";
import { signOutUser } from "@/lib/auth";

/*
  "Try the demo": look around HireTrack without making an account.
  - The guest gets their own private account (Firebase anonymous sign-in, lib/auth.ts), so the
    security rules protect a demo exactly like a real account.
  - The first time a guest's board is empty, it's filled with example jobs, CVs and a weekly goal.
    A note on the device remembers that, so removing the examples doesn't bring them back.
  - "End the demo" deletes everything the guest saved, then the guest account itself.
*/

const seededKey = (uid: string) => `hiretrack:demoSeeded:${uid}`;

/** Fills a new guest's empty board with examples, once */
export function seedDemoOnce(uid: string, empty: boolean) {
  try {
    if (localStorage.getItem(seededKey(uid))) return;
    localStorage.setItem(seededKey(uid), "1");
  } catch {
    /* storage blocked: still seed, but only when the board is empty */
  }
  if (empty) seedDemo();
}

/** Deletes the guest's data and the guest account. Needs a connection. */
export async function endDemo() {
  const user = firebase().auth.currentUser;
  if (!user) return;
  await deleteEverything();
  try {
    localStorage.removeItem(seededKey(user.uid));
  } catch {
    /* nothing to remove */
  }
  try {
    await deleteUser(user);
  } catch {
    await signOutUser(); // if Firebase won't delete it, at least sign out
  }
}
