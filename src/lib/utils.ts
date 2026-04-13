// ============================================
// FareCracker — Utility Functions
// ============================================

import { type ClassValue, clsx } from 'clsx';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Generate a deterministic search hash for caching */
export function generateSearchHash(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: { adults: number; children: number; infants: number };
  cabinClass: string;
}): string {
  const key = [
    params.origin,
    params.destination,
    params.departureDate,
    params.returnDate || 'OW',
    `${params.passengers.adults}A${params.passengers.children}C${params.passengers.infants}I`,
    params.cabinClass,
  ].join('|');
  
  // Simple hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash) + key.charCodeAt(i);
  }
  return Math.abs(hash).toString(36);
}

/** Generate a unique flight result ID */
export function generateFlightId(
  source: string,
  flightNumber: string,
  departureDate: string
): string {
  return `${source}_${flightNumber}_${departureDate}`.replace(/\s+/g, '');
}

/** Delay utility for rate limiting */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Safe JSON parse */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/** Format time ago (e.g., "2 min ago", "1 hour ago") */
export function timeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
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

/** Debounce function */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
