"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { firebaseConfigured } from "@/lib/firebase";
import { defaultName } from "@/lib/read";
import { connect, disconnect, reportProblem, useApp } from "@/lib/store";
import Header from "@/components/Header";
import LoginScreen from "@/components/LoginScreen";
import Logo from "@/components/Logo";
import Toasts from "@/components/Toasts";
import Icon from "@/components/Icon";
import DemoBanner from "@/components/DemoBanner";
import { seedDemoOnce } from "@/lib/demo";

/*
  Wraps every page. Until someone is signed in, it shows the sign-in screen instead, so no job
  ever loads without an account. After sign-in it connects to their jobs (lib/store.ts).
  The real protection is in firestore.rules: only you can ever read your jobs.
*/
export default function AppShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const app = useApp();
  const user = auth.status === "signedIn" ? auth.user : null;

  useEffect(() => {
    if (user) connect(user.uid, user.isAnonymous ? "Guest" : defaultName(user));
    else disconnect();
  }, [user]);

  // "Try the demo": a guest's empty board is filled with example jobs, once (lib/demo.ts)
  const demo = Boolean(user?.isAnonymous);
  useEffect(() => {
    if (demo && user && app.status === "ready" && app.uid === user.uid) seedDemoOnce(user.uid, app.jobs.length === 0 && app.docs.length === 0);
  }, [demo, user, app.status, app.uid, app.jobs.length, app.docs.length]);

  if (!firebaseConfigured) return <SetupNeeded />;
  // Until Firebase has checked, both screens are on the page and the saved hint picks one
  // (see lib/auth.ts). The sign-in screen stays in the same place, so nothing typed is lost.
  if (auth.status !== "signedIn")
    return (
      <>
        {auth.status === "loading" && (
          <div className="gate-splash">
            <Splash text="Opening HireTrack…" />
          </div>
        )}
        <div className={auth.status === "loading" ? "gate-login" : undefined}>
          <LoginScreen />
        </div>
      </>
    );
  if (app.status === "loading") return <Splash text="Getting your jobs…" />;

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-card focus:px-4 focus:py-2">
        Skip to the main content
      </a>
      <Header />
      {/* On laptops everything sits to the right of the sidebar */}
      <div className="lg:pl-64">
      {demo && <DemoBanner />}
      <main id="main" className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:px-8 lg:pt-8">
        {!app.online && (
          <p className="mb-4 flex items-start gap-2 rounded-xl border border-line bg-card px-4 py-3 text-sm">
            <Icon name="cloudOff" className="mt-0.5 h-4 w-4 shrink-0 text-alert" />
            <span>
              <strong>You&apos;re offline.</strong> You can still see and change your jobs. Changes are saved on this device and sent when you&apos;re back online.
            </span>
          </p>
        )}
        {app.problem && (
          <p role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-alert/40 bg-card px-4 py-3 text-sm">
            <span className="flex-1">{app.problem}</span>
            <button type="button" onClick={() => reportProblem(null)} aria-label="Close" className="text-ink-soft hover:text-ink">
              <Icon name="close" className="h-4 w-4" />
            </button>
          </p>
        )}
        {children}
      </main>
      </div>
      <Toasts />
    </>
  );
}

function Splash({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-ink-soft">
      <Logo className="h-14 w-14 motion-safe:animate-bounce" />
      <p role="status">{text}</p>
    </div>
  );
}

/* Shown only to a developer who hasn't added the Firebase settings yet */
function SetupNeeded() {
  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-3xl font-extrabold">HireTrack needs its Firebase settings</h1>
      <p className="mt-4 text-lg text-ink-soft">
        Add the four NEXT_PUBLIC_FIREBASE_ settings to .env.local on your computer and restart npm run dev, or to Vercel&apos;s
        Environment Variables and redeploy. The README explains where to find them.
      </p>
    </div>
  );
}
