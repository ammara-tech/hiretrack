"use client";

import { useEffect, useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { authErrorMessage, errorCode, finishRedirectSignIn, resetPassword, signInEmail, signInGoogle, signUpEmail } from "@/lib/auth";

/*
  The sign-in screen. On a laptop the green side shows three small example cards (the board,
  a reminder and the stats), so people see what HireTrack does before they sign up.
*/
export default function LoginScreen() {
  const [mode, setMode] = useState<"signIn" | "create">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; code: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  
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
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[#123528] p-12 text-white lg:flex lg:flex-col">
        <p className="flex items-center gap-2 text-2xl font-extrabold">
          <Logo className="h-9 w-9" />
          HireTrack
        </p>
        <DemoBoard />
        {/* A big line of text, not the page's heading: on phones this side is hidden, so "Welcome back" is the h1 */}
        <p className="relative mt-auto max-w-md text-5xl font-extrabold leading-[1.05] tracking-tight">Every application, one board.</p>
        <p className="relative mt-5 max-w-md text-lg text-white/85">
          Know where every job stands, follow up on time, walk into interviews prepared, and see which CV gets you called back.
        </p>
      </aside>

      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-xl font-extrabold lg:invisible">
            <Logo />
            HireTrack
          </p>
          <ThemeToggle />
        </div>

        <div className="m-auto w-full max-w-sm py-10">
          <h1 className="text-3xl font-extrabold tracking-tight">{mode === "signIn" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-2 text-ink-soft">{mode === "signIn" ? "Sign in to see your board." : "It's free, and takes a minute."}</p>

          <button type="button" disabled={busy} onClick={() => run(signInGoogle)} className="btn-quiet mt-8 w-full py-3">
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

          <p className="mt-8 text-ink-soft">
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
          <p className="mt-6 text-sm text-ink-soft">Your jobs are private: only you can see them. They&apos;re stored in Google&apos;s Firebase database, and you can delete everything in Settings.</p>
        </div>
      </main>
    </div>
  );
}

/*
  Three made-up cards, as a preview on the sign-in screen. They sit in a grid, so none hides
  another (on narrower laptops the reminder card is left out). Each shows something HireTrack does:
    the board, with jobs in Applied, Interview and Offer
    a follow-up reminder with a ready-written email
    the stats
  Decorative only: screen readers skip it.
*/
const card = "rounded-2xl bg-white p-4 text-[#1c1f2b] shadow-[0_24px_50px_-18px_rgba(0,0,0,0.55)]";

function DemoBoard() {
  const cols: [string, string, string, [string, string][]][] = [
    ["Applied", "#2a59b0", "#e3ebfa", [["Fynbos Digital", "Graduate dev"], ["Karoo Data", "IT intern"]]],
    ["Interview", "#6a3db5", "#efe7fb", [["Umoya Health", "Thu 14:00"]]],
    ["Offer", "#1b7349", "#dff2e7", [["Sunbird Studio", "R28 000"]]],
  ];
  return (
    <div aria-hidden="true" className="relative mx-auto mb-10 mt-8 grid w-full max-w-[540px] select-none gap-5 xl:grid-cols-2">
      {/* The board */}
      <div className={`${card} w-full max-w-[330px] rotate-[-2.5deg] justify-self-center xl:col-span-2 xl:justify-self-start`}>
        <p className="flex items-center justify-between text-sm font-bold">
          <span className="flex items-center gap-1.5">
            <Icon name="board" className="h-4 w-4 text-[#1b6b4f]" />
            My job hunt
          </span>
          <span className="text-[11px] font-semibold text-[#545968]">6 jobs</span>
        </p>
        <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {cols.map(([name, colour, soft, jobs]) => (
            <div key={name} className="rounded-lg p-1.5" style={{ background: soft }}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: colour }}>
                {name}
              </p>
              {jobs.map(([company, line]) => (
                <div key={company} className="mb-1.5 rounded-md border-l-[3px] bg-white px-1.5 py-1 text-[10px] leading-tight shadow-sm" style={{ borderColor: colour }}>
                  <p className="font-bold">{company}</p>
                  <p className="text-[#545968]">{line}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* A reminder */}
      <div className={`${card} hidden w-full max-w-[250px] rotate-[2.5deg] self-start justify-self-start xl:block`}>
        <p className="flex items-center gap-1.5 text-sm font-bold">
          <Icon name="bell" className="h-4 w-4 text-[#a8401c]" />
          Today
        </p>
        <p className="mt-2 rounded-lg bg-[#fbe6dc] p-2 text-xs">
          <span className="block font-bold">Follow up with Fynbos Digital</span>
          <span className="text-[#6b3018]">Applied 7 days ago, no reply yet</span>
        </p>
        <p className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-[#1b6b4f] py-1.5 text-xs font-bold text-white">
          <Icon name="mail" className="h-3.5 w-3.5" />
          Email them
        </p>
      </div>

      {/* Stats */}
      <div className={`${card} w-full max-w-[230px] rotate-[-1.5deg] justify-self-center xl:mt-4 xl:justify-self-end`}>
        <p className="flex items-center gap-1.5 text-sm font-bold">
          <Icon name="chart" className="h-4 w-4 text-[#2a59b0]" />
          How it&apos;s going
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center">
          <p className="rounded-lg bg-[#f6f4ef] py-1.5">
            <span className="block text-xl font-extrabold">42%</span>
            <span className="text-[10px] text-[#545968]">heard back</span>
          </p>
          <p className="rounded-lg bg-[#f6f4ef] py-1.5">
            <span className="block text-xl font-extrabold">3</span>
            <span className="text-[10px] text-[#545968]">interviews</span>
          </p>
        </div>
        <p className="mt-2 text-center text-[11px] font-semibold text-[#1b6b4f]">4 of 5 applications this week</p>
      </div>
    </div>
  );
}
