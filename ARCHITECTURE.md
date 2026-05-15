# TheWingsScan — Complete Architecture & Design Reference

> **Last updated:** 2026-05-15  
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
│   │   ├── api/                   # API Routes + Cron
│   │   ├── [page].tsx             # Top-level pages
│   │   ├── layout.tsx             # Root layout (SSR theme + fonts)
│   │   ├── globals.css            # Global styles + theme transitions
│   │   └── page.tsx               # Homepage
│   │
│   ├── components/
│   │   ├── layout/                # Navbar, Footer, EnvWarningBanner, ScrollProgressBar
│   │   ├── theme/                 # ThemeFab, ThemeTransitionOverlay, useThemeController
│   │   ├── ui/                    # Reusable UI components (30+ files)
│   │   └── Providers.tsx          # NextAuth SessionProvider
│   │
│   ├── lib/                       # Core libraries (NO React components)
│   │   ├── api/                   # Travelpayouts client, types, cache, rate limit
│   │   ├── flight/                # Offer engine, price trends, split tickets
│   │   ├── theme/                 # Theme types, resolver, storage helpers
│   │   ├── airports.ts            # 600+ airport database + fuzzy search
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── banks.ts               # Available bank/card list
│   │   ├── constants.ts           # Airlines, filters, formatters
│   │   ├── holidays.ts            # Indian holidays
│   │   ├── prisma.ts              # Prisma singleton
│   │   ├── types.ts               # Core TypeScript types
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
│   └── migrations/              # SQL migrations (RLS policies, triggers)
│
├── docs/
│   ├── plans/                   # Implementation plans (empty)
│   ├── superpowers/
│   │   ├── plans/               # 20+ detailed implementation plans (MD)
│   │   └── specs/               # Architecture spec documents
│   └── TheWingsScan-Architecture-Graph.md  # Mermaid architecture diagram
│
├── scripts/
│   ├── test_auth_flow.py        # Playwright smoke test
│   └── trigger-cron.sh          # Manual cron trigger
│
├── .github/
│   └── workflows/
│       └── track-flights.yml    # GitHub Actions cron fallback
│
├── public/                      # Static assets
├── next.config.ts               # Next.js config (CSP, images, headers)
├── vercel.json                  # Vercel cron + region config
├── tsconfig.json                # TypeScript paths: `@/* -> ./src/*`
├── postcss.config.mjs           # Tailwind v4 PostCSS plugin
├── eslint.config.mjs            # ESLint flat config
└── .env.example                 # Required environment variables
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

**Client:** `src/lib/api/travelpayoutsClient.ts`
**Types:** `src/lib/api/travelpayoutsTypes.ts`
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

---

## 7. Authentication System

**File:** `src/lib/auth.ts`

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

### 9.2 Live Flight Mapper (`src/lib/api/live-flight-mapper.ts`)

**Goal:** Convert `EnrichedFlight` (from server action) → `FlightResult` (frontend type).

**Mapping steps:**
- Resolves airline name from `AIRLINES` constant dictionary
- Computes duration from departure/arrival times
- Resolves source API name to `FlightSource` enum
- Builds `FlightSegment` and `FlightResult` objects
- Sets default baggage: cabin 7kg, checked 15kg

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

| Action File | Exports | Role |
|-------------|---------|------|
| `flightActions.ts` | `searchFlightsAction`, `getAndTrackFlights`, `logSearchAction`, `logBookingClick`, `getPlatformStats`, `fetchCheckoutOffers`, `fetchPriceTrend`, `getCheapestNearbyDays`, `fetchSplitTicketSuggestions`, `fetchHiddenCityOpportunities`, + Travelpayouts wrappers | Core flight search + tracking + analytics |
| `authActions.ts` | `registerUser`, `sendPasswordResetEmail`, `verifyEmail`, `updateProfile`, `deleteAccount`, `updateProfileImage`, `updatePassword` | Auth lifecycle |
| `userActions.ts` | `syncWallet`, `getUserWallet` | Card wallet persistence |
| `alertActions.ts` | `subscribePriceAlert`, `getPriceAlerts`, `removePriceAlert` + backward-compat aliases | Price alerts |
| `aggregatorActions.ts` | `searchAggregatorFlights`, `getAggregatorProviders`, `getProviderOffers`, `getAggregatorBestDeal`, `searchMultiCity` | Multi-OTA aggregation |
| `compareActions.ts` | `getOtaComparison`, `getAirlineComparison`, `getBestBankCombo`, `getBestForRoute`, `getFareComparePageData` | Fare comparison |
| `dealsActions.ts` | `getDealsTrends`, `getNearbyAirportDeals`, `getBankOffers`, `getSearchCoupons`, `getDealsPageData` | Deals & offers |
| `intelligenceActions.ts` | `getPriceForecast`, `getMlPricePrediction`, `getBookingAdvice`, `getTrendingRoutes`, `getIntelligenceCombined` | ML intelligence |
| `trafficActions.ts` | `getTrafficDaily`, `getTrafficSummary`, `getDomesticTraffic` | Compatibility traffic helpers; returns empty/default data until a dedicated traffic source is attached |
| `priceFreezeActions.ts` | `createPriceFreeze`, `getUserActiveFreezes`, `redeemPriceFreeze` | Fare lock feature |

---

## 11. API Routes (`src/app/api/`)

| Route | Method | Runtime | Role |
|-------|--------|---------|------|
| `/api/auth/[...nextauth]/route.ts` | ALL | — | NextAuth handler |
| `/api/airports/route.ts` | GET | `nodejs` | Airport search (Travelpayouts first, local fallback) |
| `/api/calendar/route.ts` | GET | `nodejs` | Fare calendar (Travelpayouts + holiday overlay) |
| `/api/prices/history/route.ts` | GET | `nodejs` | Price history for trend charts |
| `/api/search/route.ts` | GET | `nodejs` | Logs search + returns generic message |
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

---

## 13. UI Components

### Layout Components
| Component | Location | Role |
|-----------|----------|------|
| `Navbar` | `components/layout/Navbar.tsx` | Fixed top nav with animated active pill (`layoutId="nav-pill"`), user avatar dropdown, mobile hamburger menu |
| `Footer` | `components/layout/Footer.tsx` | Simple footer with links |
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
| `matte` | `#09090B` | `#FAFAFA` | Dark mode, near-black |

### Theme Switching
- Default: follow system (`prefers-color-scheme`)
- System light → `warm`, system dark → `matte`
- Manual selection overrides system and persists to:
  - `localStorage` (`thewingsscan:theme`, `thewingsscan:theme_mode`)
  - Cookie (`thewingsscan_theme`, `thewingsscan_theme_mode`) for SSR
- **SSR script** in `<head>` resolves system theme before paint to prevent FOUC
- Transition: radial wipe from FAB center + scroll lock + clone-based overlay

### CSS Tokens
All colors, spacing, radii, shadows, and timing functions are CSS custom properties in `tokens.css`. Components NEVER hardcode colors — they use `var(--bg-base)`, `var(--text-primary)`, `var(--accent-cta)`, etc.

---

## 15. Rate Limiting & Middleware

**File:** `src/proxy.ts` (middleware)

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
Zustand search-store holds form state
  ↓
User clicks "Search" → router.push(/search?from=...)
  ↓
/search/page.tsx reads URL params
  ↓
fetchFlights(origin, dest, date, ownedCards)
  ↓
  ├─→ searchFlightsAction() [Server Action]
  │     ├─→ travelpayoutsApi.searchFares() → Travelpayouts
  │     ├─→ dedupeFares() (by flightNumber + hour bucket)
  │     ├─→ enrichFares() → calculateBestEffectivePrice() per flight
  │     ├─→ logSearchAction() → Prisma SearchHistory
  │     └─→ trackLowestPrice() → Prisma PriceHistory (async, fire-and-forget)
  │
  └─→ mapEnrichedFlightToResult() → FlightResult[]
  ↓
Frontend: sortFlights() → filter panel → FlightCard components
  ↓
User clicks "Book Now" → setSelectedFlight(flight) in checkout-store
  ↓
router.push(/checkout)
  ↓
/checkout reads selectedFlight from checkout-store (sessionStorage)
  ↓
fetchCheckoutOffers(baseFare, airlineCode, ownedCards)
  ↓
Display fare breakdown + OfferClaimGuide for best offer
  ↓
"Proceed to Booking" → logBookingClick() → open OTA URL in new tab
```

---

## 19. Key File Reference

| What I need to change | Go to this file |
|-----------------------|-----------------|
| Add a new bank/card | `src/lib/banks.ts` |
| Change convenience fee | `src/lib/flight/offerEngine.ts` (`CONVENIENCE_FEE`) |
| Add airline logo | `src/lib/constants.ts` (`AIRLINES`) |
| Change theme colors | `src/styles/tokens.css` |
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

*End of Architecture Reference. If you modify any of the systems above, update this document.*
