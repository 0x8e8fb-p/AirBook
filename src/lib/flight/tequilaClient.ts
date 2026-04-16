interface TequilaFlightResponse {
  data: Array<{
    id: string;
    flyFrom: string;
    flyTo: string;
    price: number; // EUR by default, we need INR
    local_departure: string;
    local_arrival: string;
    airlines: string[];
    route: Array<{
      flight_no: number;
      airline: string;
    }>;
  }>;
}

export interface StandardizedFlight {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  basePriceINR: number;
}

export async function searchFlights(origin: string, destination: string, dateFrom: string): Promise<StandardizedFlight[]> {
  const TEQUILA_API_KEY = process.env.TEQUILA_API_KEY;
  if (!TEQUILA_API_KEY) throw new Error("TEQUILA_API_KEY is not set");

  // Format date for Tequila: DD/MM/YYYY
  const [year, month, day] = dateFrom.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  const url = new URL('https://api.tequila.kiwi.com/v2/search');
  url.searchParams.append('fly_from', origin);
  url.searchParams.append('fly_to', destination);
  url.searchParams.append('date_from', formattedDate);
  url.searchParams.append('date_to', formattedDate);
  url.searchParams.append('curr', 'INR');
  url.searchParams.append('limit', '10');

  const response = await fetch(url.toString(), {
    headers: {
      'apikey': TEQUILA_API_KEY,
      'accept': 'application/json',
    },
    next: { revalidate: 3600 } // Cache for 1 hour to avoid rate limits
  });

  if (!response.ok) {
    throw new Error(`Tequila API Error: ${response.statusText}`);
  }

  const data: TequilaFlightResponse = await response.json();

  return data.data.map(flight => ({
    id: flight.id,
    origin: flight.flyFrom,
    destination: flight.flyTo,
    departureTime: flight.local_departure,
    arrivalTime: flight.local_arrival,
    airline: flight.airlines[0] || 'Unknown',
    flightNumber: flight.route[0] ? `${flight.route[0].airline}${flight.route[0].flight_no}` : 'Unknown',
    basePriceINR: flight.price,
  }));
}
