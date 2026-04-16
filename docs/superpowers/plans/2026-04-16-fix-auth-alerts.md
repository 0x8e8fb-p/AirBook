# Fix Auth & Alerts Implementation Plan

## 1. Goal
The user reported that the Sign In page is broken (saying "Try signing in with a different account. and a google sign in button") and the Alerts tab is not loading/redirecting properly. We need to debug the NextAuth configuration, verify the Prisma Adapter setup, and fix the routing/state in the Profile/Alerts components.

## 2. Components
1. **NextAuth / Prisma Adapter Issue**:
   - The default NextAuth pages (like the error page saying "Try signing in with a different account") usually appear when the OAuth flow fails, often due to a database connection issue or missing `NEXTAUTH_SECRET`.
   - *Fix*: We need to ensure the Prisma client is correctly instantiated globally so NextAuth doesn't fail when trying to create the user in the database.
   - We must also ensure `NEXTAUTH_URL` is set correctly.

2. **Alerts Tab / Profile Routing**:
   - The user says "alerts tab is not loading and not redirecting me to profile". This implies the `useSearchParams` hook might be causing an issue, or the page is stuck in a loading state because `status === "unauthenticated"` isn't properly redirecting, or it's stuck on `status === "loading"`.
   - *Fix*: Simplify the auth checking logic in `src/app/profile/page.tsx` and ensure `Suspense` boundary is wrapping the search params correctly without breaking the client-side render.

3. **Global Prisma Client**:
   - In Next.js dev mode, `new PrismaClient()` can exhaust connection pools if not cached globally. We need to verify `src/lib/prisma.ts`.

## 3. Execution Steps
1. Inspect and fix `src/lib/prisma.ts` to ensure a singleton Prisma client.
2. Inspect and fix `src/lib/auth.ts` to ensure the adapter is using the correct Prisma instance and `session` callback is robust.
3. Fix the `src/app/profile/page.tsx` routing and loading state logic.
4. Ensure the `Navbar` correctly handles the Sign In action without relying on default pages.