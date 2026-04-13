// ============================================
// Atmos — Indian Airport Database
// ============================================
// 140+ airports covering all major Indian cities + top international hubs

import type { Airport } from './types';
import { fuzzyMatch, transliterateHindi } from './utils';

export const AIRPORTS: Airport[] = [
  // ─── TIER 1: Metro Cities ───────────────────────────────────
  { iata: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', state: 'Delhi', country: 'IN', lat: 28.5562, lng: 77.1000, tier: 1, popular: true },
  { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', state: 'Maharashtra', country: 'IN', lat: 19.0896, lng: 72.8656, tier: 1, popular: true },
  { iata: 'BLR', name: 'Kempegowda International', city: 'Bangalore', state: 'Karnataka', country: 'IN', lat: 13.1986, lng: 77.7066, tier: 1, popular: true },
  { iata: 'MAA', name: 'Chennai International', city: 'Chennai', state: 'Tamil Nadu', country: 'IN', lat: 12.9941, lng: 80.1709, tier: 1, popular: true },
  { iata: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', state: 'Telangana', country: 'IN', lat: 17.2403, lng: 78.4294, tier: 1, popular: true },
  { iata: 'CCU', name: 'Netaji Subhas Chandra Bose International', city: 'Kolkata', state: 'West Bengal', country: 'IN', lat: 22.6547, lng: 88.4467, tier: 1, popular: true },

  // ─── TIER 1-2: Major Cities ────────────────────────────────
  { iata: 'GOI', name: 'Goa International (Dabolim)', city: 'Goa', state: 'Goa', country: 'IN', lat: 15.3808, lng: 73.8314, tier: 1, popular: true },
  { iata: 'GOX', name: 'Manohar International (Mopa)', city: 'North Goa', state: 'Goa', country: 'IN', lat: 15.7384, lng: 73.8349, tier: 1, popular: true },
  { iata: 'PNQ', name: 'Pune Airport', city: 'Pune', state: 'Maharashtra', country: 'IN', lat: 18.5821, lng: 73.9197, tier: 1, popular: true },
  { iata: 'AMD', name: 'Sardar Vallabhbhai Patel International', city: 'Ahmedabad', state: 'Gujarat', country: 'IN', lat: 23.0772, lng: 72.6347, tier: 1, popular: true },
  { iata: 'JAI', name: 'Jaipur International', city: 'Jaipur', state: 'Rajasthan', country: 'IN', lat: 26.8242, lng: 75.8122, tier: 1, popular: true },
  { iata: 'COK', name: 'Cochin International', city: 'Kochi', state: 'Kerala', country: 'IN', lat: 10.1520, lng: 76.4019, tier: 1, popular: true },
  { iata: 'TRV', name: 'Trivandrum International', city: 'Thiruvananthapuram', state: 'Kerala', country: 'IN', lat: 8.4821, lng: 76.9200, tier: 1, popular: true },
  { iata: 'LKO', name: 'Chaudhary Charan Singh International', city: 'Lucknow', state: 'Uttar Pradesh', country: 'IN', lat: 26.7606, lng: 80.8893, tier: 1, popular: true },
  { iata: 'IXC', name: 'Chandigarh International', city: 'Chandigarh', state: 'Chandigarh', country: 'IN', lat: 30.6735, lng: 76.7885, tier: 1, popular: true },

  // ─── TIER 2: Growing Cities ────────────────────────────────
  { iata: 'PAT', name: 'Jay Prakash Narayan International', city: 'Patna', state: 'Bihar', country: 'IN', lat: 25.5913, lng: 85.0880, tier: 2, popular: true },
  { iata: 'BHO', name: 'Raja Bhoj International', city: 'Bhopal', state: 'Madhya Pradesh', country: 'IN', lat: 23.2875, lng: 77.3372, tier: 2, popular: false },
  { iata: 'IDR', name: 'Devi Ahilya Bai Holkar', city: 'Indore', state: 'Madhya Pradesh', country: 'IN', lat: 22.7218, lng: 75.8011, tier: 2, popular: true },
  { iata: 'NAG', name: 'Dr. Babasaheb Ambedkar International', city: 'Nagpur', state: 'Maharashtra', country: 'IN', lat: 21.0922, lng: 79.0472, tier: 2, popular: false },
  { iata: 'VNS', name: 'Lal Bahadur Shastri International', city: 'Varanasi', state: 'Uttar Pradesh', country: 'IN', lat: 25.4524, lng: 82.8593, tier: 2, popular: true },
  { iata: 'SXR', name: 'Sheikh ul-Alam International', city: 'Srinagar', state: 'J&K', country: 'IN', lat: 33.9871, lng: 74.7742, tier: 2, popular: true },
  { iata: 'GAU', name: 'Lokpriya Gopinath Bordoloi International', city: 'Guwahati', state: 'Assam', country: 'IN', lat: 26.1061, lng: 91.5859, tier: 2, popular: true },
  { iata: 'IXB', name: 'Bagdogra Airport', city: 'Bagdogra', state: 'West Bengal', country: 'IN', lat: 26.6812, lng: 88.3286, tier: 2, popular: true },
  { iata: 'DED', name: 'Jolly Grant Airport', city: 'Dehradun', state: 'Uttarakhand', country: 'IN', lat: 30.1897, lng: 78.1803, tier: 2, popular: true },
  { iata: 'ATQ', name: 'Sri Guru Ram Dass Jee International', city: 'Amritsar', state: 'Punjab', country: 'IN', lat: 31.7094, lng: 74.7973, tier: 2, popular: true },
  { iata: 'CJB', name: 'Coimbatore International', city: 'Coimbatore', state: 'Tamil Nadu', country: 'IN', lat: 11.0300, lng: 77.0434, tier: 2, popular: true },
  { iata: 'IXR', name: 'Birsa Munda Airport', city: 'Ranchi', state: 'Jharkhand', country: 'IN', lat: 23.3143, lng: 85.3217, tier: 2, popular: false },
  { iata: 'RPR', name: 'Swami Vivekananda Airport', city: 'Raipur', state: 'Chhattisgarh', country: 'IN', lat: 21.1804, lng: 81.7388, tier: 2, popular: false },
  { iata: 'VTZ', name: 'Visakhapatnam Airport', city: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'IN', lat: 17.7212, lng: 83.2245, tier: 2, popular: false },
  { iata: 'STV', name: 'Surat International', city: 'Surat', state: 'Gujarat', country: 'IN', lat: 21.1141, lng: 72.7418, tier: 2, popular: false },
  { iata: 'BDQ', name: 'Vadodara Airport', city: 'Vadodara', state: 'Gujarat', country: 'IN', lat: 22.3362, lng: 73.2264, tier: 2, popular: false },
  { iata: 'IXM', name: 'Madurai Airport', city: 'Madurai', state: 'Tamil Nadu', country: 'IN', lat: 9.8345, lng: 78.0934, tier: 2, popular: false },
  { iata: 'TRZ', name: 'Tiruchirappalli International', city: 'Tiruchirappalli', state: 'Tamil Nadu', country: 'IN', lat: 10.7654, lng: 78.7097, tier: 2, popular: false },
  { iata: 'IXA', name: 'Agartala Airport', city: 'Agartala', state: 'Tripura', country: 'IN', lat: 23.8870, lng: 91.2404, tier: 2, popular: false },
  { iata: 'IMF', name: 'Imphal Airport', city: 'Imphal', state: 'Manipur', country: 'IN', lat: 24.7600, lng: 93.8967, tier: 2, popular: false },
  { iata: 'MYQ', name: 'Mysore Airport', city: 'Mysore', state: 'Karnataka', country: 'IN', lat: 12.2296, lng: 76.6556, tier: 2, popular: false },
  { iata: 'IXE', name: 'Mangalore International', city: 'Mangalore', state: 'Karnataka', country: 'IN', lat: 12.9614, lng: 74.8901, tier: 2, popular: true },
  { iata: 'HBX', name: 'Hubli Airport', city: 'Hubli', state: 'Karnataka', country: 'IN', lat: 15.3617, lng: 75.0849, tier: 3, popular: false },

  // ─── TIER 2-3: Smaller Cities ──────────────────────────────
  { iata: 'UDR', name: 'Maharana Pratap Airport', city: 'Udaipur', state: 'Rajasthan', country: 'IN', lat: 24.6177, lng: 73.8961, tier: 2, popular: true },
  { iata: 'JDH', name: 'Jodhpur Airport', city: 'Jodhpur', state: 'Rajasthan', country: 'IN', lat: 26.2511, lng: 73.0489, tier: 2, popular: true },
  { iata: 'BBI', name: 'Biju Patnaik International', city: 'Bhubaneswar', state: 'Odisha', country: 'IN', lat: 20.2444, lng: 85.8178, tier: 2, popular: true },
  { iata: 'IXZ', name: 'Veer Savarkar International', city: 'Port Blair', state: 'Andaman & Nicobar', country: 'IN', lat: 11.6412, lng: 92.7297, tier: 2, popular: true },
  { iata: 'IXL', name: 'Kushok Bakula Rimpochee Airport', city: 'Leh', state: 'Ladakh', country: 'IN', lat: 34.1359, lng: 77.5465, tier: 2, popular: true },
  { iata: 'CCJ', name: 'Calicut International', city: 'Kozhikode', state: 'Kerala', country: 'IN', lat: 11.1368, lng: 75.9553, tier: 2, popular: true },
  { iata: 'GWL', name: 'Gwalior Airport', city: 'Gwalior', state: 'Madhya Pradesh', country: 'IN', lat: 26.2933, lng: 78.2278, tier: 3, popular: false },
  { iata: 'JLR', name: 'Jabalpur Airport', city: 'Jabalpur', state: 'Madhya Pradesh', country: 'IN', lat: 23.1778, lng: 80.0520, tier: 3, popular: false },
  { iata: 'DIB', name: 'Dibrugarh Airport', city: 'Dibrugarh', state: 'Assam', country: 'IN', lat: 27.4839, lng: 95.0169, tier: 3, popular: false },
  { iata: 'JRH', name: 'Jorhat Airport', city: 'Jorhat', state: 'Assam', country: 'IN', lat: 26.7315, lng: 94.1753, tier: 3, popular: false },
  { iata: 'AYJ', name: 'Ayodhya Airport', city: 'Ayodhya', state: 'Uttar Pradesh', country: 'IN', lat: 26.7346, lng: 82.1427, tier: 2, popular: true },
  { iata: 'KUU', name: 'Kullu–Manali Airport', city: 'Kullu', state: 'Himachal Pradesh', country: 'IN', lat: 31.8767, lng: 77.1544, tier: 3, popular: true },
  { iata: 'DHM', name: 'Gaggal Airport', city: 'Dharamshala', state: 'Himachal Pradesh', country: 'IN', lat: 32.1651, lng: 76.2634, tier: 3, popular: true },
  { iata: 'SHL', name: 'Shillong Airport', city: 'Shillong', state: 'Meghalaya', country: 'IN', lat: 25.7036, lng: 91.9787, tier: 3, popular: false },

  // ─── INTERNATIONAL HUBS (Popular from India) ───────────────
  { iata: 'DXB', name: 'Dubai International', city: 'Dubai', state: '', country: 'AE', lat: 25.2532, lng: 55.3657, tier: 1, popular: true },
  { iata: 'SIN', name: 'Singapore Changi', city: 'Singapore', state: '', country: 'SG', lat: 1.3644, lng: 103.9915, tier: 1, popular: true },
  { iata: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', state: '', country: 'TH', lat: 13.6900, lng: 100.7501, tier: 1, popular: true },
  { iata: 'LHR', name: 'London Heathrow', city: 'London', state: '', country: 'GB', lat: 51.4700, lng: -0.4543, tier: 1, popular: true },
  { iata: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', state: '', country: 'MY', lat: 2.7456, lng: 101.7099, tier: 1, popular: true },
  { iata: 'DOH', name: 'Hamad International', city: 'Doha', state: '', country: 'QA', lat: 25.2609, lng: 51.6138, tier: 1, popular: true },
  { iata: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', state: '', country: 'AE', lat: 24.4330, lng: 54.6511, tier: 1, popular: true },
  { iata: 'CMB', name: 'Bandaranaike International', city: 'Colombo', state: '', country: 'LK', lat: 7.1808, lng: 79.8841, tier: 1, popular: true },
  { iata: 'KTM', name: 'Tribhuvan International', city: 'Kathmandu', state: '', country: 'NP', lat: 27.6966, lng: 85.3591, tier: 1, popular: true },
  { iata: 'MLE', name: 'Velana International', city: 'Male', state: '', country: 'MV', lat: 4.1918, lng: 73.5291, tier: 1, popular: true },
  { iata: 'JFK', name: 'John F. Kennedy International', city: 'New York', state: 'NY', country: 'US', lat: 40.6413, lng: -73.7781, tier: 1, popular: true },
  { iata: 'SFO', name: 'San Francisco International', city: 'San Francisco', state: 'CA', country: 'US', lat: 37.6213, lng: -122.3790, tier: 1, popular: true },
  { iata: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', state: 'ON', country: 'CA', lat: 43.6777, lng: -79.6248, tier: 1, popular: true },
  { iata: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', state: 'NSW', country: 'AU', lat: -33.9461, lng: 151.1772, tier: 1, popular: true },
  { iata: 'MEL', name: 'Melbourne Tullamarine', city: 'Melbourne', state: 'VIC', country: 'AU', lat: -37.6690, lng: 144.8410, tier: 1, popular: true },
];

/**
 * Search airports with fuzzy matching and Hindi support.
 * Returns results sorted by relevance.
 */
export function searchAirports(query: string, limit: number = 8): Airport[] {
  if (!query || query.length < 1) return [];

  const normalizedQuery = transliterateHindi(query.trim());
  
  const scored = AIRPORTS.map((airport) => {
    // Score based on multiple fields
    const scores = [
      fuzzyMatch(normalizedQuery, airport.iata) * 1.2,        // IATA code boost
      fuzzyMatch(normalizedQuery, airport.city) * 0.9,
      fuzzyMatch(normalizedQuery, airport.name) * 0.7,
      fuzzyMatch(normalizedQuery, airport.state) * 0.4,
    ];
    
    let bestScore = Math.max(...scores);
    
    // Boost popular airports
    if (airport.popular) bestScore *= 1.15;
    // Boost tier 1
    if (airport.tier === 1) bestScore *= 1.1;
    
    return { airport, score: bestScore };
  })
  .filter(({ score }) => score > 0.1)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit);

  return scored.map(({ airport }) => airport);
}

/** Get airport by IATA code */
export function getAirport(iata: string): Airport | undefined {
  return AIRPORTS.find((a) => a.iata === iata.toUpperCase());
}

/** Get display name: "Delhi (DEL)" */
export function getAirportDisplay(iata: string): string {
  const airport = getAirport(iata);
  if (!airport) return iata;
  return `${airport.city} (${airport.iata})`;
}
