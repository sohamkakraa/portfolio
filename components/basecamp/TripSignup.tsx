"use client";

import Link from "next/link";
import { useId, useState } from "react";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

/** "I might come along" for one wishlist place. */
export default function TripSignup({ placeId, placeName }: { placeId: string; placeName: string }) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });

  if (state.kind === "sent") {
    return <p className="bc-sent">You&apos;re on the list for {placeName}. You&apos;ll hear from me when it&apos;s happening.</p>;
  }

  if (!open) {
    return (
      <button type="button" className="bc-link-btn" onClick={() => setOpen(true)}>
        I might come along
      </button>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/community/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId,
          email: form.get("email"),
          consent: form.get("consent") === "on",
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
      <label htmlFor={`${uid}-email`}>Your email</label>
      <input id={`${uid}-email`} name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" />
      <label className="bc-check" htmlFor={`${uid}-consent`}>
        <input id={`${uid}-consent`} name="consent" type="checkbox" required />
        <span>Email me about this trip. I can ask to be removed any time.</span>
      </label>
      <input className="bc-hp" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="bc-form-row">
        <button type="submit" className="bc-btn" disabled={state.kind === "sending"}>
          {state.kind === "sending" ? "Sending…" : "Count me in"}
        </button>
        <button type="button" className="bc-link-btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {state.kind === "error" ? <p className="bc-error" role="alert">{state.message}</p> : null}
      <p className="bc-fine">
        Only used for this trip, never shown on the site. <Link href="/privacy">Privacy</Link>
      </p>
    </form>
  );
}
