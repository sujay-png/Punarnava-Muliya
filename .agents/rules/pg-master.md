---
trigger: always_on
---

# PG Master: Project Rules

## Context
PG (Paying Guest) management app for an Indian PG owner.
Stack: Next.js App Router + TypeScript, Firebase Auth/Firestore/Storage,
Cloud Functions (MSG91 WhatsApp). Currency ₹, timezone Asia/Kolkata,
date format DD MMM YYYY.

Full feature spec and phased plan: `docs/PROMPT.md`. Read it before
starting any task and follow its phase order. Do not start a later phase
until I approve.

## Design
- Dark theme, near-black surfaces `oklch(0.13 0 0)`, pastel orange accent.
- Status colors only: Emerald-400 = paid, Amber-400 = pending,
  Rose-400 = overdue. Do not invent new colors or add UI libraries.
- Reuse existing components and tokens. Every view needs loading,
  empty and error states. Responsive for desktop and tablet.

## Data model
- Person and stay are separate: `tenants`, `stays`, `deposits`,
  `payments`, `statusHistory`. A returning tenant gets a new stay.
- Fine = ₹100/day after the 10th, and stops at vacateDate.
- Deposit amount is per stay, not fixed.

## Architecture
- Project has no `src/`. App Router is at `app/`, aliases use `@/`.
- Existing code is type-based (`components/`, `hooks/`, `lib/api`,
  `lib/models`, `providers/`, `store/`). Do NOT reorganize it.
- All NEW domain code goes in `features/<name>/` with `components/`,
  `api/`, `model/`, and an `index.ts` public API.
- Existing shared code stays where it is: shadcn UI in `components/ui`,
  `lib/utils.ts`, `lib/firebase/config.ts`. New features may import these,
  but shared code must never import from `features/`.
- Cross-feature imports only via the other feature's `index.ts`.
  Multi-feature flows (vacate) live in their own feature.
- Route files in `app/` are thin and only compose features.
- If new code needs something in legacy `lib/api` or `lib/models`, wrap or
  extend it rather than rewriting it. Flag any conflict with the target
  data model instead of silently changing legacy files.

## Engineering
- TypeScript strict. New types live in `features/*/model/`.
- Firestore access for new code only in `features/*/api/`, never in
  components.
- Pure business logic (payment status, fine, stay duration, net refund)
  lives in `features/*/model/` with unit tests covering mid-month
  join/vacate, month boundaries, leap years and partial payments.
- Multi-document writes (vacate + deposit + statusHistory) use
  transactions or batched writes.
- Validate forms with zod.
- Always list new Firestore rules and composite indexes explicitly.

## Safety
- Never run the migration script without `--dry-run` first, and never
  auto-run it. Ask me before any command that writes to Firestore.
- Don't touch the MSG91 Cloud Function unless required.
- No secrets in code. Don't refactor unrelated code. Keep diffs focused.
- After each phase: list files changed, manual test steps, new
  indexes/rules. Then stop and wait for approval.