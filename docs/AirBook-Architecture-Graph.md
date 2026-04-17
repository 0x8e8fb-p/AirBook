# AirBook Architecture Graph

This document provides a comprehensive, graph-based overview of the AirBook codebase. You can use this to quickly onboard any AI onto the project.

## System Architecture Overview

```mermaid
graph TD
    %% Define styles
    classDef client fill:#d4e6f1,stroke:#2874a6,stroke-width:2px,color:#1b4f72
    classDef server fill:#d5f5e3,stroke:#1e8449,stroke-width:2px,color:#145a32
    classDef external fill:#fcf3cf,stroke:#b7950b,stroke-width:2px,color:#7d6608
    classDef database fill:#fadbd8,stroke:#b03a2e,stroke-width:2px,color:#78281f

    %% Client Layer (Frontend)
    subgraph Client ["Client Layer (React / Next.js UI)"]
        SearchPage["/search/page.tsx\n(Flight Search UI)"]:::client
        CheckoutPage["/checkout/page.tsx\n(Booking & Offers)"]:::client
        DashboardPage["/dashboard/page.tsx\n(Analytics)"]:::client
        
        Components["UI Components\n(FlightCard, OfferClaimGuide, CostCuttingTips)"]:::client
        Stores["Zustand Stores\n(search-store, checkout-store, user-store)"]:::client
    end

    %% API / Server Actions Layer
    subgraph ServerActions ["Server Actions & API Layer"]
        FlightActions["src/app/actions/flightActions.ts\n(Core Flight Logic)"]:::server
        UserActions["src/app/actions/userActions.ts\n(Wallet sync)"]:::server
        CronAPI["src/app/api/cron/sync-offers/route.ts\n(Daily Sync)"]:::server
        AuthAPI["src/app/api/auth/[...nextauth]\n(NextAuth.js)"]:::server
    end

    %% Business Logic Layer
    subgraph BusinessLogic ["Business Logic & Integrations"]
        LiveFlightMapper["src/lib/api/live-flight-mapper.ts\n(Data Formatting)"]:::server
        OfferEngine["src/lib/flight/offerEngine.ts\n(Calculates best effective price)"]:::server
        OfferScraper["src/lib/flight/offerScraper.ts\n(Scrapes offers daily)"]:::server
        FlightCache["src/lib/flight/flightCache.ts\n(In-memory LRU Cache)"]:::server
        
        subgraph Scrapers ["Flight Scrapers (Simulated/Mock API)"]
            GoogleScraper["googleFlightsScraper.ts"]:::server
            OTAScrapers["ixigoScraper, mmtScraper, cleartripScraper"]:::server
        end
    end

    %% Database Layer
    subgraph DBLayer ["Database Layer (Prisma + Supabase PostgreSQL)"]
        PrismaClient["Prisma Client"]:::database
        DB[(PostgreSQL DB)]:::database
        
        Models["Models:\n- User\n- FlightRoute\n- PriceHistory\n- BookingClick\n- FlightOffer (Pillar 2)"]:::database
    end

    %% External Dependencies
    subgraph ExternalServices ["External Services"]
        Tequila["Tequila / Kiwi API\n(Fallback flights)"]:::external
        PublicOffers["Public Bank/OTA Pages\n(GrabOn, HDFC, MMT)"]:::external
        GoogleAuth["Google/GitHub Auth\n(OAuth Providers)"]:::external
    end

    %% Relationships
    SearchPage -->|Calls| LiveFlightMapper
    SearchPage -->|Uses| Stores
    SearchPage -->|Uses| Components
    CheckoutPage -->|Uses| Components
    CheckoutPage -->|Calls| OfferEngine
    
    LiveFlightMapper -->|Calls| FlightActions
    
    FlightActions -->|Checks| FlightCache
    FlightActions -->|Fetches raw flights| Scrapers
    FlightActions -->|Fetches effective prices| OfferEngine
    FlightActions -->|Logs search/history| PrismaClient
    
    OfferEngine -->|Queries active offers| PrismaClient
    
    CronAPI -->|Triggers| OfferScraper
    OfferScraper -->|Fetches HTML| PublicOffers
    OfferScraper -->|Upserts offers| PrismaClient
    
    UserActions -->|Syncs wallet| PrismaClient
    AuthAPI -->|Verifies credentials| GoogleAuth
    AuthAPI -->|Manages Sessions| PrismaClient
    
    PrismaClient --> DB
```

## Core Modules & Responsibilities

### 1. **Flight Search & Streaming (Phase 5 WIP)**
- `src/app/search/page.tsx`: The main UI for searching flights. Displays skeleton loaders while calling the server actions.
- `src/lib/api/live-flight-mapper.ts`: Normalizes raw enriched flight data into the `FlightResult` format expected by the frontend.
- `src/app/actions/flightActions.ts`: Handles the heavy lifting. Dispatches parallel requests to scrapers (`googleFlightsScraper`, `ixigoScraper`, `mmtScraper`, `cleartripScraper`), deduplicates results, applies smart pricing via `offerEngine`, logs history via Prisma, and caches the final results.

### 2. **Dynamic Offer Engine (Pillar 2)**
- `prisma/schema.prisma`: Contains the `FlightOffer` model (DB-backed, expiry-aware).
- `src/lib/flight/offerEngine.ts`: Fetches applicable offers from DB (cached 5 mins), filters by the user's saved cards, calculates the best effective price, and returns offer metadata.
- `src/lib/flight/offerScraper.ts`: Uses `fetch` to scrape public offer pages (GrabOn, Bank pages) and parses HTML to find discount details.
- `src/app/api/cron/sync-offers/route.ts`: Vercel Cron job that runs daily to trigger `offerScraper.ts` and sync the DB.

### 3. **Checkout & Savings Guidance (Pillar 1)**
- `src/app/checkout/page.tsx`: Presents the selected flight and the calculated discounts.
- `src/components/ui/OfferClaimGuide.tsx`: Contextual step-by-step guide for claiming the applied offer (e.g., how to use an HDFC credit card code).

### 4. **Analytics & Dashboard**
- `src/app/actions/flightActions.ts`: Contains `logSearchAction` and `logBookingClick` to inflate search counts and record actual money saved.
- `src/components/dashboard/PriceTrendChart.tsx`: Pulls `PriceHistory` from Prisma to display 30-day price trends.

## Pending Implementation Details (Where the previous AI stopped)

**Pillar 3: Performance Optimization Layer 1 (Streaming Results)**
- Currently, `getAndTrackFlights` in `flightActions.ts` waits for *all* scrapers to finish via `Promise.allSettled`.
- The Next.js frontend waits for this combined payload.
- **Goal**: Split this into two phases:
  1. `getGoogleFlightsAction`: Fetch Google Flights (fast), return immediately to the frontend.
  2. `getOTAFlightsAction`: Fetch OTA Flights (Ixigo, MMT, Cleartrip), append seamlessly to the search results state.
- **Frontend changes**: Update `search/page.tsx` to handle a two-phase loading state (displaying Google results while showing a "Loading more sources..." indicator for OTAs).
