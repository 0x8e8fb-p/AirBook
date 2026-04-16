import { chromium } from 'playwright-core';
import { StandardizedFlight } from '../tequilaClient';

export async function scrapeCleartripFlights(origin: string, destination: string, dateStr: string): Promise<StandardizedFlight[]> {
  // dateStr format expected: YYYY-MM-DD
  // Cleartrip URL format: https://www.cleartrip.com/flights/results?adults=1&childs=0&infants=0&class=Economy&depart_date=15/05/2026&from=DEL&to=BOM
  
  const [year, month, day] = dateStr.split('-');
  const ctDate = `${day}/${month}/${year}`;
  
  const url = `https://www.cleartrip.com/flights/results?adults=1&childs=0&infants=0&class=Economy&depart_date=${ctDate}&from=${origin}&to=${destination}`;
  
  let browser;
  try {
    // Launch headless chromium
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Add extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    });

    const flightDataPromise = page.waitForResponse(
      response => response.url().includes('api/search') && response.status() === 200,
      { timeout: 15000 }
    ).catch(() => null);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    const apiResponse = await flightDataPromise;
    
    if (apiResponse) {
      const json = await apiResponse.json();
      
      const flights: StandardizedFlight[] = [];
      const rawFlights = json?.flights || json?.data || [];
      
      for (const f of rawFlights.slice(0, 10)) {
        flights.push({
          id: `ct-${f.id || Math.random().toString(36).substr(2, 9)}`,
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
    await page.waitForSelector('.rt-tuple-container', { timeout: 10000 }).catch(() => null);
    
    const domFlights = await page.$$eval('.rt-tuple-container', (cards) => {
      return cards.slice(0, 10).map(card => {
        const priceText = card.querySelector('.price')?.textContent || '0';
        const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
        
        return {
          airline: card.querySelector('.fw-500')?.textContent || 'Unknown',
          flightNumber: card.querySelector('.fs-2')?.textContent || 'Unknown',
          departureTime: card.querySelector('.m-0')?.textContent || '',
          arrivalTime: card.querySelector('.m-0:last-child')?.textContent || '',
          price: price
        };
      });
    });

    return domFlights.map(f => ({
      id: `ct-dom-${Math.random().toString(36).substr(2, 9)}`,
      origin,
      destination,
      departureTime: f.departureTime,
      arrivalTime: f.arrivalTime,
      airline: f.airline,
      flightNumber: f.flightNumber,
      basePriceINR: f.price || 5000
    }));

  } catch (error) {
    console.error('Cleartrip Scraper Error:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}