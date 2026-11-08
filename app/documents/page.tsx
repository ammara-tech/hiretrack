"use client";

import { useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import { addDoc, deleteDocument, updateDocument } from "@/lib/actions";
import { DOC_LIMITS, docsOfKind, docUsage, kindName, usageText } from "@/lib/documents";
import { useApp } from "@/lib/store";
import type { Doc, DocKind } from "@/lib/types";

/*
  /documents: your CV versions and cover letters.
  HireTrack keeps each one's name, a link to where the file lives (Google Drive, OneDrive…)
  and notes, not the file itself. On each job you choose which you sent, and this page shows
  how many applications each went with and how many led to an interview.
*/

type Fields = Pick<Doc, "kind" | "name" | "link" | "notes">;
const blank = (kind: DocKind): Fields => ({ kind, name: "", link: "", notes: "" });

export default function DocumentsPage() {
  const { docs, jobs } = useApp();
  const use = docUsage(docs, jobs);
  const [form, setForm] = useState<{ editing: Doc | null; f: Fields } | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form || !form.f.name.trim()) return;
    if (form.editing) updateDocument(form.editing, form.f);
    else addDoc(form.f);
    setForm(null);
  }

  const box = "field mt-1 font-normal";
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight">CVs and cover letters</h1>
      <p className="mt-1 text-ink-soft">Keep track of each version you send, and see which one gets you more interviews.</p>

      {!form && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => setForm({ editing: null, f: blank("cv") })} className="btn">
            <Icon name="plus" className="h-4 w-4" />
            Add a CV
          </button>
          <button type="button" onClick={() => setForm({ editing: null, f: blank("cover") })} className="btn-quiet">
            <Icon name="plus" className="h-4 w-4" />
            Add a cover letter
          </button>
        </div>
      )}

      {form && (
        <form onSubmit={submit} className="panel mt-6 space-y-4">
          <h2 className="text-lg font-extrabold">{form.editing ? `Edit ${form.editing.name}` : `Add a ${kindName(form.f.kind).toLowerCase()}`}</h2>
          <fieldset>
            <legend className="text-sm font-semibold">It&apos;s a</legend>
            <div className="mt-2 flex gap-2">
              {(["cv", "cover"] as const).map((k) => (
                <label key={k} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold ${form.f.kind === k ? "border-brand bg-brand-soft text-brand" : "border-line"}`}>
                  <input type="radio" name="kind" className="sr-only" checked={form.f.kind === k} onChange={() => setForm({ ...form, f: { ...form.f, kind: k } })} />
                  {kindName(k)}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-semibold">
            Name
            <input value={form.f.name} onChange={(e) => setForm({ ...form, f: { ...form.f, name: e.target.value } })} required maxLength={DOC_LIMITS.name} placeholder={form.f.kind === "cv" ? "e.g. CV: web developer, November" : "e.g. Cover letter: graduate roles"} className={box} />
          </label>
          <label className="block text-sm font-semibold">
            Link to the file (optional)
            <input type="url" inputMode="url" value={form.f.link} onChange={(e) => setForm({ ...form, f: { ...form.f, link: e.target.value } })} maxLength={DOC_LIMITS.link} placeholder="A Google Drive or OneDrive link" className={box} />
          </label>
          <label className="block text-sm font-semibold">
            Notes (optional)
            <textarea value={form.f.notes} onChange={(e) => setForm({ ...form, f: { ...form.f, notes: e.target.value } })} maxLength={DOC_LIMITS.notes} rows={2} placeholder="What's different about this version" className={box} />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn">
              <Icon name="check" className="h-4 w-4" />
              {form.editing ? "Save" : "Add"}
            </button>
            <button type="button" onClick={() => setForm(null)} className="btn-quiet">
              Cancel
            </button>
          </div>
        </form>
      )}

      {(["cv", "cover"] as const).map((kind) => {
        const list = docsOfKind(docs, kind);
        return (
          <section key={kind} className="mt-8" aria-labelledby={`docs-${kind}`}>
            <h2 id={`docs-${kind}`} className="text-xl font-extrabold">
              {kind === "cv" ? "CVs" : "Cover letters"}
            </h2>
            {list.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">{kind === "cv" ? "No CVs yet. Add each version you send out, like one for developer roles and one for support roles." : "No cover letters yet."}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {list.map((d) => {
                  const u = use[d.id];
                  return (
                    <li key={d.id} className="panel flex flex-wrap items-start gap-3 p-4">
                      <Icon name="file" className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{d.name}</p>
                        <p className="text-sm text-ink-soft">{usageText(u)}</p>
                        {u && u.sent > 0 && (
                          <span className="mt-2 block h-1.5 max-w-xs overflow-hidden rounded-full bg-line" aria-hidden="true">
                            <span className="block h-full rounded-full bg-interview" style={{ width: `${u.rate ?? 0}%` }} />
                          </span>
                        )}
                        {d.notes && <p className="mt-1 text-sm">{d.notes}</p>}
                      </div>
                      <div className="flex gap-1">
                        {d.link && (
                          <a href={d.link} target="_blank" rel="noopener noreferrer" className="tool" aria-label={`Open ${d.name}`} title="Open the file">
                            <Icon name="external" />
                          </a>
                        )}
                        <button type="button" onClick={() => setForm({ editing: d, f: { kind: d.kind, name: d.name, link: d.link, notes: d.notes } })} className="tool" aria-label={`Edit ${d.name}`}>
                          <Icon name="pencil" />
                        </button>
                        <button type="button" onClick={() => deleteDocument(d)} className="tool hover:!text-alert" aria-label={`Delete ${d.name}`}>
                          <Icon name="trash" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      <p className="mt-10 text-sm text-ink-soft">
        HireTrack doesn&apos;t store the files themselves, so your CV stays where you keep it. Deleting one here takes it off the jobs it was sent with, but not the file.
      </p>
    </div>
  );
}
