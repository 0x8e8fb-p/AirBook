// ============================================
// TheWingsScan — Search State Store (Zustand)
// ============================================

import { create } from 'zustand';
import type { FlightResult, SearchParams, FilterState, SortOption, CabinClass } from '@/lib/types';
import { DEFAULT_FILTERS } from '@/lib/constants';

interface SearchState {
  // Search form state
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  infants: number;
  cabinClass: CabinClass;
  flexibleDates: number;

  // Results state
  results: FlightResult[];
  isSearching: boolean;
  searchError: string | null;
  totalResults: number;

  // Filter & sort
  filters: FilterState;
  sortBy: SortOption;

  // Recent searches
  recentSearches: SearchParams[];

  // Actions
  setOrigin: (origin: string) => void;
  setDestination: (destination: string) => void;
  swapAirports: () => void;
  setDepartureDate: (date: string) => void;
  setReturnDate: (date: string) => void;
  setPassengers: (adults: number, children: number, infants: number) => void;
  setCabinClass: (cabin: CabinClass) => void;
  setFlexibleDates: (flex: number) => void;
  setResults: (results: FlightResult[], total: number) => void;
  setSearching: (searching: boolean) => void;
  setSearchError: (error: string | null) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setSortBy: (sort: SortOption) => void;
  addRecentSearch: (params: SearchParams) => void;
  getSearchParams: () => SearchParams;
}

/** Get tomorrow's date as YYYY-MM-DD */
function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export const useSearchStore = create<SearchState>((set, get) => ({
  // Default form state
  origin: '',
  destination: '',
  departureDate: getTomorrow(),
  returnDate: '',
  adults: 1,
  children: 0,
  infants: 0,
  cabinClass: 'economy',
  flexibleDates: 0,

  // Results
  results: [],
  isSearching: false,
  searchError: null,
  totalResults: 0,

  // Filter & sort
  filters: { ...DEFAULT_FILTERS } as FilterState,
  sortBy: 'cheapest',

  // Recent searches (persisted in localStorage)
  recentSearches: [],

  // Actions
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  swapAirports: () => {
    const { origin, destination } = get();
    set({ origin: destination, destination: origin });
  },
  setDepartureDate: (departureDate) => set({ departureDate }),
  setReturnDate: (returnDate) => set({ returnDate }),
  setPassengers: (adults, children, infants) => set({ adults, children, infants }),
  setCabinClass: (cabinClass) => set({ cabinClass }),
  setFlexibleDates: (flexibleDates) => set({ flexibleDates }),

  setResults: (results, totalResults) => set({ results, totalResults, searchError: null }),
  setSearching: (isSearching) => set({ isSearching }),
  setSearchError: (searchError) => set({ searchError, isSearching: false }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } as FilterState }),
  setSortBy: (sortBy) => set({ sortBy }),

  addRecentSearch: (params) =>
    set((state) => {
      const recents = [params, ...state.recentSearches.slice(0, 4)];
      return { recentSearches: recents };
    }),

  getSearchParams: (): SearchParams => {
    const s = get();
    return {
      origin: s.origin,
      destination: s.destination,
      departureDate: s.departureDate,
      returnDate: s.returnDate || undefined,
      passengers: { adults: s.adults, children: s.children, infants: s.infants },
      cabinClass: s.cabinClass,
      flexibleDates: s.flexibleDates || undefined,
    };
  },
}));
