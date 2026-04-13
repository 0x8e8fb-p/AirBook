// ============================================
// FareCracker — Mock Flight Data Generator
// ============================================
// Generates realistic mock flight results for demo when no API keys are configured
// Covers all major Indian airlines with believable prices and schedules

import type { FlightResult, SearchParams, FlightSegment, BaggageInfo } from '../types';
import { generateFlightId, generateSearchHash } from '../utils';
import { AIRLINES } from '../constants';
import { getAirport } from '../airports';

interface MockFlightTemplate {
  airline: string;
  flightPrefix: string;
  basePriceFactor: number;  // multiplier on base price
  timeSlots: { dep: string; arr: string; dur: number }[];
  hasCheckedBag: boolean;
  refundable: boolean;
}

/** Indian airline templates with realistic time slots */
const AIRLINE_TEMPLATES: MockFlightTemplate[] = [
  {
    airline: '6E',
    flightPrefix: '6E',
    basePriceFactor: 0.85,
    timeSlots: [
      { dep: '06:15', arr: '08:25', dur: 130 },
      { dep: '09:30', arr: '11:40', dur: 130 },
      { dep: '14:00', arr: '16:10', dur: 130 },
      { dep: '18:45', arr: '20:55', dur: 130 },
      { dep: '21:30', arr: '23:40', dur: 130 },
    ],
    hasCheckedBag: false,
    refundable: false,
  },
  {
    airline: 'AI',
    flightPrefix: 'AI',
    basePriceFactor: 1.15,
    timeSlots: [
      { dep: '07:00', arr: '09:20', dur: 140 },
      { dep: '11:15', arr: '13:35', dur: 140 },
      { dep: '16:30', arr: '18:50', dur: 140 },
      { dep: '20:00', arr: '22:20', dur: 140 },
    ],
    hasCheckedBag: true,
    refundable: true,
  },
  {
    airline: 'SG',
    flightPrefix: 'SG',
    basePriceFactor: 0.90,
    timeSlots: [
      { dep: '05:45', arr: '08:00', dur: 135 },
      { dep: '10:00', arr: '12:15', dur: 135 },
      { dep: '15:30', arr: '17:45', dur: 135 },
      { dep: '19:00', arr: '21:15', dur: 135 },
    ],
    hasCheckedBag: false,
    refundable: false,
  },
  {
    airline: 'QP',
    flightPrefix: 'QP',
    basePriceFactor: 0.82,
    timeSlots: [
      { dep: '06:45', arr: '09:00', dur: 135 },
      { dep: '12:00', arr: '14:15', dur: 135 },
      { dep: '17:30', arr: '19:45', dur: 135 },
    ],
    hasCheckedBag: false,
    refundable: false,
  },
  {
    airline: 'IX',
    flightPrefix: 'IX',
    basePriceFactor: 0.78,
    timeSlots: [
      { dep: '08:00', arr: '10:30', dur: 150 },
      { dep: '13:00', arr: '15:30', dur: 150 },
    ],
    hasCheckedBag: true,
    refundable: false,
  },
];

/** Base prices for popular routes (one-way, economy, per person) */
const ROUTE_BASE_PRICES: Record<string, number> = {
  'DEL-BOM': 4200,
  'BOM-DEL': 4200,
  'DEL-BLR': 4800,
  'BLR-DEL': 4800,
  'DEL-GOI': 5200,
  'GOI-DEL': 5200,
  'BOM-GOI': 3200,
  'GOI-BOM': 3200,
  'DEL-CCU': 4500,
  'CCU-DEL': 4500,
  'BLR-BOM': 3800,
  'BOM-BLR': 3800,
  'DEL-MAA': 5000,
  'MAA-DEL': 5000,
  'BLR-HYD': 2800,
  'HYD-BLR': 2800,
  'DEL-HYD': 4600,
  'HYD-DEL': 4600,
  'BOM-HYD': 3400,
  'HYD-BOM': 3400,
  'DEL-JAI': 2400,
  'JAI-DEL': 2400,
  'DEL-LKO': 2600,
  'LKO-DEL': 2600,
  'DEL-PAT': 3800,
  'PAT-DEL': 3800,
  'BLR-COK': 2600,
  'COK-BLR': 2600,
  'DEL-TRV': 6800,
  'TRV-DEL': 6800,
  'DEL-SXR': 4200,
  'SXR-DEL': 4200,
  'DEL-IXL': 5600,
  'IXL-DEL': 5600,
  'BOM-PNQ': 2200,
  'PNQ-BOM': 2200,
  'DEL-VNS': 3000,
  'VNS-DEL': 3000,
  // International from India
  'DEL-DXB': 12500,
  'BOM-DXB': 11800,
  'DEL-SIN': 16500,
  'BOM-SIN': 15800,
  'DEL-BKK': 14200,
  'BOM-BKK': 15500,
  'DEL-LHR': 35000,
  'BOM-LHR': 34000,
};

/** Get base price for a route, with fallback estimation */
function getBasePrice(origin: string, destination: string): number {
  const key = `${origin}-${destination}`;
  if (ROUTE_BASE_PRICES[key]) return ROUTE_BASE_PRICES[key];

  // Estimate based on airports
  const orig = getAirport(origin);
  const dest = getAirport(destination);
  if (!orig || !dest) return 5000;

  // Rough distance-based estimation
  const dLat = (dest.lat - orig.lat) * 111;
  const dLng = (dest.lng - orig.lng) * 85;
  const dist = Math.sqrt(dLat * dLat + dLng * dLng);

  // ~₹3/km for domestic, more for international
  const isInternational = orig.country !== dest.country;
  const perKm = isInternational ? 4.5 : 3.0;
  return Math.max(2000, Math.round(dist * perKm));
}

/** Add random variation to price (±15%) */
function addPriceVariation(base: number): number {
  const variation = 0.85 + Math.random() * 0.30; // 0.85 to 1.15
  return Math.round(base * variation);
}

/** Adjust duration based on actual route distance */
function adjustDuration(baseDur: number, origin: string, destination: string): number {
  const orig = getAirport(origin);
  const dest = getAirport(destination);
  if (!orig || !dest) return baseDur;

  const dLat = (dest.lat - orig.lat) * 111;
  const dLng = (dest.lng - orig.lng) * 85;
  const dist = Math.sqrt(dLat * dLat + dLng * dLng);

  // Rough: 800km/h cruise, plus 30min overhead
  const estimatedMin = Math.round((dist / 800) * 60 + 30);
  return Math.max(60, estimatedMin);
}

/**
 * Generate realistic mock flight results for a search
 */
export function generateMockResults(params: SearchParams): FlightResult[] {
  const basePrice = getBasePrice(params.origin, params.destination);
  const searchHash = generateSearchHash(params);
  const results: FlightResult[] = [];

  const origAirport = getAirport(params.origin);
  const destAirport = getAirport(params.destination);
  const originCity = origAirport?.city || params.origin;
  const destCity = destAirport?.city || params.destination;

  // Check if route is international
  const isInternational = origAirport?.country !== destAirport?.country;

  // Filter airlines for international routes
  const templates = isInternational
    ? AIRLINE_TEMPLATES.filter((t) => ['AI', '6E', 'IX'].includes(t.airline))
    : AIRLINE_TEMPLATES;

  for (const template of templates) {
    const airlineInfo = AIRLINES[template.airline];
    if (!airlineInfo) continue;

    for (const slot of template.timeSlots) {
      const flightNum = Math.floor(1000 + Math.random() * 8000);
      const flightNumber = `${template.flightPrefix}-${flightNum}`;
      const adjustedDur = adjustDuration(slot.dur, params.origin, params.destination);

      // Calculate departure and arrival times for the given date
      const [depHour, depMin] = slot.dep.split(':').map(Number);
      const depDate = new Date(params.departureDate);
      depDate.setHours(depHour, depMin, 0, 0);

      const arrDate = new Date(depDate.getTime() + adjustedDur * 60000);

      const price = addPriceVariation(basePrice * template.basePriceFactor);
      const totalPrice = price * params.passengers.adults +
        price * 0.75 * params.passengers.children;

      const segments: FlightSegment[] = [
        {
          airline: template.airline,
          airlineName: airlineInfo.name,
          airlineLogo: airlineInfo.logo,
          flightNumber,
          origin: params.origin,
          originCity,
          destination: params.destination,
          destinationCity: destCity,
          departureTime: depDate.toISOString(),
          arrivalTime: arrDate.toISOString(),
          durationMinutes: adjustedDur,
        },
      ];

      const baggage: BaggageInfo = {
        cabin: { included: true, weight: 7, pieces: 1 },
        checked: {
          included: template.hasCheckedBag,
          weight: template.hasCheckedBag ? 15 : undefined,
          pieces: template.hasCheckedBag ? 1 : 0,
        },
      };

      results.push({
        id: generateFlightId('duffel', flightNumber, params.departureDate),
        source: 'duffel',
        segments,
        price: Math.round(totalPrice),
        currency: 'INR',
        pricePerAdult: Math.round(price),
        airline: template.airline,
        airlineName: airlineInfo.name,
        airlineLogo: airlineInfo.logo,
        flightNumber,
        origin: params.origin,
        destination: params.destination,
        departureTime: depDate.toISOString(),
        arrivalTime: arrDate.toISOString(),
        durationMinutes: adjustedDur,
        stops: 0,
        stopCities: [],
        baggage,
        refundable: template.refundable,
        cabinClass: params.cabinClass,
        seatsRemaining: Math.floor(1 + Math.random() * 15),
        fetchedAt: new Date().toISOString(),
        searchHash,
      });
    }
  }

  // Add a couple of 1-stop flights for variety
  if (!isInternational && results.length > 3) {
    const connectingCities = ['BOM', 'DEL', 'BLR', 'HYD'].filter(
      (c) => c !== params.origin && c !== params.destination
    );
    
    for (let i = 0; i < Math.min(2, connectingCities.length); i++) {
      const via = connectingCities[i];
      const viaAirport = getAirport(via);
      const airline = AIRLINE_TEMPLATES[Math.floor(Math.random() * 2)];
      const airlineInfo = AIRLINES[airline.airline];
      if (!airlineInfo || !viaAirport) continue;

      const flightNum1 = Math.floor(1000 + Math.random() * 8000);
      const flightNum2 = Math.floor(1000 + Math.random() * 8000);
      const dur1 = adjustDuration(120, params.origin, via);
      const dur2 = adjustDuration(120, via, params.destination);
      const layoverMin = 60 + Math.floor(Math.random() * 120);
      const totalDur = dur1 + layoverMin + dur2;

      const depDate = new Date(params.departureDate);
      depDate.setHours(7, 0, 0, 0);
      const midArr = new Date(depDate.getTime() + dur1 * 60000);
      const midDep = new Date(midArr.getTime() + layoverMin * 60000);
      const finalArr = new Date(midDep.getTime() + dur2 * 60000);

      const price1Stop = addPriceVariation(basePrice * 0.70); // 1-stop is cheaper

      const segments: FlightSegment[] = [
        {
          airline: airline.airline,
          airlineName: airlineInfo.name,
          airlineLogo: airlineInfo.logo,
          flightNumber: `${airline.flightPrefix}-${flightNum1}`,
          origin: params.origin,
          originCity,
          destination: via,
          destinationCity: viaAirport.city,
          departureTime: depDate.toISOString(),
          arrivalTime: midArr.toISOString(),
          durationMinutes: dur1,
        },
        {
          airline: airline.airline,
          airlineName: airlineInfo.name,
          airlineLogo: airlineInfo.logo,
          flightNumber: `${airline.flightPrefix}-${flightNum2}`,
          origin: via,
          originCity: viaAirport.city,
          destination: params.destination,
          destinationCity: destCity,
          departureTime: midDep.toISOString(),
          arrivalTime: finalArr.toISOString(),
          durationMinutes: dur2,
        },
      ];

      results.push({
        id: generateFlightId('kiwi', `${airline.flightPrefix}-${flightNum1}`, params.departureDate),
        source: 'kiwi',
        segments,
        price: Math.round(price1Stop * params.passengers.adults),
        currency: 'INR',
        pricePerAdult: Math.round(price1Stop),
        airline: airline.airline,
        airlineName: airlineInfo.name,
        airlineLogo: airlineInfo.logo,
        flightNumber: `${airline.flightPrefix}-${flightNum1}`,
        origin: params.origin,
        destination: params.destination,
        departureTime: depDate.toISOString(),
        arrivalTime: finalArr.toISOString(),
        durationMinutes: totalDur,
        stops: 1,
        stopCities: [via],
        baggage: {
          cabin: { included: true, weight: 7, pieces: 1 },
          checked: { included: false },
        },
        refundable: false,
        cabinClass: params.cabinClass,
        seatsRemaining: Math.floor(1 + Math.random() * 8),
        fetchedAt: new Date().toISOString(),
        searchHash,
      });
    }
  }

  return results.sort((a, b) => a.price - b.price);
}
