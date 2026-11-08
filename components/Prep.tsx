"use client";

import { useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import { updateJob } from "@/lib/actions";
import { itemId, LIMITS } from "@/lib/jobs";
import { prepProgress, withCommonQuestions, withSuggestedChecklist } from "@/lib/prep";
import type { Job, PrepQuestion } from "@/lib/types";

/*
  Interview prep for one job:
  - what you've found out about the company
  - a checklist (with suggestions to add in one press)
  - questions to practise, each with notes for your answer (common questions in one press)
  A bar shows how ready you are. Ticks save straight away; text saves when you leave the box.
*/
export default function Prep({ job }: { job: Job }) {
  const progress = prepProgress(job);
  const [research, setResearch] = useState(job.research);
  const [newItem, setNewItem] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  function addItem(e: FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    updateJob(job, { checklist: [...job.checklist, { id: itemId(), text: newItem, done: false }] });
    setNewItem("");
  }
  function addQuestion(e: FormEvent) {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    const id = itemId();
    updateJob(job, { questions: [...job.questions, { id, question: newQuestion, answer: "" }] });
    setNewQuestion("");
    setOpen(id);
  }
  const setAnswer = (q: PrepQuestion, answer: string) => {
    if (answer !== q.answer) updateJob(job, { questions: job.questions.map((x) => (x.id === q.id ? { ...x, answer } : x)) });
  };

  return (
    <section className="panel" aria-labelledby="prep">
      <h2 id="prep" className="flex items-center gap-2 text-lg font-extrabold">
        <Icon name="list" className="h-5 w-5 text-interview" />
        Interview prep
      </h2>
      {progress.total > 0 && (
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label="How ready you are">
            <span className="block h-full rounded-full bg-interview" style={{ width: `${progress.percent}%` }} />
          </span>
          <span className="font-semibold tabular-nums">
            {progress.done} of {progress.total} ready
          </span>
        </div>
      )}

      <label className="mt-4 block text-sm font-semibold">
        About the company
        <textarea
          value={research}
          onChange={(e) => setResearch(e.target.value)}
          onBlur={() => research !== job.research && updateJob(job, { research })}
          maxLength={LIMITS.research}
          rows={3}
          placeholder="What they do, who their customers are, recent news, why you'd like to work there"
          className="field mt-1 font-normal"
        />
      </label>

      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold">Checklist</h3>
          <button type="button" onClick={() => updateJob(job, { checklist: withSuggestedChecklist(job.checklist) })} className="ml-auto text-sm font-semibold text-brand hover:underline">
            Add suggestions
          </button>
        </div>
        <ul className="mt-2 space-y-1">
          {job.checklist.map((item) => (
            <li key={item.id} className="group flex items-center gap-2">
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-page">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(e) => updateJob(job, { checklist: job.checklist.map((x) => (x.id === item.id ? { ...x, done: e.target.checked } : x)) })}
                  className="h-4 w-4 shrink-0 accent-[var(--color-interview)]"
                />
                <span className={item.done ? "text-ink-soft line-through" : ""}>{item.text}</span>
              </label>
              <button type="button" onClick={() => updateJob(job, { checklist: job.checklist.filter((x) => x.id !== item.id) })} className="tool h-8 min-w-8" aria-label={`Remove "${item.text}"`}>
                <Icon name="close" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        {job.checklist.length < LIMITS.checklist && (
          <form onSubmit={addItem} className="mt-2 flex gap-2">
            <label className="flex-1">
              <span className="sr-only">New checklist item</span>
              <input value={newItem} onChange={(e) => setNewItem(e.target.value)} maxLength={LIMITS.short} placeholder="Add to the checklist" className="field py-2" />
            </label>
            <button type="submit" className="btn-quiet px-3" aria-label="Add to the checklist">
              <Icon name="plus" className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold">Questions to practise</h3>
          <button type="button" onClick={() => updateJob(job, { questions: withCommonQuestions(job.questions) })} className="ml-auto text-sm font-semibold text-brand hover:underline">
            Add common questions
          </button>
        </div>
        <ul className="mt-2 space-y-2">
          {job.questions.map((q) => (
            <li key={q.id} className="rounded-xl border border-line">
              <div className="flex items-center gap-2 p-2">
                <button type="button" onClick={() => setOpen(open === q.id ? null : q.id)} aria-expanded={open === q.id} className="flex flex-1 items-center gap-2 text-left text-sm font-semibold">
                  <Icon name={q.answer.trim() ? "check" : "down"} className={`h-4 w-4 shrink-0 ${q.answer.trim() ? "text-brand" : "text-ink-soft"}`} />
                  {q.question}
                </button>
                <button type="button" onClick={() => updateJob(job, { questions: job.questions.filter((x) => x.id !== q.id) })} className="tool h-8 min-w-8" aria-label={`Remove "${q.question}"`}>
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </div>
              {open === q.id && (
                <label className="block px-2 pb-2">
                  <span className="sr-only">My answer to: {q.question}</span>
                  <textarea defaultValue={q.answer} onBlur={(e) => setAnswer(q, e.target.value)} maxLength={LIMITS.answer} rows={4} placeholder="Notes for your answer. Try: the situation, what you did, and what happened." className="field text-sm" />
                </label>
              )}
            </li>
          ))}
        </ul>
        {job.questions.length < LIMITS.questions && (
          <form onSubmit={addQuestion} className="mt-2 flex gap-2">
            <label className="flex-1">
              <span className="sr-only">New question</span>
              <input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} maxLength={LIMITS.short} placeholder="Add a question" className="field py-2" />
            </label>
            <button type="submit" className="btn-quiet px-3" aria-label="Add the question">
              <Icon name="plus" className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
