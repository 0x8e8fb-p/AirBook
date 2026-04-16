# Fix Auth DB Connectivity & Airline Logos

## 1. Goal
1. **Fix Supabase DB Connectivity**: The user is getting `FATAL: (ENOTFOUND) tenant/user postgres.vffwryvhyworvkrkagvc not found` during sign-up. This means the `DATABASE_URL` is incorrectly configured for connection pooling.
2. **Fix Airline Logos**: The screenshot shows a default plane icon instead of the actual airline logo. This means the `onError` fallback is triggering because the `images.kiwi.com` URLs are returning 404s or the `airlineInfo` logic is failing to resolve the correct airline code.

## 2. Components
1. **`.env.local`**:
   - The `DATABASE_URL` using PgBouncer on Supabase requires the exact user format: `postgres.[project_ref]`. The current format seems to be failing DNS resolution. We will switch both URLs to use the direct connection string (`DIRECT_URL`) to completely bypass PgBouncer issues during development.
2. **`src/app/search/page.tsx`**:
   - The `flight.airline` might not be the standard 2-letter IATA code (e.g., it might be "AirAsia" instead of "AK"). If it's not a 2-letter code, the Kiwi image URL (`https://images.kiwi.com/airlines/64/AirAsia.png`) will return a 404, triggering the fallback.
   - We need a robust way to map airline names to their IATA codes if the API returns the full name instead of the code.

## 3. Execution Steps
1. **DB Fix**: Update `.env.local` to use the `DIRECT_URL` for both `DATABASE_URL` and `DIRECT_URL`. This is perfectly fine for Next.js serverless/dev environments when not under extreme load.
2. **Logos Fix**:
   - Check the `flight.airline` value in the search results.
   - If it's a full name (e.g., "AirAsia"), we need a reverse lookup dictionary or an API that provides the logo based on the name.
   - Alternatively, we can use a service like Clearbit (`https://logo.clearbit.com/airasia.com`) as a fallback if the Kiwi IATA code fails.
3. **Verify**: Restart the dev server and test.