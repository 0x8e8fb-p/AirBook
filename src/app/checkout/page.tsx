"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Plane,
  ShieldCheck,
  TicketPercent,
  Wallet,
} from "lucide-react";

import { createBookingLinkAction, fetchCheckoutOffers, logBookingClick } from "@/app/actions/flightActions";
import { getUserWallet } from "@/app/actions/userActions";
import { Footer } from "@/components/layout/Footer";
import { AirlineLogo } from "@/components/ui/AirlineLogo";
import { OfferClaimGuide } from "@/components/ui/OfferClaimGuide";
import { PriceFreezeButton } from "@/components/ui/PriceFreezeButton";
import { getAirportDisplay } from "@/lib/airports";
import { formatDuration, formatPrice, formatTime, getAirlineCodeFromFlight, getAirlineLogoForFlight } from "@/lib/constants";
import type { BankOffer } from "@/lib/flight/offerEngine";
import type { FlightResult } from "@/lib/types";
import { formatPlatformName, isWalletMatch } from "@/lib/utils";
import { useCheckoutStore } from "@/stores/checkout-store";
import { useUserStore } from "@/stores/user-store";

const AVIASALES_AFFILIATE =
  "https://tp.media/r?marker=728497&trs=529383&p=4114&u=https%3A%2F%2Faviasales.com&campaign_id=100";

const PLATFORM_URLS: Record<string, string> = {
  travelpayouts_calendar: AVIASALES_AFFILIATE,
  travelpayouts_realtime: AVIASALES_AFFILIATE,
};

function resolveBookingUrl(flight: FlightResult): string {
  if (flight.deepLink || flight.bookingUrl) return flight.deepLink || flight.bookingUrl || AVIASALES_AFFILIATE;
  const platform = flight.appliedOffer?.platform?.toLowerCase();
  if (platform && PLATFORM_URLS[platform]) return PLATFORM_URLS[platform];
  const source = flight.source?.toLowerCase();
  if (source && PLATFORM_URLS[source]) return PLATFORM_URLS[source];
  return AVIASALES_AFFILIATE;
}

function CheckoutContent() {
  const router = useRouter();
  const { selectedFlight } = useCheckoutStore();
  const { ownedCards, setCards } = useUserStore();
  const { data: session } = useSession();

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(useCheckoutStore.persist.hasHydrated());
  const [applicableOffers, setApplicableOffers] = useState<Array<{ offer: BankOffer; discount: number }>>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = useCheckoutStore.persist.onFinishHydration(() => setIsHydrated(true));
    if (useCheckoutStore.persist.hasHydrated()) setIsHydrated(true);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isHydrated && !selectedFlight) {
      const timer = window.setTimeout(() => router.replace("/"), 1200);
      return () => window.clearTimeout(timer);
    }
  }, [isHydrated, router, selectedFlight]);

  useEffect(() => {
    if (session?.user) {
      getUserWallet().then((result) => {
        if (result.success && result.cards) {
          setCards(result.cards);
        }
      });
    }
  }, [session, setCards]);

  useEffect(() => {
    async function loadOffers() {
      if (!selectedFlight) return;

      setIsLoadingOffers(true);
      try {
        const baseFare = selectedFlight.basePrice || selectedFlight.price;
        const code = getAirlineCodeFromFlight(selectedFlight);
        const offers = await fetchCheckoutOffers(baseFare, code || undefined, ownedCards);
        setApplicableOffers(offers);
      } catch (error) {
        console.error("Failed to load offers:", error);
        setApplicableOffers([]);
      } finally {
        setIsLoadingOffers(false);
      }
    }

    if (isHydrated && selectedFlight) {
      loadOffers();
    }
  }, [isHydrated, ownedCards, selectedFlight]);

  const displayedOffers = showAllOffers ? applicableOffers : applicableOffers.slice(0, 2);

  const summary = useMemo(() => {
    if (!selectedFlight) return null;

    const airlineName = selectedFlight.airlineName || selectedFlight.airline;
    const logoUrl = getAirlineLogoForFlight(selectedFlight);
    const baseFare = selectedFlight.basePrice || selectedFlight.price;
    const convenienceFee = 350;
    const totalBeforeDiscount = baseFare + convenienceFee;
    const discountAmount = Math.max(0, totalBeforeDiscount - selectedFlight.price);

    return {
      airlineName,
      logoUrl,
      baseFare,
      convenienceFee,
      totalBeforeDiscount,
      discountAmount,
      walletMatch: isWalletMatch(selectedFlight, ownedCards),
    };
  }, [ownedCards, selectedFlight]);

  const handleProceed = async () => {
    if (!selectedFlight || !summary) return;

    setIsRedirecting(true);
    setBookingError(null);

    try {
      await logBookingClick(
        `${selectedFlight.origin}-${selectedFlight.destination}`,
        selectedFlight.airline,
        selectedFlight.price,
        summary.discountAmount,
      ).catch((error) => {
        console.error("Failed to log booking click:", error);
      });

      let bookingUrl = resolveBookingUrl(selectedFlight);
      if (selectedFlight.searchId && selectedFlight.bookingToken) {
        const generated = await createBookingLinkAction(selectedFlight.searchId, selectedFlight.bookingToken);
        if (generated?.url) bookingUrl = generated.url;
      }

      const opened = window.open(bookingUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        window.location.assign(bookingUrl);
      }
    } catch (error) {
      console.error("Booking redirect failed:", error);
      setBookingError("We could not open the booking partner right now. Please try again in a moment.");
    } finally {
      setIsRedirecting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="surface-card rounded-[28px] px-6 py-5 inline-flex items-center gap-3 text-sm text-[var(--text-secondary)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading your selected fare…
        </div>
      </div>
    );
  }

  if (!selectedFlight || !summary) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4">
        <div className="surface-card rounded-[32px] max-w-lg p-8 text-center">
          <h1 className="text-2xl font-semibold mb-3">No fare is ready for checkout</h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            We are sending you back to the homepage so you can start a fresh search and choose a fare again.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)]"
          >
            Go to homepage
          </button>
        </div>
      </div>
    );
  }

  const travelDateLabel = new Date(selectedFlight.departureTime).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="min-h-[100dvh] pb-20">
      <header className="sticky top-14 z-30 border-b border-[var(--border-default)] bg-[var(--bg-base)]/88 backdrop-blur-2xl">
        <div className="container-app py-4 flex items-start gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:bg-[var(--accent-primary-dim)] transition-colors"
            aria-label="Back to results"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] mb-2">Checkout</div>
            <h1 className="text-xl md:text-2xl font-semibold">Review your booking with full fare context</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-secondary)]">
              <span>{getAirportDisplay(selectedFlight.origin)}</span>
              <span className="text-[var(--text-muted)]">→</span>
              <span>{getAirportDisplay(selectedFlight.destination)}</span>
              <span className="text-[var(--text-muted)]">•</span>
              <span>{travelDateLabel}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container-app py-8 max-w-6xl mx-auto">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_380px]">
          <div className="space-y-6">
            <section className="surface-card rounded-[32px] overflow-hidden">
              <div className="p-5 md:p-6 border-b border-[var(--border-default)] bg-[var(--bg-subtle)] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <AirlineLogo
                    src={summary.logoUrl}
                    alt={summary.airlineName}
                    seed={summary.airlineName}
                    size={44}
                    className="bg-[var(--bg-base)]"
                  />
                  <div>
                    <div className="font-semibold text-sm">{summary.airlineName}</div>
                    <div className="text-xs text-[var(--text-muted)] font-mono mt-1">{selectedFlight.flightNumber || "Flight details pending"}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  {summary.walletMatch ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-green)]">
                      <Wallet className="w-3 h-3" />
                      Wallet matched
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {selectedFlight.stops === 0 ? "Direct" : `${selectedFlight.stops} stop${selectedFlight.stops > 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>

              <div className="p-5 md:p-6">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
                  <div>
                    <div className="text-3xl font-semibold font-mono-price">{formatTime(selectedFlight.departureTime)}</div>
                    <div className="font-semibold mt-1">{selectedFlight.origin}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">{getAirportDisplay(selectedFlight.origin)}</div>
                  </div>

                  <div className="flex flex-col items-center px-2 relative">
                    <Plane className="w-5 h-5 text-[var(--text-muted)] mb-2" />
                    <div className="w-full min-w-[88px] md:min-w-[160px] h-px border-t-2 border-dashed border-[var(--border-strong)] absolute top-1/2 -translate-y-1/2 -z-10" />
                    <span className="text-[10px] font-medium bg-[var(--bg-base)] px-2 text-[var(--text-muted)] uppercase tracking-[0.14em]">
                      {formatDuration(selectedFlight.durationMinutes)}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-semibold font-mono-price">{formatTime(selectedFlight.arrivalTime)}</div>
                    <div className="font-semibold mt-1">{selectedFlight.destination}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">{getAirportDisplay(selectedFlight.destination)}</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Briefcase,
                  title: "Baggage",
                  body: `Cabin ${selectedFlight.baggage.cabin.weight || 7}kg · Check-in ${selectedFlight.baggage.checked.weight || 15}kg`,
                },
                {
                  icon: ShieldCheck,
                  title: "Cancellation",
                  body: `${selectedFlight.refundable ? "Refundable" : "Partially refundable"} fare, subject to airline rules.`,
                },
                {
                  icon: CheckCircle2,
                  title: "Booking flow",
                  body: "You finish payment on the partner page after a secure handoff from this screen.",
                },
              ].map((item) => (
                <div key={item.title} className="surface-card rounded-[24px] p-5">
                  <item.icon className="w-5 h-5 text-[var(--accent-cta)] mb-3" />
                  <h2 className="text-sm font-semibold mb-2">{item.title}</h2>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.body}</p>
                </div>
              ))}
            </section>

            <section className="surface-card rounded-[32px] p-5 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <TicketPercent className="w-5 h-5 text-[var(--accent-green)]" />
                    How to save more on this booking
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-2xl leading-relaxed">
                    Review the best applicable savings paths before you open the booking partner.
                  </p>
                </div>
              </div>

              {isLoadingOffers ? (
                <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-5 text-sm text-[var(--text-secondary)] inline-flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading offer guidance for this fare…
                </div>
              ) : applicableOffers.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {displayedOffers.map((item, index) => (
                      <OfferClaimGuide key={item.offer.id || index} offer={item.offer} discount={item.discount} isBestOffer={index === 0} />
                    ))}
                  </div>

                  {applicableOffers.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => setShowAllOffers((current) => !current)}
                      className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--accent-cta)] hover:underline"
                    >
                      {showAllOffers ? (
                        <>
                          Show less
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Show {applicableOffers.length - 2} more offers
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  ) : null}
                </>
              ) : (
                <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-5 text-sm text-[var(--text-secondary)] leading-relaxed">
                  No extra booking-path offers were found for this fare beyond the current effective price shown in results.
                </div>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="surface-panel rounded-[32px] p-6">
              <div className="flex items-start justify-between gap-3 mb-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] mb-2">Fare summary</div>
                  <h2 className="text-xl font-semibold">Final payable amount</h2>
                </div>
                <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Partner checkout
                </span>
              </div>

              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Base fare</span>
                  <span className="font-mono-price font-medium">{formatPrice(summary.baseFare)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Taxes & fees</span>
                  <span className="font-mono-price font-medium">{formatPrice(summary.convenienceFee)}</span>
                </div>

                {selectedFlight.appliedOffer && summary.discountAmount > 0 ? (
                  <div className="flex justify-between items-start pt-2 border-t border-[var(--border-muted)]">
                    <div>
                      <span className="text-[var(--accent-green)] font-semibold flex items-center gap-1.5">
                        <TicketPercent className="w-4 h-4" />
                        Savings applied
                      </span>
                      <div className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                        {selectedFlight.appliedOffer.name}
                        <span className="text-[var(--accent-cta)] ml-1">
                          · {formatPlatformName(selectedFlight.appliedOffer.platform, selectedFlight.appliedOffer.bankCode, selectedFlight.appliedOffer.category)}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono-price font-bold text-[var(--accent-green)]">
                      -{formatPrice(summary.discountAmount)}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-base)] p-4 mb-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">You pay now</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1">Final effective fare at handoff</div>
                  </div>
                  <div className="text-3xl font-semibold font-mono-price text-[var(--accent-cta)]">
                    {formatPrice(selectedFlight.price)}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--accent-cta)]/18 bg-[var(--accent-primary-dim)] p-4 mb-5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--accent-cta)] shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold">Secure booking handoff</div>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)] mt-1.5">
                    By continuing, you move to the official booking page to complete payment and review final fare rules.
                  </p>
                </div>
              </div>

              {bookingError ? (
                <div className="rounded-[20px] border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10 px-4 py-3 text-sm text-[var(--accent-red)] mb-5">
                  {bookingError}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleProceed}
                disabled={isRedirecting}
                className="w-full rounded-full py-4 bg-[var(--accent-cta)] text-[var(--text-inverse)] font-semibold hover:opacity-90 disabled:opacity-70 transition-opacity flex items-center justify-center gap-2 text-[15px]"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening booking partner…
                  </>
                ) : (
                  <>
                    Proceed to booking
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-4">
                <PriceFreezeButton
                  origin={selectedFlight.origin}
                  destination={selectedFlight.destination}
                  departureDate={selectedFlight.departureTime}
                  airline={selectedFlight.airline}
                  flightNumber={selectedFlight.flightNumber}
                  lockedPrice={selectedFlight.price}
                  basePrice={summary.baseFare}
                />
              </div>

              <div className="mt-6 pt-5 border-t border-[var(--border-default)] space-y-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">What happens next</div>
                {[
                  "We open the booking partner in a new tab or current tab fallback.",
                  "You review final baggage, timing, and fare rules on the partner page.",
                  "If you are comparing options, use price freeze before leaving this screen.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-[12px] text-[var(--text-secondary)] leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--accent-green)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
