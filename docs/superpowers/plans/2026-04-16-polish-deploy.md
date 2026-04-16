# Polish & Deploy Implementation Plan

## 1. Goal
Audit the application for any remaining UI/UX issues, fix console warnings or hydration errors, optimize the initial page load animations (Framer Motion / GSAP), and prepare the project for a seamless Vercel production deployment.

## 2. Components
1. **Hydration / Next.js Warnings Check**:
   - Ensure `next/font` is correctly configured and not throwing any warnings.
   - Verify `useSession` and Zustand persist middleware aren't causing server/client hydration mismatches.

2. **Animation Polish**:
   - Add a subtle stagger animation to the Flight Results grid so they don't pop in all at once.
   - Ensure the "Searching..." loader state on the homepage looks professional.
   - Polish the `WalletModal` enter/exit transitions.

3. **Error Handling & Edge Cases**:
   - Ensure the "No flights found" state looks good.
   - Handle timeout gracefully if the Playwright scrapers take too long.

4. **Production Configuration**:
   - Verify `next.config.ts` has the correct settings for Vercel.
   - Ensure the SQLite database path logic in Prisma handles Vercel Serverless (using a Turso/Neon PostgreSQL DB for production instead of local SQLite if necessary, or documenting that Vercel needs a persistent DB). *Note: For this project, we will assume local SQLite is fine for development, but document that a cloud DB is needed for prod*.

## 3. Execution Steps
1. Add a stagger animation to `src/app/search/page.tsx` for flight cards.
2. Build a beautiful "Empty State" component for `search/page.tsx`.
3. Fix the `z-index` layering on the `Navbar` vs the `WalletModal`.
4. Run `npm run build` locally to verify there are no TypeScript or ESLint errors before final delivery.