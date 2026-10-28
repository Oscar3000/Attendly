# Attendly → Multi-tenant Product: Ticket Backlog

Goal: turn Attendly from a single hard-coded wedding into a product any host can sign up for, create events, and manage guests.

## Ground rules

- **One ticket = one PR.** Max ~20 changed files per PR (migrations and lockfiles count). If a ticket grows past that, split it before opening the PR.
- **`main` stays deployable.** Each PR must pass `npm run type-check`, `npm run lint:check`, `npm run build`, and tests (once T-003 lands).
- **Schema changes are additive first.** Add column/table → backfill → switch code → drop old column in a later ticket. Never rename-and-drop in one PR.
- **Size guide:** S = < 1 day, M = 1–2 days, L = 3+ days (L tickets should be rare; split if possible).
- `Depends on` lists tickets that must be merged first.
- **Done tickets** are marked ✅ in their heading, with the PR number where known. Mark a ticket done in the PR that completes it.

## Phase overview

| Phase | Theme                                                | Tickets       | Status      |
| ----- | ---------------------------------------------------- | ------------- | ----------- |
| 0     | Foundations (server layer, validation, tests, CI)    | T-001 – T-009 | ✅ Done     |
| 1     | Lock down security on the current app                | T-101 – T-108 | Next        |
| 2     | Accounts with Better Auth (users, sign-up, sessions) | T-201 – T-209 | Not started |
| 3     | Events & multi-tenancy                               | T-301 – T-312 | Not started |
| 4     | Remove hard-coded content / theming                  | T-401 – T-409 | Not started |
| 5     | Guest experience                                     | T-501 – T-508 | Not started |
| 6     | Product features                                     | T-601 – T-610 | Not started |
| 7     | Ops, compliance, launch                              | T-701 – T-710 | Not started |
| 8     | Billing                                              | T-801 – T-805 | Not started |

Phases 0 and 1 can happen while the current wedding site is still live. Phase 2 onwards changes the data model.

---

## Phase 0 — Foundations

### ✅ T-001 · Create `src/server/` layer and move Prisma client · S (#1)

Move the Prisma client singleton from `src/lib/db.ts` into `src/server/db/client.ts`. Keep `src/lib/db.ts` re-exporting `db` so no callers change yet.

- Add `import 'server-only'` to server modules so they can't be bundled to the client.
- **Done when:** build passes, no behaviour change.
- **Files:** ~3

### ✅ T-002 · Split `db.ts` into repository modules · M (#2)

Split `src/lib/db.ts` into `src/server/repositories/invitation.repo.ts` and `src/server/repositories/metrics.repo.ts`. Update the API routes to import from them, then delete `src/lib/db.ts`.

- **Depends on:** T-001
- **Files:** ~10

### ✅ T-003 · Add test tooling (Vitest + test DB) · M (#4)

- Add Vitest and a `npm run test` script.
- Add a `docker-compose.test.yml` Postgres or Testcontainers, plus a helper that runs migrations and truncates tables between tests.
- Write one smoke test against `invitation.repo.ts`.
- **Files:** ~6

### ✅ T-004 · Add `zod` and request validation helper · S (#3)

- Add `zod`.
- Add `src/server/http/validate.ts` with a `parseBody(req, schema)` helper that returns a 400 containing field errors.
- Add `src/server/http/errors.ts` with standard `ApiError` classes and a `handleRoute()` wrapper that maps errors to JSON responses.
- **Files:** ~3

### ✅ T-005 · Apply validation to all existing API routes · M (#5)

Use `parseBody` and `handleRoute` in every route under `src/app/api/`. Remove the hand-rolled `try/catch` blocks.

- **Depends on:** T-004
- **Files:** ~10

### ✅ T-006 · CI pipeline · S (#6)

Add a GitHub Actions workflow that runs install, type-check, lint, test, and build on every PR. The format check is left out until T-009.

- **Depends on:** T-003
- **Files:** ~2

### ✅ T-007 · Prettier config + format server-side code · S (#7)

- Add `.prettierrc` with `printWidth: 100` and the other defaults (double quotes). This gave the smallest diff of the configs tried.
- Run Prettier on `src/server`, `src/app/api`, `src/lib`, `src/store`, `src/middleware.ts`, `next.config.ts`, and `tests`.
- Formatting only, no code changes.
- **Files:** ~20

### ✅ T-008 · Format app pages + docs · S (#8)

Run Prettier on the `src/app` pages (everything except `src/app/api`) and on `README.md`, `DEPLOYMENT.md`, and `docs/TICKETS.md`.

- **Depends on:** T-007
- **Files:** ~13

### ✅ T-009 · Format components + enforce in CI · S

- Run Prettier on `src/components`.
- Add an `npm run format:check` step to `.github/workflows/ci.yml`. After this, `npm run format:check` must pass for the whole repo.
- **Depends on:** T-006, T-008
- **Files:** ~14

---

## Phase 1 — Security fixes (current app)

### T-101 · Signed admin session tokens · M

Replace the base64 `admin:<timestamp>` token with a signed JWT, using `jose` and an `AUTH_SECRET` env var.

- **Note:** this is a stopgap to close the forged-cookie hole while the current site is live. Better Auth replaces it in T-204, so keep it minimal.
- Add `src/server/auth/session.ts` with `signSession()` and `verifySession()`.
- Update `api/auth/login/route.ts` to issue the signed token.
- **Files:** ~5

### T-102 · Verify tokens in middleware (not just presence) · S

In `src/middleware.ts`, call `verifySession()` (it is edge-compatible via `jose`). Reject missing, invalid, or expired tokens.

- **Depends on:** T-101
- **Done when:** setting `auth_token=x` by hand no longer grants access.
- **Files:** ~2

### T-103 · Restrict guest access on `/api/invitations` · M

Guests (`invite_token`) may only `GET` a single invitation and `PATCH` its status. `GET` list, `POST`, `PUT`, `DELETE`, and `/bulk` require the admin session.

- Add `requireAdmin()` and `requireGuest()` helpers in `src/server/auth/guards.ts`.
- **Files:** ~5

### T-104 · Constant-time secret comparison · S

Compare the password and PIN with `crypto.timingSafeEqual`.

- **Files:** ~3

### T-105 · Remove insecure defaults · S

- Remove the `INVITE_PIN` default of `"1234"`.
- Fail fast at startup if `AUTH_SECRET`, `ADMIN_PASSWORD`, or `DATABASE_URL` is missing. Add `src/server/env.ts`, which validates env vars with zod.
- **Files:** ~5

### T-106 · Rate limiting on login and PIN endpoints · M

Add a simple rate limiter (5 attempts per minute per IP plus identifier), in memory for now behind an interface so it can move to Redis later.

- **Files:** ~4

### T-107 · Security headers · S

Add CSP, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` (camera stays allowed for the QR scanner) in `next.config.ts`.

- **Files:** ~1

### T-108 · Tests for auth guards · S

Cover: forged cookie → 401, guest calling an admin route → 401/403, guest `PATCH` on own invite → 200.

- **Depends on:** T-003, T-103
- **Files:** ~3

---

## Phase 2 — Accounts

**Decision:** use **Better Auth** (`better-auth`) with its Prisma adapter. Users, sessions, and accounts live in our own Postgres database.

**What Better Auth gives us (so we don't build it):** email + password sign-up and login, password hashing, database sessions, email verification, password reset, rate limiting on auth endpoints, social login, and an `organization` plugin we can use for co-hosts (T-608).

**Design notes:**

- All auth endpoints live under `/api/auth/*` via one catch-all route. The existing `api/auth/login` and `api/auth/logout` routes must be removed in the same PR that adds the catch-all (T-204) or they'll conflict. Until then, mount Better Auth at `basePath: "/api/better-auth"` and switch it over in T-204.
- Middleware only does an **optimistic** check (`getSessionCookie()` from `better-auth/cookies`, with no DB call). Real checks happen on the server with `auth.api.getSession({ headers })` in pages, route handlers, and guards.
- Passwords live on the `Account` table (`providerId: "credential"`), not on `User`. Create users through `auth.api.signUpEmail`, never by writing to Prisma directly.

### T-201 · Install Better Auth + schema · M

- Add `better-auth`.
- Create `src/server/auth/auth.ts` with `betterAuth({ database: prismaAdapter(prisma, { provider: "postgresql" }), emailAndPassword: { enabled: true }, plugins: [nextCookies()] })`, using the temporary `basePath` from the design notes.
- Create `src/lib/auth-client.ts` with `createAuthClient()` from `better-auth/react`.
- Run `npx @better-auth/cli generate` to add the `User`, `Session`, `Account`, and `Verification` models to `schema.prisma`, then generate the Prisma migration.
- Add the route handler at `src/app/api/better-auth/[...all]/route.ts` using `toNextJsHandler(auth)`.
- Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to `env.ts` (T-105).
- **Done when:** the app builds and `GET /api/better-auth/get-session` returns `null`. No UI changes yet.
- **Files:** ~7

### T-202 · Session helpers + seed admin user · S

- Add `src/server/auth/session.ts` with `getCurrentUser()` (returns `null` when signed out) and `requireUser()` (throws 401), both wrapping `auth.api.getSession({ headers: await headers() })`.
- Add a seed script that calls `auth.api.signUpEmail` to create your existing admin user (email + password from env), so you aren't locked out.
- **Depends on:** T-201
- **Files:** ~4

### T-203 · Sign-up + login pages · M

- Add a `/signup` page using `authClient.signUp.email()`.
- Rewrite the `/login` page with email and password fields, using `authClient.signIn.email()`.
- Show field errors from the Better Auth error responses.
- **Depends on:** T-201
- **Files:** ~5

### T-204 · Cut over: middleware, logout, remove old auth · M

- Delete `api/auth/login`, `api/auth/logout`, and the T-101 token helpers.
- Move Better Auth to the default `basePath` (`/api/auth`) by renaming the route folder to `api/auth/[...all]` and updating the auth client.
- Middleware uses `getSessionCookie()` to redirect signed-out users away from `/admin/*` and return 401 for `/api/admin/*`. The guest `invite_token` logic stays as it is until Phase 5.
- The logout button calls `authClient.signOut()`.
- **Depends on:** T-202, T-203
- **Files:** ~8

### T-205 · Replace admin guards with `requireUser()` · S

- Use `requireUser()` in admin pages and API routes in place of `requireAdmin()` from T-103.
- Remove the `ADMIN_PASSWORD` env var.
- **Depends on:** T-204
- **Files:** ~10

### T-206 · Transactional email provider · S

Add `src/server/email/` with a `sendEmail()` abstraction (Resend recommended) and a dev mode that logs to the console.

- **Files:** ~4

### T-207 · Email verification + password reset · M

These are built into Better Auth; this ticket wires them up.

- Set `emailVerification: { sendOnSignUp: true, sendVerificationEmail }` and `emailAndPassword.sendResetPassword` in `auth.ts`, both calling `sendEmail()`.
- Add a `/forgot-password` page (`authClient.requestPasswordReset`) and a `/reset-password` page (`authClient.resetPassword`).
- Add an "unverified email" banner in the dashboard. Leave `requireEmailVerification` off for now so unverified users can still log in.
- Turn on `revokeSessionsOnPasswordReset`.
- **Depends on:** T-204, T-206
- **Files:** ~7

### T-208 · Google sign-in (optional) · S

Add `socialProviders.google` in `auth.ts` and a "Continue with Google" button on the login and sign-up pages.

- **Depends on:** T-204
- **Files:** ~4

### T-209 · Account settings page · S

Change name (`authClient.updateUser`), password (`authClient.changePassword`, current password required), and email (`authClient.changeEmail`, which re-verifies through T-207).

- **Depends on:** T-205, T-207
- **Files:** ~5

---

## Phase 3 — Events & multi-tenancy

### T-301 · `Event` model + migration · S

Add an `Event` model: `id`, `ownerId → User`, `slug` (unique), `type` (enum: WEDDING, BIRTHDAY, CORPORATE, OTHER), `title`, `date`, `timezone`, `venueName`, `venueAddress`, `rsvpDeadline`, timestamps. Add `event.repo.ts`.

- **Depends on:** T-201
- **Files:** ~4

### T-302 · Add nullable `eventId` to `Invitation` · S

An additive migration. Add an index on `eventId`.

- **Files:** ~2

### T-303 · Backfill: create your wedding as an `Event` · S

Add a migration script that creates the event for your user from the current hard-coded values and sets `eventId` on all existing invitations.

- **Depends on:** T-202, T-301, T-302
- **Files:** ~2

### T-304 · Make `eventId` required; move `eventDate`/`venue` off `Invitation` · M

- Make `eventId` NOT NULL.
- Stop reading `invitation.eventDate` and `invitation.venue` and read them from `event` instead. Drop those columns in T-312.
- Update types in `src/lib/types.ts`.
- **Depends on:** T-303
- **Files:** ~12

### T-305 · Ownership guard: `requireEventOwner(eventId)` · S

Loads the event and throws 404 if the current user is not its owner. Return 404, not 403, so event ids aren't leaked.

- **Files:** ~2

### T-306 · Scope invitation repository by `eventId` · M

Every repository function takes `eventId`, and there are no unscoped queries left. Metrics and status updates are scoped too.

- **Depends on:** T-304
- **Files:** ~5

### T-307 · Event-scoped API routes · M

Move routes to `/api/events/[eventId]/invitations`, `/bulk`, `/metrics`, and `/status`. Each one calls `requireEventOwner`. Keep the old routes as thin redirects or remove them.

- **Depends on:** T-305, T-306
- **Files:** ~12

### T-308 · Update RTK Query slice for event-scoped endpoints · S

Every endpoint takes `eventId`. Scope cache tags by event.

- **Depends on:** T-307
- **Files:** ~3

### T-309 · Dashboard routes under `/dashboard/events/[eventId]` · M

Move the `admin/*` pages (dashboard, create, edit, bulk upload, success) under the new path and pass `eventId` through.

- **Depends on:** T-308
- **Files:** ~15

### T-310 · Events list + create event page · M

- `/dashboard` lists the user's events.
- `/dashboard/events/new` has a form for the basic fields and auto-generates the slug.
- **Files:** ~8

### T-311 · Tenant isolation tests · S

User A cannot read, update, delete, or list user B's events or invitations, through any route.

- **Depends on:** T-307
- **Files:** ~3

### T-312 · Cleanup: drop old columns and `/admin` routes · S

Drop `Invitation.eventDate` and `Invitation.venue`. Delete the old `/admin` pages and the old API routes. Update the middleware matcher.

- **Depends on:** T-309, T-310, T-311
- **Files:** ~15

---

## Phase 4 — Remove hard-coded content / theming

### T-401 · Event content fields · S

Add to `Event`: `hostNames`, `headline`, `tagline`, `familyLines` (JSON), `dressCode`, `colorPalette` (JSON), `coverImageUrl`, `notes`.

- **Files:** ~3

### T-402 · Event settings page · M

`/dashboard/events/[eventId]/settings`, a form to edit all the event fields.

- **Depends on:** T-401
- **Files:** ~6

### T-403 · Public event page reads from DB · M

Replace the hard-coded `src/app/page.tsx` with `/e/[slug]`. The hero, details, countdown, and footer receive the `event` as props. Remove the names, date, and colors from `src/components/home/*`.

- **Depends on:** T-401
- **Files:** ~10

### T-404 · Dynamic metadata · S

Use `generateMetadata` on `/e/[slug]` (title, description, OG image). Make the root `layout.tsx` metadata generic.

- **Files:** ~3

### T-405 · Theme presets · M

Store `theme` on `Event` (accent color, font pairing). Apply it with CSS variables at the event page root. Start with 3–4 presets, with `#C07A54` as the default.

- **Files:** ~8

### T-406 · Cover image upload · M

Upload to S3, R2, or UploadThing and store the URL. Validate size and type.

- **Files:** ~6

### T-407 · Copy by event type · S

Wedding, birthday, and corporate events get different default wording ("Solemnly request…" vs "You're invited to…").

- **Files:** ~4

### T-408 · Generated invite image uses event data · S

Update the image generation in `utils.ts` (names, date, venue, colors) to read from `Event`.

- **Files:** ~3

### T-409 · Product landing page at `/` · M

Marketing page: what it is, how it works, sign-up CTA.

- **Files:** ~6

---

## Phase 5 — Guest experience

### T-501 · Per-invitation `accessToken` · S

Add `accessToken` (unique, random 32 bytes, base64url) to `Invitation`. Backfill existing rows.

- **Files:** ~3

### T-502 · Guest link route `/e/[slug]/i/[token]` · M

Look up the invitation by token. The token itself is the credential, so no PIN is needed. Render the existing invite view.

- **Depends on:** T-501, T-403
- **Files:** ~6

### T-503 · Guest RSVP API by token · S

`PATCH /api/rsvp/[token]` updates only that invitation's status.

- **Files:** ~3

### T-504 · QR codes encode the new guest link · S

Update QR generation and regenerate codes for existing invitations.

- **Files:** ~3

### T-505 · Remove shared PIN flow · S

Delete `invite-pin/`, `api/invite/verify-pin`, the `INVITE_PIN` env var, and the guest cookie logic in middleware.

- **Depends on:** T-502, T-503, T-504
- **Files:** ~6

### T-506 · Richer RSVP: attending count, meal, dietary notes · M

New fields on `Invitation`, a guest form, and display in the dashboard table.

- **Files:** ~8

### T-507 · RSVP deadline enforcement · S

After `rsvpDeadline`, the guest form is read-only and shows a message.

- **Files:** ~3

### T-508 · "Add to calendar" (ICS) on guest page · S

- **Files:** ~3

---

## Phase 6 — Product features

### T-601 · CSV export of guest list · S

### T-602 · Email invitations to guests (single + bulk) · M — needs `email` on `Invitation`, uses T-206

### T-603 · RSVP reminder emails (manual trigger) · S

### T-604 · Scheduled reminders (cron / job queue) · M

### T-605 · Notify host on new RSVP (email) · S

### T-606 · Check-in mode: scan QR at door, mark `checkedInAt` · M

### T-607 · Check-in dashboard (arrived vs expected) · S

### T-608 · Co-hosts: invite another user to manage an event (consider Better Auth `organization` plugin vs own `EventMember` + roles) · L → split into model/API and UI tickets when started

### T-609 · WhatsApp share link per guest · S

### T-610 · Duplicate event / archive event · S

---

## Phase 7 — Ops, compliance, launch

### T-701 · Managed Postgres + hosting setup (Neon/Supabase + Vercel/Fly) · M

### T-702 · Sentry error tracking (client + server) · S

### T-703 · Structured logging (pino), remove `console.error` · S

### T-704 · Automated DB backups + restore runbook · S

### T-705 · Privacy policy + terms pages · S

### T-706 · Account deletion (cascades events/invitations) · S

### T-707 · Guest data deletion on request / event auto-purge after N months · M

### T-708 · Basic analytics (PostHog/Plausible) · S

### T-709 · Health check includes DB + migrations status · S

### T-710 · Update README, DEPLOYMENT.md, CLAUDE.md for new architecture · S

---

## Phase 8 — Billing

### T-801 · Decide pricing model (per-event vs subscription, free tier limits) · decision doc

### T-802 · `Plan`/`Subscription` fields + plan limits helper (`assertCanAddGuests`) · M

### T-803 · Stripe Checkout + webhook · M

### T-804 · Enforce limits in create/bulk-create invitation and create event · S

### T-805 · Billing page (current plan, upgrade, Stripe portal link) · S

---

## Suggested order for the first 10 PRs

1. T-001 → T-002 → T-004 → T-003 (foundations)
2. T-101 → T-102 → T-103 (closes the critical security holes)
3. T-105 → T-104 → T-106
