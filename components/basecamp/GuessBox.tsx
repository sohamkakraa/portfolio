"use client";

import { useId, useState } from "react";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

/** "What do you think the answer is?" under one open question. Collapsed until asked for. */
export default function GuessBox({ questionId }: { questionId: string }) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });

  if (state.kind === "sent") {
    return <p className="bc-sent">Got it, thank you. I read every guess before it shows up here.</p>;
  }

  if (!open) {
    return (
      <button type="button" className="bc-link-btn" onClick={() => setOpen(true)}>
        Send your guess
      </button>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/community/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          text: form.get("text"),
          name: form.get("name"),
          website: form.get("website"),
        }),
      });
      if (res.ok) return setState({ kind: "sent" });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setState({ kind: "error", message: body.error ?? "That didn't send. Try again." });
    } catch {
      setState({ kind: "error", message: "That didn't send. Check your connection and try again." });
    }
  }

  return (
    <form className="bc-form" onSubmit={submit}>
      <label htmlFor={`${uid}-text`}>What do you think the answer is?</label>
      <textarea id={`${uid}-text`} name="text" rows={3} maxLength={600} required minLength={3} placeholder="My guess is…" />
      <label htmlFor={`${uid}-name`}>Your name (optional)</label>
      <input id={`${uid}-name`} name="name" type="text" maxLength={40} autoComplete="given-name" placeholder="Anonymous" />
      <input className="bc-hp" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="bc-form-row">
        <button type="submit" className="bc-btn" disabled={state.kind === "sending"}>
          {state.kind === "sending" ? "Sending…" : "Send my guess"}
        </button>
        <button type="button" className="bc-link-btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {state.kind === "error" ? <p className="bc-error" role="alert">{state.message}</p> : null}
      <p className="bc-fine">Your guess and name appear here once I&apos;ve read them. Nothing else is stored.</p>
    </form>
  );
}
