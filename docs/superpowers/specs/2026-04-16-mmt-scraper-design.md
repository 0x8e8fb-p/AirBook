# Master API Expansion: MakeMyTrip Scraper Design

## Overview
To ensure TheWingsScan finds the absolute lowest price, our Master API must race multiple providers concurrently. We currently scrape Ixigo successfully. We will now add a scraper for **MakeMyTrip (MMT)**, the largest Online Travel Agency in India.

## Architecture

### 1. The Scraper Module (`mmtScraper.ts`)
- **Engine**: Playwright Headless Browser.
- **Input**: Origin (e.g., DEL), Destination (e.g., BOM), Date (YYYY-MM-DD).
- **Navigation URL**: MMT uses a specific URL format for domestic flights: 
  `https://www.makemytrip.com/flight/search?itinerary=DEL-BOM-15/05/2026&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=E`
- **Extraction Strategy**:
  1. **Primary**: Wait for the internal network request that populates the React state (often to a `/api/flights/` endpoint) and parse the JSON directly.
  2. **Fallback**: Wait for `.listingCard` or `.makeFlex` flight cards to appear in the DOM and scrape the airline, time, and price texts using Cheerio-like syntax via `page.$$eval`.

### 2. Orchestration (`flightActions.ts`)
- Currently, `getAndTrackFlights` awaits the Ixigo scraper.
- We will update it to use `Promise.allSettled` to run both `scrapeIxigoFlights` and `scrapeMMTFlights` **concurrently**.
- **Merging Logic**:
  - Combine the arrays of flights from both providers.
  - Apply the Smart-Pricing Engine to all flights.
  - Sort by the lowest `effectivePrice`.
  - Optionally, deduplicate identical flights (same airline, flight number, and time) by keeping only the cheaper one, so the user doesn't see identical flights from two different OTAs cluttering the UI.

## Error Handling
- MMT occasionally shows popups or modals on load. The scraper must be designed to either ignore them or intercept the network requests *before* the UI blocks interaction.
- If MMT fails (e.g., blocked by Akamai), `Promise.allSettled` ensures that the Ixigo results still successfully return to the user without crashing the whole search.

## Data Schema
The output from MMT must map to our existing `StandardizedFlight` interface:
```typescript
{
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  basePriceINR: number;
}
```

## Next Steps
1. Build `mmtScraper.ts`.
2. Update `flightActions.ts` to execute both scrapers in parallel and merge/deduplicate the results.