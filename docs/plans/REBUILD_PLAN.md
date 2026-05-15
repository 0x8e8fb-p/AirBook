# TheWingsScan Rebuild Plan

Goal: Beat every Indian OTA (MMT, Ixigo, Cleartrip, EaseMyTrip, Goibibo) on cheapest-fare surfacing. Consume Travelpayouts for fares + coupons. Ship on Vercel.

Date: 2026-04-18
Owner: Prabha

---

## 1. North-star principles

1. **One price truth** — every fare user sees is `base + tax + fees − best_applicable_offer`. No hidden charges, no bait.
2. **India-first, IATA-global** — INR only today, airport codes worldwide so expat/return flows work.
3. **Offer-aware ranking** — sort by *effective price*, not sticker price. Bank + card aware.
4. **Fast by default** — Travelpayouts serves cached fares from Postgres. P50 search < 500ms, P95 < 1.2s.
5. **No mocks in prod** — every scraper file under `src/lib/flight/scrapers/` either calls Travelpayouts or is deleted.

---

## 2. Target architecture

```
┌──────────────────────────────────────────────────────────┐
│ Browser (Next.js 16 App Router, React 19)                │
│   • Landing / Search form (zustand search-store)         │
│   • /search (results + filters + sort)                    │
│   • /checkout (persisted selected flight + offers)        │
│   • /profile (cards, alerts, history)                     │
└──────────────────────────────────────────────────────────┘
            │ server actions + fetch('/api/…')
            ▼
┌──────────────────────────────────────────────────────────┐
│ Next.js API routes + server actions (Vercel serverless)   │
│   • /api/search        → travelpayoutsClient.searchFares()      │
│   • /api/calendar      → travelpayoutsClient.faresCalendar()    │
│   • /api/coupons       → travelpayoutsClient.listCoupons()      │
│   • /api/airports      → travelpayoutsClient.searchAirports()   │
│   • /api/prices/history→ own PriceHistory (Supabase)     │
│   • /api/cron/*        → Vercel cron (Bearer $CRON_SEC) │
│   • /api/auth/[...]    → NextAuth v4 (→ migrate v5)      │
└──────────────────────────────────────────────────────────┘
            │
            ├─► Supabase Postgres (own data: Users, Alerts, BookingClicks, PriceHistory)
            │
            └─► Travelpayouts (sibling project) via X-Client-Id + X-Api-Key
                    ↓
                 airports / airlines / flight_prices / coupons / live_flights / routes
```

Key shifts from today:
- Delete fake scrapers (`ixigoScraper.ts`, `mmtScraper.ts`, `cleartripScraper.ts`).
- Delete dead `tequilaClient.ts`.
- Insert `src/lib/api/travelpayoutsClient.ts` — typed, Zod-validated, retry, circuit-breaker, Upstash-KV cache.
- `live-flight-mapper.ts` simplified — single map fn, no duplication, no `Math.random` fields.
- Offer engine reads Travelpayouts coupons, not `FlightOffer` table (deprecate local offer cache).

---

## 3. Travelpayouts contract (to implement)

### Auth
Every request:
```
X-Client-Id: <public-client-id>
X-Api-Key:   <secret>      # server-side only, NEVER NEXT_PUBLIC_*
```
Server checks `api_keys.api_key_hash = sha256(X-Api-Key)` and `is_active = true`. Rate limit by `client_id` (Redis INCR w/ TTL = 60s), then daily rollup into `usage_logs`.

### Endpoints (v1)

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/v1/airports` | `q` (≥2 chars), `limit` | `{airports: Airport[]}` |
| GET | `/v1/airlines` | `iata?` | `{airlines: Airline[]}` |
| GET | `/v1/fares` | `from, to, date, ret?, pax, cabin` | `{fares: Fare[], cache_age_sec}` |
| GET | `/v1/fares/calendar` | `from, to, month` (YYYY-MM) | `{days: {date, cheapest, currency}[]}` |
| GET | `/v1/coupons` | `airline?, route?, bank?, min_spend?` | `{coupons: Coupon[]}` |
| GET | `/v1/live` | `icao24?` | `{flights: LiveFlight[]}` |
| GET | `/v1/routes` | `from?, to?` | `{routes: Route[]}` |
| GET | `/v1/health` | — | `{sources: SourceHealth[]}` |

### TS types (add `src/lib/api/travelpayoutsTypes.ts`)
```ts
export type Airport = { iata: string; icao?: string; name: string; city: string; country: string; lat?: number; lng?: number; tz?: string };
export type Airline = { iata: string; icao?: string; name: string; active: boolean };
export type Fare = {
  from: string; to: string; airline: string; price: number; currency: 'INR';
  departureDate: string; returnDate?: string;
  sourceApi: string; recordedAt: string;
};
export type CalendarDay = { date: string; cheapest: number | null; currency: 'INR' };
export type Coupon = {
  code: string; description: string;
  discountType: 'PERCENTAGE'|'FIXED'|'BOGO';
  discountValue: number; maxDiscount: number | null;
  validFrom: string; validUntil: string; minSpend: number;
  applicableAirlines: string[]; applicableRoutes: string[];
  bankName: string | null; cardType: string | null; otaName: string | null;
  userSegment: 'NEW'|'RETURNING'|'ALL';
  sourceSite: string | null; sourceUrl: string | null;
  isVerified: boolean; successRate: number | null;
};
```

### Client skeleton
```ts
// src/lib/api/travelpayoutsClient.ts
import { z } from 'zod';
const BASE = process.env.TRAVELPAYOUTS_API_BASE!;
const ID = process.env.TRAVELPAYOUTS_MARKER!;
const KEY = process.env.TRAVELPAYOUTS_TOKEN!;

async function req<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'X-Client-Id': ID, 'X-Api-Key': KEY, Accept: 'application/json', ...(init?.headers ?? {}) },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new TravelpayoutsError(res.status, await res.text());
  return schema.parse(await res.json());
}
```
Add: 3-retry exponential backoff on 5xx, AbortSignal.timeout(8000), Upstash KV layer keyed by path+query (TTL per endpoint: fares=120s, calendar=900s, coupons=300s, airports=86400s).

---

## 4. Phased roadmap

### Phase 0 — Hygiene (half day)
1. **Rotate ALL secrets** in `.env`, `.env.local`, `.env.vercel.test`: Supabase anon + service-role + DB password, Google OAuth secret, Resend key, `NEXTAUTH_SECRET`, `CRON_SECRET`. Delete `.env.vercel.test` from git history (`git filter-repo`).
2. **Confirm `.gitignore`** covers `.env*`, `*.log`, `dev.db`, `tsconfig.tsbuildinfo`.
3. **Delete junk:** `TheWingsScan/TheWingsScan/` (nested clone), `fix_offers.ts`, `fix_offers2.ts`, `fix*.log`, `output.log`, `dev.db`, `prisma/dev.db`, `scratch/`, root `*.sql` (content already in `supabase/migrations/`), `src/lib/flight/tequilaClient.ts`.
4. **Remove client leakage:** grep `NEXT_PUBLIC_RESEND_API_KEY` → move email send into a server action. Strip from `profile/page.tsx:504`, `register/page.tsx:86`.
5. **Remove `playwright-core`** from deps (unused, bloats bundle).

### Phase 1 — Travelpayouts wiring (1-2 days)
1. Create `src/lib/api/travelpayoutsTypes.ts`, `src/lib/api/travelpayoutsClient.ts`, `src/lib/api/travelpayoutsCache.ts` (Upstash Redis).
2. Env template `.env.example` with `TRAVELPAYOUTS_API_BASE`, `TRAVELPAYOUTS_MARKER`, `TRAVELPAYOUTS_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
3. Replace `src/app/actions/flightActions.ts → scrapeGoogleFlights` (+ Ixigo/MMT/Cleartrip) with single `travelpayoutsClient.searchFares(...)`. Drop two-phase fetch unless Travelpayouts later streams.
4. Replace `src/app/api/calendar/route.ts` synthetic generator with `travelpayoutsClient.faresCalendar(...)`.
5. Replace `src/app/api/airports/route.ts` fuzzy-match over `src/lib/airports.ts` with `travelpayoutsClient.searchAirports(...)`; keep edge runtime, delete the 600-row static array.
6. Rewrite `src/lib/flight/offerEngine.ts` to read Travelpayouts `/v1/coupons` instead of local `FlightOffer` table. Keep `calculateBestEffectivePrice` math. Remove hardcoded `CONVENIENCE_FEE = 350` → pull from Travelpayouts response or feature flag per-airline.
7. Delete `src/lib/flight/scrapers/` (all four files) + `src/lib/flight/offerScraper.ts` + `src/app/api/cron/sync-offers/route.ts` (Travelpayouts owns scraping).
8. Update CSP in `next.config.ts` → add Travelpayouts origin to `connect-src`.

### Phase 2 — Bug fixes + UX hardening (1 day)
1. **Fix cron auth** — `/api/cron/track/route.ts` checks `Authorization: Bearer ${process.env.CRON_SECRET}` (Vercel auto-injects when `CRON_SECRET` env is set). Delete `/api/cron/track-test`.
2. **Persist checkout store** — add `persist` middleware in `src/stores/checkout-store.ts`; drop 100ms wait hack in `checkout/page.tsx:36`.
3. **Add `middleware.ts`** at `src/` root — protect `/profile`, `/search` (optional), return 401 on `/api/**` without session where needed.
4. **Fix `reduce` crash** `flightActions.ts:242` — pass initial value.
5. **Remove `SEARCH_COUNT` stats-padding hack** `flightActions.ts:325-337` → compute `searchesToday` from `SearchHistory` table directly.
6. **Strip `console.log`** (19 instances across 7 files) + `as any` (46 across 11 files) via pass, or gate on `NODE_ENV !== 'production'`.
7. **Consolidate bank list** — single `src/lib/banks.ts` exports list; `profile/page.tsx`, `search/page.tsx`, `utils.ts` import from it.
8. **Drop `allowDangerousEmailAccountLinking`** in `src/lib/auth.ts:14`.
9. **Cache session** — stop re-fetching user in `session` callback every call; encode claims in JWT once at sign-in, refresh on profile-update.
10. **Email verify order** — either send magic link first and only create user on click, or TTL-delete unverified users after 24h via cron.
11. **`INDIAN_HOLIDAYS_2026`** — fetch from Travelpayouts (add `/v1/holidays?country=IN&year=`) or generate via `date-holidays` package. Raise validator year cap.
12. **Fix `googleFlightsScraper.ts:55-58`** ×100 hack — irrelevant once the file is deleted.
13. **Replace `seatsRemaining: Math.random`, `carbonEmissions: 100`** in `live-flight-mapper.ts` — either receive from Travelpayouts or drop the fields from UI until real.
14. **Kill duplicated 50-line block** `live-flight-mapper.ts:87-196` → single `mapEnrichedFlightToResult`.
15. **Rate limit** `/api/search`, `/api/calendar`, `/api/coupons` via Upstash ratelimit `@upstash/ratelimit` — 30 req/min/IP.

### Phase 3 — Kill-shot features (market differentiation)
Order by impact.

1. **Wallet-match ranker** — user sets cards in `/profile`. Search results sort by *their* effective price. Badge: "Your HDFC Diners saves ₹1,200 here" inline on each card. Already half-built in `offerEngine.getOffersForUser` — just hook UI.
2. **Predictive Fare Dip**  — background job: for each tracked route, fit 7-day EMA on `PriceHistory`, detect drop > 8%. Push email via Resend: "BLR→GOI dropped ₹900 — likely rises back Friday". Already have `cron/track/route.ts` scaffold.
3. **Secret Class** — if `/v1/fares` returns business fares < 1.8× economy (algorithm flips sometimes on empty legs), surface as "Secret upgrade: Business for +₹2,400". Huge conversion hook.
4. **Split-ticket finder** — try `DEL→HYD + HYD→MAA` vs `DEL→MAA` when non-stop is pricey. Show combined price. Offered by almost no one in India.
5. **Hidden-city detector** — if leg-1 of multi-stop is cheaper than the direct, surface (w/ warning "skipping leg-2 may void return"). Compliance note: OK in India, disclosed.
6. **Group book** — ≥9 pax → different fare table (Travelpayouts `/v1/fares?pax=9`). India has massive wedding+pilgrim market OTAs underserve.
7. **Cheapest-day hinter** — from calendar agg: "Fly Tue Mar-10 saves ₹1,800 vs your Fri Mar-13".
8. **IRCTC-style queue UX** on `/checkout` — progress stepper (Fare locked → Coupon applied → Redirecting to airline), zero anxiety.
9. **UPI-offer autopick** — coupons where `ota_name = 'PhonePe' OR 'Paytm' OR 'GPay'` — checkbox "I pay via UPI" filters to best.
10. **Price-freeze** — pay ₹99 to lock fare for 24h. Partner w/ one airline (Akasa/IndiGo) via Travelpayouts provider column.

### Phase 4 — Perf + polish
1. **ISR** for `/calendar/[route]` pages (revalidate 1h).
2. **RSC** for `/search` — move result rendering server-side, stream via React Suspense.
3. **Image optimization** — airline logos via `next/image`, `priority` on top-3 results only.
4. **Bundle audit** — `@next/bundle-analyzer`; target < 200 KB first-load JS.
5. **Core Web Vitals** — LCP < 2.0s on `/search`, CLS < 0.05.
6. **Sentry** — error tracking on server actions + fetch boundaries.
7. **PostHog** — funnel: search → select → checkout → click-out.
8. **SEO** — `/calendar/DEL-to-BOM` pages targeted keywords; sitemap.xml dynamic.

### Phase 5 — Migration: Auth.js v5
NextAuth 4.24 + Next 16 unstable. Scheduled migration, standalone PR.

---

## 5. Data model cleanup

Prisma schema keep: `User`, `Account`, `Session`, `VerificationToken`, `PriceAlert`, `SearchHistory`, `BookingClick`, `PriceHistory`, `FlightRoute`.
Prisma schema **delete**: `FlightOffer` (Travelpayouts owns coupons).
Supabase migrations: consolidate into **one** file `supabase/migrations/001_init.sql`. Drop the snake_case tables from `002_persistence.sql` that Prisma never reads.

---

## 6. Env / secrets map

### Server-only (Vercel env)
| Name | Purpose |
|---|---|
| `DATABASE_URL` | Supabase pooled |
| `DIRECT_URL` | Supabase direct (migrations) |
| `SUPABASE_SERVICE_ROLE_KEY` | server RLS bypass |
| `NEXTAUTH_URL` | prod domain |
| `NEXTAUTH_SECRET` | 32+ byte random |
| `GOOGLE_CLIENT_ID` / `_SECRET` | OAuth |
| `RESEND_API_KEY` | email |
| `TRAVELPAYOUTS_API_BASE` | `https://<your-domain>/` |
| `TRAVELPAYOUTS_MARKER` | issued by Travelpayouts |
| `TRAVELPAYOUTS_TOKEN` | issued by Travelpayouts, rotate quarterly |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | cache + ratelimit |
| `SENTRY_DSN` | optional |

### Public (safe to ship to browser)
| Name | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client read |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | RLS-gated client |
| `NEXT_PUBLIC_SITE_URL` | canonical URL for OG tags |

**No `NEXT_PUBLIC_TRAVELPAYOUTS_*`** — Travelpayouts must never be called from browser; all Travelpayouts calls go through our `/api/*` routes to hide keys and enforce rate-limits.

---

## 7. Vercel deploy runbook

1. Push to GitHub `main`.
2. Vercel → Import project → Framework: Next.js.
3. Add all env vars from §6 under Production + Preview.
4. `vercel.json` — keep cron for `/api/cron/track` (daily 00:00 IST = 18:30 UTC). Remove `sync-offers` cron (Travelpayouts owns).
5. Domain: add `thewingsscan.app` (or chosen) → set `NEXTAUTH_URL` + `NEXT_PUBLIC_SITE_URL` to match.
6. **Post-deploy smoke test:**
   - `/` renders
   - `/api/airports?q=del` returns DEL+DED+…
   - `/search?from=DEL&to=BOM&date=2026-05-10` returns ≥1 fare
   - `/checkout` keeps selection on reload
   - `/api/cron/track` returns 401 on unsigned req, 200 from Vercel cron
7. Monitor Vercel logs for 24h. Watch Upstash cache hit ratio > 70%.

### Required env vars at deploy (full list)
- `DATABASE_URL`, `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `TRAVELPAYOUTS_API_BASE`, `TRAVELPAYOUTS_MARKER`, `TRAVELPAYOUTS_TOKEN`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `CRON_SECRET` (required by Vercel cron — `Authorization: Bearer $CRON_SECRET` auto-injected)
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL`

### Pre-deploy checklist
- `npm run build` clean
- `npm test` all green (16+ tests)
- `npx prisma migrate deploy` against prod DB
- `curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/track` returns 200
- Without header: returns 401
- Open `/search?from=DEL&to=BOM&date=<future>` — fares stream in
- DevTools → Network: no call to `*.thewingsscan` API uses browser-visible key
- Rate-limit smoke: hit `/api/airports?q=del` 150× in 60s → last calls return 429 with `Retry-After`

---

## 8. Execution order (what I will do now)

Propose I execute in this order, each a separate commit:
1. **commit A — hygiene sweep** (Phase 0 items 1-5)
2. **commit B — Travelpayouts client scaffold + types** (Phase 1 items 1-2)
3. **commit C — wire search to Travelpayouts** (Phase 1 items 3,5,8)
4. **commit D — wire calendar + coupons** (Phase 1 items 4,6,7)
5. **commit E — bug fixes batch** (Phase 2 items 1-7)
6. **commit F — security + middleware** (Phase 2 items 8-10,15)
7. **commit G — cleanup mapper + UI polish** (Phase 2 items 11-14)
8. **commit H — deploy config + smoke tests**

Phase 3 features after Phase 2 ships and works in prod.

---

## 9. Risks / open questions

- **Travelpayouts not built yet** — you own that project. Every Phase 1 step assumes the endpoints exist. Suggest we define the OpenAPI spec there first; I can mirror it in TS types here.
- **Vercel hobby 10-second limit** — `/api/search` must respond inside 10s. Budget: 200ms overhead + 8s Travelpayouts timeout + 300ms render. Travelpayouts should serve from cache in < 300ms p95.
- **Cache invalidation** — if Travelpayouts scrape updates fares every 4h but our Upstash cache TTL is 2m, stale is fine. If user triggers `?fresh=true`, bypass cache → cost.
- **Legal** — hidden-city ticketing has gray-zone reputation. Add disclaimer. Split-ticket = no issue.
- **next-auth v4 → v5** — coordinated in Phase 5; if v4 breaks on Next 16 earlier, bump priority.
