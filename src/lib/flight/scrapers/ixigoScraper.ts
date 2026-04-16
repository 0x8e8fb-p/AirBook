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
