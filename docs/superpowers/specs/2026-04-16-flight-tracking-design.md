# Flight Tracking and Smart-Pricing Engine Design

## Overview
AirBook will implement a flight aggregation and pricing engine designed specifically for the Indian market. Unlike global aggregators (Skyscanner, Google Flights) that only show base fares, AirBook will calculate the **True Effective Price** by automatically applying Indian OTA convenience fees and bank/credit card offers. It will also track historical prices to alert users when a flight hits an "all-time low."

## Architecture & Components

The system is decomposed into three distinct modules to ensure scalability and maintainability:

### 1. Flight Aggregator Engine (Data Ingestion)
- **Primary Source**: Tequila API (by Kiwi.com) for initial discovery.
- **Data Flow**: Next.js Server Actions will securely fetch data from the provider to keep API keys hidden and allow for edge caching.
- **Standardized Schema**: The raw provider data will be mapped to an internal `FlightOffer` interface:
  - Airline, Flight Number, Origin/Dest Airports
  - Departure/Arrival Times, Duration, Layovers
  - Base Price, Currency, Baggage Allowance

### 2. Smart-Price Offer Engine (The Differentiator)
- **Purpose**: Calculate the absolute lowest price based on user-held credit cards and OTA promo codes.
- **Structure**: A Static Rule Engine (TypeScript module) containing known, high-value Indian bank offers.
  - Example Rule: `HDFC_CC_DOM: { type: 'percentage', value: 0.15, maxCap: 1500, minBooking: 5000, appliesTo: ['MMT', 'Cleartrip'] }`
- **Logic**: 
  - `Effective Price = Base Fare + Estimated Convenience Fee - Best Applicable Bank Discount`
- **Extensibility**: Designed so we can later plug in a live scraper (via `agent-browser` or MCP) to update these rules dynamically.

### 3. Time-Series Tracking & Alerting (Database)
- **Storage**: SQLite via Prisma ORM. This allows us to move fast locally while being trivial to migrate to PostgreSQL later.
- **Models**:
  - `FlightRoute`: e.g., BOM -> DEL.
  - `PriceHistory`: Logs the lowest found `Effective Price` for a specific route and future date, stamped with the current time.
  - `UserAlert`: Subscriptions for when a price drops below a threshold or hits the all-time historical low.

## API & Data Flow
1. **User Search**: User enters BOM -> DEL for 2026-05-01.
2. **Fetch**: Server Action calls Tequila API.
3. **Enhance**: The response is passed through the `Smart-Price Engine` to append the `effectivePrice` and `bestOffer` details to each flight.
4. **Log**: The lowest `effectivePrice` found for this search is asynchronously written to the SQLite `PriceHistory` table.
5. **Respond**: The fully enriched data is returned to the frontend for rendering.

## Error Handling & Edge Cases
- **API Rate Limits**: Implement a basic caching layer (Redis or Next.js `unstable_cache`) to avoid hammering the free Tequila API for identical, concurrent searches.
- **Stale Offers**: The Static Rule Engine must have expiration dates on offers so they silently drop off when invalid, preventing false hopes.

## Next Steps for Implementation
1. Initialize Prisma and the SQLite database schema.
2. Build the Tequila API fetcher and standardizer.
3. Build the Static Rule Engine for Indian Bank Offers.
4. Integrate the flow into a Next.js Server Action.