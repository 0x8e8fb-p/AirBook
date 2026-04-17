"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CreditCard, Smartphone, Tag, Globe, Gift, Percent, ExternalLink, Copy, Check } from "lucide-react";
import type { BankOffer } from "@/lib/flight/offerEngine";
import { formatPrice } from "@/lib/constants";
import { formatPlatformName } from "@/lib/utils";

function getOfferSteps(offer: BankOffer, formattedPlatform: string): { icon: typeof CreditCard; steps: string[] } {
  const cat = offer.category;
  if (cat === 'bank_cc') {
    return {
      icon: CreditCard,
      steps: [
        `Proceed to ${formattedPlatform} and select 'Credit Card' as payment method`,
        `Choose your ${offer.bankCode || ''} credit card`,
        offer.promoCode ? `Enter promo code: ${offer.promoCode}` : "Discount will be auto-applied at checkout",
        "Complete the payment — discount reflects in final amount",
        "Check your registered email/SMS for booking confirmation",
      ],
    };
  }
  if (cat === 'bank_dc') {
    return {
      icon: CreditCard,
      steps: [
        `Select '${formattedPlatform}' as your booking platform`,
        "Proceed to the checkout page and select 'Debit Card' as payment method",
        `Enter your ${offer.bankCode || ''} debit card details`,
        offer.promoCode ? `Apply promo code: ${offer.promoCode} before making payment` : "Discount amount will be auto-applied on the payment page",
        "Complete OTP verification on your registered mobile to finalize the booking",
      ],
    };
  }
  if (cat === 'bank_emi') {
    return {
      icon: CreditCard,
      steps: [
        "Select 'EMI' payment option at checkout",
        `Choose ${offer.bankCode || 'your bank'} from the list`,
        offer.promoCode ? `Apply code: ${offer.promoCode}` : "Select your preferred EMI tenure",
        "Discount is applied on the first EMI installment",
        "No extra processing fee on select tenures",
      ],
    };
  }
  if (cat === 'upi_wallet') {
    return {
      icon: Smartphone,
      steps: [
        `Select '${offer.bankCode || 'UPI/Wallet'}' at payment`,
        "Complete payment in your UPI/wallet app",
        "Cashback will be credited within 48-72 hours",
        "Check your wallet/bank statement for confirmation",
      ],
    };
  }
  if (cat === 'airline_promo') {
    return {
      icon: Tag,
      steps: [
        offer.platform === 'airline_direct' ? "Go to the airline website directly" : "Select the flight on the booking platform",
        offer.promoCode ? `Enter promo code: ${offer.promoCode} at booking` : "Discount is automatically applied",
        "Complete your booking — discount reflects before payment",
        "Save your PNR/booking reference for your records",
      ],
    };
  }
  if (cat === 'ota_coupon') {
    return {
      icon: Tag,
      steps: [
        `Visit ${offer.platform || 'the booking platform'} directly`,
        offer.promoCode ? `Apply coupon code: ${offer.promoCode}` : "Look for the offer banner on the flights page",
        "Select your flight and proceed to payment",
        "Verify discount is applied before completing payment",
      ],
    };
  }
  if (cat === 'cashback_portal') {
    return {
      icon: Percent,
      steps: [
        `Visit ${offer.url ? offer.name : 'the cashback portal'} first`,
        "Click through to the flight booking platform via their link",
        "Complete your booking normally",
        `Cashback (${offer.type === 'percentage' ? `${Math.round(offer.value * 100)}%` : `₹${offer.value}`}) credited to your portal account in 30-60 days`,
      ],
    };
  }
  if (cat === 'international') {
    return {
      icon: Globe,
      steps: [
        "Visit the airline website directly for best international fares",
        offer.promoCode ? `Use promo code: ${offer.promoCode}` : "Check the 'Offers' section on the airline site",
        "Select India as your country of residence if prompted",
        "Complete booking with any payment method",
      ],
    };
  }
  // seasonal / default
  return {
    icon: Gift,
    steps: [
      offer.promoCode ? `Apply code: ${offer.promoCode} at checkout` : "Offer is auto-applied during the sale period",
      "Valid on all payment methods unless specified",
      "Book now — sale offers are limited time only!",
    ],
  };
}

const PRO_TIPS = [
  "Book on Tuesdays/Wednesdays for typically lower fares",
  "Use incognito mode to avoid dynamic pricing markup",
  "Stack cashback portal savings with bank card offers for double savings",
  "Book 21-45 days before departure for the best domestic fares",
  "Compare airline direct website vs OTA — sometimes ₹200-500 difference",
];

export function OfferClaimGuide({ offer, discount, isBestOffer = false, isOpenByDefault = false }: { offer: BankOffer, discount?: number, isBestOffer?: boolean, isOpenByDefault?: boolean }) {
  const [isOpen, setIsOpen] = useState(isOpenByDefault || isBestOffer);
  const [copied, setCopied] = useState(false);
  const formattedPlatform = formatPlatformName(offer.platform);
  const { icon: Icon, steps } = getOfferSteps(offer, formattedPlatform);

  const handleCopyCode = () => {
    if (offer.promoCode) {
      navigator.clipboard.writeText(offer.promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const randomTip = PRO_TIPS[Math.floor(Math.random() * PRO_TIPS.length)];

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
              Apply on: {formattedPlatform}
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
                  View offer details
                </a>
              )}

              {/* Pro Tip */}
              <div className="bg-[var(--bg-subtle)] rounded-[var(--radius-md)] px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">💡 Pro Tip</div>
                <div className="text-xs text-[var(--text-secondary)]">{randomTip}</div>
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
