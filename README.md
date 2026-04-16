# AirBook: Smart Indian Flight Tracker & Deal Engine

AirBook is a modern flight search engine specifically optimized for the Indian market. It aggregates live flight data from multiple OTAs (Google Flights, Ixigo, MakeMyTrip, Cleartrip) and intelligently applies real-time Indian Credit Card & Bank offers to calculate your true "Effective Price".

## Key Features
- **Multi-OTA Aggregation**: Custom Playwright API bypasses restrictive affiliate limits to scrape Google Flights and top Indian OTAs in real-time.
- **Smart Wallet Engine**: Users select which credit cards they own (HDFC, SBI, ICICI, etc.), and the engine automatically recalculates the absolute lowest price possible using available bank discounts.
- **Auto-Tracking & Price Drops**: A Vercel/GitHub Cron Job automatically scrapes popular routes 7, 14, and 30 days into the future.
- **Email Alerts**: Set a target price and receive instant emails via Resend when the flight drops below your budget.
- **NextAuth Accounts**: Cloud-synced user profiles via Supabase PostgreSQL.

## Architecture
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Framer Motion, Zustand.
- **Backend API**: Next.js Route Handlers + Server Actions.
- **Scraper Engine**: Playwright Headless Browsers.
- **Database**: Prisma + Supabase (PostgreSQL).
- **Authentication**: NextAuth.js (Auth.js v4) with Google OAuth.
- **Emails**: Resend API.

## Getting Started Locally

### 1. Prerequisites
You need Node.js 18+ installed. Since this app uses Playwright for web scraping, you must install the browser binaries:
```bash
npx playwright install chromium
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
# 1. Supabase Database Connection
# Connect to Supabase via connection pooling with Supavisor.
DATABASE_URL="postgres://postgres.your_project_id:your_db_password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database. Used for migrations.
DIRECT_URL="postgres://postgres.your_project_id:your_db_password@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# 2. NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_secret_key_here

# 3. Google OAuth (For login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# 4. Cron Job Security
CRON_SECRET=airbook_super_secret_dev_key_12345

# 5. Emails (Optional, for Price Drop Alerts)
RESEND_API_KEY=re_your_resend_key
```

### 3. Database Setup (Supabase)
We use Prisma with a Supabase PostgreSQL database. Update the `DATABASE_URL` and `DIRECT_URL` in `.env.local` with your Supabase credentials, then push the schema:
```bash
npx prisma generate
npx prisma db push
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Background Cron Jobs
To trigger the background auto-tracker that populates the Price Trend Charts:
```bash
./scripts/trigger-cron.sh local
```

## Production Deployment (Vercel)

Deploying to Vercel requires two architectural considerations due to Serverless limitations:

1. **Playwright in Serverless**:
   Vercel functions do not include Chromium by default. You must either:
   - Use `@sparticuz/chromium` in your build.
   - **Recommended**: Host the `/api/cron/track` scraper on a separate Railway/Render Node.js server, OR use the provided GitHub Actions workflow (`.github/workflows/track-flights.yml`) to run the cron job on GitHub's generous Ubuntu runners, which then pushes data to your database.

2. **Supabase Database**:
   The project is pre-configured to use a Supabase PostgreSQL database. Make sure you have pushed your Prisma schema to Supabase before deploying:
   ```bash
   npx prisma db push
   ```
   Then, add your `DATABASE_URL` and `DIRECT_URL` (found in your Supabase project settings -> Database -> Connection string) to your Vercel Environment Variables.

```bash
# Push to Vercel
vercel --prod
```

## License
MIT License. Built for educational and portfolio purposes.
