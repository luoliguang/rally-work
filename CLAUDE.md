# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Rally (`rally-work`) is a personal site for recording badminton sessions — a cinematic, dark-themed timeline of "matches" with scores, win/loss, notes, photos, and videos. **`README.md` is the product source of truth** (data model, pages, design, performance rules, roadmap); read it before making product decisions. This file covers commands and code-level architecture.

Stack: **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4**. Single repo, front and back end together (no separate Express server — an earlier Vue+Express plan in README history was superseded).

## Commands

```bash
npm run dev        # Dev server (Turbopack) at http://localhost:3000
npm run build      # Production build — also runs the full typecheck
npm start          # Serve the production build
npm run lint       # ESLint (flat config, eslint.config.mjs)
npm run typecheck  # tsc --noEmit
```

No test runner is wired up yet. If you add one, add the `test` script and update this section.

## Architecture

One-directional data flow: **`matches.json` → data layer (`src/lib`) → Server Components / Route Handlers → UI**.

- **Data store — `src/data/matches.json`**: the single source of truth. Shape is `{ "matches": Match[] }`. There is no database; this file *is* the database (README §4).
- **Data layer — `src/lib/matches.ts`**: the ONLY module that reads the JSON file. `listMatches` (newest day first), `listMatchesPage` (1-indexed pagination), `getMatch`, `getLatestMatch`. When this graduates to a real DB/SQLite, this is the one file to swap.
- **Derived stats — `src/lib/stats.ts`**: `computeStats`/`getStats`. **Aggregate numbers (totals, win rate, longest streak, etc.) are NEVER stored in JSON** — always recomputed from raw matches. Keep it that way (README §4).
- **Domain types — `src/lib/types.ts`**: `Match`, `Media` (a discriminated union on `type: "image" | "video"`), `Stats`.
- **API — `src/app/api/*/route.ts`**: `/api/matches` (paginated), `/api/matches/[id]`, `/api/latest`, `/api/stats`. These exist for client/external use.
- **Pages — `src/app/`**: `page.tsx` (home: latest highlight + stats), `timeline/`, `matches/[id]/` (SSG via `generateStaticParams`), `about/`. **Pages are async Server Components that call `src/lib` directly — NOT via fetch to the API.** Components in `src/components/` (`MatchCard`, `ScoreBadge`, `MediaItem`, `StatsBar`).

Path alias: `@/*` → `src/*`.

## Conventions specific to this repo

- **"List light, detail heavy" (README §8)**: timeline cards (`MatchCard`) render thumbnails only (`media.thumb` / `media.poster`), never full media. Heavy media lives on the detail page. Videos use `poster` + `preload="none"` so they load only on play. Don't break this for performance.
- **No infinite scroll** — pagination / "load more" is the intended pattern.
- **Media is URL-based, not uploaded** (yet). `Media.url`/`thumb`/`poster` point at remote or `/media/*` paths. File upload is a future step (README §13) — don't assume it exists. `next.config.mjs` allows any HTTPS image host for now; tighten before production.
- Images use plain `<img>` (with an eslint-disable) rather than `next/image`, to keep arbitrary remote sources simple.
- **GSAP cinematic intro is NOT built yet.** The home page is intentionally the place for it (README §6/§7); when adding animation, it must respect `prefers-reduced-motion` and stay confined to the home page (timeline/detail animations stay minimal).
- UI copy is in Chinese; match the surrounding tone.

## Version sensitivity

Next 16 + React 19 + Tailwind v4 are all recent and a bit sharp-edged:

- **Tailwind and `@tailwindcss/postcss` must stay in lockstep.** An out-of-date `@tailwindcss/postcss` breaks the Turbopack build with a cryptic `Missing field 'negated' on ScannerOptions.sources` PostCSS error. If the CSS build fails after a dependency bump, upgrade both Tailwind packages together first.
- Tailwind v4 has **no `tailwind.config.js`** — it's configured via `@import "tailwindcss"` in `src/app/globals.css` plus the plugin in `postcss.config.mjs`.
- **`next lint` was removed in Next 16.** Linting runs ESLint directly (`eslint .`) against the flat config in `eslint.config.mjs`, which spreads `eslint-config-next` (itself a flat-config array).
- Route Handler and Page `params` are **async** (`params: Promise<{ id: string }>`) — await them.
- Pin Next to a patched release; `next@15.1.6` carried CVE-2025-66478, which is why this repo is on 16.x.
