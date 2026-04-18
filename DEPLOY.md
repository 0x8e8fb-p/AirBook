# AirBook — Vercel Deploy Checklist

One-page runbook for shipping to production. Do each step in order.

## 1. DB schema sync

The repo has no `prisma/migrations/` folder — schema is managed via `prisma db push`.

```bash
# set DATABASE_URL + DIRECT_URL in shell first
npx prisma db push
npx prisma generate
```

Verify the new `PriceFreeze` table exists in Supabase.

## 2. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** for `Production` (and `Preview` where noted). Match `.env.example`.

| Variable | Required | Scope | Notes |
|---|---|---|---|
| `DATABASE_URL` | yes | all | Supabase pooler URL (`:6543`, `?pgbouncer=true`) |
| `DIRECT_URL` | yes | all | Supabase direct URL (`:5432`) — migrations only |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | all | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | all | public |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | server | bypasses RLS — keep secret |
| `NEXTAUTH_URL` | yes | prod | `https://<your-domain>` — no trailing slash |
| `NEXTAUTH_SECRET` | yes | all | `openssl rand -base64 48` |
| `GOOGLE_CLIENT_ID` | optional | all | OAuth disabled if empty |
| `GOOGLE_CLIENT_SECRET` | optional | all | OAuth disabled if empty |
| `RESEND_API_KEY` | optional | server | email disabled if empty |
| `AIRAPI_URL` | yes | server | no trailing slash |
| `AIRAPI_CLIENT_ID` | yes | server | from AirAPI dashboard |
| `AIRAPI_KEY` | yes | server | rotate quarterly |
| `UPSTASH_REDIS_REST_URL` | recommended | server | falls back to in-memory if absent |
| `UPSTASH_REDIS_REST_TOKEN` | recommended | server | — |
| `CRON_SECRET` | yes | server | `openssl rand -hex 32` — Vercel auto-injects as `Authorization: Bearer` |
| `NEXT_PUBLIC_SITE_URL` | yes | all | public OG tags |
| `SENTRY_DSN` | optional | server | — |

## 3. OAuth redirect URIs

Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs:

```
https://<your-domain>/api/auth/callback/google
```

Staging/preview domains need their own entry.

## 4. Vercel region

`vercel.json` pins `bom1` (Mumbai) — lowest latency for Indian users and the Supabase ap-south-1 region. Change only if Supabase project lives elsewhere.

## 5. Cron verification

After first deploy, trigger the daily job manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/track
```

Expected: `{"success":true,"results":[...]}`. Vercel auto-schedules thereafter per `vercel.json`.

## 6. Domain + DNS

Vercel → Project → Settings → Domains → add custom domain. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the custom domain before flipping DNS.

## 7. Smoke test checklist

- [ ] `/` homepage renders, no EnvWarningBanner visible
- [ ] Search DEL→BOM returns results within 5s
- [ ] Price-trend banner appears after 3+ cron runs
- [ ] Login via Google succeeds
- [ ] Wallet cards persist across logout/login
- [ ] Checkout page loads, offers render, freeze button works
- [ ] Group-book CTA appears when pax ≥ 9

## 8. Monitoring

Vercel logs → filter `[Cron]` tag for daily job health. Supabase dashboard → SQL Editor → sanity-check row counts on `PriceHistory`, `SearchHistory`, `PriceFreeze`.

## Known non-blockers

- `src/components/layout/Navbar.test.tsx` has two pre-existing `tsc` errors unrelated to runtime. Tests still pass. Safe to deploy.
