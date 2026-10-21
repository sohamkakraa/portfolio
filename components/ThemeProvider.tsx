"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * The site follows the visitor's system setting and offers no toggle. A fresh storage key means a
 * choice saved by the old toggle cannot pin someone to one theme forever.
 */
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="sk-theme-system"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
