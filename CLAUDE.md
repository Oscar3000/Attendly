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
npm run db:migrate       # Prisma migrate dev
npm run db:studio        # Prisma Studio
npm run db:reset         # Reset database
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
    db.ts                     # Database service layer (wraps Prisma)
    types.ts                  # TypeScript interfaces
    utils.ts                  # Formatting, QR generation, status helpers
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

- **Admin**: Password login -> `auth_token` cookie -> access to `/admin/*` and `/api/admin/*`
- **Guest**: PIN verification -> `invite_token` cookie -> access to `/invite/*`
- **Middleware** protects routes; redirects to `/login` or `/invite-pin` on missing token

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `ADMIN_PASSWORD` - Admin login password
- `INVITE_PIN` - Guest PIN (default: "1234")
- `NEXT_PUBLIC_BASE_URL` - App URL for QR codes (default: http://localhost:3000)

## Key Patterns

- Server Components by default; `'use client'` for interactive UI
- RTK Query for data fetching with tag-based cache invalidation
- `db.ts` service layer abstracts all Prisma operations
- `utils.ts` has status converters between Prisma enums and app types
- Path alias: `@/*` maps to `./src/*`
- Pagination defaults: 10 items per page
