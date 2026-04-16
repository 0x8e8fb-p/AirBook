export interface BankOffer {
  id: string;
  name: string;
  type: 'percentage' | 'flat';
  value: number; // percentage (0.15) or flat amount (1000)
  maxCap?: number; // max discount amount for percentage
  minBooking: number;
}

export interface FlightPriceDetails {
  baseFare: number;
  convenienceFee: number;
  effectivePrice: number;
  appliedOffer: BankOffer | null;
}

const CONVENIENCE_FEE = 350; // Standard domestic convenience fee

export const INDIAN_BANK_OFFERS: BankOffer[] = [
  {
    id: 'HDFC_CC_DOM',
    name: '15% off up to ₹1500 on HDFC Credit Cards',
    type: 'percentage',
    value: 0.15,
    maxCap: 1500,
    minBooking: 5000,
  },
  {
    id: 'AXIS_DC_FLAT',
    name: 'Flat ₹1000 off on Axis Debit Cards',
    type: 'flat',
    value: 1000,
    minBooking: 4000,
  },
  {
    id: 'SBI_CC_10',
    name: '10% off up to ₹1200 on SBI Credit Cards',
    type: 'percentage',
    value: 0.10,
    maxCap: 1200,
    minBooking: 3000,
  }
];

export function calculateBestEffectivePrice(baseFare: number, userCards?: string[]): FlightPriceDetails {
  const totalFare = baseFare + CONVENIENCE_FEE;
  let bestOffer: BankOffer | null = null;
  let maxDiscount = 0;

  for (const offer of INDIAN_BANK_OFFERS) {
    if (totalFare >= offer.minBooking) {
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
  }

  return {
    baseFare,
    convenienceFee: CONVENIENCE_FEE,
    effectivePrice: totalFare - maxDiscount,
    appliedOffer: bestOffer,
  };
}
