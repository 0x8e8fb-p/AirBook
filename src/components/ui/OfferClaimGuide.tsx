"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Copy, CreditCard, ExternalLink, Globe2, Percent, ShieldCheck, Sparkles, Tag, Wallet } from "lucide-react";
import type { BankOffer } from "@/lib/flight/offerEngine";
import { formatPrice } from "@/lib/constants";
import { formatBankName, getOfferTravelerLabel, getOfferTravelerSupportText } from "@/lib/utils";

function OfferIcon({ category }: { category: BankOffer["category"] }) {
  switch (category) {
    case "bank_cc":
    case "bank_dc":
    case "bank_emi":
      return <CreditCard className="h-4 w-4" />;
    case "upi_wallet":
      return <Wallet className="h-4 w-4" />;
    case "cashback_portal":
      return <Percent className="h-4 w-4" />;
    case "airline_promo":
    case "ota_coupon":
      return <Tag className="h-4 w-4" />;
    case "international":
      return <Globe2 className="h-4 w-4" />;
    default:
      return <ShieldCheck className="h-4 w-4" />;
  }
}

function getOfferSteps(offer: BankOffer): string[] {
  const bankDisplayName = formatBankName(offer.bankCode);

  switch (offer.category) {
    case "bank_cc":
      return [
        "Open the final booking page for this fare.",
        `Choose your eligible ${bankDisplayName} credit card at payment.`,
        offer.promoCode ? `Apply promo code ${offer.promoCode} if the booking page asks for one.` : "Confirm that the card saving appears in the final fare summary.",
        "Review the updated payable amount before you complete payment.",
      ];
    case "bank_dc":
      return [
        "Proceed to the final payment step for this fare.",
        `Choose your eligible ${bankDisplayName} debit card at payment.`,
        offer.promoCode ? `Enter promo code ${offer.promoCode} if prompted.` : "Check that the debit-card saving appears in the total.",
        "Confirm the final amount before completing the booking.",
      ];
    case "bank_emi":
      return [
        "Continue to payment on the final booking page.",
        `Choose the eligible ${bankDisplayName} EMI option if it is available.`,
        offer.promoCode ? `Apply promo code ${offer.promoCode} if the EMI flow supports it.` : "Verify the savings on the first instalment or total payable amount.",
        "Check the tenure, fees, and final amount before you confirm.",
      ];
    case "upi_wallet":
      return [
        "Continue to the final payment step for this fare.",
        `Choose ${bankDisplayName} or the matching wallet / UPI option if it is shown.`,
        offer.promoCode ? `Apply promo code ${offer.promoCode} if the flow supports it.` : "Watch for the discount or cashback confirmation before you complete payment.",
        "Approve the payment on your device and keep the confirmation for reference.",
      ];
    case "cashback_portal":
      return [
        "Open the offer terms to confirm whether activation is required before booking.",
        "Complete the flight booking only after the cashback conditions are satisfied.",
        "Keep your booking confirmation and payment reference until the cashback settles.",
        "Review the credit timeline and exclusions in the official terms.",
      ];
    case "airline_promo":
    case "ota_coupon":
      return [
        "Proceed to the final booking step for this fare.",
        offer.promoCode ? `Apply promo code ${offer.promoCode} before payment.` : "Check that the promotional fare is reflected in the final summary.",
        "Review baggage, refund rules, and total amount before you pay.",
        "Complete the booking only after the discounted total matches expectations.",
      ];
    case "international":
      return [
        "Review the full fare rules and baggage terms for this international fare.",
        offer.promoCode ? `Apply promo code ${offer.promoCode} if it is supported.` : "Confirm that the long-haul fare is showing the expected offer in the summary.",
        "Check currency, flexibility, and refund terms before payment.",
        "Complete the booking once the total payable amount matches the offer terms.",
      ];
    default:
      return [
        "Open the final booking step for this fare.",
        offer.promoCode ? `Apply promo code ${offer.promoCode} if the booking flow includes one.` : "Review the fare summary for the expected saving.",
        "Confirm the updated payable amount before payment.",
        "Complete the booking only after the final total matches the offer terms.",
      ];
  }
}

const PRO_TIPS: Record<string, string[]> = {
  bank_cc: [
    "Card savings sometimes change with minimum booking value, so confirm the threshold before payment.",
    "If two cards qualify, compare the final payable amount instead of only the headline discount.",
  ],
  bank_dc: [
    "Debit-card discounts can have lower caps than credit-card offers, so check the effective total before paying.",
    "Keep enough balance ready before you reach payment to avoid losing the fare while re-trying.",
  ],
  bank_emi: [
    "EMI savings are worth comparing only after you check tenure, fees, and the final first-instalment amount.",
    "Shorter tenures often preserve more of the savings once charges are included.",
  ],
  upi_wallet: [
    "Wallet and UPI savings can credit after payment rather than reducing the upfront total, so review the terms carefully.",
    "Keep the payment confirmation until the cashback or reward settles.",
  ],
  cashback_portal: [
    "Cashback credits can take time to settle, so keep your confirmation email and payment reference.",
    "Review exclusions carefully before you rely on post-booking cashback for your final trip cost.",
  ],
  default: [
    "When two fares look similar, compare baggage, flexibility, and final payable amount together.",
    "If the saving does not appear in the final summary, stop before payment and review the offer terms again.",
  ],
};

function pickStableTip(offer: BankOffer): string {
  const tips = PRO_TIPS[offer.category] || PRO_TIPS.default;
  const seed = `${offer.id ?? offer.name ?? "offer"}`;
  const index = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % tips.length;
  return tips[index];
}

export function OfferClaimGuide({ offer, discount, isBestOffer = false, isOpenByDefault = false }: { offer: BankOffer, discount?: number, isBestOffer?: boolean, isOpenByDefault?: boolean }) {
  const [isOpen, setIsOpen] = useState(isOpenByDefault || isBestOffer);
  const [copied, setCopied] = useState(false);
  const steps = getOfferSteps(offer);

  const iconElement = useMemo(() => <OfferIcon category={offer.category} />, [offer.category]);
  const offerLabel = useMemo(() => getOfferTravelerLabel(offer), [offer]);
  const supportText = useMemo(() => getOfferTravelerSupportText(offer), [offer]);
  const proTip = useMemo(() => pickStableTip(offer), [offer]);

  const handleCopyCode = () => {
    if (offer.promoCode) {
      navigator.clipboard.writeText(offer.promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-base)] shadow-[var(--shadow-sm)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-[var(--bg-subtle)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-green)]/10 text-[var(--accent-green)]">
            {iconElement}
          </div>
          <div className="text-left flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm font-bold text-[var(--text-primary)]">
                {discount ? `Save ${formatPrice(discount)}` : "How to claim this saving"}
              </div>
              {isBestOffer && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-cta)] text-[var(--text-inverse)]">
                  Best Offer
                </span>
              )}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{offerLabel}</div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <ShieldCheck className="h-3 w-3" />
              Review the final payment summary before you complete booking
            </div>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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
            <div className="space-y-4 px-4 pb-4">
              <div className="rounded-[18px] border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                {supportText}
              </div>

              {/* Promo Code */}
              {offer.promoCode && (
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--accent-cta)]/20 bg-[var(--accent-cta)]/5 px-3 py-2">
                  <Tag className="h-3.5 w-3.5 text-[var(--accent-cta)]" />
                  <span className="text-xs text-[var(--text-secondary)]">Promo Code:</span>
                  <code className="font-mono font-bold text-sm text-[var(--accent-cta)] tracking-wider">{offer.promoCode}</code>
                  <button onClick={handleCopyCode} className="ml-auto rounded p-1 transition-colors hover:bg-[var(--bg-elevated)]">
                    {copied ? <Check className="h-3.5 w-3.5 text-[var(--accent-green)]" /> : <Copy className="h-3.5 w-3.5 text-[var(--text-muted)]" />}
                  </button>
                </div>
              )}

              {/* Steps */}
              <ol className="space-y-2.5">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[10px] font-bold text-[var(--text-muted)]">
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
                  <ExternalLink className="h-3 w-3" />
                  View official offer details
                </a>
              )}

              {/* Pro Tip */}
              <div className="rounded-[var(--radius-md)] bg-[var(--bg-subtle)] px-3 py-3">
                <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Before you pay
                </div>
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
