# Does He Like Me?

Next.js app for tracking one romantic profile per person, running guided check-in flows, and generating blunt AI analysis on chat updates.

## Stack
- Next.js 16 App Router
- React 19
- TypeScript
- Prisma + PostgreSQL
- NextAuth v5
- Tailwind CSS v4

## What Exists
- Auth-backed dashboard and per-profile pages
- Prisma schema for users, profiles, events, state, and entitlements
- Guided relationship check-in flows
- `POST /api/analyze` for structured OpenAI analysis
- Checkout and Stripe webhook placeholders

## Local Setup
1. Install dependencies:
```bash
npm install
```

2. Copy envs and fill them in:
```bash
cp .env.example .env.local
```

3. Generate Prisma client and apply your schema:
```bash
npx prisma generate
npx prisma db push
```

4. Start the app:
```bash
npm run dev
```

Open `http://localhost:3000`.

## Required Environment Variables
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`

## Optional Environment Variables
- `OPENAI_MODEL`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID`
- `APPLE_CLIENT_SECRET`

## Deployment Notes
- Authenticated profile routes require a working PostgreSQL database.
- OAuth sign-in buttons are present, but provider credentials must be configured before those flows work.
- Stripe routes are still stubs and do not create real checkout sessions yet.
