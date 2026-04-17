import { FlightData, Passengers, createFilter, getFlightsFromFilter } from "google-flights-ts";
import { StandardizedFlight } from "../tequilaClient";

export async function scrapeGoogleFlights(origin: string, destination: string, dateStr: string): Promise<StandardizedFlight[]> {
  try {
    const filter = createFilter({
      flight_data: [
        new FlightData({
          date: dateStr,
          from_airport: origin,
          to_airport: destination,
        }),
      ],
      trip: "one-way",
      passengers: new Passengers({ adults: 1 }),
      seat: "economy",
    });

    const result = await getFlightsFromFilter(filter, {
      currency: "INR",
      data_source: "js"
    });

    if (!result || !("best" in result)) {
      return [];
    }

    const allFlights = [...result.best, ...result.other];
    const standardizedFlights: StandardizedFlight[] = [];

    for (const itinerary of allFlights) {
      if (!itinerary.flights || itinerary.flights.length === 0) continue;
      
      const firstFlight = itinerary.flights[0];
      const lastFlight = itinerary.flights[itinerary.flights.length - 1];

      // Format dates to ISO strings roughly
      // departure_date: [2026, 5, 15], departure_time: [5, 0] (or just [5] if 5:00)
      const depYear = firstFlight.departure_date[0];
      const depMonth = String(firstFlight.departure_date[1]).padStart(2, '0');
      const depDay = String(firstFlight.departure_date[2]).padStart(2, '0');
      const depHour = String(firstFlight.departure_time[0] || 0).padStart(2, '0');
      const depMin = String(firstFlight.departure_time[1] || 0).padStart(2, '0');
      const departureTime = `${depYear}-${depMonth}-${depDay}T${depHour}:${depMin}:00.000Z`;

      const arrYear = lastFlight.arrival_date[0];
      const arrMonth = String(lastFlight.arrival_date[1]).padStart(2, '0');
      const arrDay = String(lastFlight.arrival_date[2]).padStart(2, '0');
      const arrHour = String(lastFlight.arrival_time[0] || 0).padStart(2, '0');
      const arrMin = String(lastFlight.arrival_time[1] || 0).padStart(2, '0');
      const arrivalTime = `${arrYear}-${arrMonth}-${arrDay}T${arrHour}:${arrMin}:00.000Z`;

      // The library parses the Google Protobuf response and incorrectly divides the integer price by 100 
      // for zero-decimal currencies like INR. We need to multiply by 100 to get the actual INR value.
      let price = itinerary.itinerary_summary?.price || 0;
      if (itinerary.itinerary_summary?.currency === "INR" || !itinerary.itinerary_summary?.currency) {
        price = Math.round(price * 100);
      }

      // Safeguard: Ensure price is not 0 or abnormally low
      if (price <= 0) continue;

      standardizedFlights.push({
        id: `google-${Math.random().toString(36).substr(2, 9)}`,
        origin: origin,
        destination: destination,
        departureTime,
        arrivalTime,
        airline: itinerary.airline_names?.[0] || firstFlight.airline_name || 'Unknown',
        flightNumber: `${firstFlight.airline}${firstFlight.flight_number}`,
        basePriceINR: price,
        stops: itinerary.flights.length - 1
      });
    }

    return standardizedFlights;

  } catch (error) {
    console.error("Google Flights Scraper Error:", error);
    return [];
  }
}