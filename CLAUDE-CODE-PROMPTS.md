# Claude Code Prompts for Portfolio Features

Use these prompts in Claude Code (one per session) to implement each feature. They are self-contained and reference actual file paths, types, and architecture in this codebase.

---

## Prompt 1: Frontend Design Audit & Fixes

```
I need a thorough frontend design audit of my Next.js portfolio site. The codebase is a monorepo with:
- Main app: root (`/`) — Next.js 16, React 19, Tailwind CSS v4 (`@import "tailwindcss"` syntax)
- Photography app: `apps/photography/` — separate Next.js 15 app for photography.sohamkakra.com

CRITICAL Tailwind v4 rule: All CSS resets MUST be inside `@layer base {}`. Unlayered CSS overrides all `@layer`-based utilities in Tailwind v4, so never write bare reset selectors.

Audit checklist — go through every component file and check:

1. **Responsiveness**: Test all breakpoints (320px, 375px, 768px, 1024px, 1440px). Key files:
   - `components/PortfolioPage.tsx` — hero clamp `text-[clamp(2rem,7vw,5.5rem)]`, badge grid, highlight cards, about section split, book grid
   - `components/PhotographySection.tsx` — category pills overflow-x-auto, photo grid columns, lightbox safe-area insets
   - `components/Nav.tsx` — hamburger 44px touch target, mobile overlay with safe-area
   - `components/Footer.tsx` — social icons 44px touch target
   - `components/ProjectGrid.tsx` — card gaps, tag pills wrapping
   - `apps/photography/components/CategoryGallery.tsx` — masonry grid, hero min-height
   - `apps/photography/app/page.tsx` — chapter cards, hero video section

2. **Color/contrast issues**: The design system uses CSS variables defined in `app/globals.css`:
   - `--fg`, `--fg-muted`, `--fg-subtle` for text
   - `--bg`, `--bg-surface` for backgrounds
   - `--border`, `--border-hover` for borders
   - `--accent` for highlights
   Check that all text on all backgrounds passes WCAG AA (4.5:1 for body, 3:1 for large text). Pay special attention to `text-[var(--fg-subtle)]` on `bg-[var(--bg)]` and `bg-[var(--bg-surface)]`.

3. **Animation issues**: Check `@keyframes` in globals.css — `slide-up`, `scale-in`, `gradient-mesh`. Ensure `prefers-reduced-motion` is respected. The `animate-slide-up` class should have a reduced-motion override.

4. **Dark/light mode**: The site is dark-mode-first. Check that `@custom-variant dark (&:is(.dark *))` in globals.css doesn't break if someone has light mode preference.

5. **Image loading**: `LoaderImage.tsx` uses blob URLs — verify the `setLoadedSrc(typeof src === "string" ? src : undefined)` fix is sufficient for React 19's Image type changes. Check lazy loading attributes on all `<img>` tags.

6. **Admin panel**: `components/admin/AdminPanel.tsx` — check form inputs are styled consistently, responsive sidebar tabs, mobile layout of the admin.

7. **Photography app specific**: `apps/photography/app/globals.css` has its own design system — verify it matches the main app's dark aesthetic. Check `.photo-grid` CSS columns layout, `.photo-hover-overlay` transitions.

8. **Accessibility**: Check all interactive elements have proper focus styles, ARIA labels on icon-only buttons (hamburger, close, lightbox navigation), keyboard navigation in lightbox (`Escape`, arrows).

9. **z-index stacking**: Audit all z-index values across components to ensure lightbox > nav overlay > floating elements > content.

10. **Hydration mismatches**: Look for any `typeof window !== "undefined"` patterns that could cause hydration issues. The admin panel reads localStorage on mount — ensure this is in useEffect only.

Fix all issues you find. Create a single commit with all fixes.
```

---

## Prompt 2: Persistent Admin Login with Security

```
Implement secure persistent admin login for my portfolio's admin panel at `/admin`.

Current state:
- `components/admin/AdminPanel.tsx` has client-side password check against hardcoded `const ADMIN_PASSWORD = "soham2026"` (line 45)
- No server-side auth — the `/api/portfolio` PUT endpoint accepts writes from anyone
- No session persistence — refreshing the page logs you out

Requirements:

### 1. Server-side auth with hashed password
- Create `app/api/auth/route.ts` with POST endpoint
- Store the password hash as env var `ADMIN_PASSWORD_HASH` (bcrypt hash of "soham2026")
- On login, POST the password to `/api/auth`, server verifies against the hash
- Return a signed JWT (use `jose` library — `npm install jose`) with 30-day expiry
- JWT secret from env var `JWT_SECRET` (generate a random 32-char string)

### 2. Session persistence
- Store the JWT in an HttpOnly, Secure, SameSite=Strict cookie named `admin_session`
- On the admin page load, verify the cookie server-side before rendering
- If valid, skip the login screen entirely
- Add a "Logout" button that clears the cookie

### 3. Protect API endpoints
- Create middleware or a helper `lib/auth.ts` with `verifyAdminSession(request: Request): Promise<boolean>`
- Protect `PUT /api/portfolio` — return 401 if no valid session
- Protect `POST /api/upload` — return 401 if no valid session
- GET `/api/portfolio` stays public (it serves the website)

### 4. Security measures
- Rate limit login attempts: max 5 per minute per IP (use a simple in-memory Map with TTL, or Upstash Redis if `UPSTASH_REDIS_REST_URL` is configured — see `lib/portfolio-redis.ts` for the existing Redis setup)
- CSRF protection: include a CSRF token in the JWT payload, validate on mutations
- Remove the hardcoded `ADMIN_PASSWORD` string from `AdminPanel.tsx` — the client should never see the password
- Add `Content-Security-Policy` headers in `next.config.ts`

### 5. Admin panel changes
- In `AdminPanel.tsx`, replace the current `handleLogin` (lines 205-212) with a fetch to `/api/auth`
- Replace the `authenticated` state init — on mount, check if session cookie exists (call a `/api/auth/verify` GET endpoint)
- Add a "Sign out" button in the admin header bar
- Show "Session expires in X days" somewhere subtle

### 6. Environment variables needed
Add to `.env.local` and `.env.example`:
```
ADMIN_PASSWORD_HASH=<bcrypt hash of soham2026>
JWT_SECRET=<random 32 chars>
```

Provide a one-liner to generate both values.

### File structure:
- `app/api/auth/route.ts` — POST login, DELETE logout
- `app/api/auth/verify/route.ts` — GET session check
- `lib/auth.ts` — JWT sign/verify, password hash check, rate limiter
- Update `app/api/portfolio/route.ts` — add auth check to PUT
- Update `app/api/upload/route.ts` — add auth check to POST
- Update `components/admin/AdminPanel.tsx` — new auth flow

The `PortfolioData` type is in `lib/portfolio-types.ts`. The existing Redis setup is in `lib/portfolio-redis.ts`. Don't break any existing functionality.
```

---

## Prompt 3: Agentic AI CMS Interface

```
Add an agentic AI assistant to my portfolio's admin panel that lets me manage content through natural language commands.

Current architecture:
- Admin panel: `components/admin/AdminPanel.tsx` (~1700 lines) — React client component with tabs for Site, Hero, About, Highlights, Projects, Photography, Life, Contact
- Data type: `PortfolioData` defined in `lib/portfolio-types.ts` — includes nested types for ProjectItem, PhotographyCategory, PhotoItem, LifeBook, LifePlace, etc.
- API: `app/api/portfolio/route.ts` — GET reads merged data, PUT saves full PortfolioData JSON
- Upload: `app/api/upload/route.ts` — POST with FormData (file + scope/category)
- Storage: Redis (Upstash) primary, file fallback — see `lib/portfolio-redis.ts`

### What the agent should do:
Natural language → structured data mutations on PortfolioData. Examples:
- "Add a new project called Viveka, it's an AI conversational agent, tags AI and NLP, year 2025, status Live, link https://viveka.sohamkakra.com"
- "Add a book: The Pragmatic Programmer by Andy Hunt, theme Engineering"
- "Create a new photography category called Portraits with accent color pink"
- "Change the hero subtitle to mention AI research"
- "Remove the TabScape project"
- "Update Sage Advisory status to In progress"
- "Add Abu Dhabi as a place I've lived, context was born there"

### Implementation plan:

#### 1. Backend: `app/api/ai/route.ts`
- POST endpoint that accepts `{ message: string, currentData: PortfolioData }`
- Uses Anthropic Claude API (npm install @anthropic-ai/sdk)
- Env var: `ANTHROPIC_API_KEY`
- System prompt tells Claude the exact PortfolioData schema and available operations
- Claude responds with a JSON patch: `{ operations: Array<{ type: "add"|"update"|"remove", path: string, value?: any }>, summary: string }`
- The server applies the patch to currentData, validates the result against the type schema, and returns `{ updatedData: PortfolioData, summary: string }`
- Protect with the same admin auth from Prompt 2 (check JWT cookie)

#### 2. The AI system prompt should include:
- Full PortfolioData type definition (inline the types from portfolio-types.ts)
- Current data state (passed in each request)
- Rules: generate valid IDs with crypto.randomUUID(), use proper slugs for categories, keep accent colors as hex, don't delete data unless explicitly asked
- Available operations and their JSON patch format
- Example interactions and expected outputs

#### 3. Frontend: AI Chat Panel
- Add a new tab to the admin panel: "AI Assistant" with icon `Bot` from lucide-react
- Chat-style interface: message input at bottom, scrollable message history above
- User sends a message → show loading indicator → display AI response with a summary of what changed
- After each successful AI action, update the local `data` state (same as `setData` in AdminPanel)
- Show a "Review changes" diff view before applying (optional toggle: "Auto-apply" checkbox)
- The chat should persist within the session (useState array of messages)

#### 4. Smart suggestions
- When the user types in the chat, show quick-action buttons:
  - "Add project" / "Add book" / "Add category" / "Add place"
  - These pre-fill the input with a template like "Add a new project called [name]..."

#### 5. Bulk operations
- Support multi-line instructions: "Add these books: 1. Zero to One by Peter Thiel 2. The Lean Startup by Eric Ries"
- Support updating multiple items: "Mark all 2024 projects as Archived"

#### 6. Error handling
- If the AI returns an invalid patch, show the error and let the user retry
- If the API key is missing, show a setup message with instructions
- Rate limit: max 20 AI requests per hour (track in-memory or Redis)

### File structure:
- `app/api/ai/route.ts` — AI endpoint
- `lib/ai-portfolio.ts` — System prompt builder, patch applier, schema validator
- `components/admin/AIChatPanel.tsx` — Chat UI component
- Update `components/admin/AdminPanel.tsx` — add AI tab, wire up chat panel

### Dependencies:
- `@anthropic-ai/sdk` — Anthropic Claude API client
- Use `claude-sonnet-4-20250514` model for good speed/quality balance
- Env: `ANTHROPIC_API_KEY`

The AI should feel like a knowledgeable assistant that understands the portfolio structure. It should confirm destructive actions ("Are you sure you want to remove the TabScape project?") and provide clear summaries of what it changed.
```

---

## Prompt 4: Smart Photo Upload with EXIF + AI Metadata

```
Implement smart photo uploads in the admin panel that automatically extract EXIF metadata and use AI image understanding to fill in missing fields.

Current state:
- Photo upload in `components/admin/AdminPanel.tsx` (handleImageUpload, lines ~403-466) uploads to `/api/upload` and creates a PhotoItem with empty metadata
- PhotoItem type (`lib/portfolio-types.ts`):
  ```typescript
  type PhotoMeta = {
    camera?: string; lens?: string; aperture?: string;
    shutter?: string; iso?: string; focalLength?: string;
    date?: string; location?: string;
  };
  type PhotoItem = {
    id: string; src: string; title: string;
    description: string; meta?: PhotoMeta; hidden?: boolean;
  };
  ```
- Upload API: `app/api/upload/route.ts` handles FormData with file + category/scope
- Photography categories defined in `lib/portfolio-data.ts` with slugs: wildlife, landscape, astrophotography, light-trails, automobile, events, cityscapes

### Feature requirements:

#### 1. Client-side EXIF extraction
- Install `exifr` (npm install exifr) — lightweight, works in browser
- Before uploading each photo, extract EXIF data client-side:
  - Camera: `Make` + `Model` (e.g. "Sony ILCE-7M3" → "Sony A7 III")
  - Lens: `LensModel` or `LensMake` + `LensModel`
  - Aperture: `FNumber` → format as "f/2.8"
  - Shutter speed: `ExposureTime` → format as "1/250s" or "30s"
  - ISO: `ISO`
  - Focal length: `FocalLength` → format as "85mm"
  - Date: `DateTimeOriginal` → format as "2024-03-15"
  - GPS: `latitude` + `longitude` → reverse geocode to location name

#### 2. GPS reverse geocoding
- Use free Nominatim API (OpenStreetMap): `https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json`
- Extract `city`, `state`, `country` from response
- Format as "City, Country" (e.g. "Dubai, UAE")
- Rate limit: 1 request per second (Nominatim policy)
- Cache results in a Map to avoid duplicate lookups for photos from same location

#### 3. AI image understanding for missing fields
- After EXIF extraction, if key fields are still missing (especially: title, description, location), send the image to AI
- Create `app/api/ai/photo-analyze/route.ts`:
  - POST endpoint, accepts FormData with the image file + existing metadata JSON
  - Uses Anthropic Claude API with vision (`claude-sonnet-4-20250514`)
  - Send the image with a prompt like:
    ```
    Analyze this photograph. Given the existing metadata: {existingMeta}
    
    Fill in any MISSING fields only. Do not override existing data.
    Return JSON with these fields:
    - title: A short, evocative title (2-5 words, no generic titles like "Beautiful Sunset")
    - description: One sentence describing the scene, mood, or subject
    - location: Best guess of where this was taken (if not already known)
    - suggestedCategory: Which category fits best from: [wildlife, landscape, astrophotography, light-trails, automobile, events, cityscapes]
    
    Return ONLY valid JSON, no markdown.
    ```
  - Protect with admin auth (JWT cookie check)
  - Env: `ANTHROPIC_API_KEY` (same as Prompt 3)

#### 4. Enhanced upload flow in AdminPanel
Modify the photo upload UX in `components/admin/AdminPanel.tsx`:

a) **Upload dialog**: When user drops/selects photos, show a modal with:
   - Thumbnail grid of all selected images
   - Per-image metadata panel showing extracted EXIF + AI suggestions
   - Editable fields: title, description, camera, lens, aperture, shutter, ISO, focal length, date, location
   - Auto-filled fields highlighted in blue, AI-suggested fields highlighted in purple
   - "Accept all suggestions" button
   - Category selector (pre-filled if AI suggested one)

b) **Processing pipeline** (per image):
   1. Read file → extract EXIF (instant, client-side)
   2. Reverse geocode GPS if available (async, <1s)
   3. If title OR description OR location is missing → send to AI endpoint (async, ~2-3s)
   4. Show all results in the dialog for review
   5. User can edit any field before confirming upload

c) **Batch upload progress**:
   - Show per-image status: "Extracting EXIF..." → "Analyzing..." → "Ready" → "Uploading..."
   - Progress bar for overall batch
   - Allow canceling individual images

d) **Folder upload support**:
   - Add `webkitdirectory` attribute to the file input
   - When a folder is dropped, recursively collect all image files
   - Use folder name as suggested category name
   - If folder name matches an existing category slug, auto-select it

#### 5. Camera name normalization
Create `lib/camera-names.ts` with a lookup map for common camera model strings:
- "ILCE-7M3" → "Sony A7 III"
- "Canon EOS R5" → "Canon R5"
- "NIKON Z 6_2" → "Nikon Z6 II"
- etc. (cover top 20 popular cameras)
- Fallback: return the raw EXIF string cleaned up

#### 6. New component file structure:
- `components/admin/PhotoUploadDialog.tsx` — the upload review modal
- `components/admin/PhotoMetadataCard.tsx` — per-image metadata editor
- `lib/exif-utils.ts` — EXIF extraction, GPS geocoding, camera name normalization
- `lib/camera-names.ts` — camera model lookup table
- `app/api/ai/photo-analyze/route.ts` — AI vision endpoint
- Update `components/admin/AdminPanel.tsx` — integrate new upload flow

### Dependencies:
- `exifr` — client-side EXIF parser
- `@anthropic-ai/sdk` — for AI vision (may already be installed from Prompt 3)

### Important notes:
- Keep the existing upload API (`/api/upload`) as-is — just enhance the client-side flow
- The photography subdomain app at `apps/photography/` is separate and reads from R2 CDN — this feature is for the main admin panel's photography management
- Large batches (50+ images) should process EXIF in parallel but AI calls sequentially to avoid rate limits
- All AI calls should be optional — if ANTHROPIC_API_KEY is not set, skip AI and just use EXIF data
```

---

## Quick Setup Checklist

Before running these prompts, ensure these env vars are configured:

```bash
# .env.local

# Auth (Prompt 2)
ADMIN_PASSWORD_HASH=    # Generate: node -e "import('bcryptjs').then(b=>b.hash('soham2026',12).then(console.log))"
JWT_SECRET=             # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# AI features (Prompts 3 & 4)
ANTHROPIC_API_KEY=      # From console.anthropic.com

# Existing (already set up)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Recommended execution order:
1. **Prompt 2** (Auth) — foundation for everything else
2. **Prompt 1** (Design audit) — independent, can run anytime
3. **Prompt 3** (Agentic CMS) — depends on auth
4. **Prompt 4** (Smart photos) — depends on auth, shares AI setup with Prompt 3
