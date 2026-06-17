// ============================================
// TheWingsScan — Core Type Definitions
// ============================================

import { BankOffer } from './flight/offerEngine';

/** Supported data source identifiers */
export type FlightSource =
  | 'duffel'
  | 'kiwi'
  | 'serpapi'
  | 'amadeus'
  | 'google_flights'
  | 'ixigo'
  | 'makemytrip'
  | 'cleartrip'
  | 'master_api'
  | 'travelpayouts_calendar'
  | 'travelpayouts_realtime'
  // Multi-tier scraping architecture (rolling out incrementally).
  // Slots are declared here so downstream code can switch on them
  // before the underlying providers ship.
  | 'google_flights_rpc'
  | 'google_flights_headless'
  | 'airline_direct_ryanair'
  | 'airline_direct_indigo'
  | 'airline_direct_spicejet'
  | 'airline_direct_generic';

export type FlightAvailabilityState = 'bookable_live' | 'reference_only' | 'unavailable';
export type FlightDataFreshness = 'live' | 'cached' | 'unknown';
export type FlightConfidence = 'high' | 'medium' | 'low';

/** Cabin class options */
export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

/** Airport information */
export interface Airport {
  iata: string;
  name: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  tier: 1 | 2 | 3;       // City tier classification
  popular: boolean;       // High-traffic airport
}

/** Passenger count for search */
export interface PassengerCount {
  adults: number;
  children: number;
  infants: number;
}

/** Search request parameters */
export interface SearchParams {
  origin: string;          // IATA code
  destination: string;     // IATA code
  departureDate: string;   // YYYY-MM-DD
  returnDate?: string;     // YYYY-MM-DD (null for one-way)
  passengers: PassengerCount;
  cabinClass: CabinClass;
  flexibleDates?: number;  // ±days (1, 2, or 3)
}

/** A single flight segment (one leg) */
export interface FlightSegment {
  airline: string;
  airlineName: string;
  airlineLogo?: string;
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureTime: string;   // ISO 8601
  arrivalTime: string;     // ISO 8601
  durationMinutes: number;
  aircraft?: string;
}

/** Baggage information */
export interface BaggageInfo {
  cabin: {
    included: boolean;
    weight?: number;       // kg
    pieces?: number;
  };
  checked: {
    included: boolean;
    weight?: number;       // kg
    pieces?: number;
  };
}

/** A single flight result from any source */
export interface FlightResult {
  id: string;              // Unique identifier
  source: FlightSource;
  segments: FlightSegment[];
  
  // Price
  price: number;           // In INR
  currency: string;        // Always 'INR' for now
  pricePerAdult: number;
  basePrice?: number;
  appliedOffer?: BankOffer | null;
  carbonEmissions?: number;
  
  // Summary fields (derived)
  airline: string;         // Primary airline
  airlineName: string;
  airlineLogo?: string;
  flightNumber: string;    // Primary flight number
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  stopCities: string[];
  
  // Booking
  bookingUrl?: string;
  deepLink?: string;
  bookingToken?: string | null;
  searchId?: string | null;
  gateId?: string | number | null;
  availabilityState?: FlightAvailabilityState;
  dataFreshness?: FlightDataFreshness;
  confidence?: FlightConfidence;
  baggageConfirmed?: boolean;
  refundabilityConfirmed?: boolean;
  
  // Additional info
  baggage: BaggageInfo;
  refundable: boolean;
  cabinClass: CabinClass;
  seatsRemaining?: number;
  
  // Metadata
  fetchedAt: string;       // ISO 8601
  searchHash: string;
}


/** Sort options for results */
export type SortOption =
  | 'cheapest'
  | 'fastest'
  | 'best_value'
  | 'wallet_match'
  | 'earliest_departure'
  | 'latest_departure';

/** Filter state */
export interface FilterState {
  airlines: string[];
  maxStops: number | null;         // null = any
  departureTimeRange: [number, number];  // hours 0-24
  arrivalTimeRange: [number, number];
  priceRange: [number, number];
  sources: FlightSource[];
  baggageIncluded: boolean | null;
  refundableOnly: boolean;
}

/** Fare calendar day data */
export interface CalendarDay {
  date: string;            // YYYY-MM-DD
  cheapestPrice: number | null;
  source: FlightSource | null;
  isHoliday: boolean;
  holidayName?: string;
  priceLevel: 'cheap' | 'average' | 'expensive' | null;
}
