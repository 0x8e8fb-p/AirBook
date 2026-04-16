# Codebase Cleanup Design

## Overview
A targeted cleanup of the AirBook codebase to remove throwaway scripts and dead utility exports while intentionally preserving UI components and animation libraries for future development.

## 1. Remove Throwaway Root Scripts
The following scripts in the root directory were identified as one-off testing, debugging, or database query utilities and will be removed:
- `debug-env.js`
- `fix-schema.js`
- `query-db.js`
- `query-schema.js`
- `test-log.js`
- `test-log.ts`
- `test-pooler.js`
- `test-prisma-local.js`
- `test-prisma.js`
- `test-prisma2.js`
- `test-stats.js`

## 2. Clean Up Dead Exports & Utilities
Unused exports within `src/lib/` will be removed to reduce clutter and keep the utility library focused. This includes:

### Constants (`src/lib/constants.ts`, `src/lib/airports.ts`, etc.)
- `AIRPORTS`
- `getIataCode`
- `getAirlineLogo`
- `CABIN_CLASSES`
- `POPULAR_ROUTES`
- `INDIAN_BANK_OFFERS` (in `src/lib/flight/offerEngine.ts`)

### Functions (`src/lib/api/`, `src/lib/flight/`, `src/lib/utils.ts`)
- `orchestrateSearch` (in `search-orchestrator.ts`)
- `searchFlights` (in `tequilaClient.ts`)
- `delay`
- `safeJsonParse`
- `timeAgo`
- `debounce`

### Types & Schemas (`src/lib/validators.ts`, `src/lib/types.ts`)
- `iataCodeSchema`, `dateStringSchema`, `passengerCountSchema`, `cabinClassSchema`, `searchParamsSchema`, `airportSearchSchema`
- `PassengerType`, `PriceHistoryPoint`, `IndianHoliday`, `UserProfile`, `TrendingRoute`, `SearchParamsInput`, `AirportSearchInput`, `CalendarRequestInput`
- `THEME_LS_KEY`, `THEME_MODE_LS_KEY` (in `src/lib/theme/storage.ts`)

## 3. Preserved Code (Do Not Touch)
As per user direction, the following unused items will be kept for future feature development:
- All UI components in `src/components/ui/` (e.g., `Button.tsx`, `GlassCard.tsx`, `AnimatedText.tsx`, etc.)
- Component `ScrollProgressBar.tsx`
- Animation utilities like `src/lib/gsap.ts`
- All unused dependencies in `package.json` (`gsap`, `three`, `@radix-ui/*`, etc.)
