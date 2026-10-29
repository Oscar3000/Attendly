# CLAUDE.md - Attendly

## Project Overview

Attendly is a wedding invitation management system with QR codes, RSVP tracking, and an admin dashboard. Built with Next.js 16 (App Router), TypeScript, PostgreSQL, and Prisma.

## Tech Stack

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
    login/                    # Admin login
  components/
    admin/                    # Dashboard components (header, table, metrics, status)
    button.tsx                # Reusable button (variants: primary, secondary, danger, attendly)
    qr-code.tsx               # QR code display
  lib/
    types.ts                  # TypeScript interfaces
    utils.ts                  # Formatting, QR generation, status helpers
  server/                     # Server-only code (`import 'server-only'`)
    db/client.ts              # Prisma client singleton
    repositories/             # invitation.repo.ts, metrics.repo.ts (all Prisma queries)
  store/
    store.ts                  # Redux store config
    invitationApi.ts          # RTK Query API slice
    ReduxProvider.tsx          # Provider wrapper
prisma/
  schema.prisma               # DB schema (Invitation model, RsvpStatus enum)
middleware.ts                  # Auth route protection
```

## Database Schema

Single model: `Invitation` with fields: id (cuid), name, qrCode, eventDate, venue, status (PENDING|CONFIRMED|DECLINED|RESCINDED), plusOne, createdAt, updatedAt. Table name: `invitations`.

## Auth Flow

- **Admin**: Password login -> signed `auth_token` cookie (HS256 JWT, role `admin`) -> access to `/admin/*` and `/api/admin/*`
- **Guest**: PIN verification -> signed `invite_token` cookie (role `guest`) -> access to `/invite/*`
- Route handlers also call `requireAdmin()` / `requireAdminOrGuest()` from `src/server/auth/guards.ts` (guests may only GET one invitation and PATCH its status)
- Tokens are signed and verified in `src/server/auth/session.ts` (edge-safe; stopgap until Better Auth in T-204)
- **Middleware** verifies the signed cookies; a missing, forged or expired token redirects to `/login` or `/invite-pin` (pages) or returns 401 (API)

## Environment Variables

All required variables are validated at startup (`src/instrumentation.ts` -> `src/server/env.ts`); the server exits if any is missing. Read them with `getEnv()`, not `process.env`.

- `DATABASE_URL` - PostgreSQL connection string (required)
- `ADMIN_PASSWORD` - Admin login password (required)
- `AUTH_SECRET` - Signs session cookies; at least 32 characters (required, generate with `openssl rand -base64 32`)
- `INVITE_PIN` - Guest PIN, at least 4 characters (required, no default)
- `BETTER_AUTH_SECRET` - Better Auth secret; at least 32 characters, different from `AUTH_SECRET` (required)
- `BETTER_AUTH_URL` - Public app URL for Better Auth, e.g. `http://localhost:3000` (required)
- `NEXT_PUBLIC_BASE_URL` - App URL for QR codes (default: http://localhost:3000)
- `ADMIN_EMAIL`, `ADMIN_NAME` - Only read by `npm run db:seed` (`prisma/seed.ts`), not at startup; the seed uses `ADMIN_PASSWORD` as the account password

## Key Patterns

- Server Components by default; `'use client'` for interactive UI
- RTK Query for data fetching with tag-based cache invalidation
- Repositories in `src/server/repositories/` hold all Prisma operations; route handlers stay thin
- `utils.ts` has status converters between Prisma enums and app types
- Path alias: `@/*` maps to `./src/*`
- Security headers and the Content Security Policy live in `next.config.ts`. Everything loads from `'self'`; adding an external script, font, image or API means updating the CSP, or the browser blocks it
- Pagination defaults: 10 items per page
- Tests: Vitest, colocated as `*.test.ts` (unit) and `*.db.test.ts` (real Postgres, tables truncated before each test)
