// ============================================
// AirBook — Search Orchestrator
// ============================================
// Fires parallel searches across all APIs, normalizes results,
// deduplicates, ranks, and caches.

import type { FlightResult, SortOption } from '../types';

/**
 * Sort flights based on selected option
 */
export function sortFlights(flights: FlightResult[], sortBy: SortOption): FlightResult[] {
  const sorted = [...flights];

  switch (sortBy) {
    case 'cheapest':
      return sorted.sort((a, b) => a.price - b.price);
    case 'fastest':
      return sorted.sort((a, b) => a.durationMinutes - b.durationMinutes);
    case 'earliest_departure':
      return sorted.sort((a, b) =>
        new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
      );
    case 'latest_departure':
      return sorted.sort((a, b) =>
        new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime()
      );
    case 'best_value':
      // Score: normalize price and duration, weight them
      return sorted.sort((a, b) => {
        const maxPrice = Math.max(...sorted.map((f) => f.price));
        const maxDur = Math.max(...sorted.map((f) => f.durationMinutes));
        const scoreA = (a.price / maxPrice) * 0.6 + (a.durationMinutes / maxDur) * 0.3 + (a.stops * 0.1);
        const scoreB = (b.price / maxPrice) * 0.6 + (b.durationMinutes / maxDur) * 0.3 + (b.stops * 0.1);
        return scoreA - scoreB;
      });
    default:
      return sorted;
  }
}

