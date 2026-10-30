# CLAUDE.md - Attendly

## Project Overview

Attendly is a wedding invitation management system with QR codes, RSVP tracking, and an admin dashboard. Built with Next.js 16 (App Router), TypeScript, PostgreSQL, and Prisma.

## Tech Stack

- **Runtime**: Node.js 22 LTS (`.tool-versions`; `engines` in `package.json`)
- **Framework**: Next.js 16 (App Router, standalone output, React Compiler enabled)
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL 16 + Prisma 5.19
- **State**: Redux Toolkit + RTK Query
- **Styling**: Tailwind CSS 4 (brand color: #C07A54, background: #FFF9F4)
- **QR Codes**: `qrcode` library
- **Auth**: Custom cookie-based tokens (HTTP-only, 24h expiry)
- **Deployment**: Docker multi-stage build + Docker Compose

## Commands

```bash
npm run dev              # Dev server
npm run build            # Production build
npm run lint             # ESLint with auto-fix
npm run lint:check       # Lint check only
npm run type-check       # TypeScript check (tsc --noEmit)
npm run format           # Prettier format
npm run format:check     # Format check only
npm test                 # All tests (needs test DB: npm run test:db:up)
npm run test:unit        # Unit tests only, no DB
npm run test:db:up       # Start throwaway test Postgres on :5433
npm run test:db:down     # Stop test Postgres
npm run db:migrate       # Prisma migrate dev
npm run db:studio        # Prisma Studio
npm run db:reset         # Reset database (then runs the seed)
npm run db:seed          # Create an account from ADMIN_EMAIL / ADMIN_PASSWORD (script inputs, + app env); idempotent
npm run docker:up        # Docker Compose up
npm run docker:down      # Docker Compose down
npm run docker:logs      # View container logs
```

## Project Structure

```
src/
  app/
    dashboard/                # The user's events (sign-in and email links land here); /admin/* redirects here
    dashboard/events/new/     # Create an event (POST /api/events); slug generated from the title
    dashboard/events/[eventId]/ # Event dashboard, settings, check-in scanner, create/edit/bulk/success pages; layout checks ownership (404 otherwise) and shows the public page link
    api/
      auth/login|logout/      # Admin auth endpoints
      invite/verify-pin/      # Guest PIN verification
      events/                 # POST: create an event (any signed-in user becomes its owner)
      events/[eventId]/       # Event-scoped, owner only (requireEventOwner): PUT settings, invitations (+ [id], bulk), metrics, status, check-in
      invitations/[id]/       # PIN guests only: GET their invitation, PATCH its RSVP (requireGuest); removed in T-508
      health/                 # Health check
    e/[slug]/                 # Public event page (no sign-in, noindex) + generated link preview image (opengraph-image.tsx)
    e/[slug]/i/[token]/       # A guest's ticket (T-502): the token is the credential; read-only, QR code to show at the entrance
    invite/[id]/              # Guest invitation view
    invite-pin/               # Guest PIN entry
    login/                    # Email + password login
    signup/                   # Account sign-up (sends a verification email)
    forgot-password/          # Request a password reset email
    reset-password/           # Set a new password from the emailed link (?token= or ?error=)
    account/                  # Account settings: name, email (confirmed by email), password
  components/
    admin/                    # Dashboard components (header, table, metrics, status)
    check-in/                 # Door check-in: QrCamera and CheckInFlow (scan, how many, green/red result); wording in src/lib/check-in.ts
    landing/                  # The product landing page at / (sign-up CTA, or "Your events" when signed in)
    button.tsx                # Reusable button (variants: primary, secondary, danger, attendly)
    qr-code.tsx               # QR code display
  lib/
    types.ts                  # TypeScript interfaces
    utils.ts                  # Formatting, QR generation, status helpers
    invitation-image.ts       # The downloadable/shareable invitation image (canvas), from the event's details
  server/                     # Server-only code (`import 'server-only'`)
    db/client.ts              # Prisma client singleton
    repositories/             # invitation.repo.ts, event.repo.ts, metrics.repo.ts, image.repo.ts, check-in.repo.ts (all Prisma queries)
    email/send-email.ts       # sendEmail(): Resend when RESEND_API_KEY is set, console log in dev
    uploads/cover-images.ts   # Cover uploads: sharp re-encode to WebP, stored in Postgres (image.repo.ts), served by /uploads/[file]
  store/
    store.ts                  # Redux store config
    invitationApi.ts          # RTK Query API slice
    ReduxProvider.tsx          # Provider wrapper
prisma/
  schema.prisma               # DB schema (Invitation model, RsvpStatus enum)
middleware.ts                  # Auth route protection
```

## Database Schema

- `Invitation` (`invitations`): id (cuid), name, status (PENDING|CONFIRMED|DECLINED|RESCINDED), plusOne, accessToken (unique secret in the guest's ticket link `/e/<slug>/i/<token>`), admittedCount (people let in at the door, at most plusOne + 1), eventId → Event (required, cascade delete), createdAt, updatedAt. The date and venue come from the event. `qrCode` is unused (dropped in T-508): owner reads return `ticketUrl` and a QR code made from the token, PIN-guest reads neither
- `Event` (`events`): id (cuid), ownerId → User (cascade delete), slug (unique), type (WEDDING|BIRTHDAY|CORPORATE|OTHER), title, date (UTC) + timezone (IANA), venueName?, venueAddress?, rsvpDeadline?, page content (hostNames?, headline?, tagline?, dressCode?, coverImageUrl?, notes?, and JSON `familyLines` / `colorPalette`, typed in `src/lib/event-content.ts` and `[]` when unset), createdAt, updatedAt
- `CheckIn` (`check_ins`): id (cuid), invitationId → Invitation, eventId → Event (both cascade delete), count, checkedInByUserId? → User (set null), createdAt. One row per admission at the door (T-504)
- `EventImage` (`event_images`): id (uuid), eventId → Event (cascade delete), bytes (re-encoded WebP), contentType, createdAt. Uploaded covers, served at `/uploads/<id>.webp`
- Better Auth tables: `users`, `sessions`, `accounts`, `verifications` (create users through Better Auth, never with Prisma directly)

## Auth Flow

- **Accounts**: Better Auth email + password (`/signup`, `/login`), endpoints at `/api/auth/*`, server instance from `getAuth()` in `src/server/auth/auth.ts`, client in `src/lib/auth-client.ts`
- **Dashboard pages** (`/dashboard/events/[eventId]/*`) and the event API (`/api/events/...`): owning the event is the permission; other accounts get 404, signed-out users go to `/login` (pages) or get 401 (API)
- **Guest**: PIN verification -> signed `invite_token` cookie (role `guest`, `src/server/auth/session.ts`) -> access to `/invite/*` (replaced by per-invitation links in Phase 5)
- Session helpers live in `src/server/auth/current-user.ts`: `getCurrentUser()` and `requireUser()` (401). Route handlers pass `request.headers`; pages and server actions call them without arguments
- PIN guests use `GET`/`PATCH /api/invitations/[id]`, guarded by `requireGuest()` from `src/server/auth/guards.ts`; account sessions get 401 there
- **Middleware** is optimistic for accounts: it only checks a Better Auth session cookie is present (`getSessionCookie()`), redirecting to `/login` (pages) or returning 401 (API). Guest tokens are verified there

## Environment Variables

All required variables are validated at startup (`src/instrumentation.ts` -> `src/server/env.ts`); the server exits if any is missing. Read them with `getEnv()`, not `process.env`.

- `DATABASE_URL` - PostgreSQL connection string (required)
- `AUTH_SECRET` - Signs session cookies; at least 32 characters (required, generate with `openssl rand -base64 32`)
- `INVITE_PIN` - Guest PIN, at least 4 characters (required, no default)
- `BETTER_AUTH_SECRET` - Better Auth secret; at least 32 characters, different from `AUTH_SECRET` (required)
- `BETTER_AUTH_URL` - Public app URL for Better Auth, e.g. `http://localhost:3000` (required)
- `NEXT_PUBLIC_BASE_URL` - App URL for QR codes (default: http://localhost:3000)
- `RESEND_API_KEY`, `EMAIL_FROM` - Send email through Resend (`EMAIL_FROM` like `Attendly <hello@yourdomain.com>`, on a domain verified in Resend). Optional: without them, development logs emails (with their links) to the console, and production skips them (sign-up still works; verification and password-reset emails aren't sent, and the verify banner is hidden)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google sign-in (OAuth client from Google Cloud; redirect URI `BETTER_AUTH_URL/api/auth/callback/google`). Optional, both or neither: without them the "Continue with Google" button is hidden
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` - Only inputs to `npm run db:seed`: the account's email, password (8+ characters) and optional display name (default `Admin`); not app settings

## Key Patterns

- Event times are stored in UTC with an IANA `timezone`; hosts enter wall-clock times. Convert with `zonedTimeToUtc()` (and back to a form value with `utcToZonedLocal()`) and display with `formatEventDateTime()` / `formatEventDate()` / `formatEventTime()` from `src/lib/timezones.ts`; invitations carry `eventTimezone` for this (built on `Intl`, no date library)

- Event-scoped code calls `requireEventOwner(eventId, headers?)` (`src/server/events/require-event-owner.ts`): 401 when signed out, the same 404 for a missing event and someone else's event, and returns `{ user, event }`. Ownership is the only permission; every account has the same powers

- New invitations go to the admin's only event via `requireCurrentEvent()` (`src/server/events/current-event.ts`, 409 if there are none or several) until routes are scoped by event id (T-307)

- Server Components by default; `'use client'` for interactive UI
- RTK Query for data fetching with tag-based cache invalidation. Event-scoped hooks (`useGetEventInvitationsQuery`, `useCreateEventInvitationMutation`, ...) live in `src/store/eventInvitationApi.ts`; their tags carry the event id, so a write only refetches that event's data
- Repositories in `src/server/repositories/` hold all Prisma operations; route handlers stay thin
- Invitation and metrics repository functions take `eventId` and only touch that event's invitations; another event's invitation behaves like a missing one. The only exceptions are `getInvitationForGuest` / `updateRsvpStatusForGuest` (shared-PIN guests, removed in T-508)
- `utils.ts` has status converters between Prisma enums and app types
- Path alias: `@/*` maps to `./src/*`
- Security headers and the Content Security Policy live in `next.config.ts`. Everything loads from `'self'`; adding an external script, font, image or API means updating the CSP, or the browser blocks it
- The event page's colours and fonts come from theme presets (`src/lib/themes.ts`, `Event.theme`), set as `--event-*` CSS variables at the `/e/[slug]` root; components under `src/components/home/` use `var(--event-*)`, never hex values
- Wording that depends on the event type (wedding vs birthday vs corporate) comes from `copyFor(type)` in `src/lib/event-copy.ts`; don't hard-code "wedding" in guest-facing text
- Pagination defaults: 10 items per page
- Tests: Vitest, colocated as `*.test.ts` (unit) and `*.db.test.ts` (real Postgres, tables truncated before each test)
- `src/app/api/tenant-isolation.db.test.ts` discovers every API route; a new route fails it until it's added to `ROUTE_POLICY` ("victim": must refuse another account's data, "own": works on the caller's data, or "not tenant data")
