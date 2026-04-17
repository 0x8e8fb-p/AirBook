import { StandardizedFlight } from '../tequilaClient';

export async function scrapeCleartripFlights(origin: string, destination: string, dateStr: string): Promise<StandardizedFlight[]> {
  try {
    // Simulate HTTP API latency (faster than Playwright)
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Generate some mock HTTP results to simulate the OTA integration
    const flights: StandardizedFlight[] = [];
    const airlines = ['6E', 'AI', 'UK', 'SG', 'QP'];
    const basePrices = [4900, 4500, 5200, 4300, 5700];

    for (let i = 0; i < 3; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const basePrice = basePrices[Math.floor(Math.random() * basePrices.length)] + Math.floor(Math.random() * 500);
      
      flights.push({
        id: `ct-${Math.random().toString(36).substr(2, 9)}`,
        origin,
        destination,
        departureTime: `${dateStr}T10:${Math.floor(Math.random() * 50).toString().padStart(2, '0')}:00.000Z`,
        arrivalTime: `${dateStr}T12:${Math.floor(Math.random() * 50).toString().padStart(2, '0')}:00.000Z`,
        airline,
        flightNumber: `${airline}${Math.floor(Math.random() * 900) + 100}`,
        basePriceINR: basePrice
      });
    }

    return flights;
  } catch (error) {
    console.error('Cleartrip Scraper Error:', error);
    return [];
  }
}