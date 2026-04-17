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

/** Map bankCode to human-readable bank name */
export function formatBankName(bankCode?: string | null): string {
  if (!bankCode) return 'Unknown';
  const map: Record<string, string> = {
    'HDFC': 'HDFC Bank',
    'SBI': 'SBI Card',
    'ICICI': 'ICICI Bank',
    'AXIS': 'Axis Bank',
    'KOTAK': 'Kotak Mahindra',
    'YES': 'Yes Bank',
    'RBL': 'RBL Bank',
    'SC': 'Standard Chartered',
    'AMEX': 'American Express',
    'INDUS': 'IndusInd Bank',
    'IDFC': 'IDFC First Bank',
    'AU': 'AU Small Finance',
    'HSBC': 'HSBC',
    'BOB': 'Bank of Baroda',
    'FEDERAL': 'Federal Bank',
    'CANARA': 'Canara Bank',
    'PNB': 'PNB',
    'UNION': 'Union Bank',
    'CITI': 'Citi',
    'CRED': 'CRED',
    'PAYTM': 'Paytm',
    'PHONEPE': 'PhonePe',
    'MOBIKWIK': 'MobiKwik',
    'GPAY': 'Google Pay',
    'FREECHARGE': 'Freecharge',
    'AMAZONPAY': 'Amazon Pay',
  };
  return map[bankCode.toUpperCase()] || bankCode;
}

/** Resolve the best specific platform for a bank offer */
export function resolveBestPlatform(bankCode?: string | null, category?: string | null): string {
  // Bank-specific partner platforms (researched partnerships)
  if (category === 'bank_cc' || category === 'bank_dc' || category === 'bank_emi') {
    const bankPlatforms: Record<string, string> = {
      'HDFC': 'MakeMyTrip',       // HDFC SmartBuy + MakeMyTrip partnership
      'SBI': 'Yatra',             // SBI Card Yatra partnership
      'ICICI': 'MakeMyTrip',      // ICICI iMobile + MakeMyTrip
      'AXIS': 'MakeMyTrip',       // Axis Bank MakeMyTrip co-brand
      'KOTAK': 'Cleartrip',       // Kotak Cleartrip partnership
      'YES': 'MakeMyTrip',        // Yes Bank MakeMyTrip
      'RBL': 'EaseMyTrip',        // RBL EaseMyTrip co-brand
      'SC': 'MakeMyTrip',         // SC MakeMyTrip offers
      'AMEX': 'Cleartrip',        // Amex Cleartrip partnership
      'INDUS': 'Goibibo',         // IndusInd Goibibo partnership
      'IDFC': 'MakeMyTrip',       // IDFC First MakeMyTrip
      'AU': 'MakeMyTrip',         // AU Bank MakeMyTrip
      'HSBC': 'Cleartrip',        // HSBC Cleartrip
      'BOB': 'Ixigo',             // BOB Ixigo
      'FEDERAL': 'MakeMyTrip',    // Federal MakeMyTrip
      'CANARA': 'Ixigo',          // Canara Ixigo
      'PNB': 'Ixigo',             // PNB Ixigo
      'UNION': 'EaseMyTrip',      // Union Bank EaseMyTrip
      'CITI': 'Cleartrip',        // Citi Cleartrip
    };
    if (bankCode && bankPlatforms[bankCode.toUpperCase()]) {
      return bankPlatforms[bankCode.toUpperCase()];
    }
    return 'MakeMyTrip'; // Default for unknown banks
  }

  if (category === 'upi_wallet') {
    const walletPlatforms: Record<string, string> = {
      'CRED': 'CRED Pay',
      'PAYTM': 'Paytm Flights',
      'PHONEPE': 'PhonePe',
      'MOBIKWIK': 'MobiKwik',
      'GPAY': 'Google Pay',
      'FREECHARGE': 'Freecharge',
      'AMAZONPAY': 'Amazon Pay',
    };
    if (bankCode && walletPlatforms[bankCode.toUpperCase()]) {
      return walletPlatforms[bankCode.toUpperCase()];
    }
  }

  return 'Multiple Platforms';
}

export function formatPlatformName(platform?: string | null, bankCode?: string | null, category?: string | null): string {
  // If specific platform is set, use it
  if (platform && platform !== 'any') {
    const map: Record<string, string> = {
      'makemytrip': 'MakeMyTrip',
      'cleartrip': 'Cleartrip',
      'ixigo': 'Ixigo',
      'yatra': 'Yatra',
      'goibibo': 'Goibibo',
      'easemytrip': 'EaseMyTrip',
      'airline_direct': 'Airline Website',
      'grabon': 'GrabOn',
      'happyeasygo': 'HappyEasyGo',
      'cashkaro': 'CashKaro',
      'gopaisaindia': 'GoPaisa',
    };
    return map[platform.toLowerCase()] || platform.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Resolve platform from bank code + category
  if (bankCode || category) {
    return resolveBestPlatform(bankCode, category);
  }

  return 'Multiple Platforms';
}

