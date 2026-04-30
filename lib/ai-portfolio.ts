import type { PortfolioData, ProjectItem, PhotographyCategory, LifeBook, LifePlace, LifeSnapshot, LifeEntertainment, HighlightItem } from "@/lib/portfolio-types";

// ── Types ────────────────────────────────────────────────────────────────────

export type AIPatchOperation =
  | { type: "set"; path: string; value: unknown }
  | { type: "append"; path: string; value: unknown }
  | { type: "remove"; path: string; match: Record<string, unknown> }
  | { type: "update"; path: string; match: Record<string, unknown>; value: Record<string, unknown> };

export interface AIResponse {
  operations: AIPatchOperation[];
  summary: string;
  confirmRequired?: boolean;
  confirmMessage?: string;
}

// ── Rate limiter (per-user, in-memory) ───────────────────────────────────────

interface RateBucket { count: number; resetAt: number }
const aiRateStore = new Map<string, RateBucket>();
const AI_MAX_PER_HOUR = 20;
const AI_WINDOW_MS = 60 * 60 * 1000;

export function checkAIRateLimit(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = aiRateStore.get(key);
  if (!bucket || bucket.resetAt <= now) {
    aiRateStore.set(key, { count: 1, resetAt: now + AI_WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (bucket.count >= AI_MAX_PER_HOUR) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count++;
  return { allowed: true, retryAfterMs: 0 };
}

// ── System prompt ─────────────────────────────────────────────────────────────

export function buildSystemPrompt(currentData: PortfolioData): string {
  return `You are an AI assistant managing the portfolio CMS for ${currentData.site.name}. You receive natural-language instructions and return a structured JSON response describing the data changes to make.

## PortfolioData schema

\`\`\`typescript
type PortfolioData = {
  site: { name: string; role: string; location: string; email: string; nav: NavItem[]; socials: SocialLink[] };
  hero: { eyebrow: string; titleLine1: string; titleLine2: string; subtitle: string;
          ctaPrimary: { label: string; href: string }; ctaSecondary: { label: string; href: string };
          badges: string[]; showVivekaCta?: boolean; vivekaCta?: { label: string; href: string } };
  about: { title: string; subtitle: string; body: string; highlights: string[]; portraitSrc?: string };
  highlights: { title: string; description: string; items: Array<{ title: string; description: string }> };
  projects: { title: string; description: string; items: ProjectItem[] };
  photography: { title: string; description: string; categories: PhotographyCategory[] };
  life: { eyebrow: string; title: string; snapshots: LifeSnapshot[]; books: LifeBook[];
          places: LifePlace[]; entertainment: LifeEntertainment[] };
  contact: { title: string; description: string; ctaLabel: string; email: string };
  footer: { note: string; links: SocialLink[] };
};

type ProjectItem   = { id: string; title: string; summary: string; tags: string[]; year: string; status?: string; link?: string };
type PhotographyCategory = { slug: string; title: string; description: string; accent: string; hidden?: boolean; images: PhotoItem[] };
type PhotoItem     = { id: string; src: string; title: string; description: string; meta?: PhotoMeta; hidden?: boolean };
type LifeBook      = { title: string; author: string; theme: string; palette: string; coverSrc?: string; isbn?: string };
type LifePlace     = { place: string; context: string; note: string };
type LifeSnapshot  = { title: string; note: string; detail: string };
type LifeEntertainment = { title: string; kind: "film"|"music"|"show"; picks: string[] };
\`\`\`

## Current data state

\`\`\`json
${JSON.stringify(currentData, null, 2)}
\`\`\`

## Response format

Always respond with ONLY valid JSON matching this exact shape — no markdown fences, no commentary outside the JSON:

\`\`\`
{
  "operations": [ ...patch operations... ],
  "summary": "Plain-English description of what changed",
  "confirmRequired": false,
  "confirmMessage": ""
}
\`\`\`

Set \`confirmRequired: true\` and fill \`confirmMessage\` when the instruction involves removing or clearing data (e.g. "remove project X", "clear all books"). The caller will ask the user to confirm before applying.

## Patch operation types

### set — overwrite a scalar or object at a path
\`{ "type": "set", "path": "hero.subtitle", "value": "New subtitle text" }\`
\`{ "type": "set", "path": "site.name", "value": "Jane Doe" }\`

### append — push an item onto an array
\`{ "type": "append", "path": "projects.items", "value": { "id": "<uuid>", "title": "...", ... } }\`
\`{ "type": "append", "path": "life.books", "value": { "title": "...", "author": "...", "theme": "...", "palette": "from-slate-600/50 via-slate-500/30 to-zinc-600/50" } }\`

### remove — delete item(s) from an array where all match fields equal
\`{ "type": "remove", "path": "projects.items", "match": { "title": "TabScape" } }\`
\`{ "type": "remove", "path": "life.books", "match": { "title": "Deep Work" } }\`

### update — patch fields on matching array item(s)
\`{ "type": "update", "path": "projects.items", "match": { "title": "Viveka" }, "value": { "status": "Live", "link": "https://viveka.sohamkakra.com" } }\`

## Rules

1. Generate UUIDs for all new \`id\` fields using the placeholder \`"__uuid__"\` — the server replaces them.
2. Photography category slugs: lowercase, hyphens only (e.g. "street-photography").
3. Accent colors must be hex (e.g. "#818cf8").
4. Book palettes: Tailwind gradient class string like \`"from-indigo-600/50 via-blue-500/30 to-cyan-600/50"\`.
5. Never invent data the user didn't provide; use empty strings for unspecified required fields.
6. Keep the \`images\` array for new photography categories as \`[]\`.
7. Year values are strings: "2025" not 2025.
8. Only operate on the data in the schema — no other keys.
9. Prefer \`update\` over a remove+append pair when editing an existing item.
10. When a user mentions "project", "book", "place", "category" — infer the correct array path.`;
}

// ── Patch applier ─────────────────────────────────────────────────────────────

function getNestedArray(obj: Record<string, unknown>, path: string): unknown[] | null {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[part];
  }
  return Array.isArray(cur) ? cur : null;
}

function setNested(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (cur[part] == null || typeof cur[part] !== "object") cur[part] = {};
    cur = cur[part] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
}

function itemMatches(item: unknown, match: Record<string, unknown>): boolean {
  if (item == null || typeof item !== "object") return false;
  const rec = item as Record<string, unknown>;
  return Object.entries(match).every(([k, v]) => rec[k] === v);
}

function replaceUUIDs(value: unknown): unknown {
  if (typeof value === "string") {
    return value === "__uuid__" ? crypto.randomUUID() : value;
  }
  if (Array.isArray(value)) return value.map(replaceUUIDs);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, replaceUUIDs(v)])
    );
  }
  return value;
}

export function applyPatch(data: PortfolioData, operations: AIPatchOperation[]): PortfolioData {
  const result = structuredClone(data) as unknown as Record<string, unknown>;

  for (const op of operations) {
    switch (op.type) {
      case "set": {
        setNested(result, op.path, replaceUUIDs(op.value));
        break;
      }

      case "append": {
        const arr = getNestedArray(result, op.path);
        if (arr) {
          arr.push(replaceUUIDs(op.value));
        }
        break;
      }

      case "remove": {
        const arr = getNestedArray(result, op.path);
        if (arr) {
          const before = arr.length;
          arr.splice(0, arr.length, ...arr.filter((item) => !itemMatches(item, op.match)));
          if (arr.length === before) {
            console.warn("[ai-portfolio] remove: no items matched", op.match);
          }
        }
        break;
      }

      case "update": {
        const arr = getNestedArray(result, op.path);
        if (arr) {
          let matched = false;
          for (let i = 0; i < arr.length; i++) {
            if (itemMatches(arr[i], op.match)) {
              const patched = replaceUUIDs(op.value);
              arr[i] = { ...(arr[i] as Record<string, unknown>), ...(patched as Record<string, unknown>) };
              matched = true;
            }
          }
          if (!matched) {
            console.warn("[ai-portfolio] update: no items matched", op.match);
          }
        }
        break;
      }
    }
  }

  return result as unknown as PortfolioData;
}

// ── Lightweight schema validator ──────────────────────────────────────────────

export function validatePortfolioData(data: unknown): data is PortfolioData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.site === "object" &&
    typeof d.hero === "object" &&
    typeof d.about === "object" &&
    typeof d.highlights === "object" &&
    typeof d.projects === "object" &&
    typeof d.photography === "object" &&
    typeof d.life === "object" &&
    typeof d.contact === "object" &&
    typeof d.footer === "object" &&
    Array.isArray((d.projects as Record<string, unknown>).items) &&
    Array.isArray((d.photography as Record<string, unknown>).categories)
  );
}
