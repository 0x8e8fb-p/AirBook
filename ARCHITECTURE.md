# TheWingsScan — Complete Architecture & Design Reference

> **Last updated:** 2026-05-16  
> **Purpose:** This document is the single source of truth for understanding every line, file, and design decision in the TheWingsScan codebase. Read this before making ANY change.

---

## 1. Project Identity

| Property | Value |
|----------|-------|
| **Name** | TheWingsScan (internal: `thewingsscan`) |
| **Version** | 0.1.0 |
| **Market** | India-first flight search + deal engine |
| **Core Value Prop** | Show "true effective price" after auto-applying Indian bank/credit card offers |
| **Framework** | Next.js 16.2.3 (App Router) + React 19.2.4 |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS v4 + CSS custom properties (tokens) |
| **Database** | PostgreSQL via Supabase (Prisma ORM) |
| **Auth** | NextAuth.js v4 (Google OAuth + Credentials) |
| **Runtime Target** | Vercel Serverless (Mumbai `bom1` region) |

---

## 2. Tech Stack & Dependencies

### Production Dependencies (`package.json`)
| Package | Role |
|---------|------|
| `next` | Framework (App Router) |
| `react`, `react-dom` | UI runtime |
| `typescript` | Type system |
| `tailwindcss`, `@tailwindcss/postcss` | Styling engine |
| `zustand` | Client state management |
| `framer-motion` | Animations |
| `gsap`, `@gsap/react` | Advanced animations (ScrollTrigger, etc.) |
| `lenis` | Smooth scroll |
| `lucide-react` | Icon library |
| `recharts` | Charts (price trends) |
| `next-auth` | Authentication |
| `@next-auth/prisma-adapter` | Auth DB adapter |
| `@prisma/client`, `prisma` | ORM |
| `@supabase/supabase-js` | Supabase client |
| `bcryptjs` | Password hashing |
| `resend` | Transactional email |
| `uuid` | Token generation |
| `zod` | Schema validation |
| `clsx` | Conditional classnames helper |
| `date-fns` | Date utilities |

### Dev Dependencies
| Package | Role |
|---------|------|
| `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` | Unit testing |
| `eslint`, `eslint-config-next` | Linting |

---

## 3. Directory Structure

```
/Users/prabha/Desktop/AirBook/
├── prisma/
│   └── schema.prisma              # DB schema (all models)
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── actions/               # Server Actions (all business logic)
│   │   │   ├── aggregatorActions.ts
│   │   │   ├── alertActions.ts
│   │   │   ├── authActions.ts
│   │   │   ├── compareActions.ts
│   │   │   ├── dealsActions.ts
│   │   │   ├── flightActions.ts
│   │   │   ├── intelligenceActions.ts
│   │   │   ├── priceFreezeActions.ts
│   │   │   ├── priceFreezeActions.test.ts
│   │   │   ├── trafficActions.ts
│   │   │   └── userActions.ts
│   │   ├── api/                   # API Routes + Cron
│   │   │   ├── airports/route.ts
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── calendar/route.ts
│   │   │   ├── cron/track/route.ts
│   │   │   ├── prices/history/route.ts
│   │   │   └── search/route.ts
│   │   ├── aggregator/page.tsx
│   │   ├── alerts/page.tsx
│   │   ├── calendar/[route]/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── compare/page.tsx
│   │   ├── deals/page.tsx
│   │   ├── intelligence/page.tsx
│   │   ├── layout.tsx             # Root layout (SSR theme + fonts)
│   │   ├── login/page.tsx
│   │   ├── page.tsx               # Homepage
│   │   ├── profile/page.tsx
│   │   ├── profile/loading.tsx
│   │   ├── register/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── search/page.tsx
│   │   ├── status/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── globals.css            # Global styles + theme transitions
│   │   └── favicon.ico
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── EnvWarningBanner.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Navbar.test.tsx
│   │   │   └── ScrollProgressBar.tsx
│   │   ├── theme/
│   │   │   ├── ThemeFab.tsx
│   │   │   ├── ThemeFab.test.tsx
│   │   │   ├── ThemeTransitionOverlay.tsx
│   │   │   └── useThemeController.ts
│   │   ├── ui/
│   │   │   ├── AlternativeItineraries.tsx
│   │   │   ├── AirlineLogo.tsx
│   │   │   ├── AnimatedText.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── CostCuttingTips.tsx
│   │   │   ├── CustomCursor.tsx
│   │   │   ├── DateHinter.tsx
│   │   │   ├── FareDipAlert.tsx
│   │   │   ├── FlightArc.tsx
│   │   │   ├── GlassCard.tsx
│   │   │   ├── GroupBookCTA.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── MagneticButton.tsx
│   │   │   ├── OfferClaimGuide.tsx
│   │   │   ├── PriceFreezeButton.tsx
│   │   │   ├── PriceTicker.tsx
│   │   │   ├── ScrollReveal.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Spinner.tsx
│   │   ├── dashboard/
│   │   │   └── PriceTrendChart.tsx
│   │   └── Providers.tsx          # NextAuth SessionProvider
│   │
│   ├── lib/                       # Core libraries (NO React components)
│   │   ├── api/
│   │   │   ├── live-flight-mapper.ts
│   │   │   ├── rateLimit.test.ts
│   │   │   ├── rateLimit.ts
│   │   │   ├── travelpayoutsCache.ts
│   │   │   ├── travelpayoutsClient.test.ts
│   │   │   ├── travelpayoutsClient.ts
│   │   │   └── travelpayoutsTypes.ts
│   │   ├── flight/
│   │   │   ├── offerEngine.test.ts
│   │   │   ├── offerEngine.ts
│   │   │   ├── priceTrend.test.ts
│   │   │   ├── priceTrend.ts
│   │   │   ├── splitTicket.test.ts
│   │   │   └── splitTicket.ts
│   │   ├── theme/
│   │   │   ├── resolve.test.ts
│   │   │   ├── resolve.ts
│   │   │   ├── storage.ts
│   │   │   └── types.ts
│   │   ├── airports.ts            # 600+ airport database + fuzzy search
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── banks.ts               # Available bank/card list
│   │   ├── constants.ts           # Airlines, filters, formatters
│   │   ├── gsap.ts                # GSAP plugin registration
│   │   ├── holidays.ts            # Indian holidays
│   │   ├── lenis.tsx              # Smooth scroll provider
│   │   ├── prisma.ts              # Prisma singleton
│   │   ├── types.ts               # Core TypeScript types
│   │   ├── utils.test.ts          # Utility tests
│   │   ├── utils.ts               # cn(), sortFlights(), fuzzyMatch(), formatBankName()
│   │   └── validators.ts          # Zod schemas
│   │
│   ├── stores/                    # Zustand stores
│   │   ├── search-store.ts        # Search form state
│   │   ├── checkout-store.ts      # Selected flight (persisted to sessionStorage)
│   │   └── user-store.ts          # Owned cards (persisted to localStorage)
│   │
│   ├── styles/
│   │   └── tokens.css             # CSS design tokens (colors, spacing, radii)
│   │
│   ├── test/
│   │   └── setup.ts               # Vitest setup
│   │
│   └── proxy.ts                   # Middleware (rate limiting + auth guard)
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_persistence.sql
│
├── docs/
│   ├── plans/
│   │   └── 2026-04-17-flight-streaming.md
│   ├── superpowers/
│   │   ├── plans/                 # 20+ detailed implementation plans (MD)
│   │   └── specs/                 # Architecture spec documents
│   ├── TheWingsScan-Architecture-Graph.md  # Mermaid architecture diagram
│   └── .DS_Store
│
├── scripts/
│   ├── test_auth_flow.py          # Playwright smoke test
│   └── trigger-cron.sh            # Manual cron trigger
│
├── .github/
│   └── workflows/
│       └── track-flights.yml      # GitHub Actions cron fallback
│
├── public/                        # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── next.config.ts                 # Next.js config (CSP, images, headers)
├── vercel.json                    # Vercel cron + region config
├── tsconfig.json                  # TypeScript paths: @/* -> ./src/*
├── postcss.config.mjs             # Tailwind v4 PostCSS plugin
├── eslint.config.mjs              # ESLint flat config
├── vitest.config.ts               # Vitest config (jsdom, aliases)
├── .env.example                   # Required environment variables
├── .env                           # Local env (gitignored)
├── .gitignore
├── AGENTS.md                      # Agent rules (Next.js breaking changes note)
├── CLAUDE.md                      # Points to AGENTS.md
├── DEPLOY.md                      # Deployment checklist
├── README.md                      # Human-facing project overview
└── ARCHITECTURE.md                # This file
```

---

## 4. Database Schema (Prisma)

**File:** `prisma/schema.prisma` (189 lines)

**Datasource:** PostgreSQL via Supabase, uses connection pooler (`pgbouncer=true`) on port 6543, direct connection on 5432 for migrations.

**Schemas used:** `public`, `auth`

### Models Overview

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `FlightRoute` | Unique route definitions | `origin`, `destination` (@@unique) |
| `PriceHistory` | Time-series price data | `routeId`, `departureDate`, `effectivePrice`, `basePrice`, `airline`, `recordedAt` |
| `User` | App users (extends NextAuth) | `name`, `email`, `username` (unique), `mobile` (unique), `password`, `savedCards` (JSON), `dob` |
| `Account` | NextAuth OAuth accounts | Standard Auth.js model |
| `Session` | NextAuth sessions | Standard Auth.js model |
| `VerificationToken` | Email verification + password reset | `identifier`, `token`, `expires` |
| `PriceAlert` | User price-drop subscriptions | `userId`, `origin`, `destination`, `targetPrice`, `active`, `lastNotified` |
| `SearchHistory` | Audit log of all searches | `userId` (nullable), `origin`, `destination`, `departureDate`, `adults`, `cabinClass` |
| `BookingClick` | Track booking CTA clicks | `userId` (nullable), `route`, `airline`, `price`, `discountSaved` |
| `PriceFreeze` | Fare-lock feature | `userId`, `origin`, `destination`, `departureDate`, `lockedPrice`, `expiresAt`, `redeemed` |
| `FlightOffer` | **DEPRECATED** — kept for migration safety | Previously stored scraped offers; now Travelpayouts owns coupons |

### Indexes
- `PriceHistory`: `routeId + departureDate`
- `PriceFreeze`: `userId + expiresAt`
- `FlightOffer`: `active + validUntil`, `category + bankCode`, `platform`

### Supabase Migrations
- `001_initial_schema.sql`: Raw SQL tables (users, credit_cards, flights_cache, price_history, user_searches, user_alerts, coupons, deals_feed, user_savings_log) with RLS policies and triggers.
- `002_persistence.sql`: Additional tables (search_history, price_alerts, booking_logs) with UUID primary keys and RLS policies.

> **Note:** Prisma schema is the source of truth at runtime. Supabase migrations are legacy/backup SQL.

---

## 5. Environment Variables

**File:** `.env.example`

### Server-Only (NEVER prefix with `NEXT_PUBLIC_`)
| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Supabase pooler (`:6543`, `?pgbouncer=true`) |
| `DIRECT_URL` | Yes | Supabase direct (`:5432`) for migrations |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Bypasses RLS — server-only |
| `NEXTAUTH_SECRET` | Yes | 32+ bytes random |
| `GOOGLE_CLIENT_ID` / `_SECRET` | Optional | OAuth (disabled if empty) |
| `RESEND_API_KEY` | Optional | Transactional email |
| `TRAVELPAYOUTS_TOKEN` | Yes | Server-only Travelpayouts API token |
| `TRAVELPAYOUTS_MARKER` | Yes | Partner marker used for affiliate attribution |
| `TRAVELPAYOUTS_HOST` | Yes | Production host registered with Travelpayouts |
| `TRAVELPAYOUTS_API_BASE` | Optional | Defaults to `https://api.travelpayouts.com` |
| `TRAVELPAYOUTS_ENABLE_REALTIME_SEARCH` | Optional | Enables Aviasales real-time search after approval |
| `TRAVELPAYOUTS_DEFAULT_USER_IP` | Realtime only | Public user IP fallback; never localhost |
| `TRAVELPAYOUTS_PARTNER_OFFERS_JSON` | Optional | JSON offer feed for local bank/partner offer display |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Recommended | Cache + rate limit (falls back to in-memory) |
| `CRON_SECRET` | Yes | Vercel cron auth (`Authorization: Bearer`) |
| `SENTRY_DSN` | Optional | Error tracking |

### Public (safe for browser)
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client anon key (RLS-gated) |
| `NEXT_PUBLIC_SITE_URL` | OG tags, canonical links |
| `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER` | Optional fallback marker for generic Aviasales links |

---

## 6. External API: Travelpayouts

TheWingsScan does NOT scrape flights directly. Flight metadata, fare calendars, cached price intelligence, and optional Aviasales real-time search come from **Travelpayouts / Aviasales** through server-only code.

**Client:** `src/lib/api/travelpayoutsClient.ts` (929 lines)  
**Types:** `src/lib/api/travelpayoutsTypes.ts` (584 lines)  
**Cache:** `src/lib/api/travelpayoutsCache.ts` (84 lines)

### Auth Pattern
Every request sends:
```
x-access-token: <TRAVELPAYOUTS_TOKEN>
User-Agent:  TheWingsScan/1.0 Travelpayouts
```

Real-time Aviasales search additionally uses `TRAVELPAYOUTS_MARKER`, `TRAVELPAYOUTS_HOST`, a public user IP, and an MD5 signature built from the token plus sorted request values. Real-time search is gated behind `TRAVELPAYOUTS_ENABLE_REALTIME_SEARCH=true`.

### Response Shapes
Travelpayouts Data API endpoints may return raw arrays, `{ success, data }` objects, or XML for special offers. The client normalizes the useful JSON endpoints into the app's stable internal shapes and keeps offer ingestion optional via `TRAVELPAYOUTS_PARTNER_OFFERS_JSON`.

### Key Endpoints Consumed
| Endpoint | Purpose | Cache TTL |
|----------|---------|-----------|
| `GET /data/en/airports.json` | Airport metadata + server-side fuzzy search | 24h |
| `GET /data/en/airlines.json` | Airline metadata | 24h |
| `GET /v1/prices/calendar` | Cheapest known fare per day for a route/month | 15m |
| `GET /v2/prices/latest` | Latest cached cheap fares and destination ideas | 15m |
| `POST /v1/flight_search` | Optional real-time Aviasales search initialization | no-store |
| `GET /v1/flight_search_results?uuid=` | Optional real-time results polling | no-store |
| `GET /v1/flight_searches/:search_id/clicks/:terms_url.json` | Buy-link generation after user click | no-store |

### Retry / Circuit Breaker Logic
- `MAX_RETRIES = 3` with exponential backoff (250ms base)
- Retries only on 5xx and 429
- 403 → immediate `TravelpayoutsError` (bad credentials)
- 4xx (except 429) → no retry
- `AbortSignal.timeout(8000)` per request

### Caching
Two-tier cache:
1. **In-memory Map** (max 500 entries, per-process, Node.js serverless)
2. **Upstash Redis** (if `UPSTASH_REDIS_REST_URL` is set)

`cacheKey()` builds colon-delimited keys. `cacheGet()` checks memory first, then Redis. `cacheSet()` writes to both.

### travelpayoutsClient.ts — Exported Functions

#### Classes
- `TravelpayoutsConfigError` — thrown when env vars are missing.
- `TravelpayoutsError` — thrown on HTTP errors; carries `status`, `body?`, `code?`.

#### `requestJson<T>(pathOrUrl, schema, init?)`
Core fetch wrapper with retry, timeout (8s), header injection, and Zod validation.

#### `buildFlightSearchSignature(token, payload)`
Builds MD5 signature for Aviasales real-time search from sorted payload values.

#### `searchAirports(params)`
Fuzzy search over Travelpayouts airport list (cached 24h), falls back to local `searchAirports` in `src/lib/airports.ts`.

#### `listAirlines()`
Returns cached airline metadata.

#### `searchFares(params)`
Primary flight search. Tries real-time if enabled; otherwise uses calendar rows filtered by date.

#### `faresCalendar(params)`
Returns cheapest fare per day for a given month.

#### `listCoupons(_params)`
Parses `TRAVELPAYOUTS_PARTNER_OFFERS_JSON` env var into Coupon array.

#### `latestPrices(origin?, limit?)`
Wraps `/v2/prices/latest`.

#### `routeFaresForAnalysis(origin, destination)`
Returns fares for trend/comparison intelligence.

#### `getDealsTrends()`
Returns top 12 cheapest routes + most active airlines from latest prices.

#### `getTrendingRoutes(limit?)`
Returns biggest_drops array.

#### `getNearbyAirportDeals(iata, _radiusKm?)`
Returns destination ideas from an origin.

#### `searchBankOffers(_bank?, _ota?, limit?)`
Returns coupons mapped to bank offer shape.

#### `searchCoupons(_q?, _bank?, _ota?, _airline?, limit?)`
Returns raw coupons slice.

#### `getForecast(origin, destination, _days?)`
Returns median, p25, p75, sample_size, recommendation.

#### `predictPrice(origin, destination, airline, departDate)`
Predicts price from calendar rows for a specific date + airline.

#### `getBestTimeToBook(origin, destination)`
Returns recommendation, price_trend, cheapest_day_of_week, cheapest_month.

#### `compareOta(origin, destination)`
Groups fares by source API; returns cheapest per source.

#### `compareAirline(origin, destination)`
Groups fares by airline; returns cheapest/average per airline.

#### `getBankCombo(origin, destination)`
Returns best_combo (base_price, bank_savings, effective_price).

#### `getBestForRoute(origin, destination, _bank?)`
Returns cheapest fare for route.

#### `aggregatorSearch(fromCode, toCode, departDate, _returnDate?, _providers?)`
Wraps searchFares into AggregatorFlight shape.

#### `aggregatorBestDeal(fromCode, toCode, departDate)`
Returns cheapestOption wrapper.

#### `multiCitySearch(legs, passengers?)`
Runs searchFares for each leg in parallel.

#### `listProviders()`
Returns `[{ id: "travelpayouts", name: "Travelpayouts / Aviasales", active: true }]`.

#### `getProviderOffers(_provider)`
Alias for `searchCouponents()`.

#### `createBookingLink(searchId, bookingToken)`
Generates affiliate click URL from Travelpayouts.

#### `travelpayoutsApi` (namespace object)
Exports all functions above as a single object.

---

## 7. Authentication System

**File:** `src/lib/auth.ts` (98 lines)

### Providers
1. **Google OAuth** (`next-auth/providers/google`)
   - Profile mapper extracts `id` (from `sub`), `name`, `email`, `image` (from `picture`)
2. **Credentials** (`next-auth/providers/credentials`)
   - Accepts `email` OR `mobile` as identifier
   - Looks up user by `email` or `mobile` (case-insensitive)
   - Verifies password with `bcrypt.compare`
   - **Rejects login if `emailVerified` is null** (email must be verified first)

### Session Strategy: JWT
- `session.strategy = "jwt"`
- Token contains `sub` (user id), `username`, `mobile`, `dob`
- JWT callback refreshes user fields from DB on every call if `trigger === "update"` or missing
- Session callback injects these into `session.user` as `any` (typed at runtime)

### Pages
- Sign in: `/login`
- Error: `/api/auth/error`

### Flows
1. **Registration** (`/register` → `registerUser` action)
   - Creates user with hashed password
   - Creates `VerificationToken`
   - Sends email via Resend (or logs link in dev)
   - Does NOT auto-login
2. **Email Verification** (`/verify-email?token=&email=`)
   - Calls `verifyEmail` action
   - Sets `emailVerified = now()`
   - Deletes token
3. **Password Reset** (`/reset-password?token=&email=`)
   - `sendPasswordResetEmail` creates `VerificationToken` (1h expiry)
   - User clicks link → `updatePassword` hashes new password → deletes token
4. **Delete Account** (`/profile`)
   - Prompts for username confirmation → `deleteAccount` action → `prisma.user.delete` → `signOut`

---

## 8. State Management (Zustand)

### `search-store.ts` (127 lines)
- Holds search form state: origin, destination, dates, passengers, cabin class
- Default departure date: tomorrow
- Actions: `setOrigin`, `setDestination`, `swapAirports`, `setDepartureDate`, etc.
- **NOT persisted** (ephemeral form state)

### `checkout-store.ts` (23 lines)
- Holds `selectedFlight: FlightResult | null`
- **Persisted to `sessionStorage`** via `zustand/middleware` + `createJSONStorage`
- Used to pass flight data from `/search` → `/checkout` (avoids URL serialization)

### `user-store.ts` (28 lines)
- Holds `ownedCards: string[]` (array of bank IDs like `"HDFC"`, `"SBI"`)
- **Persisted to `localStorage`**
- Actions: `setCards`, `toggleCard`, `clearCards`
- Synced to DB via `syncWallet` server action when user clicks "Save Wallet"

---

## 9. Business Logic Layers

### 9.1 Offer Engine (`src/lib/flight/offerEngine.ts`)

**Goal:** Calculate the lowest "effective price" after applying bank/card offers.

**How it works:**
1. Fetches active coupons from Travelpayouts (`listCoupons`)
2. Filters coupons by:
   - Validity dates (`validFrom`, `validUntil`)
   - Applicable airlines (`applicableAirlines`)
   - Applicable routes (`applicableRoutes`)
3. Converts `Coupon` → `BankOffer` (normalized interface)
4. `getOffersForUser()` filters by user's owned cards:
   - UPI wallets (`PAYTM`, `PHONEPE`, etc.) are universal (no card needed)
   - Bank offers require the user to own that bank's card
5. `calculateBestEffectivePrice(baseFare, userCards?, airlineCode?)`:
   - Total fare = `baseFare + CONVENIENCE_FEE (350)`
   - Applies each matching offer, computes discount
   - Returns `{ baseFare, convenienceFee, effectivePrice, appliedOffer }`
6. `getAllApplicableOffers()` returns ALL matching offers sorted by discount (used on checkout)

**Key rule:** If user has no cards saved, only universal offers (UPI wallets, generic promos) are shown.

**Exported functions:**
- `getActiveOffers(airlineCode?)`
- `getOffersForUser(userCards?, price?, airlineCode?)`
- `calculateBestEffectivePrice(baseFare, userCards?, airlineCode?)`
- `getAllApplicableOffers(baseFare, userCards?, airlineCode?)`

### 9.2 Live Flight Mapper (`src/lib/api/live-flight-mapper.ts`)

**Goal:** Normalize enriched fares into stable frontend results while surfacing provider failures honestly to the UI.

**Mapping steps:**
- Accepts either raw `userCards` arrays or a `FetchFlightsOptions` object (`userCards`, `cabin`, `passengers`, `fresh`)
- Calls `searchFlightsAction()` with `throwOnError: true` so provider/config failures are not silently converted into empty arrays
- Normalizes Travelpayouts config, auth, rate-limit, and generic provider failures into `FlightSearchClientError`
- Resolves airline name from `AIRLINES`
- Computes duration from departure/arrival times
- Resolves source API name to `FlightSource`
- Builds `FlightSegment` and `FlightResult` objects
- Sets default baggage: cabin 7kg, checked 15kg

**Exported types/classes/functions:**
- `FetchFlightsOptions`
- `FlightSearchClientError`
- `fetchFlights(origin, destination, date, userCardsOrOptions?)`

### 9.3 Price Trend Analysis (`src/lib/flight/priceTrend.ts`)

**Goal:** Classify price direction for a route+date.

**Algorithm:**
1. Query `PriceHistory` for the route and departure date (last 30 days of records)
2. Requires ≥3 data points
3. Computes `avg30d` and `avg7d`
4. Verdicts:
   - `DROP_LIKELY`: current ≤ 30d avg × 0.97 AND 7d avg < 30d avg
   - `RISING`: current ≥ 30d avg × 1.08 AND 7d avg > 30d avg × 1.03
   - `STABLE`: everything else
5. Confidence: `high` (≥20 samples), `medium` (≥8), `low`

**Exported functions:**
- `analyzePriceTrend(origin, destination, departureDate): Promise<TrendResult>`

### 9.4 Split Ticket Finder (`src/lib/flight/splitTicket.ts`)

**Goal:** Find cheaper itineraries by booking two separate tickets via a hub.

**Algorithm:**
1. Search direct fare `origin → destination`
2. For each hub candidate (`DEL`, `BOM`, `BLR`, `HYD`, `MAA`, `CCU`):
   - Search `origin → hub` and `hub → destination`
   - Check total < direct × (1 - 8%)
   - Check layover between 90-360 minutes
3. Returns top 3 suggestions sorted by savings

### 9.5 Hidden City Finder (`src/lib/flight/splitTicket.ts`)

**Goal:** Find itineraries where booking `A→C` (with stop at B) is cheaper than `A→B` direct.

**Algorithm:**
1. Search direct `origin → destination`
2. For each hub candidate, search `origin → hub`
3. Find fares with stops > 0 and price < direct × 0.92
4. Returns top 2 with **prominent legal warning** in UI

---

## 10. Server Actions (`src/app/actions/`)

All server actions follow the same error handling pattern:
```ts
if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
  console.error("...", err.message);
  return null / [] / default;
}
throw err;
```

### 10.1 `flightActions.ts` (409 lines)
**Core flight search + tracking + analytics.**
- `searchFlightsAction(origin, destination, date, userCards?, opts?)` — dedupes fares by flightNumber+hour bucket, enriches with offer engine, logs search + price history, and supports `pax`, `cabin`, `fresh`, and `throwOnError`.
- `getAndTrackFlights(...)` — alias for `searchFlightsAction`.
- `logSearchAction(origin, destination, date)` — writes to `SearchHistory`.
- `logBookingClick(route, airline, price, discountSaved)` — writes to `BookingClick`.
- `getPlatformStats()` — returns `{ searchesToday, moneySavedMonth }`.
- `fetchCheckoutOffers(baseFare, airlineCode?, userCards?)` — dynamic import of `getAllApplicableOffers`.
- `fetchPriceTrend(origin, destination, date)` — dynamic import of `analyzePriceTrend`.
- `getCheapestNearbyDays(origin, destination, selectedDate, windowDays?)` — queries calendar for ±days.
- `fetchSplitTicketSuggestions(...)` / `fetchHiddenCityOpportunities(...)` — dynamic imports.
- `searchAggregatorFlights(...)` — wrapper around `travelpayoutsApi.aggregatorSearch`.
- `getFlightStatus(flightNumber)` — wrapper.
- `getLiveFlightsSnapshot(bounds?)` — wrapper.
- `createBookingLinkAction(searchId, bookingToken)` — wrapper.
- `getBestDealForRoute(...)` — wrapper.
- `getAirportWeather(iata)` — wrapper.

### 10.2 `authActions.ts` (324 lines)
**Auth lifecycle.**
- `registerUser(formData)` — validates uniqueness (email, username, mobile), hashes password with bcrypt, creates `VerificationToken`, sends Resend email.
- `sendPasswordResetEmail(email)` — creates 1h token, sends reset email.
- `verifyEmail(formData)` — validates token, sets `emailVerified`, deletes token.
- `updateProfile(userId, formData)` — updates name, username, mobile, dob with uniqueness checks.
- `deleteAccount(userId)` — `prisma.user.delete`.
- `updateProfileImage(userId, imageUrl)` — stores base64/compressed image string.
- `updatePassword(formData)` — verifies token, hashes new password, deletes token.

### 10.3 `userActions.ts` (65 lines)
**Card wallet persistence.**
- `syncWallet(ownedCards)` — validates cards against `AVAILABLE_BANK_CARD_IDS`, stores JSON in `User.savedCards`.
- `getUserWallet()` — reads `User.savedCards`, parses JSON, validates.

### 10.4 `alertActions.ts` (77 lines)
**Price alerts.**
- `subscribePriceAlert(source, destination, targetPrice, expiryDays?)` — creates `PriceAlert` row.
- `getPriceAlerts(activeOnly?)` — returns DTO array for logged-in user.
- `removePriceAlert(id)` — soft-delete (sets `active = false`).
- Backward-compat aliases: `createAlert`, `getAlerts`, `deleteAlert`.

### 10.5 `aggregatorActions.ts` (86 lines)
**Multi-OTA aggregation.**
- `searchAggregatorFlights(...)` — calls `travelpayoutsApi.aggregatorSearch`.
- `getAggregatorProviders()` — returns `[{ id: "travelpayouts", name: "...", active: true }]`.
- `getProviderOffers(provider)` — returns coupons.
- `getAggregatorBestDeal(...)` — returns cheapest option.
- `searchMultiCity(legs, passengers?)` — parallel multi-leg search.

### 10.6 `compareActions.ts` (77 lines)
**Fare comparison.**
- `getOtaComparison(origin, destination)` — OTA-level price stats.
- `getAirlineComparison(...)` — airline-level stats.
- `getBestBankCombo(...)` — bank combo analysis.
- `getBestForRoute(...)` — cheapest fare.
- `getFareComparePageData(...)` — `Promise.allSettled` combo of above.

### 10.7 `dealsActions.ts` (76 lines)
**Deals & offers.**
- `getDealsTrends()` — trending routes + active airlines.
- `getNearbyAirportDeals(iata, radiusKm?)` — nearby destination deals.
- `getBankOffers(bank?, ota?, limit?)` — bank offer list.
- `getSearchCoupons(...)` — coupon search.
- `getDealsPageData(origin?)` — combines trends + bankOffers + nearby.

### 10.8 `intelligenceActions.ts` (85 lines)
**ML intelligence.**
- `getPriceForecast(origin, destination, days?)` — median/p25/p75.
- `getMlPricePrediction(origin, destination, airline, departDate)` — predicted price + confidence band.
- `getBookingAdvice(...)` — best-time-to-book recommendation.
- `getTrendingRoutes(limit?)` — biggest drops.
- `getIntelligenceCombined(...)` — `Promise.allSettled` of forecast + prediction + advice.

### 10.9 `trafficActions.ts` (47 lines)
**Compatibility traffic helpers.**
- `getTrafficDaily(...)` — returns empty array until attached.
- `getTrafficSummary()` — returns null until attached.
- `getDomesticTraffic()` — combines daily + summary.

### 10.10 `priceFreezeActions.ts` (112 lines)
**Fare lock feature.**
- `createPriceFreeze(input)` — dedup check, creates `PriceFreeze` row (24h expiry, capped at departure-1h).
- `getUserActiveFreezes()` — lists active non-redeemed freezes.
- `redeemPriceFreeze(freezeId)` — ownership check, expiry check, sets `redeemed = true`.

---

## 11. API Routes (`src/app/api/`)

| Route | Method | Runtime | Role |
|-------|--------|---------|------|
| `/api/auth/[...nextauth]/route.ts` | ALL | — | NextAuth handler (6 lines, delegates to `authOptions`) |
| `/api/airports/route.ts` | GET | `nodejs` | Airport search (Travelpayouts first, local fallback) |
| `/api/calendar/route.ts` | GET | `nodejs` | Fare calendar (Travelpayouts + holiday overlay + priceLevel quartiles) |
| `/api/prices/history/route.ts` | GET | `nodejs` | Price history for trend charts (filters `basePrice > 0`) |
| `/api/search/route.ts` | GET | `nodejs` | Logs search + returns generic message (compat endpoint) |
| `/api/cron/track/route.ts` | GET | `nodejs` | **Cron job** — tracks prices, sends alerts |

### Cron Job (`/api/cron/track`)
**Auth:** Requires `Authorization: Bearer $CRON_SECRET`

**Work:**
1. Loops over `POPULAR_ROUTES` (DEL-BOM, BLR-DEL, BOM-GOI, DEL-VTZ)
2. For each route, checks dates: today+7, today+14, today+30
3. Calls `getAndTrackFlights` (which logs lowest price to `PriceHistory`)
4. Fetches active `PriceAlert`s where `targetPrice ≥ lowestPrice`
5. Sends email via Resend to each matched user
6. Updates `lastNotified` to throttle (max 1 email per 24h per alert)

**Schedule:** Daily at 00:00 UTC (defined in `vercel.json`)
**Max Duration:** 300 seconds (5 min) for cron function

---

## 12. Frontend Pages

| Page | Route | Key Features |
|------|-------|--------------|
| **Home** | `/` | Hero search form, platform stats, "How it works", feature discovery cards, trending price drops |
| **Search** | `/search?from=&to=&date=` | Flight results grid, filters (airlines, stops, banks), sort bar, wallet modal, price trend chart, fare dip alert, date hinter, alternative itineraries (split/hidden), group booking CTA |
| **Checkout** | `/checkout` | Flight summary, fare breakdown, applicable offers with claim guides, price freeze button, proceed to OTA |
| **Calendar** | `/calendar/[route]` | Monthly fare calendar with price levels, holiday indicators, cheapest day star |
| **Compare** | `/compare` | OTA comparison, airline comparison, bank+card combo |
| **Deals** | `/deals` | Trending routes, most active airlines, bank & card offers |
| **Intelligence** | `/intelligence` | ML price forecast, booking advice, price prediction |
| **Status** | `/status` | Route tools and fare-source status; live movement data is disabled in the Travelpayouts-only setup |
| **Alerts** | `/alerts` | Create/manage price drop alerts |
| **Aggregator** | `/aggregator` | Multi-OTA search with best deal highlighting |
| **Profile** | `/profile?tab=` | Account details (edit name/username/mobile/dob), wallet (card selector), alerts list, profile picture upload (canvas-compressed base64), password reset, account deletion |
| **Login** | `/login` | Credentials + Google OAuth, IP-based country code detection |
| **Register** | `/register` | Full registration form with username uniqueness check, email verification required |
| **Verify Email** | `/verify-email` | Token verification page |
| **Reset Password** | `/reset-password` | Token-based password reset |

### Page Details

#### `src/app/layout.tsx` (127 lines)
- Fonts: `Geist`, `Geist_Mono`, `DM_Sans` via `next/font/google`
- Metadata: title template, OG tags, Twitter card, robots
- Viewport: `themeColor: #09090B`, `maximumScale: 5`
- SSR theme resolution from cookies (`thewingsscan_theme`, `thewingsscan_theme_mode`)
- Inline script in `<head>` resolves system theme before paint to prevent FOUC
- Wraps children in `Providers` → `SmoothScrollProvider` → `ScrollProgressBar` + ambient background layers + `EnvWarningBanner` + `Navbar` + `<main>` + `ThemeFab`

#### `src/app/page.tsx` (772 lines)
- **Client component** (`"use client"`)
- Local component `AirportInput` — fuzzy airport suggestions inside elevated shell surfaces
- Local component `SearchPanel` — origin/destination swap, cabin chips, date pickers, passenger dropdown, and query preservation for `/search`
- Calls `getPlatformStats()` and `getTrendingRoutes()` on mount
- Sections: premium hero, stats cards, quick-route chips, value panels, How it works, platform capability grid, feature discovery, Trending Price Drops

#### `src/app/search/page.tsx` (1177 lines)
- **Client component**
- `SearchContent` (wrapped in `<Suspense>` because of `useSearchParams`)
- Reads query params: `from`, `to`, `date`, `return`, `adults`, `children`, `infants`, `cabin`
- Calls `fetchFlights(...)` with `{ userCards, cabin, passengers, fresh }` + `getIntelligenceCombined(...)`
- Handles distinct states for missing route params, live-provider failure, provider-empty results, and filter-empty results
- Internal components:
  - `FlightCardSkeleton` — premium shimmer loading UI
  - `FlightCard` — uses shared `AirlineLogo`, shows effective fare context, wallet match badge, and sends selected flight to checkout store
  - `SortBar` — pill toggle with `layoutId="sortPill"` Framer Motion animation
  - `FilterPanel` — stops, bank offer filter, airline checklist; reset is keyed so UI state and filtered results clear together
  - `WalletModal` — checkbox grid of `AVAILABLE_BANK_CARDS`, syncs via `syncWallet` if logged in
- Displays: route summary cards, route-scoped alert feedback, `GroupBookCTA`, `FareDipAlert`, `AlternativeItineraries`, `DateHinter`, `PriceTrendChart`, `CostCuttingTips`

#### `src/app/checkout/page.tsx` (498 lines)
- **Client component**
- `CheckoutContent` (wrapped in `<Suspense>`)
- Reads `selectedFlight` from `checkoutStore` (sessionStorage persisted)
- Shows a loading surface until checkout-store hydration completes
- If no flight is present after hydration, shows a recovery state and routes back home
- Loads applicable offers via `fetchCheckoutOffers`
- Resolves booking URL: uses `deepLink`/`bookingUrl` if present, else generates via `createBookingLinkAction` if `searchId` + `bookingToken` exist, else falls back to `AVIASALES_AFFILIATE`; if a popup is blocked it falls back to same-window navigation
- Uses shared `AirlineLogo` and displays wallet-match cues, policy cards, secure-handoff explanation, fare breakdown, `OfferClaimGuide`, and `PriceFreezeButton`

#### `src/app/login/page.tsx` (173 lines)
- **Client component**
- `LoginForm` in `<Suspense>`
- Email/mobile input with dynamic country code selector (`+91` default, auto-detects via `ipapi.co`)
- `signIn("credentials")` with `redirect: false`
- `signIn("google")` with callbackUrl
- Error handling from URL query param `?error=`

#### `src/app/register/page.tsx` (187 lines)
- **Client component**
- Form fields: name, username, email, mobile (with country code), password
- Calls `registerUser(formData)` server action
- On success: shows verification message + dev note about Resend link logging

#### `src/app/profile/page.tsx` (672 lines)
- **Client component**
- `ProfileContent` in `<Suspense>`
- Tabs: `account`, `wallet`, `alerts` (synced to URL `?tab=`)
- Account tab: editable name/username/mobile/dob form, password reset (Resend), account deletion (username confirmation prompt)
- Profile picture upload: file → FileReader → canvas compression (max 150px width, JPEG 0.7) → base64 → `updateProfileImage`
- Wallet tab: checkbox grid of banks, "Save Wallet" → `syncWallet`
- Alerts tab: create alert form (origin/dest/target), list active alerts with delete

#### `src/app/calendar/[route]/page.tsx` (426 lines)
- **Client component**
- Parses `route` param as `origin-to-destination`
- Fetches `/api/calendar?origin=&destination=&month=&year=`
- Displays month grid with Framer Motion slide transitions
- Price levels: cheap (≤p25), average, expensive (≥p75)
- Holiday dots + holiday list sidebar
- Cheapest day highlighted with star animation

---

## 13. UI Components

### Layout Components
| Component | Location | Role |
|-----------|----------|------|
| `Navbar` | `components/layout/Navbar.tsx` | Fixed translucent top nav with premium link capsule, account controls, and full-screen mobile panel |
| `Footer` | `components/layout/Footer.tsx` | Large marketing footer with value messaging, product navigation, and booking-context disclaimer |
| `EnvWarningBanner` | `components/layout/EnvWarningBanner.tsx` | Shows red banner if DB URL or Google OAuth is misconfigured |
| `ScrollProgressBar` | `components/layout/ScrollProgressBar.tsx` | Thin progress bar at top on scroll |

### Theme Components
| Component | Role |
|-----------|------|
| `ThemeFab` | Floating bottom-right button → opens theme picker (warm/matte + follow system) |
| `ThemeTransitionOverlay` | Full-screen overlay for radial wipe transition when switching themes |
| `useThemeController` | Hook managing theme state, localStorage/cookie persistence, scroll lock during transition |

### Reusable UI Components (in `components/ui/`)
| Component | Role |
|-----------|------|
| `AnimatedText` | Word-by-word framer-motion reveal |
| `AirlineLogo` | Shared `next/image`-based airline avatar with DiceBear fallback for results and checkout |
| `Badge` | Status badge variants |
| `Button` | Primary/ghost/danger/secondary variants with loading spinner |
| `CostCuttingTips` | Contextual money-saving tips based on search context |
| `CustomCursor` | Dual cursor (dot + trailing circle) on desktop |
| `DateHinter` | "Fly ±3 days for ₹X off" suggestion pills |
| `FareDipAlert` | Price trend verdict banner (RISING/DROP_LIKELY/STABLE) |
| `FlightArc` | GSAP-animated SVG arc connecting two points |
| `GlassCard` | Standard card container |
| `GroupBookCTA` | Shows email CTA when passengers ≥ 9 |
| `Input` | Floating label input with icon support |
| `MagneticButton` | Button that follows mouse cursor magnetically |
| `OfferClaimGuide` | **MASSIVE** component — step-by-step claim instructions for every bank/card/OTA combination (HDFC→MMT, SBI→Yatra, etc.) |
| `PriceFreezeButton` | Locks fare for 24h via `PriceFreeze` DB row |
| `PriceTicker` | Animated counting number for prices |
| `ScrollReveal` | Generic scroll-into-view animation wrapper |
| `Skeleton` | Shimmer loading placeholder |
| `Spinner` | Loading spinner |
| `AlternativeItineraries` | Split-ticket + hidden-city suggestions |

### Dashboard Components
| Component | Role |
|-----------|------|
| `PriceTrendChart` | Recharts area chart of historical prices with trend indicator |

---

## 14. Theme System

**Files:** `src/styles/tokens.css`, `src/app/globals.css`, `src/lib/theme/*`, `src/components/theme/*`

### Themes
| Theme | BG Base | Text Primary | Use Case |
|-------|---------|--------------|----------|
| `warm` | `#F5F1EA` | `#0B0B0D` | Light mode, warm paper feel |
| `matte` | `#0A0A0A` | `#FAFAFA` | Dark mode, near-black |

### Theme Switching
- Default: follow system (`prefers-color-scheme`)
- System light → `warm`, system dark → `matte`
- Manual selection overrides system and persists to:
  - `localStorage` (`thewingsscan:theme`, `thewingsscan:theme_mode`)
  - Cookie (`thewingsscan_theme`, `thewingsscan_theme_mode`) for SSR
- **SSR script** in `<head>` resolves system theme before paint to prevent FOUC
- Transition: radial wipe from FAB center + scroll lock + clone-based overlay

### CSS Tokens
All colors, spacing, radii, shadows, motion timing, ambient canvas layers, and container sizing are CSS custom properties in `tokens.css`. New tokens such as `--bg-canvas`, `--accent-cyan`, `--accent-purple`, `--accent-amber`, `--shadow-xl`, and `--container-max` support the upgraded premium shell without abandoning the token system.

### globals.css Highlights
- `@import "tailwindcss"` + `@import "../styles/tokens.css"`
- `@theme` block maps Tailwind v4 theme keys to CSS vars
- `body::before` adds ambient radial lighting across the shell
- `html[data-theme-swap]` disables all transitions during theme swap
- `html[data-theme="matte"] body` adds subtle SVG noise texture
- `.ghost-input` removes all browser chrome (borders, outlines, shadows)
- `container-app` utility class uses tokenized max width (`--container-max`, 1280px)
- Shared shell utilities: `.surface-panel`, `.surface-card`, `.section-kicker`, `.hero-grid`, `.text-gradient-soft`, `.glow-divider`
- `.theme-transition-overlay` with `tt-radial-wipe` keyframe animation

---

## 15. Rate Limiting & Middleware

**File:** `src/proxy.ts` (60 lines)

Applied via `matcher` in middleware config to:
- `/api/search/*` — 60 req/min
- `/api/calendar/*` — 30 req/min
- `/api/airports/*` — 120 req/min
- `/api/prices/*` — 60 req/min

**Auth guards:** `/profile/*`, `/checkout/*` → redirects to `/login?callbackUrl=` if no JWT token.

**Rate limit implementation (`src/lib/api/rateLimit.ts`):**
- Uses Upstash Redis pipeline (`INCR`, `EXPIRE`, `TTL`) if env vars set
- Falls back to in-memory `Map<string, { count, resetAt }>` otherwise
- Returns `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers

---

## 16. Testing

**Runner:** Vitest (`npm test`)
**Setup:** `src/test/setup.ts` imports `@testing-library/jest-dom`

### Existing Tests
| File | What it tests |
|------|---------------|
| `src/lib/api/travelpayoutsClient.test.ts` | Header injection, config error, retry on 5xx, no retry on 4xx, schema mismatch |
| `src/lib/api/rateLimit.test.ts` | In-memory rate limiting, Upstash pipeline, header generation, IP extraction |
| `src/lib/theme/resolve.test.ts` | System scheme → theme mapping |
| `src/components/theme/ThemeFab.test.tsx` | Theme picker opens/closes |
| `src/components/layout/Navbar.test.tsx` | Profile/Sign In rendering based on session |
| `src/app/actions/priceFreezeActions.test.ts` | Create freeze (auth, validation, dedup), redeem freeze (ownership, expiry) |

---

## 17. Deployment

**Platform:** Vercel
**Region:** `bom1` (Mumbai) — pinned in `vercel.json`

### Vercel Config (`vercel.json`)
```json
{
  "regions": ["bom1"],
  "crons": [{ "path": "/api/cron/track", "schedule": "0 0 * * *" }],
  "functions": {
    "src/app/api/cron/track/route.ts": { "maxDuration": 300 },
    "src/app/api/search/route.ts": { "maxDuration": 30 }
  }
}
```

### Pre-Deploy Checklist (from `DEPLOY.md`)
1. `npx prisma db push` + `npx prisma generate`
2. Set all env vars in Vercel (Production + Preview)
3. Configure Google OAuth redirect URI: `https://<domain>/api/auth/callback/google`
4. Trigger cron manually with `curl -H "Authorization: Bearer $CRON_SECRET" ...`
5. Smoke tests: homepage renders, search works, login works, wallet persists, checkout loads

### GitHub Actions Fallback
`.github/workflows/track-flights.yml` runs twice daily as a fallback if Vercel cron is unreliable. It triggers the same endpoint with the cron secret.

---

## 18. Data Flow: Search → Results → Checkout

```
User enters search on /
  ↓
Zustand search-store holds form state (route, passengers, cabin)
  ↓
User clicks "Search" → router.push(/search?from=...&cabin=...)
  ↓
/search/page.tsx reads and validates URL params
  ↓
fetchFlights(origin, dest, date, { userCards, cabin, passengers, fresh })
  ↓
  ├─→ searchFlightsAction(..., { pax, cabin, fresh, throwOnError: true }) [Server Action]
  │     ├─→ travelpayoutsApi.searchFares() → Travelpayouts
  │     ├─→ dedupeFares() (by flightNumber + hour bucket)
  │     ├─→ enrichFares() → calculateBestEffectivePrice() per flight
  │     ├─→ logSearchAction() → Prisma SearchHistory
  │     └─→ trackLowestPrice() → Prisma PriceHistory (async, fire-and-forget)
  │
  ├─→ mapEnrichedFlightToResult() → FlightResult[]
  └─→ normalizeSearchError() → `FlightSearchClientError` on provider/config failures
  ↓
Frontend: route summary → intelligence cards → filter panel → sortFlights() → FlightCard components
  ↓
User clicks "Continue to checkout" → setSelectedFlight(flight) in checkout-store
  ↓
router.push(/checkout)
  ↓
/checkout hydrates selectedFlight from checkout-store (sessionStorage)
  ↓
fetchCheckoutOffers(baseFare, airlineCode, ownedCards)
  ↓
Display fare breakdown + secure handoff context + OfferClaimGuide + PriceFreezeButton
  ↓
"Proceed to Booking" → logBookingClick() → open OTA URL (new tab, same-window fallback if popup blocked)
```

---

## 19. Key File Reference

| What I need to change | Go to this file |
|-----------------------|-----------------|
| Add a new bank/card | `src/lib/banks.ts` |
| Change convenience fee | `src/lib/flight/offerEngine.ts` (`CONVENIENCE_FEE`) |
| Add airline logo | `src/lib/constants.ts` (`AIRLINES`) |
| Change airline badge / fallback rendering | `src/components/ui/AirlineLogo.tsx` |
| Change theme colors | `src/styles/tokens.css` |
| Change shell surfaces / ambient styling | `src/app/globals.css` + `src/styles/tokens.css` |
| Add new Travelpayouts endpoint | `src/lib/api/travelpayoutsClient.ts` + `travelpayoutsTypes.ts` |
| Change search results UI | `src/app/search/page.tsx` |
| Change checkout UI | `src/app/checkout/page.tsx` |
| Add new page | `src/app/[page]/page.tsx` |
| Change auth behavior | `src/lib/auth.ts` |
| Add DB model | `prisma/schema.prisma` → `npx prisma db push` |
| Change cron schedule | `vercel.json` |
| Add env var | `.env.example` + `DEPLOY.md` |
| Change rate limits | `src/proxy.ts` |
| Add holiday | `src/lib/holidays.ts` |
| Change airport data | `src/lib/airports.ts` |

---

## 20. Design Principles (Invariants)

1. **No NEXT_PUBLIC secrets.** Travelpayouts keys, DB passwords, NextAuth secrets are server-only.
2. **CSS variables only.** No hardcoded hex colors in components. All theming via `var(--*)`.
3. **Travelpayouts is the source of truth.** No local scraping. No `FlightOffer` table in production.
4. **Effective price sorting.** All user-facing prices must include `convenienceFee - bestDiscount`.
5. **Zustand for client state, Server Actions for server state.** No direct API calls from browser to Travelpayouts.
6. **Prisma singleton.** Always import `prisma` from `@/lib/prisma`, never create new `PrismaClient()`.
7. **Rate limit all external-facing routes.** `/api/*` and `/search` have limits.
8. **Email verification gate.** Credentials users MUST verify email before login.
9. **Vercel Mumbai.** All traffic routes through `bom1` for lowest latency to Indian users.
10. **Test before deploy.** `npm run build` and `npm test` must pass.

---

## 21. Appendix: Complete Type Reference

### Core Types (`src/lib/types.ts`)
- `FlightSource` — union of all known source identifiers
- `CabinClass` — `'economy' | 'premium_economy' | 'business' | 'first'`
- `Airport` — `{ iata, name, city, state, country, lat, lng, tier, popular }`
- `PassengerCount` — `{ adults, children, infants }`
- `SearchParams` — full search request shape
- `FlightSegment` — single leg details
- `BaggageInfo` — cabin/checked inclusion and weights
- `FlightResult` — unified frontend flight shape (price, segments, booking tokens, etc.)
- `SortOption` — 6 sort variants
- `FilterState` — airline, stops, time range, price range, sources, baggage, refundable
- `CalendarDay` — `{ date, cheapestPrice, source, isHoliday, holidayName?, priceLevel }`

### Travelpayouts Types (`src/lib/api/travelpayoutsTypes.ts`)
- Zod schemas: `AirportSchema`, `AirlineSchema`, `FareSchema`, `CalendarDaySchema`, `CouponSchema`, `LiveFlightSchema`, `RouteSchema`, `SourceHealthSchema`
- Response schemas: `AirportsResponseSchema`, `FaresResponseSchema`, `CalendarResponseSchema`, `CouponsResponseSchema`, `HealthResponseSchema`
- Raw endpoint schemas: `FlightStatusSchema`, `FlightBestDealSchema`, `CalendarRawSchema`, `ForecastSchema`, `PredictPriceSchema`, `BestTimeToBookSchema`, `TrendingRoutesSchema`, `OtaComparisonSchema`, `AirlineComparisonSchema`, `BankComboSchema`, `NearbyAirportsSchema`, `DealsTrendsSchema`, `BankOfferSchema`, `BestForRouteSchema`, `AggregatorSearchSchema`, `MultiCitySchema`

---

*End of Architecture Reference. If you modify any of the systems above, update this document.*
