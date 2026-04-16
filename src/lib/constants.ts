// ============================================
// AirBook — Application Constants
// ============================================

import type { FlightResult } from "./types";

/** Airline name to IATA code mapper */
export const getIataCode = (airlineName: string): string => {
  // Direct matches
  const directMatch = Object.entries(AIRLINES).find(
    ([_, data]) => data.name.toLowerCase() === airlineName.toLowerCase()
  );
  if (directMatch) return directMatch[0];

  // Common partial matches
  const name = airlineName.toLowerCase();
  if (name.includes('indigo')) return '6E';
  if (name.includes('air india express')) return 'IX';
  if (name.includes('air india')) return 'AI';
  if (name.includes('spicejet')) return 'SG';
  if (name.includes('akasa')) return 'QP';
  if (name.includes('vistara')) return 'UK';
  if (name.includes('alliance')) return '9I';
  if (name.includes('star air')) return 'S5';
  if (name.includes('emirates')) return 'EK';
  if (name.includes('etihad')) return 'EY';
  if (name.includes('singapore')) return 'SQ';
  if (name.includes('thai')) return 'TG';
  if (name.includes('qatar')) return 'QR';
  if (name.includes('lufthansa')) return 'LH';
  if (name.includes('british')) return 'BA';
  if (name.includes('airasia') || name.includes('air asia')) return 'AK';
  if (name.includes('malaysia')) return 'MH';
  if (name.includes('sri lankan') || name.includes('srilankan')) return 'UL';
  if (name.includes('virgin atlantic') || name.includes('virginatlantic')) return 'VS';
  if (name === 'klm' || name.includes('klm royal dutch')) return 'KL';
  if (name.includes('oman')) return 'WY';
  if (name.includes('saudi')) return 'SV';
  if (name.includes('gulf')) return 'GF';
  if (name.includes('kuwait')) return 'KU';
  if (name.includes('vietnam')) return 'MH';
  
  // Fallback: If it's already exactly 2 characters, assume it's an IATA code
  if (airlineName.length === 2) return airlineName.toUpperCase();
  
  // Return the original name if no mapping found
  return airlineName;
};

/** Get optimal logo URL */
export const getAirlineLogo = (airlineName: string): string => {
  const iata = getIataCode(airlineName);
  
  // If we found a 2-letter IATA code, use Kiwi's high quality CDN
  if (iata.length === 2) {
    return `https://images.kiwi.com/airlines/64/${iata}.png`;
  }
  
  // Otherwise fallback to Clearbit Logo API using a guessed domain
  const domainGuess = airlineName.toLowerCase().replace(/\s+/g, '') + '.com';
  return `https://logo.clearbit.com/${domainGuess}`;
};

const isIataAirlineCode = (value: string | null | undefined): value is string =>
  !!value && /^[A-Z0-9]{2}$/i.test(value.trim());

const extractIataFromFlightNumber = (flightNumber?: string | null): string | null => {
  if (!flightNumber) return null;
  const raw = flightNumber.trim().toUpperCase();
  const match = raw.match(/^([A-Z0-9]{2})\s*[-]?\s*\d+/);
  return match?.[1] ?? null;
};

export const getAirlineCodeFromFlight = (
  flight: Pick<FlightResult, "airline" | "airlineName" | "flightNumber" | "segments" | "airlineLogo">
): string | null => {
  if (isIataAirlineCode(flight.airline)) return flight.airline.trim().toUpperCase();
  if (flight.segments?.[0] && isIataAirlineCode(flight.segments[0].airline)) return flight.segments[0].airline.trim().toUpperCase();

  const fromFlightNumber = extractIataFromFlightNumber(flight.flightNumber) ?? extractIataFromFlightNumber(flight.segments?.[0]?.flightNumber);
  if (fromFlightNumber) return fromFlightNumber;

  const fromName = getIataCode(flight.airlineName || flight.airline);
  if (isIataAirlineCode(fromName)) return fromName;

  return null;
};

export const getAirlineLogoForFlight = (
  flight: Pick<FlightResult, "airline" | "airlineName" | "flightNumber" | "segments" | "airlineLogo">
): string => {
  if (flight.airlineLogo?.startsWith("http")) return flight.airlineLogo;
  const segLogo = flight.segments?.[0]?.airlineLogo;
  if (segLogo?.startsWith("http")) return segLogo;

  const iata = getAirlineCodeFromFlight(flight);
  if (iata) return `https://images.kiwi.com/airlines/64/${iata}.png`;

  const seed = encodeURIComponent(flight.airlineName || flight.airline || "Airline");
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=000000`;
};
export const AIRLINES: Record<string, { name: string; logo: string; color: string }> = {
  '6E': { name: 'IndiGo', logo: 'https://images.kiwi.com/airlines/64/6E.png', color: '#0033A0' },
  'AI': { name: 'Air India', logo: 'https://images.kiwi.com/airlines/64/AI.png', color: '#E31837' },
  'SG': { name: 'SpiceJet', logo: 'https://images.kiwi.com/airlines/64/SG.png', color: '#FF0000' },
  'QP': { name: 'Akasa Air', logo: 'https://images.kiwi.com/airlines/64/QP.png', color: '#FF6B00' },
  'IX': { name: 'Air India Express', logo: 'https://images.kiwi.com/airlines/64/IX.png', color: '#ED1C24' },
  '9I': { name: 'Alliance Air', logo: 'https://images.kiwi.com/airlines/64/9I.png', color: '#1B3A6B' },
  'S5': { name: 'Star Air', logo: 'https://images.kiwi.com/airlines/64/S5.png', color: '#003DA5' },
  'I7': { name: 'IndiGo (Interline)', logo: 'https://images.kiwi.com/airlines/64/6E.png', color: '#0033A0' },
  'UK': { name: 'Vistara', logo: 'https://images.kiwi.com/airlines/64/UK.png', color: '#4A2F83' },
  // International popular
  'EK': { name: 'Emirates', logo: 'https://images.kiwi.com/airlines/64/EK.png', color: '#D71921' },
  'EY': { name: 'Etihad Airways', logo: 'https://images.kiwi.com/airlines/64/EY.png', color: '#BD8B13' },
  'SQ': { name: 'Singapore Airlines', logo: 'https://images.kiwi.com/airlines/64/SQ.png', color: '#FDB813' },
  'TG': { name: 'Thai Airways', logo: 'https://images.kiwi.com/airlines/64/TG.png', color: '#6F2DA8' },
  'QR': { name: 'Qatar Airways', logo: 'https://images.kiwi.com/airlines/64/QR.png', color: '#5C0D34' },
  'LH': { name: 'Lufthansa', logo: 'https://images.kiwi.com/airlines/64/LH.png', color: '#05164D' },
  'BA': { name: 'British Airways', logo: 'https://images.kiwi.com/airlines/64/BA.png', color: '#075AAA' },
};

/** Default filter state */
export const DEFAULT_FILTERS = {
  airlines: [] as string[],
  maxStops: null as number | null,
  departureTimeRange: [0, 24] as [number, number],
  arrivalTimeRange: [0, 24] as [number, number],
  priceRange: [0, 100000] as [number, number],
  sources: [] as string[],
  baggageIncluded: null as boolean | null,
  refundableOnly: false,
};

/** Sort options with labels */
export const SORT_OPTIONS = [
  { value: 'cheapest', label: 'Cheapest', labelHi: 'सबसे सस्ता' },
  { value: 'fastest', label: 'Fastest', labelHi: 'सबसे तेज़' },
  { value: 'best_value', label: 'Best Value', labelHi: 'सबसे बेहतर' },
  { value: 'earliest_departure', label: 'Earliest', labelHi: 'सबसे पहले' },
  { value: 'latest_departure', label: 'Latest', labelHi: 'सबसे बाद' },
] as const;

/** Cabin class options */
export const CABIN_CLASSES = [
  { value: 'economy', label: 'Economy', labelHi: 'इकॉनमी' },
  { value: 'premium_economy', label: 'Premium Economy', labelHi: 'प्रीमियम इकॉनमी' },
  { value: 'business', label: 'Business', labelHi: 'बिज़नेस' },
  { value: 'first', label: 'First', labelHi: 'फर्स्ट' },
] as const;

/** Indian holidays 2026 (for fare calendar overlay) */
export const INDIAN_HOLIDAYS_2026 = [
  { date: '2026-01-26', name: 'Republic Day', nameHi: 'गणतंत्र दिवस', type: 'national' },
  { date: '2026-03-10', name: 'Holi', nameHi: 'होली', type: 'national' },
  { date: '2026-03-30', name: 'Id-ul-Fitr', nameHi: 'ईद-उल-फ़ित्र', type: 'national' },
  { date: '2026-04-02', name: 'Ram Navami', nameHi: 'राम नवमी', type: 'national' },
  { date: '2026-04-03', name: 'Good Friday', nameHi: 'गुड फ्राइडे', type: 'national' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti', nameHi: 'अंबेडकर जयंती', type: 'national' },
  { date: '2026-05-01', name: 'May Day', nameHi: 'मई दिवस', type: 'national' },
  { date: '2026-06-06', name: 'Id-ul-Zuha', nameHi: 'ईद-उल-अज़हा', type: 'national' },
  { date: '2026-07-06', name: 'Muharram', nameHi: 'मुहर्रम', type: 'national' },
  { date: '2026-08-15', name: 'Independence Day', nameHi: 'स्वतंत्रता दिवस', type: 'national' },
  { date: '2026-08-25', name: 'Janmashtami', nameHi: 'जन्माष्टमी', type: 'national' },
  { date: '2026-09-04', name: 'Milad-un-Nabi', nameHi: 'मिलाद-उन-नबी', type: 'national' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', nameHi: 'गांधी जयंती', type: 'national' },
  { date: '2026-10-12', name: 'Dussehra', nameHi: 'दशहरा', type: 'national' },
  { date: '2026-10-31', name: 'Diwali', nameHi: 'दिवाली', type: 'national' },
  { date: '2026-11-01', name: 'Diwali (Day 2)', nameHi: 'दिवाली', type: 'national' },
  { date: '2026-11-14', name: "Children's Day", nameHi: 'बाल दिवस', type: 'national' },
  { date: '2026-11-30', name: 'Guru Nanak Jayanti', nameHi: 'गुरु नानक जयंती', type: 'national' },
  { date: '2026-12-25', name: 'Christmas', nameHi: 'क्रिसमस', type: 'national' },
] as const;

/** Popular domestic routes for trending section */
export const POPULAR_ROUTES = [
  { origin: 'DEL', destination: 'BOM', label: 'Delhi → Mumbai' },
  { origin: 'DEL', destination: 'BLR', label: 'Delhi → Bangalore' },
  { origin: 'BOM', destination: 'GOI', label: 'Mumbai → Goa' },
  { origin: 'DEL', destination: 'GOI', label: 'Delhi → Goa' },
  { origin: 'BLR', destination: 'DEL', label: 'Bangalore → Delhi' },
  { origin: 'BOM', destination: 'BLR', label: 'Mumbai → Bangalore' },
  { origin: 'DEL', destination: 'CCU', label: 'Delhi → Kolkata' },
  { origin: 'BLR', destination: 'HYD', label: 'Bangalore → Hyderabad' },
  { origin: 'DEL', destination: 'MAA', label: 'Delhi → Chennai' },
  { origin: 'BOM', destination: 'HYD', label: 'Mumbai → Hyderabad' },
  { origin: 'DEL', destination: 'JAI', label: 'Delhi → Jaipur' },
  { origin: 'BOM', destination: 'DEL', label: 'Mumbai → Delhi' },
] as const;

/** API configuration */
export const API_CONFIG = {
  SEARCH_TIMEOUT_MS: 15000,        // 15 seconds max search time
  CACHE_TTL_MS: 15 * 60 * 1000,    // 15 minutes cache
  MAX_RESULTS_PER_SOURCE: 50,
  DUFFEL_RATE_LIMIT: 100,          // requests per minute
  KIWI_RATE_LIMIT: 30,
  SERPAPI_RATE_LIMIT: 5,
} as const;

/** Price formatting */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

/** Duration formatting */
export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
};

/** Time formatting */
export const formatTime = (isoString: string): string => {
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};
