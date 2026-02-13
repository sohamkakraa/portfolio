"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const MODES = [
  {
    id: "light",
    label: "Light",
    Icon: Sun,
  },
  {
    id: "dark",
    label: "Dark",
    Icon: Moon,
  },
] as const;

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const selected = isClient ? (theme === "system" ? resolvedTheme ?? "light" : theme ?? "light") : "light";
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-1 shadow-[0_8px_24px_rgba(15,20,35,0.12)]"
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
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
              active
                ? "bg-[color:var(--inverse-bg)] text-[color:var(--inverse-fg)] shadow-[0_6px_16px_rgba(15,20,35,0.2)]"
                : "text-[color:var(--muted)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--foreground)]"
            }`}
          >
            <mode.Icon size={15} strokeWidth={2.1} />
            <span className="sr-only">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
