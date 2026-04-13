// ============================================
// FareCracker — Kiwi Tequila API Client
// ============================================
// Kiwi.com Tequila API — multi-carrier, virtual interlining, global coverage.
// Docs: https://docs.kiwi.com/

import type { FlightResult, FlightSegment, BaggageInfo, CabinClass, SearchParams } from '../types';
import { generateFlightId, generateSearchHash } from '../utils';
import { AIRLINES } from '../constants';
import { format } from 'date-fns';

const KIWI_BASE_URL = 'https://api.tequila.kiwi.com';

interface KiwiRoute {
  airline: string;
  flight_no: number;
  flyFrom: string;
  flyTo: string;
  cityFrom: string;
  cityTo: string;
  local_departure: string;
  local_arrival: string;
  utc_departure: string;
  utc_arrival: string;
}

interface KiwiResult {
  id: string;
  flyFrom: string;
  flyTo: string;
  cityFrom: string;
  cityTo: string;
  local_departure: string;
  local_arrival: string;
  utc_departure: string;
  utc_arrival: string;
  duration: { departure: number; return: number; total: number };
  price: number;
  route: KiwiRoute[];
  airlines: string[];
  pnr_count: number;
  has_airport_change: boolean;
  bags_price?: Record<string, number>;
  baglimit?: { hold_weight: number; hand_weight: number };
  availability?: { seats: number };
  deep_link: string;
  booking_token: string;
  virtual_interlining: boolean;
}

/**
 * Map our cabin class to Kiwi's selected_cabins parameter
 */
function mapCabinToKiwi(cabin: CabinClass): string {
  const map: Record<CabinClass, string> = {
    economy: 'M',
    premium_economy: 'W',
    business: 'C',
    first: 'F',
  };
  return map[cabin];
}

/**
 * Search flights on Kiwi Tequila API
 */
export async function searchKiwi(params: SearchParams): Promise<FlightResult[]> {
  const apiKey = process.env.KIWI_API_KEY;
  if (!apiKey) {
    console.warn('[Kiwi] No API key configured, skipping');
    return [];
  }

  // Kiwi uses dd/mm/YYYY date format
  const dateFrom = format(new Date(params.departureDate), 'dd/MM/yyyy');
  const dateTo = dateFrom; // exact date; flexible dates handled via date_from/date_to range

  const queryParams = new URLSearchParams({
    fly_from: params.origin,
    fly_to: params.destination,
    date_from: dateFrom,
    date_to: dateTo,
    curr: 'INR',
    locale: 'en',
    adults: params.passengers.adults.toString(),
    children: params.passengers.children.toString(),
    infants: params.passengers.infants.toString(),
    selected_cabins: mapCabinToKiwi(params.cabinClass),
    limit: '50',
    sort: 'price',
    max_stopovers: '2',
    vehicle_type: 'aircraft',
  });

  // If return date is specified
  if (params.returnDate) {
    const returnFrom = format(new Date(params.returnDate), 'dd/MM/yyyy');
    queryParams.set('return_from', returnFrom);
    queryParams.set('return_to', returnFrom);
    queryParams.set('flight_type', 'round');
  } else {
    queryParams.set('flight_type', 'oneway');
  }

  // Flexible dates
  if (params.flexibleDates && params.flexibleDates > 0) {
    const depDate = new Date(params.departureDate);
    const flexBefore = new Date(depDate);
    flexBefore.setDate(flexBefore.getDate() - params.flexibleDates);
    const flexAfter = new Date(depDate);
    flexAfter.setDate(flexAfter.getDate() + params.flexibleDates);
    queryParams.set('date_from', format(flexBefore, 'dd/MM/yyyy'));
    queryParams.set('date_to', format(flexAfter, 'dd/MM/yyyy'));
  }

  try {
    const response = await fetch(`${KIWI_BASE_URL}/v2/search?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Kiwi] API error ${response.status}: ${errorText}`);
      return [];
    }

    const data = await response.json();
    const results: KiwiResult[] = data.data || [];
    const searchHash = generateSearchHash(params);

    return results.slice(0, 50).map((result): FlightResult => {
      const segments: FlightSegment[] = result.route.map((route): FlightSegment => {
        const airlineCode = route.airline;
        const airlineInfo = AIRLINES[airlineCode];
        const depTime = new Date(route.utc_departure);
        const arrTime = new Date(route.utc_arrival);
        const durMin = Math.round((arrTime.getTime() - depTime.getTime()) / 60000);

        return {
          airline: airlineCode,
          airlineName: airlineInfo?.name || airlineCode,
          airlineLogo: airlineInfo?.logo,
          flightNumber: `${airlineCode}-${route.flight_no}`,
          origin: route.flyFrom,
          originCity: route.cityFrom,
          destination: route.flyTo,
          destinationCity: route.cityTo,
          departureTime: route.utc_departure,
          arrivalTime: route.utc_arrival,
          durationMinutes: durMin,
        };
      });

      const firstSeg = segments[0];
      const lastSeg = segments[segments.length - 1];
      const totalDuration = Math.round(result.duration.departure / 60); // seconds to minutes

      const baggage: BaggageInfo = {
        cabin: {
          included: true,
          weight: result.baglimit?.hand_weight || 7,
          pieces: 1,
        },
        checked: {
          included: !result.bags_price || result.bags_price['1'] === 0,
          weight: result.baglimit?.hold_weight,
        },
      };

      return {
        id: generateFlightId('kiwi', firstSeg.flightNumber, params.departureDate),
        source: 'kiwi',
        segments,
        price: Math.round(result.price),
        currency: 'INR',
        pricePerAdult: Math.round(result.price / params.passengers.adults),
        airline: firstSeg.airline,
        airlineName: firstSeg.airlineName,
        airlineLogo: firstSeg.airlineLogo,
        flightNumber: firstSeg.flightNumber,
        origin: result.flyFrom,
        destination: result.flyTo,
        departureTime: firstSeg.departureTime,
        arrivalTime: lastSeg.arrivalTime,
        durationMinutes: totalDuration,
        stops: segments.length - 1,
        stopCities: segments.length > 1
          ? segments.slice(0, -1).map((s) => s.destination)
          : [],
        deepLink: result.deep_link,
        bookingUrl: result.deep_link,
        baggage,
        refundable: false, // Kiwi generally non-refundable
        cabinClass: params.cabinClass,
        seatsRemaining: result.availability?.seats,
        fetchedAt: new Date().toISOString(),
        searchHash,
      };
    });
  } catch (error) {
    console.error('[Kiwi] Search error:', error);
    return [];
  }
}
