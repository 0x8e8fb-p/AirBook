# Flight Tracking Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a flight aggregation, smart-pricing, and tracking engine for the Indian market.

**Architecture:** 
1. Database layer using Prisma + SQLite to store historical prices and routes.
2. API integration layer to fetch flight data from Kiwi's Tequila API.
3. Rule Engine layer to apply Indian bank/credit card offers to calculate the effective price.
4. Next.js Server Actions to orchestrate the flow and serve the frontend.

**Tech Stack:** Next.js (App Router), TypeScript, Prisma, SQLite, Tequila API.

---

### Task 1: Setup Prisma and Database Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`

- [x] **Step 1: Initialize Prisma**

Run: `npx prisma init --datasource-provider sqlite`

- [x] **Step 2: Define the Schema**

Modify: `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model FlightRoute {
  id          String   @id @default(cuid())
  origin      String
  destination String
  prices      PriceHistory[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([origin, destination])
}

model PriceHistory {
  id             String      @id @default(cuid())
  routeId        String
  route          FlightRoute @relation(fields: [routeId], references: [id])
  departureDate  DateTime
  effectivePrice Float
  basePrice      Float
  airline        String
  recordedAt     DateTime    @default(now())

  @@index([routeId, departureDate])
}
```

- [x] **Step 3: Create Prisma Client Singleton**

Create: `src/lib/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [x] **Step 4: Push Database Schema**

Run: `npx prisma db push`

- [x] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts .env
git commit -m "feat(db): initialize prisma schema for flight tracking"
```

---

### Task 2: Build the Smart-Price Offer Engine

**Files:**
- Create: `src/lib/flight/offerEngine.ts`

- [x] **Step 1: Define Interfaces and Static Rules**

Create: `src/lib/flight/offerEngine.ts`
```typescript
export interface BankOffer {
  id: string;
  name: string;
  type: 'percentage' | 'flat';
  value: number; // percentage (0.15) or flat amount (1000)
  maxCap?: number; // max discount amount for percentage
  minBooking: number;
}

export interface FlightPriceDetails {
  baseFare: number;
  convenienceFee: number;
  effectivePrice: number;
  appliedOffer: BankOffer | null;
}

const CONVENIENCE_FEE = 350; // Standard domestic convenience fee

export const INDIAN_BANK_OFFERS: BankOffer[] = [
  {
    id: 'HDFC_CC_DOM',
    name: '15% off up to ₹1500 on HDFC Credit Cards',
    type: 'percentage',
    value: 0.15,
    maxCap: 1500,
    minBooking: 5000,
  },
  {
    id: 'AXIS_DC_FLAT',
    name: 'Flat ₹1000 off on Axis Debit Cards',
    type: 'flat',
    value: 1000,
    minBooking: 4000,
  },
  {
    id: 'SBI_CC_10',
    name: '10% off up to ₹1200 on SBI Credit Cards',
    type: 'percentage',
    value: 0.10,
    maxCap: 1200,
    minBooking: 3000,
  }
];
```

- [x] **Step 2: Implement Calculation Logic**

Append to: `src/lib/flight/offerEngine.ts`
```typescript
export function calculateBestEffectivePrice(baseFare: number, userCards?: string[]): FlightPriceDetails {
  const totalFare = baseFare + CONVENIENCE_FEE;
  let bestOffer: BankOffer | null = null;
  let maxDiscount = 0;

  for (const offer of INDIAN_BANK_OFFERS) {
    if (totalFare >= offer.minBooking) {
      let discount = 0;
      if (offer.type === 'flat') {
        discount = offer.value;
      } else if (offer.type === 'percentage') {
        discount = totalFare * offer.value;
        if (offer.maxCap && discount > offer.maxCap) {
          discount = offer.maxCap;
        }
      }

      if (discount > maxDiscount) {
        maxDiscount = discount;
        bestOffer = offer;
      }
    }
  }

  return {
    baseFare,
    convenienceFee: CONVENIENCE_FEE,
    effectivePrice: totalFare - maxDiscount,
    appliedOffer: bestOffer,
  };
}
```

- [x] **Step 3: Commit**

```bash
git add src/lib/flight/offerEngine.ts
git commit -m "feat(flight): implement smart-price offer engine"
```

---

### Task 3: Build the Tequila API Fetcher

**Files:**
- Create: `src/lib/flight/tequilaClient.ts`

- [x] **Step 1: Create Tequila Client**

Create: `src/lib/flight/tequilaClient.ts`
```typescript
interface TequilaFlightResponse {
  data: Array<{
    id: string;
    flyFrom: string;
    flyTo: string;
    price: number; // EUR by default, we need INR
    local_departure: string;
    local_arrival: string;
    airlines: string[];
    route: Array<{
      flight_no: number;
      airline: string;
    }>;
  }>;
}

export interface StandardizedFlight {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  basePriceINR: number;
}

export async function searchFlights(origin: string, destination: string, dateFrom: string): Promise<StandardizedFlight[]> {
  const TEQUILA_API_KEY = process.env.TEQUILA_API_KEY;
  if (!TEQUILA_API_KEY) throw new Error("TEQUILA_API_KEY is not set");

  // Format date for Tequila: DD/MM/YYYY
  const [year, month, day] = dateFrom.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  const url = new URL('https://api.tequila.kiwi.com/v2/search');
  url.searchParams.append('fly_from', origin);
  url.searchParams.append('fly_to', destination);
  url.searchParams.append('date_from', formattedDate);
  url.searchParams.append('date_to', formattedDate);
  url.searchParams.append('curr', 'INR');
  url.searchParams.append('limit', '10');

  const response = await fetch(url.toString(), {
    headers: {
      'apikey': TEQUILA_API_KEY,
      'accept': 'application/json',
    },
    next: { revalidate: 3600 } // Cache for 1 hour to avoid rate limits
  });

  if (!response.ok) {
    throw new Error(`Tequila API Error: ${response.statusText}`);
  }

  const data: TequilaFlightResponse = await response.json();

  return data.data.map(flight => ({
    id: flight.id,
    origin: flight.flyFrom,
    destination: flight.flyTo,
    departureTime: flight.local_departure,
    arrivalTime: flight.local_arrival,
    airline: flight.airlines[0] || 'Unknown',
    flightNumber: flight.route[0] ? `${flight.route[0].airline}${flight.route[0].flight_no}` : 'Unknown',
    basePriceINR: flight.price,
  }));
}
```

- [x] **Step 2: Commit**

```bash
git add src/lib/flight/tequilaClient.ts
git commit -m "feat(flight): implement tequila api client"
```

---

### Task 4: Create Server Action for Flight Search & Tracking

**Files:**
- Create: `src/app/actions/flightActions.ts`

- [ ] **Step 1: Implement Server Action**

Create: `src/app/actions/flightActions.ts`
```typescript
'use server';

import { searchFlights } from '@/lib/flight/tequilaClient';
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
    // 1. Fetch raw flights
    const rawFlights = await searchFlights(origin, destination, dateString);
    
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

    // 4. Log to database asynchronously (don't block response)
    const departureDate = new Date(dateString);
    
    // Fire and forget DB logging
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
    throw new Error("Failed to retrieve flights");
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/actions/flightActions.ts
git commit -m "feat(flight): create server action for search and tracking"
```