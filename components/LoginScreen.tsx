"use client";

import { useEffect, useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { authErrorMessage, errorCode, finishRedirectSignIn, resetPassword, signInDemo, signInEmail, signInGoogle, signUpEmail } from "@/lib/auth";

/*
  The sign-in screen: one card in the middle of a dark page, with a made-up job board drifting
  slowly behind it, so people see what HireTrack is for before they sign up.
*/
export default function LoginScreen() {
  const [mode, setMode] = useState<"signIn" | "create">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; code: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Opened from a "Try the demo" link (…/?demo): the demo box goes to the top
  const [fromDemoLink, setFromDemoLink] = useState(false);
  useEffect(() => {
    setFromDemoLink(new URLSearchParams(window.location.search).has("demo"));
  }, []);

  const demoBox = (
    <div className="rounded-2xl bg-coral-soft p-4">
      <p className="flex items-center gap-2 font-bold">
        <Icon name="sparkle" className="h-4 w-4 text-coral" />
        Just looking?
      </p>
      <p className="mt-1 text-sm">Try HireTrack with example jobs. No account needed, and everything is deleted when you end the demo.</p>
      <button type="button" disabled={busy} onClick={() => run(signInDemo)} className="btn mt-3 w-full !bg-rail py-2.5 !text-rail-ink dark:!bg-rail-ink dark:!text-rail">
        Try the demo
      </button>
    </div>
  );

  // If Google sign-in went the full-page way and failed, say why when the page comes back.
  useEffect(() => {
    finishRedirectSignIn().catch((e) => {
      setError({ text: authErrorMessage(e), code: errorCode(e) });
      console.error("Sign-in failed:", errorCode(e) || e);
    });
  }, []);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (e) {
      setError({ text: authErrorMessage(e), code: errorCode(e) });
      console.error("Sign-in failed:", errorCode(e) || e); // the code, for whoever is fixing it
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    run(() => (mode === "signIn" ? signInEmail(email, password) : signUpEmail(email, password)));
  }

  async function forgot() {
    if (!email.trim()) {
      setError({ text: "Type your email address first, then press \"Forgot your password?\" again.", code: "" });
      return;
    }
    await run(async () => {
      await resetPassword(email);
      setNotice("If there's an account for that email, a reset link is on its way. Check your inbox.");
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-rail text-rail-ink">
      <BoardBackdrop />

      <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-6 sm:py-10">
        <p className="flex items-center justify-center gap-2.5 text-xl font-bold">
          <Logo className="h-9 w-9" />
          HireTrack
        </p>
        <p className="mt-3 text-center text-rail-soft">Every application, one board.</p>

        <div className="mt-6 rounded-3xl bg-card p-6 text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] ring-1 ring-white/10 sm:p-8">
          <div className="-mr-2 -mt-2 flex justify-end">
            <ThemeToggle />
          </div>
          {fromDemoLink && <div className="mb-6">{demoBox}</div>}
          <h1 className="text-3xl font-bold">{mode === "signIn" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-2 text-ink-soft">{mode === "signIn" ? "Sign in to see your board." : "It's free, and takes a minute."}</p>

          <button type="button" disabled={busy} onClick={() => run(signInGoogle)} className="btn-quiet mt-6 w-full py-3">
            <Icon name="google" />
            Continue with Google
          </button>

          <p className="my-6 flex items-center gap-3 text-sm text-ink-soft before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">or</p>

          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-semibold">
              Email
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field mt-1 font-normal" />
            </label>
            <div>
              <label htmlFor="password" className="text-sm font-semibold">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-pressed={show}
                  className="absolute inset-y-0 right-2 my-auto h-9 rounded-lg px-3 text-sm font-semibold text-brand hover:bg-brand-soft"
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            {error && (
              <div role="alert" className="text-sm font-semibold text-alert">
                <p>{error.text}</p>
                {error.code && <p className="mt-1 text-xs font-normal opacity-70">Error code: {error.code}</p>}
              </div>
            )}
            {notice && (
              <p role="status" className="text-sm text-brand">
                {notice}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn w-full py-3">
              {mode === "signIn" ? "Sign in" : "Create account"}
            </button>
          </form>

          {mode === "signIn" && (
            <button type="button" onClick={forgot} className="mt-4 text-sm font-semibold text-brand hover:underline">
              Forgot your password?
            </button>
          )}

          <p className="mt-6 text-ink-soft">
            {mode === "signIn" ? "New to HireTrack? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signIn" ? "create" : "signIn");
                setError(null);
                setNotice(null);
              }}
              className="font-bold text-brand hover:underline"
            >
              {mode === "signIn" ? "Create an account" : "Sign in"}
            </button>
          </p>
          {!fromDemoLink && <div className="mt-6">{demoBox}</div>}
          <p className="mt-6 text-xs text-ink-soft">Your jobs are private: only you can see them. They&apos;re stored in Google&apos;s Firebase database, and you can delete everything in Settings.</p>
        </div>
        <p className="mt-6 text-center text-sm text-rail-soft">Follow up on time, walk into interviews prepared, and see which CV gets you called back.</p>
      </main>
    </div>
  );
}

/*
  Behind the sign-in card: a made-up job board, five columns (one per stage) of small job cards
  drifting slowly upwards. Each column's list is drawn twice, so moving it up by half loops
  without a jump. It's faded towards the middle so the card stays easy to read. Decorative only:
  screen readers skip it, and it stands still if you've asked your device for less motion.
*/
const BOARD: [string, string, [string, string][]][] = [
  ["Saved", "#b3bacb", [["Bluegum Labs", "Junior dev"], ["Sable Tech", "QA tester"], ["Kloof Media", "Web designer"], ["Nandi Bank", "IT grad"]]],
  ["Applied", "#93b4f4", [["Fynbos Digital", "Graduate dev"], ["Karoo Data", "IT intern"], ["Protea Cloud", "Support"], ["Ubuntu Pay", "Frontend"]]],
  ["Interview", "#c4a6f5", [["Umoya Health", "Thu 14:00"], ["Marula Games", "Mon 10:30"], ["Baobab IT", "Video call"]]],
  ["Offer", "#7fd9a8", [["Sunbird Studio", "R28 000"], ["Aloe Systems", "R24 500"]]],
  ["Closed", "#a3a7b1", [["Cape Logic", "Not this time"], ["Kestrel AI", "Withdrew"], ["Impala Soft", "Not this time"]]],
];

function BoardBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
      <div className="absolute inset-x-0 -top-10 grid grid-cols-3 gap-4 px-4 opacity-60 sm:grid-cols-5 lg:gap-6 lg:px-10">
        {BOARD.map(([name, colour, jobs], i) => (
          <div key={name} className={i > 2 ? "hidden sm:block" : undefined}>
            <div className="drift" style={{ animationDelay: `${-i * 9}s` }}>
              {[0, 1].map((copy) => (
                <div key={copy} className="pb-4">
                  <p className="mb-3 flex items-center gap-2 pt-12 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: colour }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: colour }} />
                    {name}
                  </p>
                  {[...jobs, ...jobs].map(([company, line], k) => (
                    <div key={k} className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs">
                      <span className="mb-2 block h-1 w-8 rounded-full" style={{ background: colour }} />
                      <p className="font-semibold text-rail-ink">{company}</p>
                      <p className="text-rail-soft">{line}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Fades the board towards the middle, where the card is */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_45%,var(--color-rail)_45%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-rail to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-rail to-transparent" />
    </div>
  );
}
