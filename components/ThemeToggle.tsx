"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

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
  const dark = selected === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Toggle theme"
      title={dark ? "Switch to light" : "Switch to dark"}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "1px solid var(--line-2)",
        color: "var(--ink-2)",
        fontSize: 13,
        background: "transparent",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {dark ? "◐" : "◑"}
    </button>
  );
}
