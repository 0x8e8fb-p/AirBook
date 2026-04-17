"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CreditCard, Smartphone, Tag, Globe, Gift, Percent, ExternalLink, Copy, Check } from "lucide-react";
import type { BankOffer } from "@/lib/flight/offerEngine";
import { formatPrice } from "@/lib/constants";
import { formatPlatformName, formatBankName } from "@/lib/utils";

/**
 * Detailed, researched claim steps per offer category and bank.
 * Each bank has a specific partner OTA with a known claim flow.
 */
function getOfferSteps(offer: BankOffer, formattedPlatform: string): { icon: typeof CreditCard; steps: string[] } {
  const cat = offer.category;
  const bank = offer.bankCode?.toUpperCase();
  const bankDisplayName = formatBankName(offer.bankCode);

  if (cat === 'bank_cc') {
    // Bank-specific credit card claim flows
    if (bank === 'HDFC') {
      return {
        icon: CreditCard,
        steps: [
          `Go to ${formattedPlatform} (HDFC has a SmartBuy partnership with MakeMyTrip)`,
          "Search for your flight and proceed to checkout",
          "Select 'Credit Card' as payment method",
          "Enter your HDFC Credit Card details (Infinia, Regalia, Diners, MoneyBack, etc.)",
          offer.promoCode ? `Apply promo code: ${offer.promoCode} on the payment page` : "The discount is auto-applied when HDFC Credit Card BIN is detected",
          "Complete OTP verification on your registered mobile number",
          "Discount reflects in the final payment amount before deduction",
        ],
      };
    }
    if (bank === 'SBI') {
      return {
        icon: CreditCard,
        steps: [
          `Go to ${formattedPlatform} (SBI Card has an exclusive partnership with Yatra)`,
          "Search for your flight and add it to cart",
          "Select 'Credit Card' as payment method at checkout",
          "Enter your SBI Credit Card details (SimplyCLICK, Prime, Elite, etc.)",
          offer.promoCode ? `Enter promo code: ${offer.promoCode}` : "Discount auto-applies on SBI card BIN detection",
          "Complete 3D Secure OTP verification",
          "Check SMS for booking confirmation with discounted amount",
        ],
      };
    }
    if (bank === 'ICICI') {
      return {
        icon: CreditCard,
        steps: [
          `Visit ${formattedPlatform} (ICICI partners with MakeMyTrip & Cleartrip)`,
          "Search and select your preferred flight",
          "At checkout, select 'Credit Card' payment",
          "Enter your ICICI Credit Card details (Amazon Pay, Coral, Rubyx, Sapphiro, etc.)",
          offer.promoCode ? `Apply code: ${offer.promoCode} before payment` : "Discount auto-applied on ICICI card detection",
          "Complete OTP authentication via iMobile Pay / SMS",
          "Discount is deducted before final charge",
        ],
      };
    }
    if (bank === 'AXIS') {
      return {
        icon: CreditCard,
        steps: [
          `Visit ${formattedPlatform} (Axis Bank has tie-ups with MakeMyTrip & Flipkart co-brand)`,
          "Search for your flights and select your preferred option",
          "Proceed to checkout → Select 'Credit Card' as payment method",
          "Enter your Axis Bank Credit Card details (Flipkart, Vistara, MY Zone, ACE, Magnus, etc.)",
          offer.promoCode ? `Apply coupon: ${offer.promoCode}` : "Offer auto-applies on Axis card BIN recognition",
          "Verify via OTP sent to your registered mobile",
          "Final amount shown will include the discount",
        ],
      };
    }
    if (bank === 'AMEX') {
      return {
        icon: CreditCard,
        steps: [
          `Go to ${formattedPlatform} (Amex has a partnership with Cleartrip)`,
          "Search flights and proceed to payment",
          "Select 'Credit Card' and enter your American Express card details",
          "Amex cards (Platinum, Gold, MRCC) are detected automatically",
          offer.promoCode ? `Enter promo: ${offer.promoCode}` : "Discount auto-applies for eligible Amex cards",
          "Complete Amex SafeKey verification",
          "You'll see the discounted amount on the payment confirmation",
        ],
      };
    }
    if (bank === 'SC') {
      return {
        icon: CreditCard,
        steps: [
          `Visit ${formattedPlatform} (Standard Chartered partners with MakeMyTrip)`,
          "Search for flights and select your itinerary",
          "Choose 'Credit Card' at payment",
          "Enter your Standard Chartered card (EaseMyTrip, Ultimate, Platinum Rewards, etc.)",
          offer.promoCode ? `Apply code: ${offer.promoCode}` : "Offer auto-detects SC card BIN",
          "Complete 3D Secure authentication",
          "Discount is applied before final debit",
        ],
      };
    }
    // Generic credit card flow for other banks
    return {
      icon: CreditCard,
      steps: [
        `Go to ${formattedPlatform} and search for your flight`,
        "Proceed to the checkout/payment page",
        `Select 'Credit Card' as your payment method`,
        `Enter your ${bankDisplayName} Credit Card details`,
        offer.promoCode ? `Apply promo code: ${offer.promoCode} before making payment` : "Discount will be auto-applied when your card is detected",
        "Complete OTP verification on your registered mobile number",
        "Verify the discounted amount before completing payment",
      ],
    };
  }

  if (cat === 'bank_dc') {
    // Bank-specific debit card flows
    if (bank === 'AXIS') {
      return {
        icon: CreditCard,
        steps: [
          `Visit ${formattedPlatform} (Axis Bank Debit Card offers work on MakeMyTrip & Cleartrip)`,
          "Search for your desired flight and proceed to booking",
          "On the payment page, select 'Debit Card' as payment method",
          "Enter your Axis Bank Debit Card number, expiry, and CVV",
          offer.promoCode ? `Apply promo code: ${offer.promoCode} in the coupon field` : "Flat ₹1,000 auto-applies when Axis Debit Card BIN (starting with 4xxx/5xxx) is detected",
          "Complete OTP authentication via SMS sent to your registered mobile",
          "The offer is valid for bookings above the minimum amount — verify discount on confirmation screen",
          "💡 Tip: Ensure your debit card has sufficient balance and international transactions are enabled if booking on Cleartrip",
        ],
      };
    }
    if (bank === 'HDFC') {
      return {
        icon: CreditCard,
        steps: [
          `Go to ${formattedPlatform} (HDFC Debit Card works on MakeMyTrip via SmartBuy)`,
          "Search for flights and select your preferred option",
          "At payment, select 'Debit Card' as payment method",
          "Enter your HDFC Bank Debit Card details",
          offer.promoCode ? `Enter code: ${offer.promoCode}` : "Discount auto-applies on HDFC Debit Card detection",
          "Complete OTP verification from your registered mobile",
          "Ensure minimum booking value is met for discount eligibility",
        ],
      };
    }
    // Generic debit card flow
    return {
      icon: CreditCard,
      steps: [
        `Go to ${formattedPlatform} — search for your flight`,
        "Proceed to checkout and select 'Debit Card' as payment method",
        `Enter your ${bankDisplayName} Debit Card number, expiry date, and CVV`,
        offer.promoCode ? `Apply promo code: ${offer.promoCode} in the coupon/promo field` : "Discount auto-applies when your debit card BIN is recognized",
        "Complete OTP authorization sent to your registered mobile number",
        "Verify the discounted total before confirming payment",
      ],
    };
  }

  if (cat === 'bank_emi') {
    return {
      icon: CreditCard,
      steps: [
        `Visit ${formattedPlatform} and search for your flight`,
        "Proceed to checkout and select 'EMI' as your payment option",
        `Choose ${bankDisplayName} from the list of EMI providers`,
        "Select your preferred EMI tenure (3/6/9/12 months)",
        offer.promoCode ? `Enter promo code: ${offer.promoCode}` : "Discount is applied on the first EMI installment",
        "Complete card verification and OTP authentication",
        "No extra processing fee on select tenures — check terms on the payment page",
      ],
    };
  }

  if (cat === 'upi_wallet') {
    const walletName = formatBankName(offer.bankCode);
    return {
      icon: Smartphone,
      steps: [
        `Open ${formattedPlatform} or search on ${formattedPlatform}`,
        `At payment, select '${walletName}' / 'UPI' as your payment method`,
        offer.promoCode ? `Apply coupon: ${offer.promoCode}` : "Cashback offer auto-activates on payment",
        `Complete payment through ${walletName} (approve on your phone)`,
        "Cashback/discount will be credited to your wallet within 48-72 hours",
        "Check your wallet transaction history for confirmation",
      ],
    };
  }

  if (cat === 'airline_promo') {
    return {
      icon: Tag,
      steps: [
        offer.platform === 'airline_direct'
          ? "Go to the airline's official website directly for best promo prices"
          : `Search on ${formattedPlatform}`,
        "Select your preferred flight",
        offer.promoCode
          ? `Enter promo code: ${offer.promoCode} in the 'Have a promo code?' section during booking`
          : "The promotional fare is auto-applied — no code needed",
        "Complete your booking — discount reflects in the fare breakdown before payment",
        "Save your PNR / booking reference for future check-in",
      ],
    };
  }

  if (cat === 'ota_coupon') {
    return {
      icon: Tag,
      steps: [
        `Visit ${formattedPlatform} directly (the coupon is platform-specific)`,
        "Search for your flight route and travel dates",
        offer.promoCode
          ? `Apply coupon code: ${offer.promoCode} in the promo/coupon field at checkout`
          : "Look for the offer banner on the flights listing page — it auto-applies",
        "Select your preferred flight and proceed to payment",
        "Verify the discount is reflected in the fare summary before completing payment",
      ],
    };
  }

  if (cat === 'cashback_portal') {
    return {
      icon: Percent,
      steps: [
        `First, visit ${offer.url ? offer.name : 'the cashback portal'} (do NOT go directly to the OTA)`,
        "Log in or sign up on the cashback portal",
        "Search for 'flights' or 'travel' and click through to the booking platform via their referral link",
        "Complete your flight booking normally on the OTA",
        `Cashback (${offer.type === 'percentage' ? `${Math.round(offer.value * 100)}%` : `₹${offer.value}`}) will be tracked and credited to your portal account in 30-60 days`,
        "💡 Stack this with bank card offers for double savings!",
      ],
    };
  }

  if (cat === 'international') {
    return {
      icon: Globe,
      steps: [
        "Visit the airline's official website for best international fares",
        offer.promoCode ? `Use promo code: ${offer.promoCode} during booking` : "Check the 'Offers' or 'Promotions' section on the airline site",
        "Select 'India' as your country of residence when prompted",
        "Complete booking with any payment method — some offers stack with bank card discounts",
        "International fares are dynamic — book early for best prices",
      ],
    };
  }

  // seasonal / default
  return {
    icon: Gift,
    steps: [
      offer.promoCode ? `Apply code: ${offer.promoCode} at checkout on any supported platform` : "This sale offer auto-applies during the promotional period",
      "Valid on all payment methods unless otherwise specified",
      "Book now — seasonal sale offers are limited-time and first-come-first-served!",
      "💡 Combine with bank card offers for maximum discount",
    ],
  };
}

const PRO_TIPS: Record<string, string[]> = {
  bank_cc: [
    "HDFC Infinia & Diners Black give 10x rewards on travel — use SmartBuy for extra savings",
    "Stack your bank card offer with a cashback portal (CashKaro/GoPaisa) for double savings",
    "Book on Tuesdays/Wednesdays — airlines release cheapest inventory mid-week",
    "Some banks offer additional lounge access with credit cards — check before flying",
    "Use incognito mode to avoid flight price cookies inflating fares",
  ],
  bank_dc: [
    "Debit card offers typically have lower max caps than credit cards — check T&C",
    "Ensure your debit card has sufficient balance before booking",
    "Some debit card offers require registration on the bank portal beforehand",
    "Book 21-45 days before departure for the best domestic fare + bank discount combo",
  ],
  upi_wallet: [
    "UPI cashback usually credits in 48-72 hours — check wallet history",
    "CRED coins can be redeemed after payment for additional cashback",
    "Paytm First subscribers get priority cashback and higher limits",
  ],
  ota_coupon: [
    "OTA coupons often have usage limits — book early before they exhaust",
    "Compare the same flight across MakeMyTrip, Cleartrip, and Ixigo — prices vary ₹200-500",
    "Some OTA coupons are valid only on app bookings, not web",
  ],
  default: [
    "Book on Tuesdays/Wednesdays for typically lower fares",
    "Use incognito mode to avoid dynamic pricing markup",
    "Stack cashback portal savings with bank card offers for double savings",
    "Book 21-45 days before departure for the best domestic fares",
    "Compare airline direct website vs OTA — sometimes ₹200-500 difference",
  ],
};

function getProTip(category: string): string {
  const tips = PRO_TIPS[category] || PRO_TIPS.default;
  return tips[Math.floor(Math.random() * tips.length)];
}

export function OfferClaimGuide({ offer, discount, isBestOffer = false, isOpenByDefault = false }: { offer: BankOffer, discount?: number, isBestOffer?: boolean, isOpenByDefault?: boolean }) {
  const [isOpen, setIsOpen] = useState(isOpenByDefault || isBestOffer);
  const [copied, setCopied] = useState(false);
  const formattedPlatform = formatPlatformName(offer.platform, offer.bankCode, offer.category);
  const { icon: Icon, steps } = getOfferSteps(offer, formattedPlatform);

  const handleCopyCode = () => {
    if (offer.promoCode) {
      navigator.clipboard.writeText(offer.promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const proTip = getProTip(offer.category);

  return (
    <div className="border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden bg-[var(--bg-base)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-subtle)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-green)]/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[var(--accent-green)]" />
          </div>
          <div className="text-left flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm font-bold text-[var(--text-primary)]">
                {discount ? `Save ${formatPrice(discount)}` : 'How to Claim This Discount'}
              </div>
              {isBestOffer && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-cta)] text-[var(--text-inverse)]">
                  Best Offer
                </span>
              )}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{offer.name}</div>
            <div className="text-[11px] font-medium text-[var(--accent-cta)] mt-1 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Claim on: {formattedPlatform}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Promo Code */}
              {offer.promoCode && (
                <div className="flex items-center gap-2 bg-[var(--accent-cta)]/5 border border-[var(--accent-cta)]/20 rounded-[var(--radius-md)] px-3 py-2">
                  <Tag className="w-3.5 h-3.5 text-[var(--accent-cta)]" />
                  <span className="text-xs text-[var(--text-secondary)]">Promo Code:</span>
                  <code className="font-mono font-bold text-sm text-[var(--accent-cta)] tracking-wider">{offer.promoCode}</code>
                  <button onClick={handleCopyCode} className="ml-auto p-1 hover:bg-[var(--bg-elevated)] rounded transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5 text-[var(--accent-green)]" /> : <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                  </button>
                </div>
              )}

              {/* Steps */}
              <ol className="space-y-2.5">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)]">
                      {i + 1}
                    </span>
                    <span className="text-sm text-[var(--text-secondary)] leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>

              {/* External link */}
              {offer.url && (
                <a
                  href={offer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent-cta)] hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  View official offer details
                </a>
              )}

              {/* Pro Tip */}
              <div className="bg-[var(--bg-subtle)] rounded-[var(--radius-md)] px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">💡 Pro Tip</div>
                <div className="text-xs text-[var(--text-secondary)]">{proTip}</div>
              </div>

              {/* Validity */}
              <div className="text-[10px] text-[var(--text-muted)]">
                Valid until {new Date(offer.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {offer.minBooking > 0 && ` • Min. booking ₹${offer.minBooking.toLocaleString('en-IN')}`}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
