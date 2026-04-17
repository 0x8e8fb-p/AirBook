import { prisma } from '@/lib/prisma';

export interface BankOffer {
  id: string;
  name: string;
  type: 'percentage' | 'flat';
  value: number;
  maxCap?: number;
  minBooking: number;
  promoCode?: string | null;
  platform?: string | null;
  airline?: string | null;
  url?: string | null;
  category: string;
  bankCode?: string | null;
  validUntil: Date;
}

export interface FlightPriceDetails {
  baseFare: number;
  convenienceFee: number;
  effectivePrice: number;
  appliedOffer: BankOffer | null;
}

const CONVENIENCE_FEE = 350;

// ── In-memory cache for DB offers (5 min TTL) ──
let cachedOffers: BankOffer[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function mapDbOffer(row: any): BankOffer {
  return {
    id: row.id,
    name: row.name,
    type: row.type as 'percentage' | 'flat',
    value: row.value,
    maxCap: row.maxCap ?? undefined,
    minBooking: row.minBooking,
    promoCode: row.promoCode,
    platform: row.platform,
    airline: row.airline,
    url: row.url,
    category: row.category,
    bankCode: row.bankCode,
    validUntil: row.validUntil,
  };
}

export async function getActiveOffers(): Promise<BankOffer[]> {
  const now = Date.now();
  if (cachedOffers && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedOffers;
  }

  try {
    const rows = await prisma.flightOffer.findMany({
      where: {
        active: true,
        validUntil: { gte: new Date() },
        validFrom: { lte: new Date() },
      },
      orderBy: { priority: 'desc' },
    });

    cachedOffers = rows.map(mapDbOffer);
    cacheTimestamp = now;
    return cachedOffers;
  } catch (error) {
    console.error('Failed to fetch offers from DB, using empty list:', error);
    return cachedOffers || [];
  }
}

/** Invalidate the in-memory cache (called after sync) */
export function invalidateOfferCache() {
  cachedOffers = null;
  cacheTimestamp = 0;
}

/** Get offers filtered for a specific user's cards */
export async function getOffersForUser(
  userCards?: string[],
  price?: number,
  airlineCode?: string,
): Promise<BankOffer[]> {
  const allOffers = await getActiveOffers();

  return allOffers.filter(offer => {
    // Price filter
    if (price !== undefined && price < offer.minBooking) return false;

    // Airline filter — airline-specific offers only match their airline
    if (offer.airline && airlineCode && offer.airline !== airlineCode) return false;

    // Card filter — bank offers need matching user card
    if (offer.bankCode && userCards && userCards.length > 0) {
      return userCards.includes(offer.bankCode);
    }

    // Non-bank offers (airline promos, OTA coupons, cashback, seasonal) are always applicable
    if (!offer.bankCode) return true;

    // If no cards specified, still show non-bank offers
    if (!userCards || userCards.length === 0) {
      return !offer.bankCode;
    }

    return true;
  });
}

export async function calculateBestEffectivePrice(
  baseFare: number,
  userCards?: string[],
  airlineCode?: string,
): Promise<FlightPriceDetails> {
  const totalFare = baseFare + CONVENIENCE_FEE;
  const applicableOffers = await getOffersForUser(userCards, totalFare, airlineCode);

  let bestOffer: BankOffer | null = null;
  let maxDiscount = 0;

  for (const offer of applicableOffers) {
    let discount = 0;
    if (offer.type === 'flat') {
      discount = offer.value;
    } else if (offer.type === 'percentage') {
      discount = totalFare * offer.value;
      if (offer.maxCap && discount > offer.maxCap) {
        discount = offer.maxCap;
      }
    }

    if (discount > maxDiscount) {
      maxDiscount = discount;
      bestOffer = offer;
    }
  }

  return {
    baseFare,
    convenienceFee: CONVENIENCE_FEE,
    effectivePrice: totalFare - maxDiscount,
    appliedOffer: bestOffer,
  };
}

/** Get ALL applicable offers for checkout display (not just best) */
export async function getAllApplicableOffers(
  baseFare: number,
  userCards?: string[],
  airlineCode?: string,
): Promise<{ offer: BankOffer; discount: number }[]> {
  const totalFare = baseFare + CONVENIENCE_FEE;
  const applicableOffers = await getOffersForUser(userCards, totalFare, airlineCode);

  const results: { offer: BankOffer; discount: number }[] = [];

  for (const offer of applicableOffers) {
    let discount = 0;
    if (offer.type === 'flat') {
      discount = offer.value;
    } else if (offer.type === 'percentage') {
      discount = totalFare * offer.value;
      if (offer.maxCap && discount > offer.maxCap) {
        discount = offer.maxCap;
      }
    }
    if (discount > 0) {
      results.push({ offer, discount });
    }
  }

  // Sort by discount descending
  return results.sort((a, b) => b.discount - a.discount);
}
