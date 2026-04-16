// ============================================
// AirBook — Application Constants
// ============================================

/** Indian airline data with logos */
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
