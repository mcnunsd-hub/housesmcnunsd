
# MCNUN Portal — Build Plan

A premium, elite-feeling mobile-first web app for the MCNUN conference Houses competition. Built on TanStack Start + Lovable Cloud. Mobile viewport will be the default design target.

Given the scope (5 modules, auth, realtime leaderboard, QR pipelines, AI-balanced sorting), I'll deliver this in **4 phases**. Each phase is shippable and reviewable on its own. After each phase you can course-correct before I continue.

---

## Phase 1 — Foundation, Identity & Sorting Ceremony (this turn)

The core "wow" moment. Everything else hangs off the House identity assigned here.

**Scope**
- Enable Lovable Cloud (Postgres + Auth + Storage).
- Email/password + Google sign-in (login, signup, `/reset-password`).
- `profiles` table (id, full_name, committee, country, house, seniority_tier, created_at) + RLS + auto-create trigger.
- `houses` enum: `atlas | aurora | summit | eclipse`.
- Adaptive theming engine: `HouseThemeProvider` swaps CSS variables (primary/secondary/accent/gradient/font) at the `<html>` root based on `profiles.house`. All four house token sets live in `src/styles.css` under `[data-house="atlas|aurora|summit|eclipse"]`.
- Sorting Ceremony route `/sorting`:
  - 10-question scenario flow, one question per screen, swipe/tap to advance.
  - Hidden state vector `{A,B,C,D}`, +20 per pick.
  - Server function `submitSorting` runs the balancing algorithm (see Technical section) against current house distribution + seniority tiers, then writes `profiles.house`.
  - Cinematic reveal sequence: scale-down → monoline crest fly-in → haptic pulse loop → 1200 ms pitch-black hold → liquid-light radial reveal in house accent → crest + archetype + mentors grid + `[ ENTER MCNUN PORTAL ]`.
- Post-sort dashboard shell at `/portal` showing the user's house crest, name, and tier.

**Out of scope this phase:** trivia, leaderboard, QR, missions.

---

## Phase 2 — Live Leaderboard & Dashboard

- `house_scores` view aggregating points by source.
- `score_events` table (user_id, house, source, points, created_at) — append-only.
- Realtime SVG horizontal bar leaderboard on `/portal`, updates via Supabase realtime channel.
- House feed (recent score events for your house).
- Admin lock flag to freeze leaderboard before Closing Ceremony.

## Phase 3 — Trivia Engine + Anti-Cheat

- `trivia_questions`, `trivia_sessions`, `trivia_answers` tables.
- Server-enforced unlock window (lunch/snack intervals, configurable in `conference_config`).
- `/trivia` route: 10 questions, 12 s server-validated countdown per question, auto-skip on expiry.
- Scoring: +10 correct, +5 if `response_ms < 3000`, 0 penalty.
- All scoring done server-side in `submitTriviaAnswer` server fn — client-reported time is rejected; server measures from question-served timestamp.

## Phase 4 — QR Check-in, Secret Missions, Polish

- Dynamic QR on `/portal/checkin` (signed short-lived JWT, glows in house color).
- Staff `/staff/scan` route (role-gated via `user_roles` table) — camera scan, validates JWT, marks `profiles.checked_in_at`, awards welcome points.
- Secret Missions list + proof upload (Storage bucket `mission-proofs`) or staff QR validation → +15 points.
- Final polish pass: motion tuning, haptics, sound design hooks, accessibility audit.

---

## Technical Section (for Phase 1)

**Stack confirmations**
- Routes (TanStack file-based):
  - `src/routes/index.tsx` — landing / auto-redirect to `/login` or `/portal`
  - `src/routes/login.tsx`, `src/routes/signup.tsx`, `src/routes/reset-password.tsx`
  - `src/routes/_authenticated.tsx` — layout guard (beforeLoad: getUser)
  - `src/routes/_authenticated/sorting.tsx`
  - `src/routes/_authenticated/portal.tsx`
- Server functions in `src/lib/sorting.functions.ts`:
  - `getSortingState` — returns whether user is already sorted.
  - `submitSorting` (`requireSupabaseAuth`) — accepts the 10 answer letters (A/B/C/D), computes raw vector, then runs balancing.

**Balancing algorithm (server-side, runs inside `submitSorting`)**
1. Compute raw scores `{A,B,C,D}` from the 10 picks (each pick = +20).
2. Read current house distribution from `profiles` grouped by `house`, and by `seniority_tier` (advanced / first_timer derived from registration sheet).
3. Cap = 27% of total sorted users. For each house already at/over cap, multiply its raw score by a decay factor (0.55).
4. For each house under-represented in the user's seniority tier, multiply its raw score by a boost factor (1.25).
5. Argmax of adjusted vector → assigned house. Ties broken by lowest current population.
6. Insert `score_events` row (source = `sorting`, points = 0) for audit, update `profiles.house`.

**Theming tokens (all four houses)**
- Atlas: `oklch(0.18 0.04 260)` deep navy primary, brushed-steel accent `oklch(0.72 0.01 250)`, sans (Inter Tight).
- Aurora: pitch-black background `oklch(0.08 0 0)`, polished gold `oklch(0.82 0.14 85)`, serif headings (Cormorant Garamond) over sans body.
- Summit: industrial slate `oklch(0.25 0.01 250)`, crimson `oklch(0.52 0.20 25)`, block typography (Archivo Black).
- Eclipse: jet black `oklch(0.06 0 0)`, matte silver `oklch(0.78 0.01 270)`, restrained mono accents (JetBrains Mono for numerals).

All tokens declared in `src/styles.css` under `[data-house="..."]` selectors. `<html>` gets `data-house={profile.house}` from `HouseThemeProvider`.

**Cinematic reveal implementation**
- Pure CSS keyframes + Web Animations API; no heavy 3D libs (Worker SSR-safe).
- Haptics via `navigator.vibrate([60,90,60,90,60])` (no-op gracefully on iOS Safari).
- 1200 ms blackout = absolutely positioned `<div>` with `background:#000` and timed `setTimeout`.
- Liquid-light reveal = radial-gradient mask with `clip-path: circle()` animated 0→150%.
- SVG crests: 4 inline monoline SVG components in `src/components/house-crests/`.

**Constraints I'll respect**
- No childish/campy copy. Tone: institutional, diplomatic, restrained.
- Mobile-first; tested at 390×844.
- All scoring/validation server-side.
- RLS on every public-schema table with explicit GRANTs.

---

## What I need from you to start Phase 1

Two quick confirmations and then I build:

1. **Auth methods**: email/password + Google sign-in (Lovable Cloud defaults). OK?
2. **Registration sheet sync (Module 5.1)**: for Phase 1 I will let users self-enter Full Name / Committee / Country on signup, and stub a `registration_sync` server fn for the real sheet later. You'll wire the actual Google Sheet / CSV source when ready. OK?

Approve this plan (or tweak) and I'll start with Phase 1.
