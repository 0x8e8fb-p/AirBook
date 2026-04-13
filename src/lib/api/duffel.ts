// ============================================
// FareCracker — Duffel API Client
// ============================================
// Duffel provides direct airline connections via NDC.
// Docs: https://duffel.com/docs/api

import type { FlightResult, FlightSegment, BaggageInfo, CabinClass, SearchParams } from '../types';
import { generateFlightId, generateSearchHash } from '../utils';
import { AIRLINES } from '../constants';

interface DuffelSlice {
  origin: { iata_code: string };
  destination: { iata_code: string };
  departure_date: string;
}

interface DuffelPassenger {
  type: 'adult' | 'child' | 'infant_without_seat';
}

interface DuffelSegment {
  operating_carrier: { iata_code: string; name: string; logo_symbol_url?: string };
  marketing_carrier: { iata_code: string; name: string };
  operating_carrier_flight_number: string;
  origin: { iata_code: string; city_name?: string; name: string };
  destination: { iata_code: string; city_name?: string; name: string };
  departing_at: string;
  arriving_at: string;
  duration?: string;
  aircraft?: { name: string };
}

interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  base_currency: string;
  slices: {
    segments: DuffelSegment[];
    duration?: string;
  }[];
  passengers: { type: string }[];
  payment_requirements: { requires_instant_payment: boolean };
  conditions: { refund_before_departure?: { allowed: boolean } };
}

const DUFFEL_BASE_URL = 'https://api.duffel.com';

/**
 * Map Duffel cabin class name to our standard
 */
function mapCabinClass(cabin: CabinClass): string {
  const map: Record<CabinClass, string> = {
    economy: 'economy',
    premium_economy: 'premium_economy',
    business: 'business',
    first: 'first',
  };
  return map[cabin];
}

/**
 * Parse ISO 8601 duration to minutes (e.g., "PT2H30M" → 150)
 */
function parseDuration(duration: string | undefined): number {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 60) + parseInt(match[2] || '0');
}

/**
 * Convert Duffel amount to INR
 * In production, use a real FX rate API. For now, approximate.
 */
function convertToINR(amount: string, currency: string): number {
  const num = parseFloat(amount);
  const rates: Record<string, number> = {
    INR: 1,
    USD: 85.5,
    EUR: 93.2,
    GBP: 108.5,
    AED: 23.3,
    SGD: 64.2,
    THB: 2.4,
    MYR: 19.1,
  };
  return Math.round(num * (rates[currency] || 85));
}

/**
 * Search flights via Duffel API
 */
export async function searchDuffel(params: SearchParams): Promise<FlightResult[]> {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) {
    console.warn('[Duffel] No access token configured, skipping');
    return [];
  }

  const slices: DuffelSlice[] = [
    {
      origin: { iata_code: params.origin },
      destination: { iata_code: params.destination },
      departure_date: params.departureDate,
    },
  ];

  if (params.returnDate) {
    slices.push({
      origin: { iata_code: params.destination },
      destination: { iata_code: params.origin },
      departure_date: params.returnDate,
    });
  }

  const passengers: DuffelPassenger[] = [];
  for (let i = 0; i < params.passengers.adults; i++) {
    passengers.push({ type: 'adult' });
  }
  for (let i = 0; i < params.passengers.children; i++) {
    passengers.push({ type: 'child' });
  }
  for (let i = 0; i < params.passengers.infants; i++) {
    passengers.push({ type: 'infant_without_seat' });
  }

  try {
    const response = await fetch(`${DUFFEL_BASE_URL}/air/offer_requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
        'Accept-Encoding': 'gzip',
      },
      body: JSON.stringify({
        data: {
          slices,
          passengers,
          cabin_class: mapCabinClass(params.cabinClass),
          return_offers: true,
          max_connections: 2,
        },
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Duffel] API error ${response.status}: ${errorText}`);
      return [];
    }

    const data = await response.json();
    const offers: DuffelOffer[] = data.data?.offers || [];
    const searchHash = generateSearchHash(params);

    return offers.slice(0, 50).map((offer): FlightResult => {
      const firstSlice = offer.slices[0];
      const segments: FlightSegment[] = firstSlice.segments.map((seg) => {
        const airlineCode = seg.operating_carrier.iata_code || seg.marketing_carrier.iata_code;
        const airlineInfo = AIRLINES[airlineCode];
        const depTime = new Date(seg.departing_at);
        const arrTime = new Date(seg.arriving_at);
        const durMin = Math.round((arrTime.getTime() - depTime.getTime()) / 60000);

        return {
          airline: airlineCode,
          airlineName: airlineInfo?.name || seg.operating_carrier.name,
          airlineLogo: airlineInfo?.logo,
          flightNumber: `${airlineCode}-${seg.operating_carrier_flight_number}`,
          origin: seg.origin.iata_code,
          originCity: seg.origin.city_name || seg.origin.name,
          destination: seg.destination.iata_code,
          destinationCity: seg.destination.city_name || seg.destination.name,
          departureTime: seg.departing_at,
          arrivalTime: seg.arriving_at,
          durationMinutes: durMin,
          aircraft: seg.aircraft?.name,
        };
      });

      const firstSeg = segments[0];
      const lastSeg = segments[segments.length - 1];
      const totalDuration = segments.reduce((sum, s) => sum + s.durationMinutes, 0);
      const priceINR = convertToINR(offer.total_amount, offer.total_currency);

      const baggage: BaggageInfo = {
        cabin: { included: true, weight: 7, pieces: 1 },
        checked: { included: params.cabinClass !== 'economy', weight: params.cabinClass !== 'economy' ? 23 : undefined },
      };

      return {
        id: generateFlightId('duffel', firstSeg.flightNumber, params.departureDate),
        source: 'duffel',
        segments,
        price: priceINR,
        currency: 'INR',
        pricePerAdult: Math.round(priceINR / params.passengers.adults),
        airline: firstSeg.airline,
        airlineName: firstSeg.airlineName,
        airlineLogo: firstSeg.airlineLogo,
        flightNumber: firstSeg.flightNumber,
        origin: firstSeg.origin,
        destination: lastSeg.destination,
        departureTime: firstSeg.departureTime,
        arrivalTime: lastSeg.arrivalTime,
        durationMinutes: totalDuration,
        stops: segments.length - 1,
        stopCities: segments.length > 1
          ? segments.slice(0, -1).map((s) => s.destination)
          : [],
        bookingUrl: `https://book.duffel.com/offers/${offer.id}`,
        baggage,
        refundable: offer.conditions?.refund_before_departure?.allowed || false,
        cabinClass: params.cabinClass,
        fetchedAt: new Date().toISOString(),
        searchHash,
      };
    });
  } catch (error) {
    console.error('[Duffel] Search error:', error);
    return [];
  }
}
