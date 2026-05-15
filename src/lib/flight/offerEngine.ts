import { travelpayoutsApi, TravelpayoutsConfigError, TravelpayoutsError } from "@/lib/api/travelpayoutsClient";
import type { Coupon } from "@/lib/api/travelpayoutsTypes";

export interface BankOffer {
  id: string;
  name: string;
  description?: string | null;
  type: "percentage" | "flat";
  value: number;
  maxCap?: number | null;
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

export const CONVENIENCE_FEE = 350;

/** UPI wallets / pay apps — treated as universally available (no card ownership check) */
export const UNIVERSAL_UPI_CODES: Set<string> = new Set([
  "PAYTM",
  "PHONEPE",
  "CRED",
  "MOBIKWIK",
  "GPAY",
  "FREECHARGE",
  "AMAZONPAY",
]);

const BANK_NAME_TO_CODE: Record<string, string> = {
  HDFC: "HDFC",
  ICICI: "ICICI",
  SBI: "SBI",
  AXIS: "AXIS",
  AXISBANK: "AXIS",
  KOTAK: "KOTAK",
  YES: "YES",
  YESBANK: "YES",
  IDFC: "IDFC",
  IDFCFIRST: "IDFC",
  RBL: "RBL",
  AMERICANEXPRESS: "AMEX",
  AMEX: "AMEX",
  CITI: "CITI",
  CITIBANK: "CITI",
  HSBC: "HSBC",
  STANDARDCHARTERED: "SCB",
  SCB: "SCB",
  INDUSIND: "INDUSIND",
  FEDERAL: "FEDERAL",
  BOB: "BOB",
  BANKOFBARODA: "BOB",
  CANARA: "CANARA",
  PNB: "PNB",
  ONECARD: "ONECARD",
  PAYTM: "PAYTM",
  PAYTMWALLET: "PAYTM",
  PHONEPE: "PHONEPE",
  CRED: "CRED",
  CREDPAY: "CRED",
  MOBIKWIK: "MOBIKWIK",
  GPAY: "GPAY",
  GOOGLEPAY: "GPAY",
  FREECHARGE: "FREECHARGE",
  AMAZONPAY: "AMAZONPAY",
  AMAZON: "AMAZONPAY",
};

export function resolveBankCode(bankName: string | null | undefined): string | null {
  if (!bankName) return null;
  const normalized = bankName.toUpperCase().replace(/[^A-Z]/g, "");
  return BANK_NAME_TO_CODE[normalized] ?? null;
}

function couponToBankOffer(c: Coupon): BankOffer {
  const type: "percentage" | "flat" = c.discountType === "PERCENTAGE" ? "percentage" : "flat";
  const value = type === "percentage" ? c.discountValue / 100 : c.discountValue;
  const validUntil = c.validUntil ? new Date(c.validUntil) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const category = c.bankName ? "bank" : c.otaName ? "ota" : c.applicableAirlines.length > 0 ? "airline" : "promo";
  const name = c.bankName
    ? `${c.bankName}${c.cardType ? ` ${c.cardType}` : ""} offer`
    : c.otaName
    ? `${c.otaName} offer`
    : c.description ?? c.code;

  return {
    id: c.code,
    name,
    description: c.description ?? null,
    type,
    value,
    maxCap: c.maxDiscount ?? null,
    minBooking: c.minSpend ?? 0,
    promoCode: c.code,
    platform: c.otaName ?? null,
    airline: c.applicableAirlines[0] ?? null,
    url: c.sourceUrl ?? null,
    category,
    bankCode: resolveBankCode(c.bankName),
    validUntil,
  };
}

function couponMatchesContext(c: Coupon, airlineCode: string | undefined, route: string | undefined): boolean {
  if (airlineCode && c.applicableAirlines.length > 0 && !c.applicableAirlines.includes(airlineCode)) {
    return false;
  }
  if (route && c.applicableRoutes.length > 0 && !c.applicableRoutes.includes(route)) {
    return false;
  }
  const now = Date.now();
  if (c.validFrom && new Date(c.validFrom).getTime() > now) return false;
  if (c.validUntil && new Date(c.validUntil).getTime() < now) return false;
  return true;
}

async function fetchCoupons(airlineCode?: string): Promise<BankOffer[]> {
  try {
    const { coupons } = await travelpayoutsApi.listCoupons({ airline: airlineCode });
    return coupons
      .filter((c) => couponMatchesContext(c, airlineCode, undefined))
      .map(couponToBankOffer);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError) {
      console.warn("Travelpayouts not configured; offers disabled");
    } else if (err instanceof TravelpayoutsError) {
      console.error(`Travelpayouts ${err.status} on listCoupons:`, err.message);
    } else {
      console.error("Failed to fetch coupons:", err);
    }
    return [];
  }
}

export async function getActiveOffers(airlineCode?: string): Promise<BankOffer[]> {
  return fetchCoupons(airlineCode);
}

export async function getOffersForUser(
  userCards?: string[],
  price?: number,
  airlineCode?: string,
): Promise<BankOffer[]> {
  const offers = await fetchCoupons(airlineCode);
  return offers.filter((offer) => {
    if (price !== undefined && price < offer.minBooking) return false;
    if (offer.airline && airlineCode && offer.airline !== airlineCode) return false;

    if (offer.bankCode) {
      if (UNIVERSAL_UPI_CODES.has(offer.bankCode)) return true;
      if (!userCards || userCards.length === 0) return false;
      return userCards.includes(offer.bankCode);
    }
    return true;
  });
}

function computeDiscount(offer: BankOffer, totalFare: number): number {
  let discount = 0;
  if (offer.type === "flat") {
    discount = offer.value;
  } else if (offer.type === "percentage") {
    discount = totalFare * offer.value;
    if (offer.maxCap && discount > offer.maxCap) discount = offer.maxCap;
  }
  return Math.max(0, Math.min(discount, totalFare));
}

export async function calculateBestEffectivePrice(
  baseFare: number,
  userCards?: string[],
  airlineCode?: string,
): Promise<FlightPriceDetails> {
  const totalFare = baseFare + CONVENIENCE_FEE;
  const applicable = await getOffersForUser(userCards, totalFare, airlineCode);

  let bestOffer: BankOffer | null = null;
  let maxDiscount = 0;
  for (const offer of applicable) {
    const discount = computeDiscount(offer, totalFare);
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

export async function getAllApplicableOffers(
  baseFare: number,
  userCards?: string[],
  airlineCode?: string,
): Promise<{ offer: BankOffer; discount: number }[]> {
  const totalFare = baseFare + CONVENIENCE_FEE;
  const applicable = await getOffersForUser(userCards, totalFare, airlineCode);
  return applicable
    .map((offer) => ({ offer, discount: computeDiscount(offer, totalFare) }))
    .filter((r) => r.discount > 0)
    .sort((a, b) => b.discount - a.discount);
}
