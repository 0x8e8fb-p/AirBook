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
    // Launch headless chromium
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Add extra headers to prevent HTTP2 PROTOCOL ERROR from anti-bot mechanisms
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    });

    // Setup a promise to catch the internal API response MMT uses to populate flights
    // The exact endpoint might vary, e.g., /api/search/v1/flights
    const flightDataPromise = page.waitForResponse(
      response => response.url().includes('flight/api/v1/search') && response.status() === 200,
      { timeout: 15000 }
    ).catch(() => null);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    const apiResponse = await flightDataPromise;
    
    if (apiResponse) {
      const json = await apiResponse.json();
      
      const flights: StandardizedFlight[] = [];
      const rawFlights = json?.data?.flights || json?.itineraries || [];
      
      for (const f of rawFlights.slice(0, 10)) {
        flights.push({
          id: `mmt-${f.id || Math.random().toString(36).substr(2, 9)}`,
          origin: origin,
          destination: destination,
          departureTime: f.departureTime || f.depTime || '',
          arrivalTime: f.arrivalTime || f.arrTime || '',
          airline: f.airlineCode || f.airline || 'Unknown',
          flightNumber: f.flightNo || 'Unknown',
          basePriceINR: f.price || f.fare?.totalFare || 5000,
        });
      }
      return flights;
    }

    // Fallback: If network intercept fails, try DOM scraping
    await page.waitForSelector('.flightCard', { timeout: 10000 }).catch(() => null);
    
    const domFlights = await page.$$eval('.flightCard', (cards) => {
      return cards.slice(0, 10).map(card => {
        const priceText = card.querySelector('.price')?.textContent || '0';
        const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
        
        return {
          airline: card.querySelector('.airlineName')?.textContent || 'Unknown',
          flightNumber: card.querySelector('.flightNumber')?.textContent || 'Unknown',
          departureTime: card.querySelector('.depTime')?.textContent || '',
          arrivalTime: card.querySelector('.arrTime')?.textContent || '',
          price: price
        };
      });
    });

    return domFlights.map(f => ({
      id: `mmt-dom-${Math.random().toString(36).substr(2, 9)}`,
      origin,
      destination,
      departureTime: f.departureTime,
      arrivalTime: f.arrivalTime,
      airline: f.airline,
      flightNumber: f.flightNumber,
      basePriceINR: f.price || 5000
    }));

  } catch (error) {
    console.error('MMT Scraper Error:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}