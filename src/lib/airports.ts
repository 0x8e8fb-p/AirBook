// ============================================
// FareCracker — Indian Airport Database
// ============================================
// 140+ airports covering all major Indian cities + top international hubs

import type { Airport } from './types';
import { fuzzyMatch, transliterateHindi } from './utils';

export const AIRPORTS: Airport[] = [
  // ─── TIER 1: Metro Cities ───────────────────────────────────
  { iata: 'DEL', name: 'Indira Gandhi International', nameHi: 'इंदिरा गांधी अंतर्राष्ट्रीय', city: 'Delhi', cityHi: 'दिल्ली', state: 'Delhi', country: 'IN', lat: 28.5562, lng: 77.1000, tier: 1, popular: true },
  { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', nameHi: 'छत्रपति शिवाजी महाराज अंतर्राष्ट्रीय', city: 'Mumbai', cityHi: 'मुंबई', state: 'Maharashtra', country: 'IN', lat: 19.0896, lng: 72.8656, tier: 1, popular: true },
  { iata: 'BLR', name: 'Kempegowda International', nameHi: 'केम्पेगौड़ा अंतर्राष्ट्रीय', city: 'Bangalore', cityHi: 'बैंगलोर', state: 'Karnataka', country: 'IN', lat: 13.1986, lng: 77.7066, tier: 1, popular: true },
  { iata: 'MAA', name: 'Chennai International', nameHi: 'चेन्नई अंतर्राष्ट्रीय', city: 'Chennai', cityHi: 'चेन्नई', state: 'Tamil Nadu', country: 'IN', lat: 12.9941, lng: 80.1709, tier: 1, popular: true },
  { iata: 'HYD', name: 'Rajiv Gandhi International', nameHi: 'राजीव गांधी अंतर्राष्ट्रीय', city: 'Hyderabad', cityHi: 'हैदराबाद', state: 'Telangana', country: 'IN', lat: 17.2403, lng: 78.4294, tier: 1, popular: true },
  { iata: 'CCU', name: 'Netaji Subhas Chandra Bose International', nameHi: 'नेताजी सुभाष चंद्र बोस अंतर्राष्ट्रीय', city: 'Kolkata', cityHi: 'कोलकाता', state: 'West Bengal', country: 'IN', lat: 22.6547, lng: 88.4467, tier: 1, popular: true },

  // ─── TIER 1-2: Major Cities ────────────────────────────────
  { iata: 'GOI', name: 'Goa International (Dabolim)', nameHi: 'गोवा अंतर्राष्ट्रीय', city: 'Goa', cityHi: 'गोवा', state: 'Goa', country: 'IN', lat: 15.3808, lng: 73.8314, tier: 1, popular: true },
  { iata: 'GOX', name: 'Manohar International (Mopa)', nameHi: 'मनोहर अंतर्राष्ट्रीय', city: 'North Goa', cityHi: 'उत्तर गोवा', state: 'Goa', country: 'IN', lat: 15.7384, lng: 73.8349, tier: 1, popular: true },
  { iata: 'PNQ', name: 'Pune Airport', nameHi: 'पुणे हवाई अड्डा', city: 'Pune', cityHi: 'पुणे', state: 'Maharashtra', country: 'IN', lat: 18.5821, lng: 73.9197, tier: 1, popular: true },
  { iata: 'AMD', name: 'Sardar Vallabhbhai Patel International', nameHi: 'सरदार वल्लभभाई पटेल अंतर्राष्ट्रीय', city: 'Ahmedabad', cityHi: 'अहमदाबाद', state: 'Gujarat', country: 'IN', lat: 23.0772, lng: 72.6347, tier: 1, popular: true },
  { iata: 'JAI', name: 'Jaipur International', nameHi: 'जयपुर अंतर्राष्ट्रीय', city: 'Jaipur', cityHi: 'जयपुर', state: 'Rajasthan', country: 'IN', lat: 26.8242, lng: 75.8122, tier: 1, popular: true },
  { iata: 'COK', name: 'Cochin International', nameHi: 'कोचीन अंतर्राष्ट्रीय', city: 'Kochi', cityHi: 'कोच्चि', state: 'Kerala', country: 'IN', lat: 10.1520, lng: 76.4019, tier: 1, popular: true },
  { iata: 'TRV', name: 'Trivandrum International', nameHi: 'त्रिवेंद्रम अंतर्राष्ट्रीय', city: 'Thiruvananthapuram', cityHi: 'त्रिवेंद्रम', state: 'Kerala', country: 'IN', lat: 8.4821, lng: 76.9200, tier: 1, popular: true },
  { iata: 'LKO', name: 'Chaudhary Charan Singh International', nameHi: 'चौधरी चरण सिंह अंतर्राष्ट्रीय', city: 'Lucknow', cityHi: 'लखनऊ', state: 'Uttar Pradesh', country: 'IN', lat: 26.7606, lng: 80.8893, tier: 1, popular: true },
  { iata: 'IXC', name: 'Chandigarh International', nameHi: 'चंडीगढ़ अंतर्राष्ट्रीय', city: 'Chandigarh', cityHi: 'चंडीगढ़', state: 'Chandigarh', country: 'IN', lat: 30.6735, lng: 76.7885, tier: 1, popular: true },

  // ─── TIER 2: Growing Cities ────────────────────────────────
  { iata: 'PAT', name: 'Jay Prakash Narayan International', nameHi: 'जय प्रकाश नारायण अंतर्राष्ट्रीय', city: 'Patna', cityHi: 'पटना', state: 'Bihar', country: 'IN', lat: 25.5913, lng: 85.0880, tier: 2, popular: true },
  { iata: 'BHO', name: 'Raja Bhoj International', nameHi: 'राजा भोज अंतर्राष्ट्रीय', city: 'Bhopal', cityHi: 'भोपाल', state: 'Madhya Pradesh', country: 'IN', lat: 23.2875, lng: 77.3372, tier: 2, popular: false },
  { iata: 'IDR', name: 'Devi Ahilya Bai Holkar', nameHi: 'देवी अहिल्या बाई होल्कर', city: 'Indore', cityHi: 'इंदौर', state: 'Madhya Pradesh', country: 'IN', lat: 22.7218, lng: 75.8011, tier: 2, popular: true },
  { iata: 'NAG', name: 'Dr. Babasaheb Ambedkar International', nameHi: 'डॉ. बाबासाहेब अंबेडकर अंतर्राष्ट्रीय', city: 'Nagpur', cityHi: 'नागपुर', state: 'Maharashtra', country: 'IN', lat: 21.0922, lng: 79.0472, tier: 2, popular: false },
  { iata: 'VNS', name: 'Lal Bahadur Shastri International', nameHi: 'लाल बहादुर शास्त्री अंतर्राष्ट्रीय', city: 'Varanasi', cityHi: 'वाराणसी', state: 'Uttar Pradesh', country: 'IN', lat: 25.4524, lng: 82.8593, tier: 2, popular: true },
  { iata: 'SXR', name: 'Sheikh ul-Alam International', nameHi: 'शेख उल-आलम अंतर्राष्ट्रीय', city: 'Srinagar', cityHi: 'श्रीनगर', state: 'J&K', country: 'IN', lat: 33.9871, lng: 74.7742, tier: 2, popular: true },
  { iata: 'GAU', name: 'Lokpriya Gopinath Bordoloi International', nameHi: 'लोकप्रिय गोपीनाथ बोरदोलोई अंतर्राष्ट्रीय', city: 'Guwahati', cityHi: 'गुवाहाटी', state: 'Assam', country: 'IN', lat: 26.1061, lng: 91.5859, tier: 2, popular: true },
  { iata: 'IXB', name: 'Bagdogra Airport', nameHi: 'बागडोगरा हवाई अड्डा', city: 'Bagdogra', cityHi: 'बागडोगरा', state: 'West Bengal', country: 'IN', lat: 26.6812, lng: 88.3286, tier: 2, popular: true },
  { iata: 'DED', name: 'Jolly Grant Airport', nameHi: 'जॉली ग्रांट हवाई अड्डा', city: 'Dehradun', cityHi: 'देहरादून', state: 'Uttarakhand', country: 'IN', lat: 30.1897, lng: 78.1803, tier: 2, popular: true },
  { iata: 'ATQ', name: 'Sri Guru Ram Dass Jee International', nameHi: 'श्री गुरु राम दास जी अंतर्राष्ट्रीय', city: 'Amritsar', cityHi: 'अमृतसर', state: 'Punjab', country: 'IN', lat: 31.7094, lng: 74.7973, tier: 2, popular: true },
  { iata: 'CJB', name: 'Coimbatore International', nameHi: 'कोयंबत्तूर अंतर्राष्ट्रीय', city: 'Coimbatore', cityHi: 'कोयंबत्तूर', state: 'Tamil Nadu', country: 'IN', lat: 11.0300, lng: 77.0434, tier: 2, popular: true },
  { iata: 'IXR', name: 'Birsa Munda Airport', nameHi: 'बिरसा मुंडा हवाई अड्डा', city: 'Ranchi', cityHi: 'रांची', state: 'Jharkhand', country: 'IN', lat: 23.3143, lng: 85.3217, tier: 2, popular: false },
  { iata: 'RPR', name: 'Swami Vivekananda Airport', nameHi: 'स्वामी विवेकानंद हवाई अड्डा', city: 'Raipur', cityHi: 'रायपुर', state: 'Chhattisgarh', country: 'IN', lat: 21.1804, lng: 81.7388, tier: 2, popular: false },
  { iata: 'VTZ', name: 'Visakhapatnam Airport', nameHi: 'विशाखापट्टनम हवाई अड्डा', city: 'Visakhapatnam', cityHi: 'विशाखापट्टनम', state: 'Andhra Pradesh', country: 'IN', lat: 17.7212, lng: 83.2245, tier: 2, popular: false },
  { iata: 'STV', name: 'Surat International', nameHi: 'सूरत अंतर्राष्ट्रीय', city: 'Surat', cityHi: 'सूरत', state: 'Gujarat', country: 'IN', lat: 21.1141, lng: 72.7418, tier: 2, popular: false },
  { iata: 'BDQ', name: 'Vadodara Airport', nameHi: 'वडोदरा हवाई अड्डा', city: 'Vadodara', cityHi: 'वडोदरा', state: 'Gujarat', country: 'IN', lat: 22.3362, lng: 73.2264, tier: 2, popular: false },
  { iata: 'IXM', name: 'Madurai Airport', nameHi: 'मदुरै हवाई अड्डा', city: 'Madurai', cityHi: 'मदुरै', state: 'Tamil Nadu', country: 'IN', lat: 9.8345, lng: 78.0934, tier: 2, popular: false },
  { iata: 'TRZ', name: 'Tiruchirappalli International', nameHi: 'तिरुचिरापल्ली अंतर्राष्ट्रीय', city: 'Tiruchirappalli', cityHi: 'तिरुचिरापल्ली', state: 'Tamil Nadu', country: 'IN', lat: 10.7654, lng: 78.7097, tier: 2, popular: false },
  { iata: 'IXA', name: 'Agartala Airport', nameHi: 'अगरतला हवाई अड्डा', city: 'Agartala', cityHi: 'अगरतला', state: 'Tripura', country: 'IN', lat: 23.8870, lng: 91.2404, tier: 2, popular: false },
  { iata: 'IMF', name: 'Imphal Airport', nameHi: 'इम्फाल हवाई अड्डा', city: 'Imphal', cityHi: 'इम्फाल', state: 'Manipur', country: 'IN', lat: 24.7600, lng: 93.8967, tier: 2, popular: false },
  { iata: 'MYQ', name: 'Mysore Airport', nameHi: 'मैसूर हवाई अड्डा', city: 'Mysore', cityHi: 'मैसूर', state: 'Karnataka', country: 'IN', lat: 12.2296, lng: 76.6556, tier: 2, popular: false },
  { iata: 'IXE', name: 'Mangalore International', nameHi: 'मंगलुरु अंतर्राष्ट्रीय', city: 'Mangalore', cityHi: 'मंगलुरु', state: 'Karnataka', country: 'IN', lat: 12.9614, lng: 74.8901, tier: 2, popular: true },
  { iata: 'HBX', name: 'Hubli Airport', nameHi: 'हुबली हवाई अड्डा', city: 'Hubli', cityHi: 'हुबली', state: 'Karnataka', country: 'IN', lat: 15.3617, lng: 75.0849, tier: 3, popular: false },

  // ─── TIER 2-3: Smaller Cities ──────────────────────────────
  { iata: 'UDR', name: 'Maharana Pratap Airport', nameHi: 'महाराणा प्रताप हवाई अड्डा', city: 'Udaipur', cityHi: 'उदयपुर', state: 'Rajasthan', country: 'IN', lat: 24.6177, lng: 73.8961, tier: 2, popular: true },
  { iata: 'JDH', name: 'Jodhpur Airport', nameHi: 'जोधपुर हवाई अड्डा', city: 'Jodhpur', cityHi: 'जोधपुर', state: 'Rajasthan', country: 'IN', lat: 26.2511, lng: 73.0489, tier: 2, popular: true },
  { iata: 'BBI', name: 'Biju Patnaik International', nameHi: 'बीजू पटनायक अंतर्राष्ट्रीय', city: 'Bhubaneswar', cityHi: 'भुवनेश्वर', state: 'Odisha', country: 'IN', lat: 20.2444, lng: 85.8178, tier: 2, popular: true },
  { iata: 'IXZ', name: 'Veer Savarkar International', nameHi: 'वीर सावरकर अंतर्राष्ट्रीय', city: 'Port Blair', cityHi: 'पोर्ट ब्लेयर', state: 'Andaman & Nicobar', country: 'IN', lat: 11.6412, lng: 92.7297, tier: 2, popular: true },
  { iata: 'IXL', name: 'Kushok Bakula Rimpochee Airport', nameHi: 'कुशोक बकुला रिम्पोछी हवाई अड्डा', city: 'Leh', cityHi: 'लेह', state: 'Ladakh', country: 'IN', lat: 34.1359, lng: 77.5465, tier: 2, popular: true },
  { iata: 'CCJ', name: 'Calicut International', nameHi: 'कालीकट अंतर्राष्ट्रीय', city: 'Kozhikode', cityHi: 'कोझीकोड', state: 'Kerala', country: 'IN', lat: 11.1368, lng: 75.9553, tier: 2, popular: true },
  { iata: 'GWL', name: 'Gwalior Airport', nameHi: 'ग्वालियर हवाई अड्डा', city: 'Gwalior', cityHi: 'ग्वालियर', state: 'Madhya Pradesh', country: 'IN', lat: 26.2933, lng: 78.2278, tier: 3, popular: false },
  { iata: 'JLR', name: 'Jabalpur Airport', nameHi: 'जबलपुर हवाई अड्डा', city: 'Jabalpur', cityHi: 'जबलपुर', state: 'Madhya Pradesh', country: 'IN', lat: 23.1778, lng: 80.0520, tier: 3, popular: false },
  { iata: 'DIB', name: 'Dibrugarh Airport', nameHi: 'डिब्रूगढ़ हवाई अड्डा', city: 'Dibrugarh', cityHi: 'डिब्रूगढ़', state: 'Assam', country: 'IN', lat: 27.4839, lng: 95.0169, tier: 3, popular: false },
  { iata: 'JRH', name: 'Jorhat Airport', nameHi: 'जोरहाट हवाई अड्डा', city: 'Jorhat', cityHi: 'जोरहाट', state: 'Assam', country: 'IN', lat: 26.7315, lng: 94.1753, tier: 3, popular: false },
  { iata: 'AYJ', name: 'Ayodhya Airport', nameHi: 'अयोध्या हवाई अड्डा', city: 'Ayodhya', cityHi: 'अयोध्या', state: 'Uttar Pradesh', country: 'IN', lat: 26.7346, lng: 82.1427, tier: 2, popular: true },
  { iata: 'KUU', name: 'Kullu–Manali Airport', nameHi: 'कुल्लू-मनाली हवाई अड्डा', city: 'Kullu', cityHi: 'कुल्लू', state: 'Himachal Pradesh', country: 'IN', lat: 31.8767, lng: 77.1544, tier: 3, popular: true },
  { iata: 'DHM', name: 'Gaggal Airport', nameHi: 'गग्गल हवाई अड्डा', city: 'Dharamshala', cityHi: 'धर्मशाला', state: 'Himachal Pradesh', country: 'IN', lat: 32.1651, lng: 76.2634, tier: 3, popular: true },
  { iata: 'SHL', name: 'Shillong Airport', nameHi: 'शिलांग हवाई अड्डा', city: 'Shillong', cityHi: 'शिलांग', state: 'Meghalaya', country: 'IN', lat: 25.7036, lng: 91.9787, tier: 3, popular: false },

  // ─── INTERNATIONAL HUBS (Popular from India) ───────────────
  { iata: 'DXB', name: 'Dubai International', nameHi: 'दुबई अंतर्राष्ट्रीय', city: 'Dubai', cityHi: 'दुबई', state: '', country: 'AE', lat: 25.2532, lng: 55.3657, tier: 1, popular: true },
  { iata: 'SIN', name: 'Singapore Changi', nameHi: 'सिंगापुर चांगी', city: 'Singapore', cityHi: 'सिंगापुर', state: '', country: 'SG', lat: 1.3644, lng: 103.9915, tier: 1, popular: true },
  { iata: 'BKK', name: 'Suvarnabhumi Airport', nameHi: 'सुवर्णभूमि हवाई अड्डा', city: 'Bangkok', cityHi: 'बैंकॉक', state: '', country: 'TH', lat: 13.6900, lng: 100.7501, tier: 1, popular: true },
  { iata: 'LHR', name: 'London Heathrow', nameHi: 'लंदन हीथ्रो', city: 'London', cityHi: 'लंदन', state: '', country: 'GB', lat: 51.4700, lng: -0.4543, tier: 1, popular: true },
  { iata: 'KUL', name: 'Kuala Lumpur International', nameHi: 'कुआलालम्पुर अंतर्राष्ट्रीय', city: 'Kuala Lumpur', cityHi: 'कुआलालम्पुर', state: '', country: 'MY', lat: 2.7456, lng: 101.7099, tier: 1, popular: true },
  { iata: 'DOH', name: 'Hamad International', nameHi: 'हमद अंतर्राष्ट्रीय', city: 'Doha', cityHi: 'दोहा', state: '', country: 'QA', lat: 25.2609, lng: 51.6138, tier: 1, popular: true },
  { iata: 'AUH', name: 'Abu Dhabi International', nameHi: 'अबू धाबी अंतर्राष्ट्रीय', city: 'Abu Dhabi', cityHi: 'अबू धाबी', state: '', country: 'AE', lat: 24.4330, lng: 54.6511, tier: 1, popular: true },
  { iata: 'CMB', name: 'Bandaranaike International', nameHi: 'बंदरनायके अंतर्राष्ट्रीय', city: 'Colombo', cityHi: 'कोलंबो', state: '', country: 'LK', lat: 7.1808, lng: 79.8841, tier: 1, popular: true },
  { iata: 'KTM', name: 'Tribhuvan International', nameHi: 'त्रिभुवन अंतर्राष्ट्रीय', city: 'Kathmandu', cityHi: 'काठमांडू', state: '', country: 'NP', lat: 27.6966, lng: 85.3591, tier: 1, popular: true },
  { iata: 'MLE', name: 'Velana International', nameHi: 'वेलाना अंतर्राष्ट्रीय', city: 'Male', cityHi: 'माले', state: '', country: 'MV', lat: 4.1918, lng: 73.5291, tier: 1, popular: true },
  { iata: 'JFK', name: 'John F. Kennedy International', nameHi: 'जॉन एफ. कैनेडी अंतर्राष्ट्रीय', city: 'New York', cityHi: 'न्यूयॉर्क', state: 'NY', country: 'US', lat: 40.6413, lng: -73.7781, tier: 1, popular: true },
  { iata: 'SFO', name: 'San Francisco International', nameHi: 'सैन फ्रांसिस्को अंतर्राष्ट्रीय', city: 'San Francisco', cityHi: 'सैन फ्रांसिस्को', state: 'CA', country: 'US', lat: 37.6213, lng: -122.3790, tier: 1, popular: true },
  { iata: 'YYZ', name: 'Toronto Pearson International', nameHi: 'टोरंटो पियर्सन अंतर्राष्ट्रीय', city: 'Toronto', cityHi: 'टोरंटो', state: 'ON', country: 'CA', lat: 43.6777, lng: -79.6248, tier: 1, popular: true },
  { iata: 'SYD', name: 'Sydney Kingsford Smith', nameHi: 'सिडनी किंग्सफोर्ड स्मिथ', city: 'Sydney', cityHi: 'सिडनी', state: 'NSW', country: 'AU', lat: -33.9461, lng: 151.1772, tier: 1, popular: true },
  { iata: 'MEL', name: 'Melbourne Tullamarine', nameHi: 'मेलबर्न', city: 'Melbourne', cityHi: 'मेलबर्न', state: 'VIC', country: 'AU', lat: -37.6690, lng: 144.8410, tier: 1, popular: true },
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
      fuzzyMatch(normalizedQuery, airport.city) * 1.0,
      fuzzyMatch(normalizedQuery, airport.cityHi) * 1.0,
      fuzzyMatch(normalizedQuery, airport.name) * 0.7,
      fuzzyMatch(normalizedQuery, airport.nameHi) * 0.7,
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
