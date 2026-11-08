# HireTrack

**Your job hunt on one board.** Track every job from Saved to Offer, get reminded to follow up, walk into
interviews prepared, note which CV you sent, and see how your job hunt is going.

**Live site:** (add the Vercel address here once it's deployed)

Built by Ammara Badat as part of my portfolio. It uses Firebase, like PaperTrail, TickList, Rememba and ShiftBoard,
so it syncs between your phone and laptop and keeps working with no signal. I'm building it for my own job hunt first.

## Who it's for
Anyone applying for jobs, especially students and graduates sending out lots of applications: on LinkedIn, PNet,
Careers24 and company websites. Without a tracker, it's easy to forget where you applied, miss the moment to
follow up, or walk into an interview without having looked the company up.

## What it does

**The board**
- **Five columns:** Saved, Applied, Interview, Offer and Closed. Each card shows the company, role, location,
  salary, and what matters now: a follow-up that's due, the next interview and how ready you are, or how long
  you've been waiting.
- **Drag and drop** cards between columns, or up and down in a column, on a laptop. Every card also has a
  **Move to** box, which works with a keyboard and on a phone. On a phone, the stages are tabs.
- **Applying fills in the date** and sets a reminder to follow up a week later. When they answer, that date is
  saved too, for the stats.
- **Closing a job asks why:** they said no, no reply, I withdrew, or I turned down the offer.
- **Search** every column at once, and a **weekly goal** ("3 of 5 applications this week").
- **Example jobs** to try everything with, removed in one press.

**Each job's page**
- **Details:** the advert link, location, working at the office, hybrid or remote, salary, where you found it,
  the contact person and their email, and notes.
- **Follow-up reminder** with quick dates (tomorrow, in 3 days, in a week), and **Email them**, which opens your
  email app with a polite follow-up already written (a thank-you after an interview).
- **Interviews:** day, time, phone, video, in person or an assessment, who you're meeting, where, and notes
  afterwards. **Add to my calendar** downloads it for your phone's calendar. Adding an interview moves the job to
  Interview.
- **Interview prep:** what you know about the company, a checklist and questions to practise with notes for your
  answers. Suggested checklist items and common interview questions can be added in one press, and a bar shows
  how ready you are.
- **CV and cover letter:** which versions you sent.
- **Its story:** when it moved from stage to stage, and how long they took to answer.

**Today**
- Follow-ups that are due (Done, Email them, or In 3 days), the week's interviews with how ready you are,
  applications that have **gone quiet** for two weeks, and follow-ups coming up. The Today tab shows a number when
  something needs you today.

**CVs and cover letters**
- Keep each version's name, a link to the file (Google Drive or OneDrive) and notes. Each shows how many
  applications it went with and how many led to an interview.

**Stats**
- Applications, how many heard back, how many reached an interview, and the average days to hear back.
- From applying to an offer, applications per week for 8 weeks, where you found the jobs that led to interviews,
  which CV or cover letter works best, and why jobs closed.
- **Download my jobs** as a spreadsheet (CSV).

**For everyone**
- **Private:** only you can see your jobs. **Delete everything** in Settings removes all of it.
- **Works offline**, with a badge showing Saved, Syncing or Offline, and syncs between devices.
- **Installable** ("Add to Home screen"), light and dark mode, and works on a phone and a laptop.

## Design
A job hunt kept in a good notebook: warm paper, dark ink and a deep "go" green for buttons and offers. Each stage
has its own colour (Saved slate, Applied blue, Interview violet, Offer green, Closed grey) on the edge of its cards,
coral marks follow-ups that are due, and red is for deleting. Text colours pass WCAG AA contrast in both themes.

## Tech stack
Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Firebase Authentication and Cloud Firestore,
Vitest, GitHub Actions, Vercel.

## Project structure
```
app/              Pages: the board (/), a job (/job?id=…), Today (/today), CVs (/documents), Stats (/stats),
                  Settings (/settings), the app manifest, icons and the light/dark script
components/       The sign-in screen, the header, the board and its cards, Add a job, the job page with its
                  interviews and prep, toasts, icons and the logo
lib/              The board's rules (jobs.ts), dates (dates.ts), reminders, follow-up emails and calendar files
                  (reminders.ts), interview prep (prep.ts), CVs and cover letters (documents.ts), stats (stats.ts),
                  the CSV file (csv.ts), reading data safely (read.ts), example jobs (samples.ts), the live store
                  (store.ts) and every change to the database (actions.ts)
tests/            Unit tests for everything in lib/ that doesn't need Firebase
firestore.rules   The security rules (paste them into Firebase)
```

## How the important parts work

**Stages** (`moveTo()` in `lib/jobs.ts`). Moving a job is one function that works out everything that changes: the
date you applied (the first time it reaches Applied or later), a follow-up reminder a week later, the day you
heard back (the first interview, offer or "no" after applying), clearing the automatic reminder once they answer,
and a new step in the job's story. Because it's one plain function, the tests check every move.

**Hearing back.** "No reply" doesn't count as hearing back, but "They said no" does, so the response rate is honest.
Closed jobs remember how far they got, so a job that had an interview and then closed still counts as an interview.

**Card order** (`orderAt()`). Each card has an order number. A card dropped between two others gets the number
halfway between theirs, so only the moved card is saved, not the whole column.

**Dates** (`lib/dates.ts`). Days are "2026-11-09" strings, worked out in UTC, so a date means the same day on every
phone whatever its time zone.

**Only what a form owns is saved** (`cleanEdits()`). The job page's forms send their changes through one function
that keeps only the fields they're allowed to change, trims text to its limit, makes links safe (only http and
https) and checks dates and emails. A form can never overwrite a job's stage, story or order by accident.

**Follow-up emails** (`lib/reminders.ts`). The email is written from the job (role, company, contact's first name,
the date you applied, your name) and opened with a `mailto:` link, so it goes from your own email app and
HireTrack never sends anything itself.

**CVs** (`lib/documents.ts`). HireTrack doesn't store files, only a name and a link to where you keep the file. That
keeps it free (file storage on Firebase needs a paid plan) and your CV stays where it already is.

**Live updates** (`lib/store.ts`). The app listens to your profile, jobs and documents. Changes show straight away,
even offline, and Firestore sends them when it can, so your laptop and phone stay in step.

## Security rules
`firestore.rules` runs on Google's servers and checks every read and write, whatever the app sends:
- everything is saved under your own account, and only you can read, change or delete it
- a job can only have HireTrack's fields, with the right types, a known stage, closing reason and way of working,
  and text no longer than the app allows
- links must start with http:// or https://, so a `javascript:` link can't be saved
- lists (interviews, checklist, questions, story) have a maximum length
- documents must be a CV or cover letter, with a name
- anything else is refused

## Tests
`npm test` runs the unit tests in `tests/` with Vitest: dates across months and years, moving jobs between stages
(applying, hearing back, reminders, closing reasons, offers), card order, search, cleaning what's typed (links,
emails, dates, interviews, empty items), the Today lists, follow-up emails, `mailto:` links and calendar files,
interview prep, CV usage, stats (rates, average wait, weeks, sources and the weekly goal), the CSV file (including
protection against spreadsheet formulas), reading broken data safely, and the example jobs.
GitHub runs them on every push (`.github/workflows/tests.yml`).

## Setup (run it yourself)
1. **Firebase:** create a project at [console.firebase.google.com](https://console.firebase.google.com).
   - Authentication → Get started → turn on **Email/Password** and **Google**.
   - Firestore Database → Create database (production mode).
   - Firestore Database → **Rules**: paste in `firestore.rules` and press **Publish**.
   - Project settings → General → Your apps → add a **Web app** to get its settings.
2. **Settings:** copy `.env.example` to `.env.local` and fill in the four values from step 1.
3. **Run it:** `npm install`, then `npm run dev`, and open http://localhost:3000.
4. **Deploy on Vercel:** import the GitHub repo, add the same four settings under
   Settings → Environment Variables, and deploy. Then, in Firebase, add the Vercel address under
   Authentication → Settings → **Authorized domains**, so Google sign-in works there.

## Environment variables
Names only; the values are in `.env.local` (never committed) and in Vercel.

| Name | What it is |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | The web app's API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | The Firebase project's ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | The web app's ID |

These are public by design: they say which Firebase project to use, they don't unlock anything. What protects
your jobs is `firestore.rules`.

## Known gaps
- **The security rules aren't in the automatic tests.** They'd need the Firebase emulator; they're tested by hand.
- **Reminders only show in the app.** There are no push notifications or emails, so you see them on the Today page
  (and the number on its tab) when you open HireTrack. Interviews can go into your phone's calendar, which does
  remind you.
- **No importing jobs** from LinkedIn or other sites; each job is added by hand (only the company and role are
  needed).
- **Files aren't stored.** CVs and cover letters are links to where you keep them.
- **Drag and drop is for a mouse.** On a phone and with a keyboard, cards move with the Move to box instead.
- **The rules can't check inside lists** (each interview or checklist item), only how long the lists are; the app
  cleans each item before saving.
- **English only.**

## Use of AI
I built HireTrack with Claude (by Anthropic) as my AI pair programmer:

1. **I chose what to build** from ideas we discussed, decided it's for my own job hunt first, and chose its
   features: follow-up reminders, interview prep, tracking which CV I sent, and stats.
2. **Claude wrote the code**, starting from my other Firebase apps' sign-in, offline saving and live updates,
   explained how it works, and made the app icons.
3. **I set up Firebase and Vercel, added the code to my project**, ran it, tested it on my laptop and phone,
   committed it and deployed it, and reported anything that broke or looked wrong so we could fix it.
