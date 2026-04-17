// ============================================
// AirBook — Utility Functions
// ============================================

import { type ClassValue, clsx } from 'clsx';
import type { FlightResult, SortOption } from './types';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Sort flights based on selected option */
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


/** Simple transliteration map for Hindi airport search */
const HINDI_TRANSLITERATION: Record<string, string> = {
  'दिल्ली': 'delhi',
  'मुंबई': 'mumbai',
  'बैंगलोर': 'bangalore',
  'बेंगलुरु': 'bengaluru',
  'चेन्नई': 'chennai',
  'कोलकाता': 'kolkata',
  'हैदराबाद': 'hyderabad',
  'गोवा': 'goa',
  'जयपुर': 'jaipur',
  'अहमदाबाद': 'ahmedabad',
  'पुणे': 'pune',
  'लखनऊ': 'lucknow',
  'कोच्चि': 'kochi',
  'त्रिवेंद्रम': 'trivandrum',
  'चंडीगढ़': 'chandigarh',
  'भोपाल': 'bhopal',
  'पटना': 'patna',
  'वाराणसी': 'varanasi',
  'श्रीनगर': 'srinagar',
  'इंदौर': 'indore',
  'नागपुर': 'nagpur',
  'कोयंबत्तूर': 'coimbatore',
  'मदुरै': 'madurai',
  'विशाखापट्टनम': 'visakhapatnam',
  'गुवाहाटी': 'guwahati',
  'रांची': 'ranchi',
  'रायपुर': 'raipur',
  'मंगलुरु': 'mangalore',
  'सूरत': 'surat',
  'वडोदरा': 'vadodara',
  'तिरुचिरापल्ली': 'tiruchirappalli',
  'अमृतसर': 'amritsar',
  'उदयपुर': 'udaipur',
  'जोधपुर': 'jodhpur',
  'बागडोगरा': 'bagdogra',
  'देहरादून': 'dehradun',
  'लेह': 'leh',
  'पोर्ट ब्लेयर': 'port blair',
  'दुबई': 'dubai',
  'सिंगापुर': 'singapore',
  'बैंकॉक': 'bangkok',
  'लंदन': 'london',
};

/** Transliterate Hindi to searchable English */
export function transliterateHindi(input: string): string {
  const lower = input.toLowerCase().trim();
  if (HINDI_TRANSLITERATION[input]) {
    return HINDI_TRANSLITERATION[input];
  }
  return lower;
}

/** Fuzzy match score (0-1, higher is better) */
export function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  
  // Exact match
  if (t === q) return 1;
  // Starts with
  if (t.startsWith(q)) return 0.9;
  // Contains
  if (t.includes(q)) return 0.7;
  
  // Character-by-character fuzzy
  let qIdx = 0;
  let score = 0;
  for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
    if (t[tIdx] === q[qIdx]) {
      score += 1;
      qIdx++;
    }
  }
  
  if (qIdx < q.length) return 0; // not all chars matched
  return (score / Math.max(q.length, t.length)) * 0.6;
}

