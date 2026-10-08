"use client";

import {
  ArrowLeft,
  BookOpen,
  FileText,
  LoaderCircle,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

type Note = {
  id: string;
  title: string;
  created_at: string;
  chunk_count: number;
};

type Source = {
  index: number;
  note_id: string;
  title: string;
  content: string;
  similarity: number;
};

type StudyMessage = {
  id: string;
  question: string;
  answer: string;
  sources: Source[];
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function StudyPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [messages, setMessages] = useState<StudyMessage[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [question, setQuestion] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadWorkspace() {
      try {
        const [notesResponse, chatResponse] = await Promise.all([
          fetch("/api/study/notes"),
          fetch("/api/study/chat"),
        ]);
        const [notesPayload, chatPayload] = await Promise.all([
          notesResponse.json(),
          chatResponse.json(),
        ]);
        if (!notesResponse.ok) {
          throw new Error(notesPayload.error || "Could not load your notes.");
        }
        if (!chatResponse.ok) {
          throw new Error(chatPayload.error || "Could not load your study history.");
        }
        if (!cancelled) {
          setNotes(notesPayload.notes);
          setMessages(chatPayload.messages);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load your study workspace."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, []);

  async function importTextFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!/\.(txt|md|markdown)$/i.test(file.name)) {
      setError("For now, import a plain text or Markdown file.");
      event.target.value = "";
      return;
    }
    try {
      setContent(await file.text());
      setTitle((current) => current || file.name.replace(/\.[^.]+$/, ""));
      setError("");
    } catch {
      setError("Could not read that file.");
    }
    event.target.value = "";
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/study/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Could not save this note.");
      }
      setNotes((current) => [payload.note, ...current]);
      setTitle("");
      setContent("");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save this note."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(note: Note) {
    if (!window.confirm("Delete “" + note.title + "” and its indexed passages?")) {
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/study/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Could not delete this note.");
      }
      setNotes((current) => current.filter((item) => item.id !== note.id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete this note."
      );
    }
  }

  async function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const asked = question.trim();
    if (!asked || asking) {
      return;
    }
    setAsking(true);
    setPendingQuestion(asked);
    setQuestion("");
    setError("");
    try {
      const response = await fetch("/api/study/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: asked }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Could not answer this question.");
      }
      if (payload.message) {
        setMessages((current) => [...current, payload.message]);
      } else {
        setMessages((current) => [
          ...current,
          {
            id: "unmatched-" + Date.now(),
            question: asked,
            answer: payload.answer,
            sources: payload.sources || [],
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (askError) {
      setQuestion(asked);
      setError(
        askError instanceof Error ? askError.message : "Could not answer this question."
      );
    } finally {
      setPendingQuestion("");
      setAsking(false);
    }
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              aria-label="Return to chat"
              className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground"
              href="/"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                StudyMate AI
              </p>
              <h1 className="text-xl font-semibold tracking-tight">Study workspace</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:flex">
            <Sparkles className="size-3.5 text-primary" />
            Answers grounded in your notes
          </div>
        </header>

        {error ? (
          <div
            aria-live="polite"
            className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.18fr)]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Your library</p>
                  <h2 className="mt-1 text-lg font-semibold">Add course notes</h2>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </div>
              </div>

              <form className="space-y-4" onSubmit={saveNote}>
                <label className="block space-y-2 text-sm font-medium">
                  Note title
                  <input
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    maxLength={160}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Database systems — indexing"
                    required
                    value={title}
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium">
                  Note content
                  <textarea
                    className="min-h-44 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    maxLength={50_000}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Paste your lecture notes, textbook excerpts, or your own summary…"
                    required
                    value={content}
                  />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                    <Upload className="size-3.5" />
                    Import .txt or .md
                    <input
                      accept=".txt,.md,.markdown,text/plain,text/markdown"
                      className="sr-only"
                      onChange={importTextFile}
                      type="file"
                    />
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {content.length.toLocaleString()} / 50,000 characters
                  </span>
                </div>
                <button
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={saving || !title.trim() || !content.trim()}
                  type="submit"
                >
                  {saving ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {saving ? "Indexing note…" : "Save to library"}
                </button>
              </form>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Notes are split into passages and indexed for semantic search. The first version reads pasted text and Markdown files.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Saved notes</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {notes.length} {notes.length === 1 ? "note" : "notes"} in your library
                  </p>
                </div>
                <BookOpen className="size-4 text-muted-foreground" />
              </div>
              {loading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  Loading your library…
                </div>
              ) : notes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
                  <FileText className="mx-auto size-5 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">Your library is ready</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Add one note above, then ask a question about it.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {notes.map((note) => (
                    <li
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-3"
                      key={note.id}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{note.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(note.created_at)} · {note.chunk_count} passages
                        </p>
                      </div>
                      <button
                        aria-label={"Delete " + note.title}
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => void deleteNote(note)}
                        type="button"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="flex min-h-[700px] flex-col rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MessageCircle className="size-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Ask your library</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Responses include the passages they came from
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                {messages.length} saved
              </span>
            </div>

            <div
              aria-live="polite"
              className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6"
            >
              {messages.length === 0 && !pendingQuestion ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="size-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">Turn notes into understanding</h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    Ask a question. StudyMate searches your notes, builds an answer from the most relevant passages, and shows its sources.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {[
                      "Explain the key idea in my notes",
                      "Compare the concepts I saved",
                      "What should I review before an exam?",
                    ].map((suggestion) => (
                      <button
                        className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        key={suggestion}
                        onClick={() => setQuestion(suggestion)}
                        type="button"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <article className="space-y-3" key={message.id}>
                    <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground">
                      {message.question}
                    </div>
                    <div className="max-w-[95%] rounded-2xl rounded-bl-md bg-muted/70 px-4 py-3 text-sm leading-6">
                      <p className="whitespace-pre-wrap">{message.answer}</p>
                      {message.sources?.length ? (
                        <div className="mt-4 border-t border-border/70 pt-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Sources
                          </p>
                          <ul className="space-y-2">
                            {message.sources.map((source) => (
                              <li
                                className="rounded-xl border border-border/70 bg-background/80 px-3 py-2"
                                key={source.index + "-" + source.note_id}
                              >
                                <p className="text-xs font-semibold">
                                  [{source.index}] {source.title}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  {source.content.length > 300
                                    ? source.content.slice(0, 300) + "…"
                                    : source.content}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
              {pendingQuestion ? (
                <article className="space-y-3">
                  <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground">
                    {pendingQuestion}
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-muted/70 px-4 py-3 text-sm text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" />
                    Searching notes and composing an answer…
                  </div>
                </article>
              ) : null}
            </div>

            <form className="border-t border-border p-4 sm:p-5" onSubmit={askQuestion}>
              <label className="sr-only" htmlFor="study-question">
                Ask a question about your notes
              </label>
              <div className="flex items-end gap-2 rounded-2xl border border-input bg-background p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <textarea
                  className="max-h-36 min-h-11 flex-1 resize-y bg-transparent px-2 py-3 text-sm leading-5 outline-none placeholder:text-muted-foreground"
                  id="study-question"
                  maxLength={2000}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask something from your notes…"
                  value={question}
                />
                <button
                  aria-label="Send question"
                  className="mb-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={asking || !question.trim()}
                  type="submit"
                >
                  {asking ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Keep AI answers tied to sources; verify important details in your original notes.
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
