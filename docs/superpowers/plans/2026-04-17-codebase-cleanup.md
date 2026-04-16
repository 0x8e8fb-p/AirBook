# Codebase Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the AirBook codebase by removing throwaway scripts and dead utility exports while preserving UI components and animation libraries.

**Architecture:** Targeted file deletions and dead-code removal across the `src/lib/` directory.

**Tech Stack:** Next.js, TypeScript

---

### Task 1: Delete Throwaway Root Scripts

**Files:**
- Delete: `debug-env.js`
- Delete: `fix-schema.js`
- Delete: `query-db.js`
- Delete: `query-schema.js`
- Delete: `test-log.js`
- Delete: `test-log.ts`
- Delete: `test-pooler.js`
- Delete: `test-prisma-local.js`
- Delete: `test-prisma.js`
- Delete: `test-prisma2.js`
- Delete: `test-stats.js`

- [x] **Step 1: Delete the files**

Run the following command to remove the throwaway scripts:
```bash
rm -f debug-env.js fix-schema.js query-db.js query-schema.js test-log.js test-log.ts test-pooler.js test-prisma-local.js test-prisma.js test-prisma2.js test-stats.js
```

- [x] **Step 2: Commit**

```bash
git add .
git commit -m "chore: remove throwaway root test and debug scripts"
```

### Task 2: Clean Up Dead Constants

**Files:**
- Modify: `src/lib/constants.ts`
- Modify: `src/lib/airports.ts`
- Modify: `src/lib/flight/offerEngine.ts`

- [x] **Step 1: Remove unused constants**
Edit the files to remove the following exports:
- `AIRPORTS` (from `src/lib/airports.ts`)
- `getIataCode`, `getAirlineLogo`, `CABIN_CLASSES`, `POPULAR_ROUTES` (from `src/lib/constants.ts`)
- `INDIAN_BANK_OFFERS` (from `src/lib/flight/offerEngine.ts`)

- [ ] **Step 2: Commit**

```bash
git add src/lib/constants.ts src/lib/airports.ts src/lib/flight/offerEngine.ts
git commit -m "refactor: remove unused constants and airport data"
```

### Task 3: Clean Up Dead Functions

**Files:**
- Modify: `src/lib/api/search-orchestrator.ts`
- Modify: `src/lib/flight/tequilaClient.ts`
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: Remove unused functions**
Edit the files to remove the following exports:
- `orchestrateSearch` (from `src/lib/api/search-orchestrator.ts`)
- `searchFlights` (from `src/lib/flight/tequilaClient.ts`)
- `delay`, `safeJsonParse`, `timeAgo`, `debounce` (from `src/lib/utils.ts`)

- [ ] **Step 2: Commit**

```bash
git add src/lib/api/search-orchestrator.ts src/lib/flight/tequilaClient.ts src/lib/utils.ts
git commit -m "refactor: remove unused utility and api functions"
```

### Task 4: Clean Up Dead Types and Schemas

**Files:**
- Modify: `src/lib/validators.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/theme/storage.ts`

- [ ] **Step 1: Remove unused Zod schemas and Types**
Edit the files to remove the following exports:
- `iataCodeSchema`, `dateStringSchema`, `passengerCountSchema`, `cabinClassSchema`, `searchParamsSchema`, `airportSearchSchema` (from `src/lib/validators.ts`)
- `SearchParamsInput`, `AirportSearchInput`, `CalendarRequestInput` (from `src/lib/validators.ts`)
- `PassengerType`, `PriceHistoryPoint`, `IndianHoliday`, `UserProfile`, `TrendingRoute` (from `src/lib/types.ts`)
- `THEME_LS_KEY`, `THEME_MODE_LS_KEY` (from `src/lib/theme/storage.ts`)

- [ ] **Step 2: Commit**

```bash
git add src/lib/validators.ts src/lib/types.ts src/lib/theme/storage.ts
git commit -m "refactor: remove unused types and schemas"
```

### Task 5: Verify Build and Tests

- [ ] **Step 1: Run type checking and tests**
Ensure that the codebase still compiles and all tests pass after the cleanup.

```bash
npm run lint
npm run build
npm test --silent
```

- [ ] **Step 2: Final verification commit**
If any additional fixes were needed during the build verification, commit them here.
