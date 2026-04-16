import { getAndTrackFlights, EnrichedFlight } from '@/app/actions/flightActions';
import { FlightResult, FlightSegment } from '@/lib/types';
import { AIRLINES } from '@/lib/constants';

export async function fetchLiveFlights(origin: string, destination: string, date: string, userCards?: string[]): Promise<FlightResult[]> {
  try {
    const liveFlights = await getAndTrackFlights(origin, destination, date, userCards);
    
    return liveFlights.map((flight: EnrichedFlight) => {
      // Map airline code to full name if available in our constants
      let airlineName = flight.airline;
      const airlineInfo = AIRLINES[flight.airline];
      if (airlineInfo) {
        airlineName = airlineInfo.name;
      } else if (flight.airline === '6E') { airlineName = 'IndiGo'; }
      else if (flight.airline === 'AI') { airlineName = 'Air India'; }
      else if (flight.airline === 'UK') { airlineName = 'Vistara'; }
      else if (flight.airline === 'SG') { airlineName = 'SpiceJet'; }
      else if (flight.airline === 'QP') { airlineName = 'Akasa Air'; }
      else if (flight.airline === 'I5') { airlineName = 'AirAsia India'; }

      // Calculate duration in minutes (approximation based on departure/arrival strings)
      const dep = new Date(flight.departureTime);
      const arr = new Date(flight.arrivalTime);
      let durationMinutes = Math.round((arr.getTime() - dep.getTime()) / 60000);
      
      // Handle overnight flights where arrival might be next day but date string is messed up
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60;
      }
      
      const finalDuration = durationMinutes > 0 ? durationMinutes : 120; // fallback to 2h if parsing fails

      let source = flight.source || 'master_api' as any;

      const segment: FlightSegment = {
        airline: flight.airline,
        airlineName: airlineName,
        airlineLogo: airlineInfo?.logo,
        flightNumber: flight.flightNumber,
        origin: origin,
        originCity: origin, // Simplified, ideally mapped
        destination: destination,
        destinationCity: destination, // Simplified
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        durationMinutes: finalDuration,
      };

      return {
        id: flight.id,
        source: source,
        segments: [segment],
        
        // Price
        price: flight.pricing.effectivePrice,
        currency: 'INR',
        pricePerAdult: flight.pricing.effectivePrice,
        basePrice: flight.pricing.baseFare,
        appliedOffer: flight.pricing.appliedOffer,
        carbonEmissions: 100,
        
        // Summary fields
        airline: flight.airline,
        airlineName: airlineName,
        airlineLogo: airlineInfo?.logo,
        flightNumber: flight.flightNumber,
        origin: origin,
        destination: destination,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        durationMinutes: finalDuration,
        stops: 0,
        stopCities: [],
        
        // Additional info
        baggage: {
          cabin: { included: true, weight: 7 },
          checked: { included: true, weight: 15 }
        },
        refundable: false,
        cabinClass: 'economy',
        seatsRemaining: Math.floor(Math.random() * 10) + 1,
        
        // Metadata
        fetchedAt: new Date().toISOString(),
        searchHash: `${origin}-${destination}-${date}`,
      };
    });
  } catch (error) {
    console.error("Error mapping live flights:", error);
    return [];
  }
}
