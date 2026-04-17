export interface StandardizedFlight {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  basePriceINR: number;
  stops: number;
}

