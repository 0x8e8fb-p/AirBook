# Auto-Tracking (Prisma/Cron) Implementation Plan

## 1. Goal
Implement an automated background tracking system that continuously monitors flight prices for popular routes, storing the historical base fares and effective prices in our SQLite database via Prisma. This data will be used to show users price trends ("Buy Now" vs. "Wait").

## 2. Components
1. **Prisma Database Validation**:
   - Ensure the `FlightRoute` and `PriceHistory` models are correctly defined in `schema.prisma`.
   - Ensure the database is migrated and accessible.

2. **Cron Job / Background Task**:
   - Since Next.js doesn't have built-in long-running daemon processes (like a traditional Node.js Express server with `node-cron`), we have two main options:
     - **Option A**: Use a custom `server.js` to run Next.js and `node-cron` simultaneously.
     - **Option B**: Create an API Route (e.g., `app/api/cron/track/route.ts`) and trigger it externally using GitHub Actions, Vercel Cron, or a local cron utility.
   - **Decision**: We will implement Option B (API Route) for better Vercel/Next.js compatibility, and provide a simple script to trigger it locally if needed.

3. **Tracking Logic (`api/cron/track/route.ts`)**:
   - Retrieve a list of predefined "Popular Routes" (e.g., DEL-BOM, BLR-DEL) from the database or constants.
   - For each route, pick a date 7 days, 14 days, and 30 days from today.
   - Call the `getAndTrackFlights` server action.
   - `getAndTrackFlights` already logs the lowest price to `PriceHistory`.

4. **UI Integration**:
   - Add a small API route `app/api/prices/history/route.ts` to fetch historical data for a specific route and date.
   - Integrate a simple Line Chart (using Recharts or Chart.js) into the UI Dashboard or Homepage to display the trend.

## 3. Execution Steps
1. Verify Prisma models and run `npx prisma db push`.
2. Create the Cron API endpoint (`src/app/api/cron/track/route.ts`).
3. Create the Data Retrieval API endpoint (`src/app/api/prices/history/route.ts`).
4. (Optional) Create a simple UI component to display the price trend.
