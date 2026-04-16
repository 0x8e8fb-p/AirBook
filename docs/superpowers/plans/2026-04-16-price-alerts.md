# Price Drop Alerts Implementation Plan

## 1. Goal
Re-introduce the `alerts` feature, specifically allowing users to set a target price for a route and receive an email notification when the tracked price drops below their threshold.

## 2. Components
1. **Prisma Schema Update**:
   - Add a `PriceAlert` model tracking: `userId`, `origin`, `destination`, `targetPrice`, `active` status, and `lastNotified`.
2. **Alerts UI (`src/app/alerts/page.tsx`)**:
   - A dashboard for users to view and manage their active price alerts.
   - Form to create a new alert for a specific route and price point.
3. **Resend Email Integration**:
   - Install `resend` SDK.
   - Update `api/cron/track/route.ts` to query active alerts after fetching the lowest price for a route.
   - If `lowestPrice <= targetPrice` and not notified recently, trigger an email via Resend.

## 3. Execution Steps
1. Restore/Recreate `src/app/alerts/page.tsx` and `src/app/alerts/actions.ts`.
2. Update `prisma/schema.prisma` with `PriceAlert`.
3. Add `RESEND_API_KEY` handling.
4. Hook up the cron job to send emails.