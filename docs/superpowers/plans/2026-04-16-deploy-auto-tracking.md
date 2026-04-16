# Deploy Auto-Tracking Implementation Plan

## 1. Goal
We have already built the `GET /api/cron/track` endpoint which scrapes and logs flight prices for our predefined popular routes 7, 14, and 30 days into the future.
However, it currently requires manual triggering. We need to automate this using **Vercel Cron Jobs** or **GitHub Actions**, so the data is consistently fresh and the price trend charts are always populated.

## 2. Components
1. **Vercel Configuration (`vercel.json`)**:
   - Vercel supports native cron jobs defined in `vercel.json`.
   - We will configure a cron job to hit the `/api/cron/track` endpoint automatically twice a day (e.g., at 00:00 and 12:00 UTC).

2. **Environment Variables Check**:
   - The cron endpoint requires `CRON_SECRET` to prevent unauthorized users from triggering the heavy Playwright scraping jobs.
   - We need to ensure the Vercel setup will pass this secret correctly.

3. **Fallback GitHub Actions (Optional)**:
   - Since Playwright headless scraping can be resource-intensive, Vercel Serverless Functions have a 10s (Hobby) or 60s (Pro) timeout.
   - *Architecture Pivot*: If the Vercel function times out while running 4 scrapers across multiple routes, we might need to use a GitHub Actions workflow to run the script via Node.js instead, pushing directly to the database.
   - For now, we will configure Vercel Cron but add a warning/fallback GitHub Action script (`.github/workflows/track-flights.yml`) as a bulletproof alternative that won't timeout.

## 3. Execution Steps
1. Create `vercel.json` with the cron schedule.
2. Create a GitHub Action `.github/workflows/track-flights.yml` that curls the endpoint (or runs a local ts-node script) as a robust, free fallback with up to 6 hours of execution time.
3. Add a simple local test script `scripts/trigger-cron.sh` to manually fire it.