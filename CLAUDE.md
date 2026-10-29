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
npm run db:seed          # Create the admin user (needs ADMIN_EMAIL + app env); idempotent
npm run db:backfill-wedding # T-303: create the wedding Event for ADMIN_EMAIL, link unlinked invitations; idempotent
npm run docker:up        # Docker Compose up
npm run docker:down      # Docker Compose down
npm run docker:logs      # View container logs
```

## Project Structure

```
src/
  app/
    admin/                    # Admin dashboard, create/edit invite pages
    api/
      auth/login|logout/      # Admin auth endpoints
      invite/verify-pin/      # Guest PIN verification
      invitations/[id]/       # CRUD for invitations
      admin/                  # Dashboard metrics & status updates
      health/                 # Health check
    invite/[id]/              # Guest invitation view
    invite-pin/               # Guest PIN entry
    login/                    # Email + password login
    signup/                   # Account sign-up (sends a verification email)
    forgot-password/          # Request a password reset email
    reset-password/           # Set a new password from the emailed link (?token= or ?error=)
    account/                  # Account settings: name, email (confirmed by email), password
  components/
    admin/                    # Dashboard components (header, table, metrics, status)
    button.tsx                # Reusable button (variants: primary, secondary, danger, attendly)
    qr-code.tsx               # QR code display
  lib/
    types.ts                  # TypeScript interfaces
    utils.ts                  # Formatting, QR generation, status helpers
  server/                     # Server-only code (`import 'server-only'`)
    db/client.ts              # Prisma client singleton
    repositories/             # invitation.repo.ts, event.repo.ts, metrics.repo.ts (all Prisma queries)
    email/send-email.ts       # sendEmail(): Resend when RESEND_API_KEY is set, console log in dev
  store/
    store.ts                  # Redux store config
    invitationApi.ts          # RTK Query API slice
    ReduxProvider.tsx          # Provider wrapper
prisma/
  schema.prisma               # DB schema (Invitation model, RsvpStatus enum)
middleware.ts                  # Auth route protection
```

## Database Schema

- `Invitation` (`invitations`): id (cuid), name, qrCode, status (PENDING|CONFIRMED|DECLINED|RESCINDED), plusOne, eventId → Event (required, cascade delete), createdAt, updatedAt. The date and venue come from the event; the legacy `eventDate`/`venue` columns are still written (copied from the event) until T-312 drops them
- `Event` (`events`): id (cuid), ownerId → User (cascade delete), slug (unique), type (WEDDING|BIRTHDAY|CORPORATE|OTHER), title, date (UTC) + timezone (IANA), venueName?, venueAddress?, rsvpDeadline?, createdAt, updatedAt
- Better Auth tables: `users`, `sessions`, `accounts`, `verifications` (create users through Better Auth, never with Prisma directly)

## Auth Flow

- **Accounts**: Better Auth email + password (`/signup`, `/login`), endpoints at `/api/auth/*`, server instance from `getAuth()` in `src/server/auth/auth.ts`, client in `src/lib/auth-client.ts`
- **Admin**: any account can sign in, but only the `ADMIN_EMAIL` account may use `/admin/*`, `/api/admin/*` and the admin invitation APIs until invitations are scoped per owner (Phase 3); other accounts get 403 from the API and a "no access" page from `src/app/admin/layout.tsx`
- **Guest**: PIN verification -> signed `invite_token` cookie (role `guest`, `src/server/auth/session.ts`) -> access to `/invite/*` (replaced by per-invitation links in Phase 5)
- Session helpers live in `src/server/auth/current-user.ts`: `getCurrentUser()`, `requireUser()` (401) and `requireAdminUser()` (adds the `ADMIN_EMAIL` 403). Route handlers pass `request.headers`; pages and server actions call them without arguments
- Endpoints guests share with the dashboard use `requireAdminOrGuest()` from `src/server/auth/guards.ts` (guests may only GET one invitation and PATCH its status)
- **Middleware** is optimistic for accounts: it only checks a Better Auth session cookie is present (`getSessionCookie()`), redirecting to `/login` (pages) or returning 401 (API). Guest tokens are verified there

## Environment Variables

All required variables are validated at startup (`src/instrumentation.ts` -> `src/server/env.ts`); the server exits if any is missing. Read them with `getEnv()`, not `process.env`.

- `DATABASE_URL` - PostgreSQL connection string (required)
- `ADMIN_EMAIL` - The one account allowed into the dashboard; also the email `npm run db:seed` creates (required)
- `AUTH_SECRET` - Signs session cookies; at least 32 characters (required, generate with `openssl rand -base64 32`)
- `INVITE_PIN` - Guest PIN, at least 4 characters (required, no default)
- `BETTER_AUTH_SECRET` - Better Auth secret; at least 32 characters, different from `AUTH_SECRET` (required)
- `BETTER_AUTH_URL` - Public app URL for Better Auth, e.g. `http://localhost:3000` (required)
- `NEXT_PUBLIC_BASE_URL` - App URL for QR codes (default: http://localhost:3000)
- `RESEND_API_KEY`, `EMAIL_FROM` - Send email through Resend (`EMAIL_FROM` like `Attendly <hello@yourdomain.com>`, on a domain verified in Resend). Optional: without them, development logs emails (with their links) to the console, and production skips them (sign-up still works; verification and password-reset emails aren't sent, and the verify banner is hidden)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google sign-in (OAuth client from Google Cloud; redirect URI `BETTER_AUTH_URL/api/auth/callback/google`). Optional, both or neither: without them the "Continue with Google" button is hidden
- `ADMIN_PASSWORD`, `ADMIN_NAME` - Only read by `npm run db:seed`: the admin account's password (8+ characters) and optional display name (default `Admin`); not needed at runtime

## Key Patterns

- New invitations go to the admin's only event via `requireCurrentEvent()` (`src/server/events/current-event.ts`, 409 if there are none or several) until routes are scoped by event id (T-307)

- Server Components by default; `'use client'` for interactive UI
- RTK Query for data fetching with tag-based cache invalidation
- Repositories in `src/server/repositories/` hold all Prisma operations; route handlers stay thin
- `utils.ts` has status converters between Prisma enums and app types
- Path alias: `@/*` maps to `./src/*`
- Security headers and the Content Security Policy live in `next.config.ts`. Everything loads from `'self'`; adding an external script, font, image or API means updating the CSP, or the browser blocks it
- Pagination defaults: 10 items per page
- Tests: Vitest, colocated as `*.test.ts` (unit) and `*.db.test.ts` (real Postgres, tables truncated before each test)
