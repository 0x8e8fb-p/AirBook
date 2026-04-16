# Checkout / Booking Screen Implementation Plan

## 1. Goal
When a user clicks "Book Now" on a flight result, they should be taken to a detailed `/checkout` screen. This screen will display a full breakdown of the base fare, OTA convenience fees, and applied bank discounts, along with baggage policies. Finally, it provides a deep link (or an external link) to the OTA where they can complete the booking.

## 2. Components
1. **Zustand Store Update**:
   - Since flights are dynamically scraped and don't live in a permanent DB (except for lowest historical prices), we need to pass the selected flight details to the checkout page.
   - Update `src/stores/search-store.ts` (or create `checkout-store.ts`) to temporarily hold the `selectedFlight: FlightResult | null`.

2. **Checkout Page (`src/app/checkout/page.tsx`)**:
   - **Header**: Simple "Review your booking" with a back button.
   - **Flight Summary Card**: Shows Origin, Destination, Departure/Arrival times, duration, and airline details.
   - **Fare Breakdown Section**:
     - Base Fare: ₹X
     - Convenience Fee: ₹350
     - Bank Discount: -₹Y (highlighted in green)
     - Total Payable: ₹Z
   - **Policies Section**:
     - Baggage allowance (15kg checked, 7kg cabin).
     - Cancellation / Reschedule info (e.g., "Partial Refund").
   - **Redirect Button**: "Proceed to [OTA Name]". Opens the OTA's search page in a new tab (since deep-linking directly to a checkout page is usually restricted by OTAs without an affiliate API, we'll link to their search results for that exact route/date).

## 3. Execution Steps
1. Create `checkout-store.ts`.
2. Update the "Book Now" button in `FlightCard` (in `search/page.tsx`) to set the `selectedFlight` in the store before routing to `/checkout`.
3. Build the `/checkout` UI page.