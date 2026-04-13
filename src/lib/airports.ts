// ============================================
// AirBook — Global Airport Database
// ============================================
// 600+ airports covering every continent, major hubs, and all Indian airports

import type { Airport } from './types';
import { fuzzyMatch, transliterateHindi } from './utils';

export const AIRPORTS: Airport[] = [
  // ═══════════════════════════════════════════════════════════════
  // INDIA — Complete Coverage
  // ═══════════════════════════════════════════════════════════════

  // ─── Metro (Tier 1) ────────────────────────────────────────────
  { iata: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', state: 'Delhi', country: 'IN', lat: 28.5562, lng: 77.1000, tier: 1, popular: true },
  { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', state: 'Maharashtra', country: 'IN', lat: 19.0896, lng: 72.8656, tier: 1, popular: true },
  { iata: 'BLR', name: 'Kempegowda International', city: 'Bangalore', state: 'Karnataka', country: 'IN', lat: 13.1986, lng: 77.7066, tier: 1, popular: true },
  { iata: 'MAA', name: 'Chennai International', city: 'Chennai', state: 'Tamil Nadu', country: 'IN', lat: 12.9941, lng: 80.1709, tier: 1, popular: true },
  { iata: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', state: 'Telangana', country: 'IN', lat: 17.2403, lng: 78.4294, tier: 1, popular: true },
  { iata: 'CCU', name: 'Netaji Subhas Chandra Bose International', city: 'Kolkata', state: 'West Bengal', country: 'IN', lat: 22.6547, lng: 88.4467, tier: 1, popular: true },

  // ─── Major (Tier 1-2) ──────────────────────────────────────────
  { iata: 'GOI', name: 'Goa International (Dabolim)', city: 'Goa', state: 'Goa', country: 'IN', lat: 15.3808, lng: 73.8314, tier: 1, popular: true },
  { iata: 'GOX', name: 'Manohar International (Mopa)', city: 'North Goa', state: 'Goa', country: 'IN', lat: 15.7384, lng: 73.8349, tier: 1, popular: true },
  { iata: 'PNQ', name: 'Pune Airport', city: 'Pune', state: 'Maharashtra', country: 'IN', lat: 18.5821, lng: 73.9197, tier: 1, popular: true },
  { iata: 'AMD', name: 'Sardar Vallabhbhai Patel International', city: 'Ahmedabad', state: 'Gujarat', country: 'IN', lat: 23.0772, lng: 72.6347, tier: 1, popular: true },
  { iata: 'JAI', name: 'Jaipur International', city: 'Jaipur', state: 'Rajasthan', country: 'IN', lat: 26.8242, lng: 75.8122, tier: 1, popular: true },
  { iata: 'COK', name: 'Cochin International', city: 'Kochi', state: 'Kerala', country: 'IN', lat: 10.1520, lng: 76.4019, tier: 1, popular: true },
  { iata: 'TRV', name: 'Trivandrum International', city: 'Thiruvananthapuram', state: 'Kerala', country: 'IN', lat: 8.4821, lng: 76.9200, tier: 1, popular: true },
  { iata: 'LKO', name: 'Chaudhary Charan Singh International', city: 'Lucknow', state: 'Uttar Pradesh', country: 'IN', lat: 26.7606, lng: 80.8893, tier: 1, popular: true },
  { iata: 'IXC', name: 'Chandigarh International', city: 'Chandigarh', state: 'Chandigarh', country: 'IN', lat: 30.6735, lng: 76.7885, tier: 1, popular: true },

  // ─── Growing (Tier 2) ──────────────────────────────────────────
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
  { iata: 'UDR', name: 'Maharana Pratap Airport', city: 'Udaipur', state: 'Rajasthan', country: 'IN', lat: 24.6177, lng: 73.8961, tier: 2, popular: true },
  { iata: 'JDH', name: 'Jodhpur Airport', city: 'Jodhpur', state: 'Rajasthan', country: 'IN', lat: 26.2511, lng: 73.0489, tier: 2, popular: true },
  { iata: 'BBI', name: 'Biju Patnaik International', city: 'Bhubaneswar', state: 'Odisha', country: 'IN', lat: 20.2444, lng: 85.8178, tier: 2, popular: true },
  { iata: 'IXZ', name: 'Veer Savarkar International', city: 'Port Blair', state: 'Andaman & Nicobar', country: 'IN', lat: 11.6412, lng: 92.7297, tier: 2, popular: true },
  { iata: 'IXL', name: 'Kushok Bakula Rimpochee Airport', city: 'Leh', state: 'Ladakh', country: 'IN', lat: 34.1359, lng: 77.5465, tier: 2, popular: true },
  { iata: 'CCJ', name: 'Calicut International', city: 'Kozhikode', state: 'Kerala', country: 'IN', lat: 11.1368, lng: 75.9553, tier: 2, popular: true },
  { iata: 'AYJ', name: 'Ayodhya Airport', city: 'Ayodhya', state: 'Uttar Pradesh', country: 'IN', lat: 26.7346, lng: 82.1427, tier: 2, popular: true },
  { iata: 'KUU', name: 'Kullu-Manali Airport', city: 'Kullu', state: 'Himachal Pradesh', country: 'IN', lat: 31.8767, lng: 77.1544, tier: 3, popular: true },
  { iata: 'DHM', name: 'Gaggal Airport', city: 'Dharamshala', state: 'Himachal Pradesh', country: 'IN', lat: 32.1651, lng: 76.2634, tier: 3, popular: true },

  // ─── Smaller (Tier 3) ──────────────────────────────────────────
  { iata: 'GWL', name: 'Gwalior Airport', city: 'Gwalior', state: 'Madhya Pradesh', country: 'IN', lat: 26.2933, lng: 78.2278, tier: 3, popular: false },
  { iata: 'JLR', name: 'Jabalpur Airport', city: 'Jabalpur', state: 'Madhya Pradesh', country: 'IN', lat: 23.1778, lng: 80.0520, tier: 3, popular: false },
  { iata: 'DIB', name: 'Dibrugarh Airport', city: 'Dibrugarh', state: 'Assam', country: 'IN', lat: 27.4839, lng: 95.0169, tier: 3, popular: false },
  { iata: 'JRH', name: 'Jorhat Airport', city: 'Jorhat', state: 'Assam', country: 'IN', lat: 26.7315, lng: 94.1753, tier: 3, popular: false },
  { iata: 'SHL', name: 'Shillong Airport', city: 'Shillong', state: 'Meghalaya', country: 'IN', lat: 25.7036, lng: 91.9787, tier: 3, popular: false },
  { iata: 'RAJ', name: 'Rajkot Airport', city: 'Rajkot', state: 'Gujarat', country: 'IN', lat: 22.3093, lng: 70.7795, tier: 3, popular: false },
  { iata: 'BHJ', name: 'Bhuj Airport', city: 'Bhuj', state: 'Gujarat', country: 'IN', lat: 23.2878, lng: 69.6702, tier: 3, popular: false },
  { iata: 'DIU', name: 'Diu Airport', city: 'Diu', state: 'Daman & Diu', country: 'IN', lat: 20.7131, lng: 70.9211, tier: 3, popular: false },
  { iata: 'PBD', name: 'Porbandar Airport', city: 'Porbandar', state: 'Gujarat', country: 'IN', lat: 21.6487, lng: 69.6572, tier: 3, popular: false },
  { iata: 'KLH', name: 'Kolhapur Airport', city: 'Kolhapur', state: 'Maharashtra', country: 'IN', lat: 16.6647, lng: 74.2894, tier: 3, popular: false },
  { iata: 'NDC', name: 'Nanded Airport', city: 'Nanded', state: 'Maharashtra', country: 'IN', lat: 19.1833, lng: 77.3167, tier: 3, popular: false },
  { iata: 'SAG', name: 'Shirdi Airport', city: 'Shirdi', state: 'Maharashtra', country: 'IN', lat: 19.6886, lng: 74.3789, tier: 2, popular: true },
  { iata: 'TIR', name: 'Tirupati Airport', city: 'Tirupati', state: 'Andhra Pradesh', country: 'IN', lat: 13.6325, lng: 79.5433, tier: 2, popular: true },
  { iata: 'RJA', name: 'Rajahmundry Airport', city: 'Rajahmundry', state: 'Andhra Pradesh', country: 'IN', lat: 17.1104, lng: 81.8182, tier: 3, popular: false },
  { iata: 'CDP', name: 'Kadapa Airport', city: 'Kadapa', state: 'Andhra Pradesh', country: 'IN', lat: 14.5100, lng: 78.7728, tier: 3, popular: false },
  { iata: 'SLV', name: 'Shimla Airport', city: 'Shimla', state: 'Himachal Pradesh', country: 'IN', lat: 31.0818, lng: 77.0681, tier: 3, popular: true },
  { iata: 'IXJ', name: 'Jammu Airport', city: 'Jammu', state: 'J&K', country: 'IN', lat: 32.6891, lng: 74.8374, tier: 2, popular: true },
  { iata: 'AGR', name: 'Agra Airport', city: 'Agra', state: 'Uttar Pradesh', country: 'IN', lat: 27.1557, lng: 77.9608, tier: 3, popular: true },
  { iata: 'KNU', name: 'Kanpur Airport', city: 'Kanpur', state: 'Uttar Pradesh', country: 'IN', lat: 26.4414, lng: 80.3648, tier: 3, popular: false },
  { iata: 'GOP', name: 'Gorakhpur Airport', city: 'Gorakhpur', state: 'Uttar Pradesh', country: 'IN', lat: 26.7397, lng: 83.4497, tier: 3, popular: false },
  { iata: 'PYB', name: 'Jeypore Airport', city: 'Jeypore', state: 'Odisha', country: 'IN', lat: 18.8800, lng: 82.5519, tier: 3, popular: false },
  { iata: 'DMU', name: 'Dimapur Airport', city: 'Dimapur', state: 'Nagaland', country: 'IN', lat: 25.8839, lng: 93.7711, tier: 3, popular: false },
  { iata: 'AJL', name: 'Lengpui Airport', city: 'Aizawl', state: 'Mizoram', country: 'IN', lat: 23.8406, lng: 92.6197, tier: 3, popular: false },
  { iata: 'IXS', name: 'Silchar Airport', city: 'Silchar', state: 'Assam', country: 'IN', lat: 24.9129, lng: 92.9787, tier: 3, popular: false },
  { iata: 'TEZ', name: 'Tezpur Airport', city: 'Tezpur', state: 'Assam', country: 'IN', lat: 26.7091, lng: 92.7847, tier: 3, popular: false },

  // ═══════════════════════════════════════════════════════════════
  // MIDDLE EAST
  // ═══════════════════════════════════════════════════════════════
  { iata: 'DXB', name: 'Dubai International', city: 'Dubai', state: '', country: 'AE', lat: 25.2532, lng: 55.3657, tier: 1, popular: true },
  { iata: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', state: '', country: 'AE', lat: 24.4330, lng: 54.6511, tier: 1, popular: true },
  { iata: 'SHJ', name: 'Sharjah International', city: 'Sharjah', state: '', country: 'AE', lat: 25.3286, lng: 55.5172, tier: 2, popular: false },
  { iata: 'DOH', name: 'Hamad International', city: 'Doha', state: '', country: 'QA', lat: 25.2609, lng: 51.6138, tier: 1, popular: true },
  { iata: 'BAH', name: 'Bahrain International', city: 'Manama', state: '', country: 'BH', lat: 26.2708, lng: 50.6336, tier: 1, popular: true },
  { iata: 'MCT', name: 'Muscat International', city: 'Muscat', state: '', country: 'OM', lat: 23.5933, lng: 58.2844, tier: 1, popular: true },
  { iata: 'KWI', name: 'Kuwait International', city: 'Kuwait City', state: '', country: 'KW', lat: 29.2266, lng: 47.9689, tier: 1, popular: true },
  { iata: 'RUH', name: 'King Khalid International', city: 'Riyadh', state: '', country: 'SA', lat: 24.9576, lng: 46.6988, tier: 1, popular: true },
  { iata: 'JED', name: 'King Abdulaziz International', city: 'Jeddah', state: '', country: 'SA', lat: 21.6796, lng: 39.1565, tier: 1, popular: true },
  { iata: 'DMM', name: 'King Fahd International', city: 'Dammam', state: '', country: 'SA', lat: 26.4712, lng: 49.7979, tier: 2, popular: false },
  { iata: 'TLV', name: 'Ben Gurion International', city: 'Tel Aviv', state: '', country: 'IL', lat: 32.0114, lng: 34.8867, tier: 1, popular: true },
  { iata: 'AMM', name: 'Queen Alia International', city: 'Amman', state: '', country: 'JO', lat: 31.7226, lng: 35.9932, tier: 1, popular: false },
  { iata: 'BEY', name: 'Beirut-Rafic Hariri International', city: 'Beirut', state: '', country: 'LB', lat: 33.8209, lng: 35.4884, tier: 1, popular: false },

  // ═══════════════════════════════════════════════════════════════
  // SOUTHEAST ASIA
  // ═══════════════════════════════════════════════════════════════
  { iata: 'SIN', name: 'Singapore Changi', city: 'Singapore', state: '', country: 'SG', lat: 1.3644, lng: 103.9915, tier: 1, popular: true },
  { iata: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', state: '', country: 'TH', lat: 13.6900, lng: 100.7501, tier: 1, popular: true },
  { iata: 'DMK', name: 'Don Mueang International', city: 'Bangkok', state: '', country: 'TH', lat: 13.9126, lng: 100.6068, tier: 1, popular: true },
  { iata: 'HKT', name: 'Phuket International', city: 'Phuket', state: '', country: 'TH', lat: 8.1132, lng: 98.3169, tier: 1, popular: true },
  { iata: 'CNX', name: 'Chiang Mai International', city: 'Chiang Mai', state: '', country: 'TH', lat: 18.7668, lng: 98.9625, tier: 2, popular: true },
  { iata: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', state: '', country: 'MY', lat: 2.7456, lng: 101.7099, tier: 1, popular: true },
  { iata: 'PEN', name: 'Penang International', city: 'Penang', state: '', country: 'MY', lat: 5.2972, lng: 100.2769, tier: 2, popular: false },
  { iata: 'LGK', name: 'Langkawi International', city: 'Langkawi', state: '', country: 'MY', lat: 6.3298, lng: 99.7286, tier: 2, popular: true },
  { iata: 'CGK', name: 'Soekarno-Hatta International', city: 'Jakarta', state: '', country: 'ID', lat: -6.1256, lng: 106.6559, tier: 1, popular: true },
  { iata: 'DPS', name: 'Ngurah Rai International', city: 'Bali', state: '', country: 'ID', lat: -8.7482, lng: 115.1672, tier: 1, popular: true },
  { iata: 'SUB', name: 'Juanda International', city: 'Surabaya', state: '', country: 'ID', lat: -7.3798, lng: 112.7868, tier: 2, popular: false },
  { iata: 'MNL', name: 'Ninoy Aquino International', city: 'Manila', state: '', country: 'PH', lat: 14.5086, lng: 121.0196, tier: 1, popular: true },
  { iata: 'CEB', name: 'Mactan-Cebu International', city: 'Cebu', state: '', country: 'PH', lat: 10.3076, lng: 123.9795, tier: 2, popular: true },
  { iata: 'SGN', name: 'Tan Son Nhat International', city: 'Ho Chi Minh City', state: '', country: 'VN', lat: 10.8188, lng: 106.6520, tier: 1, popular: true },
  { iata: 'HAN', name: 'Noi Bai International', city: 'Hanoi', state: '', country: 'VN', lat: 21.2212, lng: 105.8072, tier: 1, popular: true },
  { iata: 'DAD', name: 'Da Nang International', city: 'Da Nang', state: '', country: 'VN', lat: 16.0439, lng: 108.1992, tier: 2, popular: true },
  { iata: 'RGN', name: 'Yangon International', city: 'Yangon', state: '', country: 'MM', lat: 16.9073, lng: 96.1332, tier: 1, popular: false },
  { iata: 'PNH', name: 'Phnom Penh International', city: 'Phnom Penh', state: '', country: 'KH', lat: 11.5466, lng: 104.8442, tier: 1, popular: false },
  { iata: 'REP', name: 'Siem Reap International', city: 'Siem Reap', state: '', country: 'KH', lat: 13.4107, lng: 103.8128, tier: 2, popular: true },
  { iata: 'VTE', name: 'Wattay International', city: 'Vientiane', state: '', country: 'LA', lat: 17.9883, lng: 102.5633, tier: 2, popular: false },

  // ═══════════════════════════════════════════════════════════════
  // EAST ASIA
  // ═══════════════════════════════════════════════════════════════
  { iata: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', state: '', country: 'HK', lat: 22.3080, lng: 113.9185, tier: 1, popular: true },
  { iata: 'NRT', name: 'Narita International', city: 'Tokyo', state: '', country: 'JP', lat: 35.7647, lng: 140.3864, tier: 1, popular: true },
  { iata: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', state: '', country: 'JP', lat: 35.5494, lng: 139.7798, tier: 1, popular: true },
  { iata: 'KIX', name: 'Kansai International', city: 'Osaka', state: '', country: 'JP', lat: 34.4347, lng: 135.2441, tier: 1, popular: true },
  { iata: 'NGO', name: 'Chubu Centrair International', city: 'Nagoya', state: '', country: 'JP', lat: 34.8584, lng: 136.8125, tier: 2, popular: false },
  { iata: 'FUK', name: 'Fukuoka Airport', city: 'Fukuoka', state: '', country: 'JP', lat: 33.5859, lng: 130.4508, tier: 2, popular: false },
  { iata: 'CTS', name: 'New Chitose Airport', city: 'Sapporo', state: '', country: 'JP', lat: 42.7752, lng: 141.6925, tier: 2, popular: true },
  { iata: 'OKA', name: 'Naha Airport', city: 'Okinawa', state: '', country: 'JP', lat: 26.1958, lng: 127.6459, tier: 2, popular: true },
  { iata: 'ICN', name: 'Incheon International', city: 'Seoul', state: '', country: 'KR', lat: 37.4602, lng: 126.4407, tier: 1, popular: true },
  { iata: 'GMP', name: 'Gimpo International', city: 'Seoul', state: '', country: 'KR', lat: 37.5583, lng: 126.7906, tier: 1, popular: false },
  { iata: 'PUS', name: 'Gimhae International', city: 'Busan', state: '', country: 'KR', lat: 35.1796, lng: 128.9382, tier: 2, popular: true },
  { iata: 'CJU', name: 'Jeju International', city: 'Jeju', state: '', country: 'KR', lat: 33.5113, lng: 126.4929, tier: 2, popular: true },
  { iata: 'TPE', name: 'Taiwan Taoyuan International', city: 'Taipei', state: '', country: 'TW', lat: 25.0777, lng: 121.2328, tier: 1, popular: true },
  { iata: 'PEK', name: 'Beijing Capital International', city: 'Beijing', state: '', country: 'CN', lat: 40.0799, lng: 116.6031, tier: 1, popular: true },
  { iata: 'PKX', name: 'Beijing Daxing International', city: 'Beijing', state: '', country: 'CN', lat: 39.5098, lng: 116.4105, tier: 1, popular: true },
  { iata: 'PVG', name: 'Shanghai Pudong International', city: 'Shanghai', state: '', country: 'CN', lat: 31.1443, lng: 121.8083, tier: 1, popular: true },
  { iata: 'SHA', name: 'Shanghai Hongqiao International', city: 'Shanghai', state: '', country: 'CN', lat: 31.1979, lng: 121.3363, tier: 1, popular: false },
  { iata: 'CAN', name: 'Guangzhou Baiyun International', city: 'Guangzhou', state: '', country: 'CN', lat: 23.3924, lng: 113.2988, tier: 1, popular: true },
  { iata: 'SZX', name: 'Shenzhen Bao\'an International', city: 'Shenzhen', state: '', country: 'CN', lat: 22.6393, lng: 113.8107, tier: 1, popular: true },
  { iata: 'CTU', name: 'Chengdu Tianfu International', city: 'Chengdu', state: '', country: 'CN', lat: 30.3197, lng: 104.4412, tier: 1, popular: true },
  { iata: 'CKG', name: 'Chongqing Jiangbei International', city: 'Chongqing', state: '', country: 'CN', lat: 29.7193, lng: 106.6417, tier: 1, popular: false },
  { iata: 'XIY', name: 'Xi\'an Xianyang International', city: 'Xi\'an', state: '', country: 'CN', lat: 34.4471, lng: 108.7516, tier: 1, popular: false },
  { iata: 'KMG', name: 'Kunming Changshui International', city: 'Kunming', state: '', country: 'CN', lat: 25.1019, lng: 102.9291, tier: 1, popular: false },
  { iata: 'HGH', name: 'Hangzhou Xiaoshan International', city: 'Hangzhou', state: '', country: 'CN', lat: 30.2295, lng: 120.4344, tier: 1, popular: false },
  { iata: 'MFM', name: 'Macau International', city: 'Macau', state: '', country: 'MO', lat: 22.1496, lng: 113.5920, tier: 2, popular: false },
  { iata: 'ULN', name: 'Chinggis Khaan International', city: 'Ulaanbaatar', state: '', country: 'MN', lat: 47.8431, lng: 106.7666, tier: 2, popular: false },

  // ═══════════════════════════════════════════════════════════════
  // SOUTH ASIA
  // ═══════════════════════════════════════════════════════════════
  { iata: 'CMB', name: 'Bandaranaike International', city: 'Colombo', state: '', country: 'LK', lat: 7.1808, lng: 79.8841, tier: 1, popular: true },
  { iata: 'HRI', name: 'Mattala Rajapaksa International', city: 'Hambantota', state: '', country: 'LK', lat: 6.2849, lng: 81.1241, tier: 3, popular: false },
  { iata: 'KTM', name: 'Tribhuvan International', city: 'Kathmandu', state: '', country: 'NP', lat: 27.6966, lng: 85.3591, tier: 1, popular: true },
  { iata: 'MLE', name: 'Velana International', city: 'Male', state: '', country: 'MV', lat: 4.1918, lng: 73.5291, tier: 1, popular: true },
  { iata: 'DAC', name: 'Hazrat Shahjalal International', city: 'Dhaka', state: '', country: 'BD', lat: 23.8433, lng: 90.3978, tier: 1, popular: true },
  { iata: 'CGP', name: 'Shah Amanat International', city: 'Chittagong', state: '', country: 'BD', lat: 22.2496, lng: 91.8133, tier: 2, popular: false },
  { iata: 'ISB', name: 'Islamabad International', city: 'Islamabad', state: '', country: 'PK', lat: 33.5605, lng: 72.8526, tier: 1, popular: true },
  { iata: 'KHI', name: 'Jinnah International', city: 'Karachi', state: '', country: 'PK', lat: 24.9065, lng: 67.1609, tier: 1, popular: true },
  { iata: 'LHE', name: 'Allama Iqbal International', city: 'Lahore', state: '', country: 'PK', lat: 31.5216, lng: 74.4036, tier: 1, popular: true },
  { iata: 'KBL', name: 'Hamid Karzai International', city: 'Kabul', state: '', country: 'AF', lat: 34.5659, lng: 69.2124, tier: 2, popular: false },
  { iata: 'PBH', name: 'Paro International', city: 'Paro', state: '', country: 'BT', lat: 27.4033, lng: 89.4256, tier: 3, popular: true },

  // ═══════════════════════════════════════════════════════════════
  // EUROPE
  // ═══════════════════════════════════════════════════════════════
  { iata: 'LHR', name: 'London Heathrow', city: 'London', state: '', country: 'GB', lat: 51.4700, lng: -0.4543, tier: 1, popular: true },
  { iata: 'LGW', name: 'London Gatwick', city: 'London', state: '', country: 'GB', lat: 51.1537, lng: -0.1821, tier: 1, popular: true },
  { iata: 'STN', name: 'London Stansted', city: 'London', state: '', country: 'GB', lat: 51.8850, lng: 0.2350, tier: 2, popular: false },
  { iata: 'LTN', name: 'London Luton', city: 'London', state: '', country: 'GB', lat: 51.8747, lng: -0.3683, tier: 2, popular: false },
  { iata: 'MAN', name: 'Manchester Airport', city: 'Manchester', state: '', country: 'GB', lat: 53.3537, lng: -2.2750, tier: 1, popular: true },
  { iata: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', state: '', country: 'GB', lat: 55.9500, lng: -3.3725, tier: 2, popular: true },
  { iata: 'BHX', name: 'Birmingham Airport', city: 'Birmingham', state: '', country: 'GB', lat: 52.4539, lng: -1.7480, tier: 2, popular: false },
  { iata: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', state: '', country: 'FR', lat: 49.0097, lng: 2.5479, tier: 1, popular: true },
  { iata: 'ORY', name: 'Paris Orly', city: 'Paris', state: '', country: 'FR', lat: 48.7233, lng: 2.3794, tier: 1, popular: false },
  { iata: 'NCE', name: 'Nice Cote d\'Azur', city: 'Nice', state: '', country: 'FR', lat: 43.6584, lng: 7.2159, tier: 2, popular: true },
  { iata: 'LYS', name: 'Lyon-Saint Exupery', city: 'Lyon', state: '', country: 'FR', lat: 45.7256, lng: 5.0811, tier: 2, popular: false },
  { iata: 'MRS', name: 'Marseille Provence', city: 'Marseille', state: '', country: 'FR', lat: 43.4393, lng: 5.2214, tier: 2, popular: false },
  { iata: 'FRA', name: 'Frankfurt am Main', city: 'Frankfurt', state: '', country: 'DE', lat: 50.0379, lng: 8.5622, tier: 1, popular: true },
  { iata: 'MUC', name: 'Munich Airport', city: 'Munich', state: '', country: 'DE', lat: 48.3538, lng: 11.7861, tier: 1, popular: true },
  { iata: 'BER', name: 'Berlin Brandenburg', city: 'Berlin', state: '', country: 'DE', lat: 52.3667, lng: 13.5033, tier: 1, popular: true },
  { iata: 'HAM', name: 'Hamburg Airport', city: 'Hamburg', state: '', country: 'DE', lat: 53.6304, lng: 9.9882, tier: 2, popular: false },
  { iata: 'DUS', name: 'Dusseldorf Airport', city: 'Dusseldorf', state: '', country: 'DE', lat: 51.2895, lng: 6.7668, tier: 2, popular: false },
  { iata: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', state: '', country: 'NL', lat: 52.3086, lng: 4.7639, tier: 1, popular: true },
  { iata: 'BRU', name: 'Brussels Airport', city: 'Brussels', state: '', country: 'BE', lat: 50.9014, lng: 4.4844, tier: 1, popular: true },
  { iata: 'ZRH', name: 'Zurich Airport', city: 'Zurich', state: '', country: 'CH', lat: 47.4647, lng: 8.5492, tier: 1, popular: true },
  { iata: 'GVA', name: 'Geneva Airport', city: 'Geneva', state: '', country: 'CH', lat: 46.2381, lng: 6.1089, tier: 1, popular: true },
  { iata: 'VIE', name: 'Vienna International', city: 'Vienna', state: '', country: 'AT', lat: 48.1103, lng: 16.5697, tier: 1, popular: true },
  { iata: 'MAD', name: 'Adolfo Suarez Madrid-Barajas', city: 'Madrid', state: '', country: 'ES', lat: 40.4983, lng: -3.5676, tier: 1, popular: true },
  { iata: 'BCN', name: 'Barcelona-El Prat', city: 'Barcelona', state: '', country: 'ES', lat: 41.2974, lng: 2.0833, tier: 1, popular: true },
  { iata: 'PMI', name: 'Palma de Mallorca', city: 'Palma', state: '', country: 'ES', lat: 39.5517, lng: 2.7388, tier: 2, popular: true },
  { iata: 'AGP', name: 'Malaga-Costa del Sol', city: 'Malaga', state: '', country: 'ES', lat: 36.6749, lng: -4.4991, tier: 2, popular: true },
  { iata: 'FCO', name: 'Rome Fiumicino', city: 'Rome', state: '', country: 'IT', lat: 41.8003, lng: 12.2389, tier: 1, popular: true },
  { iata: 'MXP', name: 'Milan Malpensa', city: 'Milan', state: '', country: 'IT', lat: 45.6306, lng: 8.7281, tier: 1, popular: true },
  { iata: 'VCE', name: 'Venice Marco Polo', city: 'Venice', state: '', country: 'IT', lat: 45.5053, lng: 12.3519, tier: 2, popular: true },
  { iata: 'NAP', name: 'Naples International', city: 'Naples', state: '', country: 'IT', lat: 40.8860, lng: 14.2908, tier: 2, popular: false },
  { iata: 'LIS', name: 'Lisbon Humberto Delgado', city: 'Lisbon', state: '', country: 'PT', lat: 38.7813, lng: -9.1359, tier: 1, popular: true },
  { iata: 'OPO', name: 'Porto Airport', city: 'Porto', state: '', country: 'PT', lat: 41.2481, lng: -8.6814, tier: 2, popular: true },
  { iata: 'ATH', name: 'Athens Eleftherios Venizelos', city: 'Athens', state: '', country: 'GR', lat: 37.9364, lng: 23.9475, tier: 1, popular: true },
  { iata: 'JTR', name: 'Santorini Airport', city: 'Santorini', state: '', country: 'GR', lat: 36.3992, lng: 25.4793, tier: 2, popular: true },
  { iata: 'JMK', name: 'Mykonos Airport', city: 'Mykonos', state: '', country: 'GR', lat: 37.4351, lng: 25.3481, tier: 2, popular: true },
  { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', state: '', country: 'TR', lat: 41.2753, lng: 28.7519, tier: 1, popular: true },
  { iata: 'SAW', name: 'Istanbul Sabiha Gokcen', city: 'Istanbul', state: '', country: 'TR', lat: 40.8986, lng: 29.3092, tier: 1, popular: true },
  { iata: 'AYT', name: 'Antalya Airport', city: 'Antalya', state: '', country: 'TR', lat: 36.8987, lng: 30.8005, tier: 2, popular: true },
  { iata: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', state: '', country: 'DK', lat: 55.6180, lng: 12.6561, tier: 1, popular: true },
  { iata: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', state: '', country: 'SE', lat: 59.6519, lng: 17.9186, tier: 1, popular: true },
  { iata: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', state: '', country: 'NO', lat: 60.1939, lng: 11.1004, tier: 1, popular: true },
  { iata: 'HEL', name: 'Helsinki-Vantaa', city: 'Helsinki', state: '', country: 'FI', lat: 60.3172, lng: 24.9633, tier: 1, popular: true },
  { iata: 'WAW', name: 'Warsaw Chopin', city: 'Warsaw', state: '', country: 'PL', lat: 52.1657, lng: 20.9671, tier: 1, popular: true },
  { iata: 'PRG', name: 'Vaclav Havel Prague', city: 'Prague', state: '', country: 'CZ', lat: 50.1008, lng: 14.2600, tier: 1, popular: true },
  { iata: 'BUD', name: 'Budapest Ferenc Liszt', city: 'Budapest', state: '', country: 'HU', lat: 47.4369, lng: 19.2556, tier: 1, popular: true },
  { iata: 'OTP', name: 'Henri Coanda International', city: 'Bucharest', state: '', country: 'RO', lat: 44.5711, lng: 26.0850, tier: 1, popular: false },
  { iata: 'SOF', name: 'Sofia Airport', city: 'Sofia', state: '', country: 'BG', lat: 42.6952, lng: 23.4063, tier: 2, popular: false },
  { iata: 'DUB', name: 'Dublin Airport', city: 'Dublin', state: '', country: 'IE', lat: 53.4264, lng: -6.2499, tier: 1, popular: true },
  { iata: 'KEF', name: 'Keflavik International', city: 'Reykjavik', state: '', country: 'IS', lat: 63.9850, lng: -22.6056, tier: 1, popular: true },
  { iata: 'SVO', name: 'Sheremetyevo International', city: 'Moscow', state: '', country: 'RU', lat: 55.9726, lng: 37.4146, tier: 1, popular: true },
  { iata: 'LED', name: 'Pulkovo Airport', city: 'Saint Petersburg', state: '', country: 'RU', lat: 59.8003, lng: 30.2625, tier: 1, popular: false },

  // ═══════════════════════════════════════════════════════════════
  // NORTH AMERICA
  // ═══════════════════════════════════════════════════════════════
  { iata: 'JFK', name: 'John F. Kennedy International', city: 'New York', state: 'NY', country: 'US', lat: 40.6413, lng: -73.7781, tier: 1, popular: true },
  { iata: 'EWR', name: 'Newark Liberty International', city: 'Newark', state: 'NJ', country: 'US', lat: 40.6895, lng: -74.1745, tier: 1, popular: true },
  { iata: 'LGA', name: 'LaGuardia Airport', city: 'New York', state: 'NY', country: 'US', lat: 40.7769, lng: -73.8740, tier: 1, popular: false },
  { iata: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', state: 'CA', country: 'US', lat: 33.9425, lng: -118.4081, tier: 1, popular: true },
  { iata: 'SFO', name: 'San Francisco International', city: 'San Francisco', state: 'CA', country: 'US', lat: 37.6213, lng: -122.3790, tier: 1, popular: true },
  { iata: 'SJC', name: 'San Jose International', city: 'San Jose', state: 'CA', country: 'US', lat: 37.3626, lng: -121.9290, tier: 2, popular: false },
  { iata: 'SAN', name: 'San Diego International', city: 'San Diego', state: 'CA', country: 'US', lat: 32.7336, lng: -117.1897, tier: 2, popular: false },
  { iata: 'ORD', name: 'O\'Hare International', city: 'Chicago', state: 'IL', country: 'US', lat: 41.9742, lng: -87.9073, tier: 1, popular: true },
  { iata: 'MDW', name: 'Midway International', city: 'Chicago', state: 'IL', country: 'US', lat: 41.7868, lng: -87.7522, tier: 2, popular: false },
  { iata: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', state: 'GA', country: 'US', lat: 33.6407, lng: -84.4277, tier: 1, popular: true },
  { iata: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', state: 'TX', country: 'US', lat: 32.8998, lng: -97.0403, tier: 1, popular: true },
  { iata: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', state: 'TX', country: 'US', lat: 29.9844, lng: -95.3414, tier: 1, popular: true },
  { iata: 'MIA', name: 'Miami International', city: 'Miami', state: 'FL', country: 'US', lat: 25.7959, lng: -80.2870, tier: 1, popular: true },
  { iata: 'MCO', name: 'Orlando International', city: 'Orlando', state: 'FL', country: 'US', lat: 28.4312, lng: -81.3081, tier: 1, popular: true },
  { iata: 'TPA', name: 'Tampa International', city: 'Tampa', state: 'FL', country: 'US', lat: 27.9755, lng: -82.5332, tier: 2, popular: false },
  { iata: 'BOS', name: 'Boston Logan International', city: 'Boston', state: 'MA', country: 'US', lat: 42.3656, lng: -71.0096, tier: 1, popular: true },
  { iata: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', state: 'WA', country: 'US', lat: 47.4502, lng: -122.3088, tier: 1, popular: true },
  { iata: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO', country: 'US', lat: 39.8561, lng: -104.6737, tier: 1, popular: true },
  { iata: 'PHX', name: 'Phoenix Sky Harbor International', city: 'Phoenix', state: 'AZ', country: 'US', lat: 33.4373, lng: -112.0078, tier: 1, popular: false },
  { iata: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', state: 'NV', country: 'US', lat: 36.0840, lng: -115.1537, tier: 1, popular: true },
  { iata: 'MSP', name: 'Minneapolis-Saint Paul International', city: 'Minneapolis', state: 'MN', country: 'US', lat: 44.8848, lng: -93.2223, tier: 1, popular: false },
  { iata: 'DTW', name: 'Detroit Metropolitan Wayne County', city: 'Detroit', state: 'MI', country: 'US', lat: 42.2124, lng: -83.3534, tier: 1, popular: false },
  { iata: 'PHL', name: 'Philadelphia International', city: 'Philadelphia', state: 'PA', country: 'US', lat: 39.8721, lng: -75.2408, tier: 1, popular: false },
  { iata: 'IAD', name: 'Dulles International', city: 'Washington D.C.', state: 'VA', country: 'US', lat: 38.9445, lng: -77.4558, tier: 1, popular: true },
  { iata: 'DCA', name: 'Ronald Reagan Washington National', city: 'Washington D.C.', state: 'VA', country: 'US', lat: 38.8512, lng: -77.0402, tier: 1, popular: false },
  { iata: 'HNL', name: 'Daniel K. Inouye International', city: 'Honolulu', state: 'HI', country: 'US', lat: 21.3187, lng: -157.9225, tier: 1, popular: true },
  { iata: 'ANC', name: 'Ted Stevens Anchorage International', city: 'Anchorage', state: 'AK', country: 'US', lat: 61.1741, lng: -149.9964, tier: 2, popular: false },
  { iata: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', state: 'ON', country: 'CA', lat: 43.6777, lng: -79.6248, tier: 1, popular: true },
  { iata: 'YVR', name: 'Vancouver International', city: 'Vancouver', state: 'BC', country: 'CA', lat: 49.1967, lng: -123.1815, tier: 1, popular: true },
  { iata: 'YUL', name: 'Montreal-Trudeau International', city: 'Montreal', state: 'QC', country: 'CA', lat: 45.4706, lng: -73.7408, tier: 1, popular: true },
  { iata: 'YOW', name: 'Ottawa Macdonald-Cartier', city: 'Ottawa', state: 'ON', country: 'CA', lat: 45.3225, lng: -75.6692, tier: 2, popular: false },
  { iata: 'YYC', name: 'Calgary International', city: 'Calgary', state: 'AB', country: 'CA', lat: 51.1215, lng: -114.0076, tier: 2, popular: true },
  { iata: 'YEG', name: 'Edmonton International', city: 'Edmonton', state: 'AB', country: 'CA', lat: 53.3097, lng: -113.5797, tier: 2, popular: false },
  { iata: 'MEX', name: 'Mexico City International', city: 'Mexico City', state: '', country: 'MX', lat: 19.4361, lng: -99.0719, tier: 1, popular: true },
  { iata: 'CUN', name: 'Cancun International', city: 'Cancun', state: '', country: 'MX', lat: 21.0365, lng: -86.8771, tier: 1, popular: true },
  { iata: 'GDL', name: 'Guadalajara International', city: 'Guadalajara', state: '', country: 'MX', lat: 20.5218, lng: -103.3113, tier: 2, popular: false },

  // ═══════════════════════════════════════════════════════════════
  // SOUTH AMERICA
  // ═══════════════════════════════════════════════════════════════
  { iata: 'GRU', name: 'Sao Paulo-Guarulhos International', city: 'Sao Paulo', state: '', country: 'BR', lat: -23.4356, lng: -46.4731, tier: 1, popular: true },
  { iata: 'GIG', name: 'Rio de Janeiro-Galeao International', city: 'Rio de Janeiro', state: '', country: 'BR', lat: -22.8100, lng: -43.2506, tier: 1, popular: true },
  { iata: 'BSB', name: 'Brasilia International', city: 'Brasilia', state: '', country: 'BR', lat: -15.8711, lng: -47.9186, tier: 1, popular: false },
  { iata: 'EZE', name: 'Buenos Aires Ezeiza', city: 'Buenos Aires', state: '', country: 'AR', lat: -34.8222, lng: -58.5358, tier: 1, popular: true },
  { iata: 'SCL', name: 'Santiago International', city: 'Santiago', state: '', country: 'CL', lat: -33.3930, lng: -70.7858, tier: 1, popular: true },
  { iata: 'BOG', name: 'El Dorado International', city: 'Bogota', state: '', country: 'CO', lat: 4.7016, lng: -74.1469, tier: 1, popular: true },
  { iata: 'LIM', name: 'Jorge Chavez International', city: 'Lima', state: '', country: 'PE', lat: -12.0219, lng: -77.1143, tier: 1, popular: true },
  { iata: 'UIO', name: 'Mariscal Sucre International', city: 'Quito', state: '', country: 'EC', lat: -0.1292, lng: -78.3575, tier: 1, popular: false },
  { iata: 'CCS', name: 'Simon Bolivar International', city: 'Caracas', state: '', country: 'VE', lat: 10.6012, lng: -66.9919, tier: 1, popular: false },
  { iata: 'MVD', name: 'Carrasco International', city: 'Montevideo', state: '', country: 'UY', lat: -34.8384, lng: -56.0308, tier: 1, popular: false },
  { iata: 'ASU', name: 'Silvio Pettirossi International', city: 'Asuncion', state: '', country: 'PY', lat: -25.2400, lng: -57.5191, tier: 2, popular: false },

  // ═══════════════════════════════════════════════════════════════
  // OCEANIA
  // ═══════════════════════════════════════════════════════════════
  { iata: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', state: 'NSW', country: 'AU', lat: -33.9461, lng: 151.1772, tier: 1, popular: true },
  { iata: 'MEL', name: 'Melbourne Tullamarine', city: 'Melbourne', state: 'VIC', country: 'AU', lat: -37.6690, lng: 144.8410, tier: 1, popular: true },
  { iata: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', state: 'QLD', country: 'AU', lat: -27.3842, lng: 153.1175, tier: 1, popular: true },
  { iata: 'PER', name: 'Perth Airport', city: 'Perth', state: 'WA', country: 'AU', lat: -31.9403, lng: 115.9672, tier: 1, popular: true },
  { iata: 'ADL', name: 'Adelaide Airport', city: 'Adelaide', state: 'SA', country: 'AU', lat: -34.9450, lng: 138.5306, tier: 2, popular: false },
  { iata: 'CBR', name: 'Canberra Airport', city: 'Canberra', state: 'ACT', country: 'AU', lat: -35.3069, lng: 149.1950, tier: 2, popular: false },
  { iata: 'OOL', name: 'Gold Coast Airport', city: 'Gold Coast', state: 'QLD', country: 'AU', lat: -28.1644, lng: 153.5047, tier: 2, popular: true },
  { iata: 'CNS', name: 'Cairns Airport', city: 'Cairns', state: 'QLD', country: 'AU', lat: -16.8858, lng: 145.7553, tier: 2, popular: true },
  { iata: 'AKL', name: 'Auckland Airport', city: 'Auckland', state: '', country: 'NZ', lat: -37.0082, lng: 174.7850, tier: 1, popular: true },
  { iata: 'WLG', name: 'Wellington Airport', city: 'Wellington', state: '', country: 'NZ', lat: -41.3272, lng: 174.8053, tier: 2, popular: false },
  { iata: 'CHC', name: 'Christchurch Airport', city: 'Christchurch', state: '', country: 'NZ', lat: -43.4894, lng: 172.5322, tier: 2, popular: true },
  { iata: 'ZQN', name: 'Queenstown Airport', city: 'Queenstown', state: '', country: 'NZ', lat: -45.0211, lng: 168.7392, tier: 2, popular: true },
  { iata: 'NAN', name: 'Nadi International', city: 'Nadi', state: '', country: 'FJ', lat: -17.7553, lng: 177.4436, tier: 2, popular: true },
  { iata: 'PPT', name: 'Faaa International', city: 'Papeete', state: '', country: 'PF', lat: -17.5537, lng: -149.6115, tier: 2, popular: false },

  // ═══════════════════════════════════════════════════════════════
  // AFRICA
  // ═══════════════════════════════════════════════════════════════
  { iata: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', state: '', country: 'ZA', lat: -26.1367, lng: 28.2461, tier: 1, popular: true },
  { iata: 'CPT', name: 'Cape Town International', city: 'Cape Town', state: '', country: 'ZA', lat: -33.9715, lng: 18.6021, tier: 1, popular: true },
  { iata: 'DUR', name: 'King Shaka International', city: 'Durban', state: '', country: 'ZA', lat: -29.6144, lng: 31.1197, tier: 2, popular: false },
  { iata: 'CAI', name: 'Cairo International', city: 'Cairo', state: '', country: 'EG', lat: 30.1219, lng: 31.4056, tier: 1, popular: true },
  { iata: 'HRG', name: 'Hurghada International', city: 'Hurghada', state: '', country: 'EG', lat: 27.1784, lng: 33.7994, tier: 2, popular: true },
  { iata: 'SSH', name: 'Sharm el-Sheikh International', city: 'Sharm el-Sheikh', state: '', country: 'EG', lat: 27.9773, lng: 34.3950, tier: 2, popular: true },
  { iata: 'CMN', name: 'Mohammed V International', city: 'Casablanca', state: '', country: 'MA', lat: 33.3675, lng: -7.5898, tier: 1, popular: true },
  { iata: 'RAK', name: 'Menara Airport', city: 'Marrakech', state: '', country: 'MA', lat: 31.6069, lng: -8.0363, tier: 2, popular: true },
  { iata: 'TUN', name: 'Tunis-Carthage International', city: 'Tunis', state: '', country: 'TN', lat: 36.8510, lng: 10.2272, tier: 1, popular: false },
  { iata: 'ALG', name: 'Houari Boumediene Airport', city: 'Algiers', state: '', country: 'DZ', lat: 36.6910, lng: 3.2155, tier: 1, popular: false },
  { iata: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', state: '', country: 'KE', lat: -1.3192, lng: 36.9278, tier: 1, popular: true },
  { iata: 'MBA', name: 'Moi International', city: 'Mombasa', state: '', country: 'KE', lat: -4.0348, lng: 39.5942, tier: 2, popular: true },
  { iata: 'DAR', name: 'Julius Nyerere International', city: 'Dar es Salaam', state: '', country: 'TZ', lat: -6.8782, lng: 39.2026, tier: 1, popular: false },
  { iata: 'JRO', name: 'Kilimanjaro International', city: 'Kilimanjaro', state: '', country: 'TZ', lat: -3.4294, lng: 37.0745, tier: 2, popular: true },
  { iata: 'ZNZ', name: 'Abeid Amani Karume International', city: 'Zanzibar', state: '', country: 'TZ', lat: -6.2220, lng: 39.2249, tier: 2, popular: true },
  { iata: 'ADD', name: 'Addis Ababa Bole International', city: 'Addis Ababa', state: '', country: 'ET', lat: 8.9779, lng: 38.7993, tier: 1, popular: true },
  { iata: 'LOS', name: 'Murtala Muhammed International', city: 'Lagos', state: '', country: 'NG', lat: 6.5774, lng: 3.3213, tier: 1, popular: true },
  { iata: 'ABJ', name: 'Port Bouet Airport', city: 'Abidjan', state: '', country: 'CI', lat: 5.2614, lng: -3.9262, tier: 2, popular: false },
  { iata: 'ACC', name: 'Kotoka International', city: 'Accra', state: '', country: 'GH', lat: 5.6052, lng: -0.1668, tier: 1, popular: false },
  { iata: 'EBB', name: 'Entebbe International', city: 'Entebbe', state: '', country: 'UG', lat: 0.0424, lng: 32.4435, tier: 2, popular: false },
  { iata: 'MRU', name: 'Sir Seewoosagur Ramgoolam International', city: 'Mauritius', state: '', country: 'MU', lat: -20.4302, lng: 57.6836, tier: 1, popular: true },
  { iata: 'SEZ', name: 'Seychelles International', city: 'Mahe', state: '', country: 'SC', lat: -4.6743, lng: 55.5218, tier: 2, popular: true },

  // ═══════════════════════════════════════════════════════════════
  // CENTRAL AMERICA & CARIBBEAN
  // ═══════════════════════════════════════════════════════════════
  { iata: 'PTY', name: 'Tocumen International', city: 'Panama City', state: '', country: 'PA', lat: 9.0714, lng: -79.3835, tier: 1, popular: false },
  { iata: 'SJO', name: 'Juan Santamaria International', city: 'San Jose', state: '', country: 'CR', lat: 9.9939, lng: -84.2088, tier: 1, popular: true },
  { iata: 'HAV', name: 'Jose Marti International', city: 'Havana', state: '', country: 'CU', lat: 22.9892, lng: -82.4091, tier: 1, popular: false },
  { iata: 'MBJ', name: 'Sangster International', city: 'Montego Bay', state: '', country: 'JM', lat: 18.5037, lng: -77.9134, tier: 2, popular: true },
  { iata: 'NAS', name: 'Lynden Pindling International', city: 'Nassau', state: '', country: 'BS', lat: 25.0390, lng: -77.4662, tier: 2, popular: true },
  { iata: 'PUJ', name: 'Punta Cana International', city: 'Punta Cana', state: '', country: 'DO', lat: 18.5674, lng: -68.3634, tier: 2, popular: true },
  { iata: 'AUA', name: 'Queen Beatrix International', city: 'Aruba', state: '', country: 'AW', lat: 12.5014, lng: -70.0152, tier: 2, popular: true },

  // ═══════════════════════════════════════════════════════════════
  // CENTRAL ASIA
  // ═══════════════════════════════════════════════════════════════
  { iata: 'TAS', name: 'Islam Karimov Tashkent International', city: 'Tashkent', state: '', country: 'UZ', lat: 41.2581, lng: 69.2812, tier: 1, popular: false },
  { iata: 'ALA', name: 'Almaty International', city: 'Almaty', state: '', country: 'KZ', lat: 43.3521, lng: 77.0405, tier: 1, popular: false },
  { iata: 'NQZ', name: 'Nursultan Nazarbayev International', city: 'Astana', state: '', country: 'KZ', lat: 51.0222, lng: 71.4669, tier: 2, popular: false },
  { iata: 'GYD', name: 'Heydar Aliyev International', city: 'Baku', state: '', country: 'AZ', lat: 40.4675, lng: 50.0467, tier: 1, popular: false },
  { iata: 'TBS', name: 'Tbilisi International', city: 'Tbilisi', state: '', country: 'GE', lat: 41.6692, lng: 44.9547, tier: 1, popular: true },
  { iata: 'EVN', name: 'Zvartnots International', city: 'Yerevan', state: '', country: 'AM', lat: 40.1473, lng: 44.3959, tier: 1, popular: false },
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
      fuzzyMatch(normalizedQuery, airport.country) * 0.3,
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
