"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const MODES = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
] as const;

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const selected = isClient
    ? theme === "system"
      ? resolvedTheme ?? "dark"
      : theme ?? "dark"
    : "dark";

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-1"
      role="group"
      aria-label="Display preference"
    >
      {MODES.map((mode) => {
        const active = selected === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => setTheme(mode.id)}
            title={mode.label}
            aria-label={mode.label}
            aria-pressed={active}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-all ${
              active
                ? "bg-[color:var(--fg)] text-[color:var(--bg)]"
                : "text-[color:var(--fg-muted)] hover:text-[color:var(--fg)]"
            }`}
          >
            <mode.Icon size={14} strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
