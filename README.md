# TheWingsScan

TheWingsScan is a clean, India-first flight discovery app built around Travelpayouts and Aviasales data. It helps users scan fares, compare effective prices with saved card offers, track route history, create fare alerts, and hand off booking clicks through a production-safe affiliate flow.

## What It Does

- **Travelpayouts fare search**: Uses Travelpayouts Data API for airports, fare calendars, route intelligence, and cached price discovery.
- **Aviasales real-time ready**: Includes the server-only marker, token, host, user IP, signature, polling, and click-link plumbing needed for real-time search.
- **Modern TheWingsScan experience**: First-screen branded search, lightweight animations, responsive sections, and simplified route-to-booking copy.
- **Effective price engine**: Applies saved card and bank offers to show the best practical fare for each user.
- **Alerts and history**: Stores search history, price history, booking clicks, and authenticated price alerts in Supabase through Prisma.
- **Secure affiliate handoff**: Generates Travelpayouts booking links server-side when a real-time fare includes the required booking token.

## Stack

- **App**: Next.js 16 App Router, React 19, TypeScript
- **UI**: Tailwind CSS v4, Framer Motion, GSAP, Lenis
- **State**: Zustand
- **Data**: Travelpayouts / Aviasales APIs, Prisma, Supabase PostgreSQL
- **Auth**: NextAuth.js with credentials and Google OAuth
- **Email**: Resend
- **Tests**: Vitest

## Local Setup

Install dependencies and generate Prisma client:

```bash
npm install
npx prisma generate
```

Create `.env.local` from `.env.example`, then fill in at least:

```env
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_me

TRAVELPAYOUTS_TOKEN=your_travelpayouts_token
TRAVELPAYOUTS_MARKER=your_marker_id
NEXT_PUBLIC_TRAVELPAYOUTS_MARKER=your_marker_id
TRAVELPAYOUTS_HOST=your-production-domain.com
TRAVELPAYOUTS_ENABLE_REALTIME_SEARCH=false
```

Push the schema when your database is ready:

```bash
npx prisma db push
```

Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Travelpayouts Notes

The Data API token is server-only. Real-time Aviasales flight search should only be enabled in production with a real host, a real user IP strategy, and the required Travelpayouts marker. Local development defaults to calendar/search data so the app remains useful without exposing secrets or generating invalid click links.

Useful environment variables:

| Variable | Purpose |
| --- | --- |
| `TRAVELPAYOUTS_TOKEN` | Server-only Travelpayouts API token |
| `TRAVELPAYOUTS_MARKER` | Server-only affiliate marker |
| `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER` | Public fallback marker for Aviasales handoff links |
| `TRAVELPAYOUTS_HOST` | Production host sent to real-time search |
| `TRAVELPAYOUTS_DEFAULT_USER_IP` | Fallback non-localhost user IP for real-time search |
| `TRAVELPAYOUTS_ENABLE_REALTIME_SEARCH` | Enables Aviasales real-time search when set to `true` |
| `TRAVELPAYOUTS_API_BASE` | Optional override for the Travelpayouts API base URL |
| `TRAVELPAYOUTS_PARTNER_OFFERS_JSON` | Optional JSON payload for curated partner/card offers |

## Verification

```bash
npm test
npm run lint
npm run build
```

## Deployment

Deploy on Vercel or any Node-compatible host with the same environment variables. The cron tracker uses Travelpayouts-powered search and local price history; no Chromium or Playwright browser binaries are required for flight search.

```bash
vercel --prod
```

## License

MIT
