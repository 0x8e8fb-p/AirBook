# The TheWingsScan "Master API" Architecture (Zero Limits)

## The Problem
All major flight aggregators (Skyscanner, Amadeus, Tequila) strictly gatekeep their live pricing APIs behind massive paywalls, rate limits, or closed B2B partnerships. They do this because live flight pricing is the most expensive data to compute in the travel industry.

## The Solution: A Superior Master API
To have zero limits and be superior to competitors, TheWingsScan will bypass official API channels and build a **Distributed Web Scraping Engine** that queries Indian Online Travel Agencies (OTAs) directly. We will create our own internal "Master API" that acts as the central brain.

### Why is it Superior?
1. **No Rate Limits:** We don't pay per query to an aggregator.
2. **True Indian Pricing:** We see exactly what the user sees (including convenience fees).
3. **Real-Time Offers:** We scrape the live bank offers directly from the OTA checkout pages, rather than relying on stale static rules.

### Architecture

#### 1. The Scraper Workers (Playwright/Puppeteer)
We cannot just send `fetch()` requests to OTAs like MakeMyTrip or Cleartrip because they use Akamai/Cloudflare bot protection and dynamic token generation. 
Instead, we will use headless browsers (Playwright) to:
- Open a hidden browser instance.
- Navigate directly to the search URL (e.g., `https://www.ixigo.com/search/result/flight?from=DEL&to=BOM&date=...`).
- Wait for the React/Angular app to finish rendering the DOM.
- Extract the raw JSON from the `window.__INITIAL_STATE__` or intercept the background XHR requests.

#### 2. The Aggregator Node (The Master API)
When a user searches on TheWingsScan:
1. The Next.js backend receives the request.
2. It spawns 3 concurrent scraping tasks targeting 3 different providers (e.g., Ixigo, Paytm Flights, Cleartrip).
3. It waits for the fastest 2 to return results.
4. It normalizes the data into our `FlightResult` format.
5. It applies our Smart-Pricing Engine (from Task 2) to factor in credit card offers.

#### 3. Caching & Database (Cost Reduction)
Running headless browsers is CPU intensive. To prevent the server from crashing under load:
- Every successful scrape is saved to our SQLite/Prisma database (`PriceHistory`).
- If another user searches the exact same route and date within 15 minutes, we serve the cached database result instantly instead of spinning up the scraper again.

## Implementation Steps

1. **Setup Playwright**: Install Playwright in the Next.js project.
2. **Build Provider Scrapers**: Write specific extraction logic for 1-2 major Indian OTAs (e.g., Ixigo, which has relatively clean DOM structures).
3. **Create the Master Route**: Build `src/app/api/master-flight/route.ts` to orchestrate the scrapers concurrently.
4. **Update Frontend**: Point the UI to our new, unlimited Master API.

## Risks & Mitigations
- **Bot Blocks**: OTAs change their DOM and add CAPTCHAs. We will mitigate this by intercepting raw network JSON responses rather than relying heavily on CSS selectors.
- **Speed**: Headless scraping takes 5-10 seconds. We will use a Server-Sent Events (SSE) or loading skeleton on the UI so the user sees flights streaming in one by one.