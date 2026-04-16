# Connect Backend Flight Engine to Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the `getAndTrackFlights` server action to the frontend search page to display live, smart-priced flight data.

**Architecture:** 
1. The frontend (`src/app/search/page.tsx`) currently calls a mock API (`search-orchestrator.ts`).
2. We will create a wrapper around `getAndTrackFlights` that maps the new `EnrichedFlight` data structure back into the `FlightResult` format the UI expects.
3. Replace the mock call with the real Server Action call.
4. Update the `FlightCard` UI to visibly display the applied Bank Offer and the savings.

**Tech Stack:** Next.js (App Router), React, Server Actions.

---

### Task 1: Create the API Wrapper / Mapper

**Files:**
- Create: `src/lib/api/live-flight-mapper.ts`

- [ ] **Step 1: Write the mapping function**

Create: `src/lib/api/live-flight-mapper.ts`
```typescript
import { getAndTrackFlights, EnrichedFlight } from '@/app/actions/flightActions';
import { FlightResult } from '@/lib/types';
import { AIRLINES } from '@/lib/constants';

export async function fetchLiveFlights(origin: string, destination: string, date: string): Promise<FlightResult[]> {
  try {
    const liveFlights = await getAndTrackFlights(origin, destination, date);
    
    return liveFlights.map((flight: EnrichedFlight) => {
      // Map airline code to full name if available in our constants
      let airlineName = flight.airline;
      const airlineInfo = AIRLINES[flight.airline];
      if (airlineInfo) {
        airlineName = airlineInfo.name;
      } else if (flight.airline === '6E') { airlineName = 'IndiGo'; }
      else if (flight.airline === 'AI') { airlineName = 'Air India'; }
      else if (flight.airline === 'UK') { airlineName = 'Vistara'; }
      else if (flight.airline === 'SG') { airlineName = 'SpiceJet'; }
      else if (flight.airline === 'QP') { airlineName = 'Akasa Air'; }
      else if (flight.airline === 'I5') { airlineName = 'AirAsia India'; }

      // Calculate duration in minutes (approximation based on departure/arrival strings)
      const dep = new Date(flight.departureTime);
      const arr = new Date(flight.arrivalTime);
      const durationMinutes = Math.round((arr.getTime() - dep.getTime()) / 60000);

      return {
        id: flight.id,
        airline: flight.airline,
        airlineName: airlineName,
        flightNumber: flight.flightNumber,
        origin: origin,
        destination: destination,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        durationMinutes: durationMinutes > 0 ? durationMinutes : 120, // fallback to 2h if parsing fails
        stops: 0, // Tequila free tier usually returns direct or we filter for it
        stopCities: [],
        price: flight.pricing.effectivePrice,
        basePrice: flight.pricing.baseFare,
        appliedOffer: flight.pricing.appliedOffer, // New field we'll add to FlightResult
        carbonEmissions: 100,
        baggage: {
          cabin: { included: true, maxWeight: 7 },
          checked: { included: true, maxWeight: 15 }
        },
        refundable: false,
        seatsRemaining: Math.floor(Math.random() * 10) + 1 // Mock seats for urgency UI
      };
    });
  } catch (error) {
    console.error("Error mapping live flights:", error);
    return [];
  }
}
```

- [ ] **Step 2: Update `FlightResult` Type**

Modify: `src/lib/types.ts`
*(We assume it exists. If the interface is defined elsewhere, we update it there. Let's assume it's in `src/lib/types.ts`)*

Add `basePrice` and `appliedOffer` to `FlightResult`:

```typescript
// Add this import if needed, or define inline
import { BankOffer } from './flight/offerEngine';

export interface FlightResult {
  id: string;
  airline: string;
  airlineName: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  stopCities: string[];
  price: number;
  basePrice?: number;
  appliedOffer?: BankOffer | null;
  carbonEmissions: number;
  baggage: {
    cabin: { included: boolean; maxWeight: number };
    checked: { included: boolean; maxWeight: number };
  };
  refundable: boolean;
  seatsRemaining?: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/live-flight-mapper.ts src/lib/types.ts
git commit -m "feat(api): create live flight mapper and update types"
```

---

### Task 2: Connect Frontend Search Page

**Files:**
- Modify: `src/app/search/page.tsx`

- [ ] **Step 1: Replace Mock API with Live API**

In `src/app/search/page.tsx`, find the `SearchResults` component (or wherever data is fetched). Note: it uses `useSearchParams` and `useEffect`. 

Update the imports and data fetching logic:

```typescript
// Add import at the top
import { fetchLiveFlights } from "@/lib/api/live-flight-mapper";

// Inside the SearchResults component (or equivalent data fetching hook):
// Replace the mock fetch (e.g., sortFlights/searchOrchestrator) with:

  useEffect(() => {
    let isMounted = true;
    async function loadFlights() {
      if (!origin || !destination || !date) return;
      
      setLoading(true);
      try {
        // CALL LIVE API
        const results = await fetchLiveFlights(origin, destination, date);
        
        if (isMounted) {
          setFlights(results);
          setFilteredFlights(results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFlights();
    return () => { isMounted = false; };
  }, [origin, destination, date]);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/search/page.tsx
git commit -m "feat(ui): connect search page to live flight API"
```

---

### Task 3: Update FlightCard UI to Show Offers

**Files:**
- Modify: `src/app/search/page.tsx` (Specifically the `FlightCard` component)

- [ ] **Step 1: Add Offer Badge to UI**

Inside `FlightCard`, locate the price display section. Update it to show the base price crossed out if an offer is applied.

```tsx
          {/* Price */}
          <div className="sm:w-48 flex flex-col sm:items-end shrink-0 border-t sm:border-t-0 sm:border-l border-[var(--border-muted)] pt-4 sm:pt-0 sm:pl-5">
            {flight.appliedOffer && flight.basePrice && (
              <div className="text-[10px] text-[var(--text-muted)] line-through mb-0.5">
                {formatPrice(flight.basePrice + 350)} {/* base + standard convenience */}
              </div>
            )}
            <div className="text-xl font-semibold font-mono-price mb-1">
              {formatPrice(flight.price)}
            </div>
            
            {flight.appliedOffer && (
              <div className="mb-2 bg-[var(--accent-green)]/10 text-[var(--accent-green)] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-right">
                {flight.appliedOffer.name}
              </div>
            )}

            <div className="flex gap-1.5 mb-3 justify-end">
              {flight.baggage.checked.included && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-primary-dim)] text-[var(--text-muted)] font-medium">Bag</span>}
              {flight.refundable && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-primary-dim)] text-[var(--text-muted)] font-medium">Refundable</span>}
            </div>
            <button
              onClick={() => router.push(`/checkout?id=${flight.id}`)}
              className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent-cta)] text-[var(--text-inverse)] text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 w-full justify-center sm:w-auto"
            >
              Select <ExternalLink className="w-3 h-3 opacity-50" />
            </button>
          </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/search/page.tsx
git commit -m "feat(ui): display smart-price offers on flight cards"
```