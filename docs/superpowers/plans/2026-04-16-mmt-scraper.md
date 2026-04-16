# MakeMyTrip Scraper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Playwright scraper for MakeMyTrip and orchestrate it to run concurrently with the Ixigo scraper.

**Architecture:** 
1. `mmtScraper.ts` uses Playwright to navigate to MakeMyTrip, wait for the flight results DOM to load, and extracts the flight data.
2. `flightActions.ts` is updated to run both `scrapeIxigoFlights` and `scrapeMMTFlights` in parallel using `Promise.allSettled`, then merges the results.

**Tech Stack:** Next.js, Playwright, TypeScript.

---

### Task 1: Build the MakeMyTrip Scraper

**Files:**
- Create: `src/lib/flight/scrapers/mmtScraper.ts`

- [ ] **Step 1: Write the Scraper Logic**

Create: `src/lib/flight/scrapers/mmtScraper.ts`
```typescript
import { chromium } from 'playwright-core';
import { StandardizedFlight } from '../tequilaClient';

export async function scrapeMMTFlights(origin: string, destination: string, dateStr: string): Promise<StandardizedFlight[]> {
  // dateStr format expected: YYYY-MM-DD
  // MMT URL format: https://www.makemytrip.com/flight/search?itinerary=DEL-BOM-15/05/2026&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=E
  
  const [year, month, day] = dateStr.split('-');
  const mmtDate = `${day}/${month}/${year}`;
  
  const url = `https://www.makemytrip.com/flight/search?itinerary=${origin}-${destination}-${mmtDate}&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=E`;
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 }
    });
    
    const page = await context.newPage();
    
    // MMT often has a popup that blocks interaction, but we just need the DOM to load
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    
    // Wait for the flight cards to appear in the DOM
    // MMT usually uses classes like .listingCard or .makeFlex for flight rows
    await page.waitForSelector('.listingCard', { timeout: 15000 }).catch(() => null);
    
    const domFlights = await page.$$eval('.listingCard', (cards) => {
      return cards.slice(0, 10).map(card => {
        // These selectors are approximations based on typical MMT structure
        // MMT obfuscates classes often, so we look for generic identifiers
        const priceElement = card.querySelector('.priceSection .blackText') || card.querySelector('[class*="price"]');
        const priceText = priceElement?.textContent || '0';
        const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
        
        const airlineElement = card.querySelector('.airlineName') || card.querySelector('[class*="airline"]');
        const flightNoElement = card.querySelector('.flightNumber') || card.querySelector('[class*="flightNo"]');
        
        const timeElements = card.querySelectorAll('.appendRight8'); // Usually holds departure/arrival times
        const depTime = timeElements[0]?.textContent || '';
        const arrTime = timeElements[1]?.textContent || '';
        
        return {
          airline: airlineElement?.textContent || 'Unknown',
          flightNumber: flightNoElement?.textContent || 'Unknown',
          departureTime: depTime,
          arrivalTime: arrTime,
          price: price
        };
      });
    });

    return domFlights
      .filter(f => f.price > 0) // filter out bad parses
      .map(f => ({
        id: `mmt-${Math.random().toString(36).substr(2, 9)}`,
        origin,
        destination,
        departureTime: f.departureTime,
        arrivalTime: f.arrivalTime,
        airline: f.airline,
        flightNumber: f.flightNumber,
        basePriceINR: f.price
      }));

  } catch (error) {
    console.error('MMT Scraper Error:', error);
    return []; // Return empty array on failure so we don't crash the whole Promise.allSettled
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/flight/scrapers/mmtScraper.ts
git commit -m "feat(flight): implement playwright scraper for makemytrip"
```

---

### Task 2: Orchestrate Scrapers Concurrently

**Files:**
- Modify: `src/app/actions/flightActions.ts`

- [ ] **Step 1: Update `getAndTrackFlights`**

Modify `src/app/actions/flightActions.ts` to import and use the MMT scraper alongside Ixigo:

```typescript
'use server';

import { scrapeIxigoFlights } from '@/lib/flight/scrapers/ixigoScraper';
import { scrapeMMTFlights } from '@/lib/flight/scrapers/mmtScraper';
import { calculateBestEffectivePrice, FlightPriceDetails } from '@/lib/flight/offerEngine';
import { prisma } from '@/lib/prisma';
import { StandardizedFlight } from '@/lib/flight/tequilaClient';

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
    // 1. Fetch raw flights via Master API Scrapers CONCURRENTLY
    const results = await Promise.allSettled([
      scrapeIxigoFlights(origin, destination, dateString),
      scrapeMMTFlights(origin, destination, dateString)
    ]);
    
    let rawFlights: StandardizedFlight[] = [];
    
    // Extract successful results
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        rawFlights = [...rawFlights, ...result.value];
      }
    });

    if (rawFlights.length === 0) return [];

    // 2. Apply Smart-Pricing
    let enrichedFlights = rawFlights.map(flight => ({
      id: flight.id,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      pricing: calculateBestEffectivePrice(flight.basePriceINR)
    }));

    // Optional: Deduplicate flights (same airline, flight number) keeping the cheapest
    const uniqueFlightsMap = new Map<string, EnrichedFlight>();
    for (const flight of enrichedFlights) {
      const key = `${flight.airline}-${flight.flightNumber}`;
      const existing = uniqueFlightsMap.get(key);
      if (!existing || flight.pricing.effectivePrice < existing.pricing.effectivePrice) {
        uniqueFlightsMap.set(key, flight);
      }
    }
    enrichedFlights = Array.from(uniqueFlightsMap.values());

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

- [ ] **Step 2: Commit**

```bash
git add src/app/actions/flightActions.ts
git commit -m "feat(flight): orchestrate ixigo and mmt scrapers concurrently"
```