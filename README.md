# Invoicer

A multi-user invoicing app for small businesses. Create invoices, manage clients and services, track payment status, and download professional PDF invoices.

## Features

- **Accounts**: email/password sign-up and login. Every user's data is fully isolated.
- **Business profile**: name, logo, address, tax/BIN number, payment details (bank, bKash, etc.), and invoice defaults.
- **Clients**: contact details, addresses and tax IDs.
- **Services**: a catalog with default prices and units (hour, day, project…) that you can pick when adding invoice lines.
- **Invoices**:
  - Line items with live totals
  - A currency per invoice (BDT, USD, EUR, GBP, INR and more)
  - Percentage or fixed discounts, plus tax/VAT
  - Automatic numbering (`INV-0001`, `INV-0002`, …)
  - Status tracking (draft → sent → paid, cancelled), with overdue detected automatically
  - Duplicate, edit, delete
  - Search and filter by status
- **PDF download**: an A4 invoice with your logo, payment details, notes and terms.
- **Dashboard**: outstanding, overdue, paid this month, total collected (grouped by currency), a 6-month revenue chart and recent invoices.

## Tech stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Drizzle ORM · PostgreSQL · `@react-pdf/renderer` · `jose` signed session cookies + bcrypt.

## Running locally

```bash
npm install
cp .env.example .env              # then set SESSION_SECRET (openssl rand -base64 48)
npm run db:migrate                # creates the tables
npm run dev                       # http://localhost:3000
```

If `DATABASE_URL` is **not** set, the app uses an embedded PostgreSQL ([PGlite](https://pglite.dev)) stored in `./.pglite`, so you don't need to install a database to try it. PGlite only allows one process at a time: stop `npm run dev` before running `npm run db:migrate`.

To use a real PostgreSQL server locally, set `DATABASE_URL="postgres://user:pass@localhost:5432/invoice"` and run `npm run db:migrate`.

## Deploying (hosted)

The app runs anywhere Node.js does. The simplest setup is:

1. Create a PostgreSQL database, for example on [Neon](https://neon.tech) or [Supabase](https://supabase.com) (both have free tiers).
2. Push this repo to GitHub and import it into [Vercel](https://vercel.com) (or Railway, Render, a VPS…).
3. Set the environment variables:
   - `DATABASE_URL`: your Postgres connection string
   - `SESSION_SECRET`: a long random string (`openssl rand -base64 48`)
4. Run the migrations against the production database once (and again after any schema change):

   ```bash
   DATABASE_URL="postgres://..." npm run db:migrate
   ```

For a VPS: `npm run build && npm start` behind a reverse proxy (nginx/Caddy) with HTTPS. Session cookies are marked `Secure` in production.

## Changing the database schema

Edit `src/db/schema.ts`, then:

```bash
npm run db:generate   # writes a new SQL migration into ./drizzle
npm run db:migrate    # applies it
```

## Project layout

```
src/
  app/
    (auth)/           login & signup pages
    (app)/            dashboard, invoices, clients, services, settings
    actions/          server actions (all scoped to the logged-in user)
    api/invoices/[id]/pdf/   PDF download route
  components/         shared UI (sidebar, invoice preview, buttons…)
  db/                 Drizzle schema + connection
  lib/                session, data-access layer, money/tax math, PDF template
  proxy.ts            redirects logged-out users to /login
drizzle/              SQL migrations
```

## Notes

- PDFs use the built-in Helvetica font, so amounts are written with currency codes (e.g. `BDT 12,500.00`) instead of symbols like ৳ or ₹, which that font can't display.
- Logos are stored in the database (PNG/JPEG, up to 500 KB), so no separate file storage is needed.
