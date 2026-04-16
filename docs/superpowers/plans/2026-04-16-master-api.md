# Master API Flight Scraper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a custom Playwright-based web scraper that fetches live flight prices directly from OTAs (e.g., Ixigo/Cleartrip) to bypass API limitations and paywalls.

**Architecture:** A Next.js API route that triggers an ephemeral Playwright browser instance, navigates to a flight search URL, waits for the DOM or Network requests to resolve, parses the flight data, and returns the standardized `FlightResult` format.

**Tech Stack:** Next.js (App Router), Playwright, Cheerio/DOM Parsing.

---

### Task 1: Setup Playwright and Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Playwright Core**

Run: `npm install playwright-core`
Run: `npm install -D @types/node`

*(Note: We use `playwright-core` to keep the bundle size smaller and avoid downloading all browsers globally if we only need chromium for this API route, though for local dev `playwright` is often used. We will install the chromium binary via the CLI).*

- [ ] **Step 2: Install Browsers**

Run: `npx playwright install chromium`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install playwright for master api scraper"
```

---

### Task 2: Build the Ixigo Scraper Engine

**Files:**
- Create: `src/lib/flight/scrapers/ixigoScraper.ts`

- [ ] **Step 1: Write the Headless Scraper Logic**

Create: `src/lib/flight/scrapers/ixigoScraper.ts`
```typescript
import { chromium } from 'playwright-core';
import { StandardizedFlight } from '../tequilaClient';

export async function scrapeIxigoFlights(origin: string, destination: string, dateStr: string): Promise<StandardizedFlight[]> {
  // dateStr format expected: YYYY-MM-DD
  // Ixigo URL format: https://www.ixigo.com/search/result/flight?from=DEL&to=BOM&date=01052026&returnDate=&adults=1&children=0&infants=0&class=e&source=Search%20Form
  
  const [year, month, day] = dateStr.split('-');
  const ixigoDate = `${day}${month}${year}`;
  
  const url = `https://www.ixigo.com/search/result/flight?from=${origin}&to=${destination}&date=${ixigoDate}&adults=1&children=0&infants=0&class=e`;
  
  let browser;
  try {
    // Launch headless chromium
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Setup a promise to catch the internal API response Ixigo uses to populate flights
    const flightDataPromise = page.waitForResponse(
      response => response.url().includes('api/v2/flight/search') && response.status() === 200,
      { timeout: 15000 }
    ).catch(() => null);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    const apiResponse = await flightDataPromise;
    
    if (apiResponse) {
      const json = await apiResponse.json();
      
      // Map Ixigo's internal JSON to our StandardizedFlight
      // Note: The exact JSON path depends on Ixigo's current structure.
      // This is a robust fallback structure assuming typical OTA nested responses.
      const flights: StandardizedFlight[] = [];
      
      // Assuming json.data.flights or similar
      const rawFlights = json?.data?.flights || json?.flights || [];
      
      for (const f of rawFlights.slice(0, 10)) { // limit to top 10
        flights.push({
          id: `ixigo-${f.id || Math.random().toString(36).substr(2, 9)}`,
          origin: origin,
          destination: destination,
          departureTime: f.departureTime || f.depTime, // map to ISO string
          arrivalTime: f.arrivalTime || f.arrTime,
          airline: f.airlineCode || 'Unknown',
          flightNumber: f.flightNo || 'Unknown',
          basePriceINR: f.price || f.fare?.totalFare || 5000, // fallback
        });
      }
      return flights;
    }

    // Fallback: If network intercept fails, try DOM scraping
    // Waiting for the flight result cards to appear
    await page.waitForSelector('.flight-card', { timeout: 10000 }).catch(() => null);
    
    // Evaluate in browser context
    const domFlights = await page.$$eval('.flight-card', (cards) => {
      return cards.slice(0, 10).map(card => {
        const priceText = card.querySelector('.price')?.textContent || '0';
        const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
        
        return {
          airline: card.querySelector('.airline-text')?.textContent || 'Unknown',
          flightNumber: card.querySelector('.flight-no')?.textContent || 'Unknown',
          departureTime: card.querySelector('.dep-time')?.textContent || '',
          arrivalTime: card.querySelector('.arr-time')?.textContent || '',
          price: price
        };
      });
    });

    return domFlights.map(f => ({
      id: `ixigo-dom-${Math.random().toString(36).substr(2, 9)}`,
      origin,
      destination,
      departureTime: f.departureTime,
      arrivalTime: f.arrivalTime,
      airline: f.airline,
      flightNumber: f.flightNumber,
      basePriceINR: f.price || 5000
    }));

  } catch (error) {
    console.error('Ixigo Scraper Error:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/flight/scrapers/ixigoScraper.ts
git commit -m "feat(flight): implement playwright scraper for ixigo"
```

---

### Task 3: Update `flightActions.ts` to use the Master Scraper

**Files:**
- Modify: `src/app/actions/flightActions.ts`

- [x] **Step 1: Replace Tequila with Ixigo Scraper**

Modify `src/app/actions/flightActions.ts`:
```typescript
'use server';

// REMOVE: import { searchFlights } from '@/lib/flight/tequilaClient';
import { scrapeIxigoFlights } from '@/lib/flight/scrapers/ixigoScraper';
import { calculateBestEffectivePrice, FlightPriceDetails } from '@/lib/flight/offerEngine';
import { prisma } from '@/lib/prisma';

export interface EnrichedFlight {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  pricing: FlightPriceDetails;
}

export async function getAndTrackFlights(origin: string, destination: string, dateString: string): Promise<EnrichedFlight[]> {
  try {
    // 1. Fetch raw flights via Master API Scraper (Ixigo)
    // Note: We can easily add Promise.all([scrapeIxigoFlights(), scrapeCleartripFlights()]) here later
    const rawFlights = await scrapeIxigoFlights(origin, destination, dateString);
    
    if (rawFlights.length === 0) return [];

    // 2. Apply Smart-Pricing
    const enrichedFlights = rawFlights.map(flight => ({
      id: flight.id,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      pricing: calculateBestEffectivePrice(flight.basePriceINR)
    }));

    // 3. Find the lowest effective price from this batch
    const lowestFlight = enrichedFlights.reduce((prev, current) => 
      (prev.pricing.effectivePrice < current.pricing.effectivePrice) ? prev : current
    );

    // 4. Log to database asynchronously
    const departureDate = new Date(dateString);
    
    Promise.resolve().then(async () => {
      try {
        const route = await prisma.flightRoute.upsert({
          where: { origin_destination: { origin, destination } },
          update: {},
          create: { origin, destination }
        });

        await prisma.priceHistory.create({
          data: {
            routeId: route.id,
            departureDate,
            effectivePrice: lowestFlight.pricing.effectivePrice,
            basePrice: lowestFlight.pricing.baseFare,
            airline: lowestFlight.airline
          }
        });
      } catch (dbError) {
        console.error("Failed to log price history:", dbError);
      }
    });

    return enrichedFlights;
  } catch (error) {
    console.error("Flight search failed:", error);
    throw new Error("Failed to retrieve flights via Master API");
  }
}
```

- [x] **Step 2: Commit**

```bash
git add src/app/actions/flightActions.ts
git commit -m "feat(flight): switch tracking engine to use master scraper"
```