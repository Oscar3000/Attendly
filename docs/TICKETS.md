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
| 0     | Foundations (server layer, validation, tests, CI)    | T-001 – T-010 | ✅ Done     |
| 1     | Lock down security on the current app                | T-101 – T-108 | ✅ Done     |
| 2     | Accounts with Better Auth (users, sign-up, sessions) | T-201 – T-209 | ✅ Done     |
| 3     | Events & multi-tenancy                               | T-301 – T-312 | ✅ Done     |
| 4     | Remove hard-coded content / theming                  | T-401 – T-410 | ✅ Done     |
| 5     | Guest tickets & door check-in                        | T-501 – T-510 | Not started |
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

### ✅ T-010 · Upgrade Node to 22 LTS · S

Node 20 reached end of life in April 2026. Better Auth's dependencies (`@noble/ciphers`, `@noble/hashes`) already require Node >= 20.19, and the project pins 20.10 locally and in CI and 20.15 in Docker. The npm that ships with Node 20.10 (10.2.3) also has a resolver bug that rejects `npm install better-auth`.

- Bump `.tool-versions` to the latest Node 22 (CI reads it through `node-version-file`).
- Bump the `Dockerfile` base image from `node:20.15.0-alpine3.19` to `node:22-alpine`, pinned to an exact version and alpine release.
- Bump `@types/node` to `22.x`.
- Add `"engines": { "node": ">=22" }` to `package.json`.
- Reinstall with the npm that ships with Node 22 and commit the lockfile if it changes.
- **Done when:** CI passes on Node 22, `npm install` works without workarounds, and the Docker image builds and passes `/api/health` locally.
- **Files:** ~5
- **As built:** Node 22.23.4 (npm 10.9.9) in `.tool-versions` and `node:22.23.4-alpine3.24` in Docker. That Alpine image has no OpenSSL, which Prisma's engine needs, so the base stage installs `openssl`. `npm ci --only=production` became `--omit=dev` (the old flag is deprecated). `@types/node` is 22.20.5.

---

## Phase 1 — Security fixes (current app)

### ✅ T-101 · Signed admin session tokens · M

Replace the base64 `admin:<timestamp>` token with a signed JWT, using `jose` and an `AUTH_SECRET` env var.

- **Note:** this is a stopgap to close the forged-cookie hole while the current site is live. Better Auth replaces it in T-204, so keep it minimal.
- Add `src/server/auth/session.ts` with `signSession()` and `verifySession()`.
- Update `api/auth/login/route.ts` to issue the signed token.
- **Files:** ~5

### ✅ T-102 · Verify tokens in middleware (not just presence) · S

In `src/middleware.ts`, call `verifySession()` (it is edge-compatible via `jose`). Reject missing, invalid, or expired tokens.

- **Depends on:** T-101
- **Done when:** setting `auth_token=x` by hand no longer grants access.
- **Files:** ~2

### ✅ T-103 · Restrict guest access on `/api/invitations` · M

Guests (`invite_token`) may only `GET` a single invitation and `PATCH` its status. `GET` list, `POST`, `PUT`, `DELETE`, and `/bulk` require the admin session.

- Add `requireAdmin()` and `requireAdminOrGuest()` helpers in `src/server/auth/guards.ts`. The `/api/admin` routes use `requireAdmin()` too, as a second line of defence behind the middleware.
- **Files:** ~10

### ✅ T-104 · Constant-time secret comparison · S

Compare the password and PIN with `crypto.timingSafeEqual`.

- **Files:** ~3

### ✅ T-105 · Remove insecure defaults · S

- Remove the `INVITE_PIN` default of `"1234"`.
- Fail fast at startup if `AUTH_SECRET`, `ADMIN_PASSWORD`, or `DATABASE_URL` is missing. Add `src/server/env.ts`, which validates env vars with zod.
- **Files:** ~5

### ✅ T-106 · Rate limiting on login and PIN endpoints · M

Add a simple rate limiter (5 attempts per minute per IP plus identifier), in memory for now behind an interface so it can move to Redis later.

- **Files:** ~4

### ✅ T-107 · Security headers · S

Add CSP, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` (camera stays allowed for the QR scanner) in `next.config.ts`.

- **Files:** ~1

### ✅ T-108 · Tests for auth guards · S

Cover: forged cookie → 401, guest calling an admin route → 401/403, guest `PATCH` on own invite → 200.

- **Depends on:** T-003, T-103
- **Files:** ~3
- Done as part of T-103 (`guards.test.ts`, the access-control cases in `invitations.db.test.ts`) and T-102 (`middleware.test.ts`).

---

## Phase 2 — Accounts

**Decision:** use **Better Auth** (`better-auth`) with its Prisma adapter. Users, sessions, and accounts live in our own Postgres database.

**What Better Auth gives us (so we don't build it):** email + password sign-up and login, password hashing, database sessions, email verification, password reset, rate limiting on auth endpoints, social login, and an `organization` plugin we can use for co-hosts (T-608).

**Design notes:**

- All auth endpoints live under `/api/auth/*` via one catch-all route. The existing `api/auth/login` and `api/auth/logout` routes must be removed in the same PR that adds the catch-all (T-204) or they'll conflict. Until then, mount Better Auth at `basePath: "/api/better-auth"` and switch it over in T-204.
- Middleware only does an **optimistic** check (`getSessionCookie()` from `better-auth/cookies`, with no DB call). Real checks happen on the server with `auth.api.getSession({ headers })` in pages, route handlers, and guards.
- Passwords live on the `Account` table (`providerId: "credential"`), not on `User`. Create users through `auth.api.signUpEmail`, never by writing to Prisma directly.

### ✅ T-201 · Install Better Auth + schema · M

- Add `better-auth`.
- Create `src/server/auth/auth.ts` with `betterAuth({ database: prismaAdapter(prisma, { provider: "postgresql" }), emailAndPassword: { enabled: true }, plugins: [nextCookies()] })`, using the temporary `basePath` from the design notes.
- Create `src/lib/auth-client.ts` with `createAuthClient()` from `better-auth/react`.
- Run `npx @better-auth/cli generate` to add the `User`, `Session`, `Account`, and `Verification` models to `schema.prisma`, then generate the Prisma migration.
- Add the route handler at `src/app/api/better-auth/[...all]/route.ts` using `toNextJsHandler(auth)`.
- Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to `env.ts` (T-105).
- **Done when:** the app builds and `GET /api/better-auth/get-session` returns `null`. No UI changes yet.
- **Files:** ~7
- **As built:** `auth.ts` exports `getAuth()`, not `auth`. The instance is built on first use because `next build` loads route modules without the runtime env vars, so later tickets call `getAuth().api.getSession(...)`. The CLI now ships as the `auth` package (`npx auth@<better-auth version> generate`) and needs Node 22; it can't load a config that imports `server-only`, so point it at a temporary copy of the options. Tables are mapped to `users`, `sessions`, `accounts`, `verifications`.

### ✅ T-202 · Session helpers + seed admin user · S

- Add `src/server/auth/session.ts` with `getCurrentUser()` (returns `null` when signed out) and `requireUser()` (throws 401), both wrapping `auth.api.getSession({ headers: await headers() })`.
- Add a seed script that calls `auth.api.signUpEmail` to create your existing admin user (email + password from env), so you aren't locked out.
- **Depends on:** T-201
- **Files:** ~4
- **As built:** the helpers live in `src/server/auth/current-user.ts`, because `session.ts` still holds the T-101 token code until T-204. The seed is `prisma/seed.ts` (run with `npm run db:seed`; Prisma also runs it after `db:reset`). It reads `ADMIN_EMAIL`, `ADMIN_PASSWORD` and an optional `ADMIN_NAME`, leaves an existing user unchanged, and runs through `tsx --conditions=react-server` so `server-only` imports resolve.

### ✅ T-203 · Sign-up + login pages · M

- Add a `/signup` page using `authClient.signUp.email()`.
- Rewrite the `/login` page with email and password fields, using `authClient.signIn.email()`.
- Show field errors from the Better Auth error responses.
- **Depends on:** T-201
- **Files:** ~5
- **As built:** `/admin` still checks the old cookie until T-204, so the old password form moved to `/login/admin-password` (linked from `/login`) to keep the dashboard reachable. Error codes are mapped to fields in `src/lib/auth-errors.ts`; shared form pieces live in `src/components/auth/`.

### ✅ T-204 · Cut over: middleware, logout, remove old auth · M

- Delete `api/auth/login`, `api/auth/logout`, and the T-101 token helpers.
- Delete the temporary `/login/admin-password` page and its link on `/login` (T-203).
- Move Better Auth to the default `basePath` (`/api/auth`) by renaming the route folder to `api/auth/[...all]` and updating the auth client.
- Middleware uses `getSessionCookie()` to redirect signed-out users away from `/admin/*` and return 401 for `/api/admin/*`. The guest `invite_token` logic stays as it is until Phase 5.
- The logout button calls `authClient.signOut()`.
- **Depends on:** T-202, T-203
- **Files:** ~8
- **As built:** while there is one shared guest list, only the account matching the new required `ADMIN_EMAIL` env var may use the dashboard and admin APIs; other accounts get 403 (`isAdminEmail()` in `guards.ts`). `requireAdmin()` now verifies the Better Auth session. `session.ts` still signs guest tokens, so only its admin use was removed; narrowing it to guest-only moved to T-205. 22 files, over the guide because the docs had to change with the behaviour.

### ✅ T-205 · Replace admin guards with `requireUser()` · S

- Use `requireUser()` in admin pages and API routes in place of `requireAdmin()` from T-103. Keep the `ADMIN_EMAIL` restriction from T-204 until Phase 3 scopes invitations per owner.
- Add a server-side check in an `/admin` layout: redirect signed-out users to `/login` and show a "no access" message to accounts other than `ADMIN_EMAIL` (today they see the dashboard shell with failing API calls).
- Fix the stale T-204 note in `current-user.ts`.
- Remove the `ADMIN_PASSWORD` env var.
- **Depends on:** T-204
- **Files:** ~10
- **As built:** admin-only endpoints call `requireAdminUser()` (`requireUser()` plus the `ADMIN_EMAIL` check) from `current-user.ts`, passing `request.headers`; `guards.ts` keeps only `requireAdminOrGuest()`. A guest calling an admin-only endpoint now gets 401 (no account session) instead of 403. `ADMIN_PASSWORD` is now read only by the seed. Narrowing `session.ts` to guest tokens moved to T-508, which deletes that code anyway.

### ✅ T-206 · Transactional email provider · S

Add `src/server/email/` with a `sendEmail()` abstraction (Resend recommended) and a dev mode that logs to the console.

- **Files:** ~4
- **As built:** `sendEmail({ to, subject, text, html? })` in `src/server/email/send-email.ts` calls Resend's REST API with `fetch` (no SDK dependency). `RESEND_API_KEY` and `EMAIL_FROM` are optional env vars (`EMAIL_FROM` is required once the key is set); without them it logs in development and throws in production.

### ✅ T-207 · Email verification + password reset · M

These are built into Better Auth; this ticket wires them up.

- Set `emailVerification: { sendOnSignUp: true, sendVerificationEmail }` and `emailAndPassword.sendResetPassword` in `auth.ts`, both calling `sendEmail()`.
- Add a `/forgot-password` page (`authClient.requestPasswordReset`) and a `/reset-password` page (`authClient.resetPassword`).
- Add an "unverified email" banner in the dashboard. Leave `requireEmailVerification` off for now so unverified users can still log in.
- Turn on `revokeSessionsOnPasswordReset`.
- **Depends on:** T-204, T-206
- **Files:** ~7
- **As built:** email content lives in `src/server/auth/auth-emails.ts`; the banner (`src/components/admin/verify-email-banner.tsx`, with a resend button) is rendered by the `/admin` layout. Better Auth catches send failures and only logs them, so sign-up still succeeds and a reset request shows the same "if an account exists" message either way; a Resend outage shows up only in the server logs. `RESEND_API_KEY` / `EMAIL_FROM` stay optional: without them production skips these emails and hides the verify banner (`canSendEmail()`). `/login` links to `/forgot-password`.

### ✅ T-208 · Google sign-in (optional) · S

Add `socialProviders.google` in `auth.ts` and a "Continue with Google" button on the login and sign-up pages.

- **As built:** `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are optional (both or neither); without them the button is hidden. `/login` and `/signup` are now small server pages (`connection()`, so the env is read per request) around `login-form.tsx` / `signup-form.tsx`. Default account linking: Google joins an existing account only when both sides have verified the email; otherwise `/login?error=account_not_linked` explains it. Setup steps are in `DEPLOYMENT.md`.

- **Depends on:** T-204
- **Files:** ~4

### ✅ T-209 · Account settings page · S

Change name (`authClient.updateUser`), password (`authClient.changePassword`, current password required), and email (`authClient.changeEmail`, which re-verifies through T-207).

- **As built:** `/account` (any signed-in user; linked from the dashboard header and the "no access" page). A verified account confirms an email change from its current address before the new one is verified. Email changes are hidden when email isn't configured and for the `ADMIN_EMAIL` account (changing it would lock the dashboard until Phase 3). Password changes log out other sessions; Google-only accounts have no password section.

- **Depends on:** T-205, T-207
- **Files:** ~5

---

## Phase 3 — Events & multi-tenancy

### ✅ T-301 · `Event` model + migration · S

Add an `Event` model: `id`, `ownerId → User`, `slug` (unique), `type` (enum: WEDDING, BIRTHDAY, CORPORATE, OTHER), `title`, `date`, `timezone`, `venueName`, `venueAddress`, `rsvpDeadline`, timestamps. Add `event.repo.ts`.

- **As built:** `venueName`, `venueAddress` and `rsvpDeadline` are optional; deleting a user cascades to their events (T-706). `eventRepo` has `create`, `findById`, `findBySlug`, `listByOwner` (soonest first), `update` (undefined leaves a field unchanged, null clears it) and `delete`; only Prisma's not-found error maps to `undefined`/`false`, other errors are rethrown. A taken slug throws Prisma's unique-constraint error (`P2002`) for T-310 to handle.

- **Depends on:** T-201
- **Files:** ~4

### ✅ T-302 · Add nullable `eventId` to `Invitation` · S

An additive migration. Add an index on `eventId`.

- **Files:** ~2
- **As built:** deleting an event deletes its invitations (`onDelete: Cascade`), matching user → event. Nothing reads or writes `eventId` yet.

### ✅ T-303 · Backfill: create your wedding as an `Event` · S

Add a migration script that creates the event for your user from the current hard-coded values and sets `eventId` on all existing invitations.

- **Depends on:** T-202, T-301, T-302
- **Files:** ~2
- **As built:** `npm run db:backfill-wedding` (`prisma/backfill-wedding-event.ts`, logic in `src/server/backfill/wedding-event.ts`) creates "Pamela & Oscar" (`pamela-and-oscar`, WEDDING, May 23 2026 3:00 PM `Africa/Lagos`, Canary World) for the `ADMIN_EMAIL` account and links every invitation with no event, in one transaction. It's a script rather than a SQL migration because it needs the admin's account; it's safe to re-run. The church service (10:00 AM, Archangels Catholic Church) belongs in the event's notes once T-401 adds them.

### ✅ T-304 · Make `eventId` required; move `eventDate`/`venue` off `Invitation` · M

- Make `eventId` NOT NULL. Run `npm run db:backfill-wedding` in production first; the migration should fail with a clear message if any invitation still has no event.
- Stop reading `invitation.eventDate` and `invitation.venue` and read them from `event` instead. Drop those columns in T-312.
- Update types in `src/lib/types.ts`.
- **Depends on:** T-303
- **Files:** ~12
- **As built:** the migration refuses (with instructions) if any invitation has no event, and `entrypoint.sh` now stops on a failed migration instead of starting anyway. The repository joins the event on every read; API responses keep `eventDate`/`venue` (filled from the event, venue = `venueName ?? venueAddress`) so display pages didn't change. Create/edit/bulk forms dropped their date and venue inputs; the API ignores them if sent. New invitations go to the admin's only event via `requireCurrentEvent()` (409 otherwise) until T-307. The legacy columns are still written (copied from the event) so a rollback works. The T-303 backfill now uses raw SQL so it still runs against a database the migration refused.

### ✅ T-305 · Ownership guard: `requireEventOwner(eventId)` · S

Loads the event and throws 404 if the current user is not its owner. Return 404, not 403, so event ids aren't leaked.

- **Files:** ~2
- **As built:** `requireEventOwner(eventId, headers?)` in `src/server/events/require-event-owner.ts` returns `{ user, event }`; signed out is 401 (via `requireUser`), and a missing or someone else's event is the same 404. It checks ownership only, not `ADMIN_EMAIL`, so it's what lets any host reach their own events once T-310 lets them create one.

### ✅ T-306 · Scope invitation repository by `eventId` · M

Every repository function takes `eventId`, and there are no unscoped queries left. Metrics and status updates are scoped too.

- **Depends on:** T-304
- **Files:** ~5
- **As built:** `eventId` is part of each query (`where: { id, eventId }`), so another event's invitation is indistinguishable from a missing one; update/delete now treat only Prisma's not-found error as "not found" and rethrow the rest. Shared-PIN guests aren't tied to an event, so they get two explicit exceptions, `getInvitationForGuest(id)` and `updateRsvpStatusForGuest(id, status)` (remove in T-508). Routes pass the admin's event from `requireCurrentEvent()` until T-307.

### ✅ T-307 · Event-scoped API routes · M

Move routes to `/api/events/[eventId]/invitations`, `/bulk`, `/metrics`, and `/status`. Each one calls `requireEventOwner`. Keep the old routes as thin redirects or remove them.

- Replace the temporary `requireCurrentEvent()` bridge (T-304) with the `eventId` from the route.

- **Depends on:** T-305, T-306
- **Files:** ~12
- **As built:** `/api/events/[eventId]/invitations` (GET paginated `?page&limit&search`, POST), `/invitations/[id]` (GET, PUT, PATCH, DELETE), `/invitations/bulk`, `/metrics` and `/status`, each starting with `requireEventOwner` (owner only: 404 for other accounts and other events' invitations, 401 signed out; no guest access). Metrics and the invitation list are separate endpoints (`/api/admin` returned both). The old routes are unchanged: they can't redirect without knowing the event, the UI still uses them until T-308, and PIN guests use `/api/invitations/[id]` until T-508. Bulk row handling moved to `invitationRepo.createInvitations()`, shared by both bulk routes. Middleware covers `/api/events/*`.

### ✅ T-308 · Update RTK Query slice for event-scoped endpoints · S

Every endpoint takes `eventId`. Scope cache tags by event.

- **Depends on:** T-307
- **Files:** ~3
- **As built:** added alongside the old endpoints, not in place of them, because the `/admin` pages have no `eventId` until T-309 moves them: `src/store/eventInvitationApi.ts` injects `getEventInvitations`, `getEventMetrics`, `getEventStatusUpdates`, `getEventInvitation` and the create / bulk / update / RSVP / delete mutations into `invitationApi`. Tags are per event (`EventInvitations`, `EventMetrics`, `EventStatus` with `id: eventId`, plus `Invitation` per id).

### ✅ T-309 · Dashboard routes under `/dashboard/events/[eventId]` · M

Move the `admin/*` pages (dashboard, create, edit, bulk upload, success) under the new path and pass `eventId` through.

- Switch the pages to the `eventInvitationApi.ts` hooks (T-308), then delete the old admin endpoints from `invitationApi.ts` (`getAllInvitations`, `getAdminData`, `getStatusUpdates`, `createInvitation`, `bulkCreateInvitations`, `updateInvitation`, `deleteInvitation`) and their `AdminData` / `StatusUpdates` tags. Keep `getInvitation` and `updateRsvpStatus` for the PIN guest page until T-508.

- **Depends on:** T-308
- **Files:** ~15
- **As built:** pages moved with `git mv` and use the T-308 hooks; the old admin endpoints are gone from `invitationApi.ts`. The event layout checks ownership server-side (signed out → `/login`, other accounts or missing events → 404) and shows the verify-email banner, replacing the `ADMIN_EMAIL` gate and "no access" page for pages. `/admin` is now a redirect hub (sign-in, sign-up, Google and email links still land there): it sends you to your soonest event, or shows "No events yet". `next.config.ts` redirects old `/admin/*` bookmarks to `/admin`; middleware covers `/dashboard/*`.

### ✅ T-310 · Events list + create event page · M

- `/dashboard` lists the user's events. Point sign-in, sign-up, Google and email callbacks there instead of `/admin`, and replace the `/admin` redirect hub (T-309) with a redirect to `/dashboard`.
- `/dashboard/events/new` has a form for the basic fields and auto-generates the slug.
- **Files:** ~8
- **As built:** `POST /api/events` lets any signed-in user create an event they own (`createEventSchema` converts the datetime-local values from the event's zone via `src/lib/timezones.ts`; the RSVP deadline must be before the start). `createEvent()` slugifies the title ("Pamela & Oscar" → `pamela-and-oscar`, accents stripped, `event` if nothing is left) and retries `-2`, `-3`... on the unique index, so concurrent creates are safe. `/dashboard` lists events with times on the event's own clock; the form defaults to the browser's zone. `/admin` (page deleted) and `/admin/*` redirect to `/dashboard` in `next.config.ts`; sign-in, sign-up, Google and email callbacks point to `/dashboard`.

### ✅ T-311 · Tenant isolation tests · S

User A cannot read, update, delete, or list user B's events or invitations, through any route.

- **Depends on:** T-307
- **Files:** ~3
- **As built:** `src/app/api/tenant-isolation.db.test.ts` finds every `route.ts` with `import.meta.glob` and requires each route/method in `ROUTE_POLICY`, so new routes can't skip it. Two attackers (the `ADMIN_EMAIL` account, which also passes the old admin routes, and an ordinary account) call every handler against a victim's event and invitation; "victim" routes must answer 403/404, no response may contain the victim's titles, names or ids, and a full snapshot of the victim's events and invitations must be unchanged. Calls aimed at the victim run before the attacker's "own" calls, since `POST /api/events` gives the attacker a second event and the old routes then refuse with 409 before reaching the scoped queries. It also checks the event dashboard layout 404s for other accounts and that `/dashboard` (T-310) lists only the caller's events. Verified by breaking `requireEventOwner`, the repository's event scoping, the layout check and `listByOwner`'s owner filter: each made the test fail.

### T-312 · Cleanup: drop old columns and `/admin` routes · S

Drop `Invitation.eventDate` and `Invitation.venue`. Delete the old `/admin` pages and the old API routes. Update the middleware matcher.

- **Depends on:** T-309, T-310, T-311
- Split into four PRs to stay under the file limit, with the column drop done in two deploys so no request fails while the old container is still serving:

### ✅ T-312a · Remove the old API routes · S

- **As built:** deleted `/api/admin`, `/api/admin/status`, `/api/invitations` (GET/POST), `/api/invitations/bulk` and the `requireCurrentEvent()` bridge. `/api/invitations/[id]` keeps only the PIN guest's GET/PATCH, guarded by the new `requireGuest()` (account sessions get 401; hosts use `/api/events/...`). Middleware now covers `/dashboard` and `/api/events` for accounts and `/api/invitations` for guests only; `/admin` is redirected by `next.config.ts` before middleware runs. The tenant isolation policy dropped the deleted routes and accepts 401 for the guest route.

### ✅ T-312b · Remove `ADMIN_EMAIL` · S

- Remove the env var (`env.ts`, `vitest.config.mts`, `docker-compose.yml`, `DEPLOYMENT.md`), `isAdminEmail` / `requireAdminUser`, and the account page's email lock and `isAdmin` prop; nothing after T-312a needs it. The seed and the T-303 backfill read `ADMIN_EMAIL` as their own input and keep doing so. Collapse the tenant isolation test's two attackers into one.
- **As built:** as above. With email configured, every account can now change its email on `/account`. The seed is documented as an optional way to create an account; `ADMIN_EMAIL` stays only as its (and the backfill's) input.

### ✅ T-312c · Stop writing `eventDate` / `venue` · S

- Make both columns nullable and stop copying the event's date and venue into them in `invitation.repo.ts`. Deploy this before T-312d: the old container keeps writing them until it's replaced, which nullable columns allow.
- **As built:** migration `20261030090000_make_legacy_invitation_columns_nullable` only drops the NOT NULL constraints (instant, no rewrite). Checked that the previous release's insert (with both columns) and this release's (without) both succeed on the migrated schema. `createInvitation` now only needs the event's id.

### ✅ T-312d · Drop `eventDate` / `venue` · S

- Drop the two columns, and delete the finished T-303 backfill (`prisma/backfill-wedding-event.ts`, `src/server/backfill/`, `db:backfill-wedding`). Deploy after T-312c is live.
- **As built:** migration `20261030100000_drop_legacy_invitation_columns` refuses to run if the database has invitations and T-312c's migration finished under 10 minutes ago (i.e. both arrived in one deploy, while the previous release may still be writing the columns); fresh databases pass straight through. The backfill and its `DEPLOYMENT.md` section are deleted.

---

## Phase 4 — Remove hard-coded content / theming

### ✅ T-401 · Event content fields · S

Add to `Event`: `hostNames`, `headline`, `tagline`, `familyLines` (JSON), `dressCode`, `colorPalette` (JSON), `coverImageUrl`, `notes`.

- **Files:** ~3
- **As built:** the text fields are nullable; `familyLines` (`[{ name, detail? }]`) and `colorPalette` (`[{ name, hex }]`) are `JSONB NOT NULL DEFAULT '[]'`, so "unset" is an empty list rather than Prisma's `DbNull`/`JsonNull`. Their zod shapes live in `src/lib/event-content.ts` (client-safe, for T-402's form and T-403's page). `eventRepo` now returns its own `Event` type with those two fields typed, parsing them on every read; a stored value that doesn't match reads as `[]` rather than breaking the page. `hostNames` empty means "use the title"; `headline` empty means "use the type's wording" (T-407). Nothing reads the fields yet.

### ✅ T-402 · Event settings page · M

`/dashboard/events/[eventId]/settings`, a form to edit all the event fields.

- **Depends on:** T-401
- **Files:** ~6
- **As built:** `PUT /api/events/[eventId]` (owner only, via `requireEventOwner`) replaces the event's settings: the form sends every field, and blank or missing optional ones are cleared (`updateEventSchema`, which shares the title/type/date/zone/deadline rules with `createEventSchema`). The slug can't be edited, since shared links and QR codes point at it. `coverImageUrl` isn't on the form: the CSP only allows images from `'self'`, so it waits for T-406's upload. The page is server-rendered: it checks ownership itself (it loads the event; the layout check isn't enough on its own) and prefills dates on the event's clock with the new `utcToZonedLocal()`. Families and colours are add/remove lists, and fully empty rows are dropped on save. The new event form's type list, select style and error mapping moved to `src/components/events/event-form.ts`. The dashboard header has a Settings button, and the tenant isolation test covers the route and the page.

### ✅ T-403 · Public event page reads from DB · M

Replace the hard-coded `src/app/page.tsx` with `/e/[slug]`. The hero, details, countdown, and footer receive the `event` as props. Remove the names, date, and colors from `src/components/home/*`.

- Show dates and times in the event's `timezone`, not the viewer's (today the invite, success and edit pages format in the browser's zone).

- **Depends on:** T-401
- **Files:** ~10
- **As built:** `/e/[slug]` is public (outside the middleware matcher) and 404s for an unknown slug. The hero splits host names written as "A & B" or "A and B" into the two-name layout with a monogram, and shows anything else as written. The hero uses the title when `hostNames` is empty and "You're invited to celebrate" when `headline` is empty (until T-407). The fixed church and reception cards are now a "when" card (with the RSVP deadline) and a "where" card. Dress code, colours of the day and notes ("Good to Know") only appear when set. The countdown counts to `event.date`. The theme colours are still the fixed brand palette (T-405). `/` redirects to `/dashboard` (signed-out visitors land on `/login`) until T-409. Invitations now carry `eventTimezone`, and the guest invite, success and edit pages format with the new `formatEventDate()` / `formatEventTime()` / `formatEventDateTime()`. Any event is public to anyone who knows or guesses its slug, which comes from the title.

### ✅ T-404 · Dynamic metadata · S

Use `generateMetadata` on `/e/[slug]` (title, description, OG image). Make the root `layout.tsx` metadata generic.

- **Files:** ~3
- **As built:** the title is the host names (or the event title), and the description is the tagline plus when and where, on the event's clock. The OG image is generated per event by `src/app/e/[slug]/opengraph-image.tsx` (`next/og`, 1200×630, no storage needed). Next adds it to `og:image` and `twitter:image` as an absolute URL from `BETTER_AUTH_URL`. Event pages are `noindex, nofollow`: anyone with the link can open them, but search shouldn't list hosts' dates and venues. The page, its metadata and the image share `src/server/events/public-event.ts`, and React `cache` keeps it to one query per page render. The root layout is "Attendly" with a `%s · Attendly` title template. An unknown slug's metadata says only "Event not found". Checked in a running dev server: tags, a 200 PNG, and a 404 for an unknown slug.

### ✅ T-405 · Theme presets · M

Store `theme` on `Event` (accent color, font pairing). Apply it with CSS variables at the event page root. Start with 3–4 presets, with `#C07A54` as the default.

- **Files:** ~8
- **As built:** `Event.theme` is a preset id (`TEXT NOT NULL DEFAULT 'terracotta'`), not an enum, so adding a preset needs no migration. An id that's no longer in the code reads as the default. `src/lib/themes.ts` has four presets: Terracotta (the original look), Sage garden, Midnight navy and Blush. Each has nine colour roles and a heading/body font pair. `themeStyle()` sets them as `--event-*` variables on the `/e/[slug]` root, and the `src/components/home/*` components read those variables instead of hex values. White text on each accent is at least as readable as on the original. Playfair Display and Montserrat are self-hosted with `next/font` and not preloaded, so a page only downloads the fonts its theme uses (CSP unchanged). The settings page has a theme picker (swatches, keyboard focus ring), and the generated preview image (T-404) uses the theme's colours.

### ✅ T-406 · Cover image upload · M

Upload to S3, R2, or UploadThing and store the URL. Validate size and type.

- **Files:** ~6
- **As built:** images are stored in Postgres (`event_images`, `bytea`, cascading from the event) rather than S3, R2, UploadThing or a disk volume. That means no new paid service, no volume (a Railway volume would mean root-owned mounts and downtime on every redeploy), images are included in database backups, and deleting an event or account deletes its covers. Storage goes through `imageRepo` (`src/server/repositories/image.repo.ts`), so moving to S3/R2 later changes only that plus a one-off copy. `POST /api/events/[eventId]/cover` (owner only, multipart `file`) refuses bodies over 5 MB, decodes with sharp and accepts only JPEG/PNG/WebP by content (an SVG or GIF labelled as a PNG is refused). It refuses decompression bombs (40 MP limit), applies the photo's orientation, resizes to at most 2000px wide and re-encodes as WebP, which drops EXIF including GPS. The new image, the event's `coverImageUrl` (`/uploads/<uuid>.webp`) and deleting the previous image happen in one transaction. `DELETE .../cover` clears the cover. `GET /uploads/[file]` serves images by id with immutable caching (a new cover gets a new id), so each visitor's browser fetches an image once. The settings page uploads and removes straight away (separate from Save), and `/e/[slug]` shows the cover as a banner above the hero. Because images are same-origin, the CSP is unchanged. Not done: covers in the generated preview image. Move to object storage if images reach tens of thousands or traffic gets heavy.

### ✅ T-407 · Copy by event type · S

Wedding, birthday, and corporate events get different default wording ("Solemnly request…" vs "You're invited to…").

- **Files:** ~4
- **As built:** `src/lib/event-copy.ts` holds each type's wording (`copyFor(type)`, unknown types read as OTHER): the event page headline when the host leaves it empty, the countdown label, the subtitle on a guest's invitation (it said "Wedding Celebration" for every event), and the share email/WhatsApp text on the invite success page (it said "our wedding"). Invitations now carry `eventType` alongside `eventTimezone`. The settings page's headline placeholder shows the type's default, which is what guests see while it's empty. The generated invite image's wording is left for T-408.

### ✅ T-408 · Generated invite image uses event data · S

Update the image generation in `utils.ts` (names, date, venue, colors) to read from `Event`.

- **Files:** ~3
- **As built:** moved out of `utils.ts` into `src/lib/invitation-image.ts`. `invitationCardContent()` (pure, unit-tested) decides what's on the card: a monogram for a wedding couple, otherwise the names written out; date and time on the event's clock; the type's invitation and closing wording (T-407); venue name and address; colours of the day; and the tagline in place of the hard-coded hashtag, all in the event's theme colours (T-405). Sections the event doesn't have are left out. The canvas now sizes itself to what it draws (drawn on a scratch canvas, then cropped) instead of a hand-kept height sum. The event dashboard layout provides the event's card details through `EventCardProvider` / `useEventCard()`, so the invitations table and invite success page need no extra request, and saving settings refreshes it. Also fixed: a non-wedding title containing "and" was shown as a couple ("Acme Gala and Awards Night" → "A & A") on the event page hero too; couples are now weddings only, with at most three words a side. Checked by rendering cards with a Node canvas.

### ✅ T-409 · Product landing page at `/` · M

Marketing page: what it is, how it works, sign-up CTA.

- **Files:** ~6
- **As built:** `/` is a landing page (it redirected to `/dashboard`): a hero with a sample invitation drawn in HTML (a made-up couple and a fake QR pattern, so there's no image to keep up to date), what the product does today, four "how it works" steps, a closing call to action and a footer, in `src/components/landing/`. Visitors get "Create your event" (`/signup`) and "Log in"; signed-in hosts get "Go to your events" (`/dashboard`) instead. Like middleware, it only checks that the session cookie is present, and `/dashboard` sends a stale cookie to `/login`. It makes no pricing claims, since billing is Phase 8.

### ✅ T-410 · Link to the public event page from the dashboard · S

Hosts had no way to find or share their event page (`/e/[slug]`, T-403): nothing in the app showed the slug.

- **Files:** ~4
- **As built:** the event layout shows a bar above every page of an event's dashboard (dashboard, settings, create/edit/bulk) with the page's path, **View** (opens it in a new tab) and **Copy link** (copies the full URL from the browser's origin, and says so if the clipboard is refused). It's not on the `/dashboard` events list, whose cards are already links. The tenant isolation test checks the owner's layout includes it; other accounts still get a 404 before anything renders.

---

## Phase 5 — Guest tickets & door check-in

An invitation is a ticket. The guest's link and QR code only show their invitation; they can't confirm or check themselves in. At the venue, the host or a door helper scans the QR code and admits the guest, and each invitation admits at most its number of people (the guest plus their plus-ones). If a guest sends their QR code to a friend outside after going in, the scan shows "Already checked in" with the time and who admitted them. Door helpers get a check-in link that does nothing else, so the host never shares their password or the dashboard.

Online RSVP (guests confirming or declining before the event) is out of scope for now; see T-611.

The original wedding has passed, so no live event depends on the shared PIN flow while these tickets land. Until T-508 removes it, the PIN flow keeps working for QR codes made before T-503.

### T-501 · Per-invitation `accessToken` · S

Add `accessToken` (unique, random 32 bytes, base64url) to `Invitation`. Backfill existing rows. Generated on create (single and bulk).

- **Files:** ~3

### T-502 · Read-only guest ticket page `/e/[slug]/i/[token]` · M

Look up the invitation by token and the event by slug (a token from another event is a 404). The token is the credential, so there's no PIN. The page shows the guest's name, how many people it admits, the date and time (event time zone), the venue, the QR code and "Show this QR code at the entrance", in the event's theme. It has no confirm, decline or check-in buttons. A cancelled invitation (`RESCINDED`) says so instead of showing the QR code.

- `noindex` and `Referrer-Policy: no-referrer`, so the token doesn't leak to search engines or other sites.
- **Depends on:** T-501, T-403
- **Files:** ~6

### T-503 · QR codes encode the ticket link · S

New QR codes, the downloaded/shared invitation image and the success page point to `/e/[slug]/i/[token]`. Regenerate codes for existing invitations.

- **Depends on:** T-502
- **Files:** ~4

### T-504 · Check-in model and API · M

Add `admittedCount` (default 0) to `Invitation` and a `CheckIn` table (invitation, event, count, time, who: the host's user id or a door link from T-506) as the audit trail. `POST /api/events/[eventId]/check-in` (owner only) takes the scanned token and how many people are entering.

- One conditional update, so two helpers scanning the same code at the same moment can't admit more than allowed: admit only if the invitation is in this event, isn't `DECLINED`/`RESCINDED`, and `admittedCount + count <= plusOne + 1`.
- Results: admitted (name, now X of N), already full (when and by whom, from the last `CheckIn`), not valid (cancelled or declined), not found (unknown token or another event's).
- Checking in sets the status to `CONFIRMED`, so the dashboard's "confirmed" keeps meaning "arrived", as it did with the PIN flow. Revisit when online RSVP lands (T-611).
- **Depends on:** T-501
- **Files:** ~7

### T-505 · Check-in scanner screen in the dashboard · M

`/dashboard/events/[eventId]/check-in`: the camera scanner (`html5-qrcode`, as the current home page scanner uses) calls the T-504 API. A full-screen result in green or red shows the guest's name and "Admits N"; when more than one person can enter, the helper picks how many are entering now (default: everyone left). Then "Scan next". If the camera is unavailable, paste or type the code.

- Shared result and scanner components, reused by the door helper screen (T-507).
- **Depends on:** T-504
- **Files:** ~6

### T-506 · Door helper links: create, name, revoke · M

A `DoorLink` table: event, name ("Ben, front gate"), the SHA-256 hash of a random token (the token itself is shown once), created, revoked, expires (default: the day after the event). On the event dashboard the host creates a link, copies it, sees each link's check-in count, and revokes it. Owner-only API under `/api/events/[eventId]/door-links`.

- **Depends on:** T-504
- **Files:** ~7

### T-507 · Door helper scanner `/door/[token]` · M

No sign-in: the link is the credential, and it can only check people in for its event. The page shows the event's name and the T-505 scanner; `POST /api/door/[token]/check-in` runs the same check-in as T-504, recording the link as who admitted the guest. A revoked or expired link shows "This check-in link no longer works; ask the host for a new one". No guest list, search or other data, `noindex`.

- Add the new routes to `ROUTE_POLICY` in the tenant isolation test (a link must not check in another event's guests).
- **Depends on:** T-505, T-506
- **Files:** ~6

### T-508 · Remove shared PIN flow · M

Delete `invite-pin/`, `api/invite/verify-pin`, the `INVITE_PIN` env var, the guest cookie logic in middleware, `invite/[id]/`, `api/invitations/[id]/`, the PIN guest endpoints in `invitationApi.ts`, and the scanner on the public event page (door check-in replaced it).

- Delete `invitationRepo.getInvitationForGuest` / `updateRsvpStatusForGuest` (T-306), the last unscoped invitation queries.
- Delete `src/server/auth/session.ts` (the T-101 token code, now only used for guest tokens) and `requireGuest()` / `requireAdminOrGuest()`; the remaining tests that sign an `admin` token go with it.
- **Depends on:** T-503, T-507
- **Files:** ~15

### T-509 · Check-in dashboard: arrived vs expected · S

On the event dashboard: people admitted vs expected, invitations checked in, the latest check-ins (who, when, by whom), and an undo for a check-in made by mistake (host only).

- **Depends on:** T-504
- **Files:** ~5

### T-510 · "Add to calendar" (ICS) on the ticket page · S

- **Depends on:** T-502
- **Files:** ~3

---

## Phase 6 — Product features

### T-601 · CSV export of guest list · S

### T-602 · Email invitations to guests (single + bulk) · M — needs `email` on `Invitation`, uses T-206

### T-603 · RSVP reminder emails (manual trigger) · S — needs T-611

### T-604 · Scheduled reminders (cron / job queue) · M

### T-605 · Notify host on new RSVP (email) · S — needs T-611

### T-606 · ~~Check-in mode~~ · moved to Phase 5 (T-504, T-505)

### T-607 · ~~Check-in dashboard~~ · moved to Phase 5 (T-509)

### T-608 · Co-hosts: invite another user to manage an event (consider Better Auth `organization` plugin vs own `EventMember` + roles) · L → split into model/API and UI tickets when started

Door helpers who only check guests in use T-506 links, not co-host accounts.

### T-609 · WhatsApp share link per guest · S

### T-610 · Duplicate event / archive event · S

### T-611 · Online RSVP from the ticket page · L → split when started

Guests confirm or decline before the event from their ticket page (`PATCH /api/rsvp/[token]`), optionally with how many are coming, meal choice and dietary notes, and the form turns read-only after `rsvpDeadline`. Check-in (T-504) currently sets `CONFIRMED` to mean "arrived"; with online RSVP, "confirmed" (intends to come) and "checked in" (arrived) become separate counts in the dashboard and metrics.

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
