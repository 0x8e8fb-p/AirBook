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

const INDIAN_BANK_OFFERS: BankOffer[] = [
  // HDFC Bank
  { id: 'HDFC_CC_15', name: '15% off up to ₹1500 on HDFC Credit Cards', type: 'percentage', value: 0.15, maxCap: 1500, minBooking: 5000 },
  { id: 'HDFC_EMI_FLAT', name: 'Flat ₹2000 off on HDFC EMI', type: 'flat', value: 2000, minBooking: 10000 },
  { id: 'HDFC_DC_10', name: '10% off up to ₹1000 on HDFC Debit Cards', type: 'percentage', value: 0.10, maxCap: 1000, minBooking: 4000 },

  // SBI Card
  { id: 'SBI_CC_10', name: '10% off up to ₹1200 on SBI Credit Cards', type: 'percentage', value: 0.10, maxCap: 1200, minBooking: 3000 },
  { id: 'SBI_CC_12', name: '12% off up to ₹1500 on SBI Credit Cards (Wednesdays)', type: 'percentage', value: 0.12, maxCap: 1500, minBooking: 4000 },
  
  // ICICI Bank
  { id: 'ICICI_CC_15', name: '15% off up to ₹1500 on ICICI Credit Cards', type: 'percentage', value: 0.15, maxCap: 1500, minBooking: 5000 },
  { id: 'ICICI_NB_FLAT', name: 'Flat ₹500 off on ICICI Netbanking', type: 'flat', value: 500, minBooking: 3000 },
  { id: 'ICICI_AMAZON_PAY', name: '5% unlimited cashback on Amazon Pay ICICI', type: 'percentage', value: 0.05, maxCap: 99999, minBooking: 0 },

  // Axis Bank
  { id: 'AXIS_CC_12', name: '12% off up to ₹1200 on Axis Credit Cards', type: 'percentage', value: 0.12, maxCap: 1200, minBooking: 4000 },
  { id: 'AXIS_DC_FLAT', name: 'Flat ₹1000 off on Axis Debit Cards', type: 'flat', value: 1000, minBooking: 4000 },
  { id: 'AXIS_FLIPKART', name: '4% unlimited cashback on Flipkart Axis Card', type: 'percentage', value: 0.04, maxCap: 99999, minBooking: 0 },

  // Kotak Mahindra Bank
  { id: 'KOTAK_CC_10', name: '10% off up to ₹1000 on Kotak Credit Cards', type: 'percentage', value: 0.10, maxCap: 1000, minBooking: 3500 },
  { id: 'KOTAK_811_FLAT', name: 'Flat ₹811 off on Kotak 811', type: 'flat', value: 811, minBooking: 4000 },

  // Yes Bank
  { id: 'YES_CC_15', name: '15% off up to ₹1500 on Yes Bank Credit Cards', type: 'percentage', value: 0.15, maxCap: 1500, minBooking: 4500 },

  // RBL Bank
  { id: 'RBL_CC_FLAT', name: 'Flat ₹1200 off on RBL Credit Cards', type: 'flat', value: 1200, minBooking: 5000 },

  // Standard Chartered
  { id: 'SC_CC_20', name: '20% off up to ₹2000 on Standard Chartered Cards', type: 'percentage', value: 0.20, maxCap: 2000, minBooking: 6000 },

  // American Express
  { id: 'AMEX_CC_FLAT', name: 'Flat ₹1500 off on Amex Network Cards', type: 'flat', value: 1500, minBooking: 8000 },
  { id: 'AMEX_PLAT_15', name: '15% off up to ₹2500 on Amex Platinum', type: 'percentage', value: 0.15, maxCap: 2500, minBooking: 10000 },

  // IndusInd Bank
  { id: 'INDUS_CC_12', name: '12% off up to ₹1200 on IndusInd Cards', type: 'percentage', value: 0.12, maxCap: 1200, minBooking: 4000 },

  // IDFC First Bank
  { id: 'IDFC_CC_10', name: '10% off up to ₹1000 on IDFC Credit Cards', type: 'percentage', value: 0.10, maxCap: 1000, minBooking: 3000 },

  // AU Small Finance Bank
  { id: 'AU_CC_15', name: '15% off up to ₹1500 on AU Bank Cards', type: 'percentage', value: 0.15, maxCap: 1500, minBooking: 5000 },

  // HSBC Bank
  { id: 'HSBC_CC_FLAT', name: 'Flat ₹1000 off on HSBC Credit Cards', type: 'flat', value: 1000, minBooking: 5000 },

  // Bank of Baroda
  { id: 'BOB_CC_10', name: '10% off up to ₹1200 on BOB Credit Cards', type: 'percentage', value: 0.10, maxCap: 1200, minBooking: 4000 },

  // Federal Bank
  { id: 'FEDERAL_CC_15', name: '15% off up to ₹1500 on Federal Bank Cards', type: 'percentage', value: 0.15, maxCap: 1500, minBooking: 5000 },

  // UPI & Wallets (Paytm, PhonePe, CRED, MobiKwik, Cred Pay)
  { id: 'CRED_PAY_FLAT', name: 'Flat ₹500 off via CRED Pay', type: 'flat', value: 500, minBooking: 2500 },
  { id: 'PAYTM_WALLET_10', name: '10% cashback up to ₹500 on Paytm Wallet', type: 'percentage', value: 0.10, maxCap: 500, minBooking: 2000 },
  { id: 'PHONEPE_UPI_FLAT', name: 'Flat ₹300 off on PhonePe UPI', type: 'flat', value: 300, minBooking: 2000 },
  { id: 'MOBIKWIK_15', name: '15% SuperCash up to ₹1000 on MobiKwik', type: 'percentage', value: 0.15, maxCap: 1000, minBooking: 3000 },

  // Generic Airline Offers
  { id: 'INDIGO_6E_FLAT', name: 'Flat ₹400 off on IndiGo flights (Code: 6E400)', type: 'flat', value: 400, minBooking: 3500 },
  { id: 'AKASA_QP_10', name: '10% off up to ₹800 on Akasa Air (Code: QP10)', type: 'percentage', value: 0.10, maxCap: 800, minBooking: 3000 },
  { id: 'AIRINDIA_AI_500', name: 'Flat ₹500 off on Air India flights', type: 'flat', value: 500, minBooking: 4000 }
];

export function calculateBestEffectivePrice(baseFare: number, userCards?: string[]): FlightPriceDetails {
  const totalFare = baseFare + CONVENIENCE_FEE;
  let bestOffer: BankOffer | null = null;
  let maxDiscount = 0;

  // Filter offers based on userCards if provided
  let applicableOffers = INDIAN_BANK_OFFERS;
  
  if (userCards && userCards.length > 0) {
    applicableOffers = INDIAN_BANK_OFFERS.filter(offer => {
      const bankPrefix = offer.id.split('_')[0]; // e.g. HDFC_CC_15 -> HDFC
      const isCardOwned = userCards.includes(bankPrefix) || userCards.includes(offer.id);
      
      // Generic Airline Offers are always applicable regardless of cards
      const isGeneric = ['INDIGO', 'AKASA', 'AIRINDIA'].includes(bankPrefix);
      
      return isCardOwned || isGeneric;
    });
  }

  for (const offer of applicableOffers) {
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
