"use client";

import { useRef, useState } from "react";
import { Bot, ChevronRight, Loader2, Send, Undo2 } from "lucide-react";
import type { PortfolioData } from "@/lib/portfolio-types";
import type { AIPatchOperation } from "@/lib/ai-portfolio";

interface Message {
  role: "user" | "assistant";
  content: string;
  summary?: string;
  error?: boolean;
  pendingConfirm?: {
    message: string;
    operations: AIPatchOperation[];
    confirmedData?: PortfolioData;
  };
}

const QUICK_ACTIONS = [
  "Add a new project",
  "Update my bio",
  "Add a book I'm reading",
  "Change hero subtitle",
  "Add a place I've visited",
  "Hide a photography category",
];

interface AIChatPanelProps {
  data: PortfolioData;
  csrfToken: string;
  onDataChange: (next: PortfolioData) => void;
}

export default function AIChatPanel({ data, csrfToken, onDataChange }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PortfolioData[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const pushHistory = (prev: PortfolioData) => {
    setHistory((h) => [...h.slice(-9), prev]);
  };

  const handleUndo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1]!;
      onDataChange(prev);
      return h.slice(0, -1);
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ message: text.trim(), currentData: data }),
      });

      const body = await res.json() as {
        updatedData?: PortfolioData;
        summary?: string;
        confirmRequired?: boolean;
        confirmMessage?: string;
        operations?: AIPatchOperation[];
        error?: string;
        retryAfterMs?: number;
      };

      if (!res.ok) {
        const errText = res.status === 429
          ? `Rate limit reached. Try again in ${Math.ceil((body.retryAfterMs ?? 60000) / 60000)} min.`
          : body.error ?? "Something went wrong.";
        setMessages((m) => [...m, { role: "assistant", content: errText, error: true }]);
      } else if (body.confirmRequired) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: body.summary ?? "Confirm this action?",
            pendingConfirm: {
              message: body.confirmMessage ?? "",
              operations: body.operations ?? [],
            },
          },
        ]);
      } else if (body.updatedData) {
        pushHistory(data);
        onDataChange(body.updatedData);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: body.summary ?? "Done.", summary: body.summary },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Network error — please try again.", error: true },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const confirmAction = async (msgIdx: number) => {
    const msg = messages[msgIdx];
    if (!msg?.pendingConfirm) return;

    // Apply the pending operations client-side via a second AI call with confirmed flag
    // Instead, ask the API again with a "confirmed: true" flag by re-sending with the operations
    setLoading(true);
    try {
      const res = await fetch("/api/ai/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ operations: msg.pendingConfirm.operations, currentData: data }),
      });

      const body = await res.json() as { updatedData?: PortfolioData; summary?: string; error?: string };
      if (res.ok && body.updatedData) {
        pushHistory(data);
        onDataChange(body.updatedData);
        setMessages((m) =>
          m.map((m2, i) =>
            i === msgIdx
              ? { ...m2, pendingConfirm: undefined, content: m2.content + " ✓ Applied." }
              : m2
          )
        );
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: body.error ?? "Failed to apply changes.", error: true },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Network error confirming action.", error: true },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const cancelConfirm = (msgIdx: number) => {
    setMessages((m) =>
      m.map((m2, i) =>
        i === msgIdx
          ? { ...m2, pendingConfirm: undefined, content: m2.content + " ✗ Cancelled." }
          : m2
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--accent)]/10">
            <Bot size={16} className="text-[color:var(--accent)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[color:var(--fg)]">AI Assistant</p>
            <p className="text-[11px] text-[color:var(--fg-muted)]">Natural language portfolio editor</p>
          </div>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[color:var(--fg-muted)] hover:bg-[color:var(--bg)] hover:text-[color:var(--fg)] transition"
          >
            <Undo2 size={13} />
            Undo
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
              <Bot size={24} className="text-[color:var(--accent)]" />
            </div>
            <p className="mb-1 text-sm font-medium text-[color:var(--fg)]">What would you like to update?</p>
            <p className="mb-6 text-xs text-[color:var(--fg-muted)]">
              Describe a change in plain English and I&apos;ll apply it.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => void sendMessage(action)}
                  className="flex items-center gap-1 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium text-[color:var(--fg-muted)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] transition"
                >
                  <ChevronRight size={11} />
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "assistant" && (
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)]/10">
                <Bot size={12} className="text-[color:var(--accent)]" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-[color:var(--accent)] text-white"
                  : msg.error
                  ? "border border-red-500/20 bg-red-500/10 text-red-400"
                  : "bg-[color:var(--bg)] text-[color:var(--fg)]"
              }`}
            >
              <p className="leading-relaxed">{msg.content}</p>
              {msg.pendingConfirm && (
                <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="mb-2 text-xs font-medium text-amber-400">{msg.pendingConfirm.message}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => confirmAction(i)}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400 transition"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelConfirm(i)}
                      className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium text-[color:var(--fg-muted)] hover:text-[color:var(--fg)] transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)]/10">
              <Bot size={12} className="text-[color:var(--accent)]" />
            </div>
            <div className="rounded-2xl bg-[color:var(--bg)] px-4 py-3">
              <Loader2 size={14} className="animate-spin text-[color:var(--fg-muted)]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[color:var(--border)] p-4">
        <div className="flex items-end gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg)] px-4 py-3 focus-within:border-[color:var(--accent)] transition">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Add a new project called Viveka with tags AI and React, year 2025…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-[color:var(--fg)] placeholder:text-[color:var(--fg-muted)] outline-none"
            style={{ maxHeight: "120px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
          />
          <button
            type="button"
            onClick={() => void sendMessage(input)}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent)] text-white transition hover:opacity-80 disabled:opacity-40"
          >
            <Send size={13} />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-[color:var(--fg-muted)]">
          Enter to send · Shift+Enter for new line · Changes apply instantly (undo available)
        </p>
      </div>
    </div>
  );
}
