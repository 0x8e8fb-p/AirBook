// ============================================
// AirBook — SerpAPI Google Flights Client
// ============================================
// Uses SerpAPI to get structured Google Flights data.
// Free tier: 250 searches/month. Use as price verification layer.
// Docs: https://serpapi.com/google-flights-api

import type { FlightResult, FlightSegment, BaggageInfo, CabinClass, SearchParams } from '../types';
import { generateFlightId, generateSearchHash } from '../utils';
import { AIRLINES } from '../constants';

const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

interface SerpFlightLeg {
  airline: string;
  airline_logo: string;
  flight_number: string;
  departure_airport: { name: string; id: string };
  arrival_airport: { name: string; id: string };
  departure_time: string;  // e.g., "2026-04-20 06:15"
  arrival_time: string;
  duration: number;        // minutes
  airplane?: string;
  travel_class: string;
}

interface SerpFlight {
  flights: SerpFlightLeg[];
  total_duration: number;
  price: number;
  type: string;
  airline_logo: string;
  departure_token?: string;
  layovers?: { name: string; duration: number }[];
  extensions?: string[];
}

/**
 * Map cabin class to SerpAPI travel_class parameter
 */
function mapCabinToSerp(cabin: CabinClass): number {
  const map: Record<CabinClass, number> = {
    economy: 1,
    premium_economy: 2,
    business: 3,
    first: 4,
  };
  return map[cabin];
}

/**
 * Search flights via SerpAPI (Google Flights)
 */
export async function searchSerpApi(params: SearchParams): Promise<FlightResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.warn('[SerpAPI] No API key configured, skipping');
    return [];
  }

  const queryParams = new URLSearchParams({
    engine: 'google_flights',
    departure_id: params.origin,
    arrival_id: params.destination,
    outbound_date: params.departureDate,
    currency: 'INR',
    hl: 'en',
    gl: 'in',
    travel_class: mapCabinToSerp(params.cabinClass).toString(),
    adults: params.passengers.adults.toString(),
    children: params.passengers.children.toString(),
    infants_in_seat: '0',
    infants_on_lap: params.passengers.infants.toString(),
    stops: '0,1,2',  // all stops
    type: params.returnDate ? '1' : '2',  // 1=round, 2=one-way
    api_key: apiKey,
  });

  if (params.returnDate) {
    queryParams.set('return_date', params.returnDate);
  }

  try {
    const response = await fetch(`${SERPAPI_BASE_URL}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SerpAPI] API error ${response.status}: ${errorText}`);
      return [];
    }

    const data = await response.json();
    
    // SerpAPI returns best_flights and other_flights separately
    const bestFlights: SerpFlight[] = data.best_flights || [];
    const otherFlights: SerpFlight[] = data.other_flights || [];
    const allFlights = [...bestFlights, ...otherFlights];
    const searchHash = generateSearchHash(params);

    return allFlights.slice(0, 30).map((flight): FlightResult => {
      const segments: FlightSegment[] = flight.flights.map((leg): FlightSegment => {
        const airlineCode = leg.flight_number?.split('-')?.[0] || leg.airline?.substring(0, 2) || 'XX';
        const airlineInfo = AIRLINES[airlineCode];

        return {
          airline: airlineCode,
          airlineName: airlineInfo?.name || leg.airline,
          airlineLogo: airlineInfo?.logo || leg.airline_logo,
          flightNumber: leg.flight_number || `${airlineCode}-???`,
          origin: leg.departure_airport.id,
          originCity: leg.departure_airport.name,
          destination: leg.arrival_airport.id,
          destinationCity: leg.arrival_airport.name,
          departureTime: new Date(leg.departure_time).toISOString(),
          arrivalTime: new Date(leg.arrival_time).toISOString(),
          durationMinutes: leg.duration,
          aircraft: leg.airplane,
        };
      });

      const firstSeg = segments[0];
      const lastSeg = segments[segments.length - 1];

      const baggage: BaggageInfo = {
        cabin: { included: true, weight: 7, pieces: 1 },
        checked: {
          included: flight.extensions?.some(
            (e) => e.toLowerCase().includes('bag')
          ) || false,
        },
      };

      return {
        id: generateFlightId('serpapi', firstSeg.flightNumber, params.departureDate),
        source: 'serpapi',
        segments,
        price: flight.price,
        currency: 'INR',
        pricePerAdult: Math.round(flight.price / params.passengers.adults),
        airline: firstSeg.airline,
        airlineName: firstSeg.airlineName,
        airlineLogo: firstSeg.airlineLogo,
        flightNumber: firstSeg.flightNumber,
        origin: firstSeg.origin,
        destination: lastSeg.destination,
        departureTime: firstSeg.departureTime,
        arrivalTime: lastSeg.arrivalTime,
        durationMinutes: flight.total_duration,
        stops: segments.length - 1,
        stopCities: flight.layovers?.map((l) => l.name) || [],
        baggage,
        refundable: false,
        cabinClass: params.cabinClass,
        fetchedAt: new Date().toISOString(),
        searchHash,
      };
    });
  } catch (error) {
    console.error('[SerpAPI] Search error:', error);
    return [];
  }
}
