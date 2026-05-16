"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
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
import { getOfferTravelerLabel, isBookableFlight, isWalletMatch } from "@/lib/utils";
import { useCheckoutStore } from "@/stores/checkout-store";
import { useUserStore } from "@/stores/user-store";

function resolveBookingUrl(flight: FlightResult): string | null {
  return flight.deepLink || flight.bookingUrl || null;
}

function formatBaggageSummary(flight: FlightResult): string {
  if (!flight.baggageConfirmed) {
    return "Baggage allowance is confirmed on the final booking page before payment.";
  }

  const cabinSummary = flight.baggage.cabin.included
    ? `Cabin ${flight.baggage.cabin.weight ? `${flight.baggage.cabin.weight}kg` : "included"}`
    : "Cabin baggage may be extra";
  const checkedSummary = flight.baggage.checked.included
    ? `Checked ${flight.baggage.checked.weight ? `${flight.baggage.checked.weight}kg` : "included"}`
    : "Checked baggage may be extra";

  return `${cabinSummary} · ${checkedSummary}`;
}

function formatCancellationSummary(flight: FlightResult): string {
  if (!flight.refundabilityConfirmed) {
    return "Refund terms are confirmed on the final booking page before payment.";
  }

  return `${flight.refundable ? "Refundable" : "Non-refundable"} fare, subject to airline rules.`;
}

function CheckoutContent() {
  const router = useRouter();
  const { selectedFlight, clear } = useCheckoutStore();
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
  const canProceedToBooking = useMemo(() => isBookableFlight(selectedFlight), [selectedFlight]);

  const summary = useMemo(() => {
    if (!selectedFlight) return null;

    const airlineName = selectedFlight.airlineName || selectedFlight.airline;
    const logoUrl = getAirlineLogoForFlight(selectedFlight);
    const baseFare = selectedFlight.basePrice || selectedFlight.price;
    const taxesAndFees = 350;
    const totalBeforeDiscount = baseFare + taxesAndFees;
    const discountAmount = Math.max(0, totalBeforeDiscount - selectedFlight.price);

    return {
      airlineName,
      logoUrl,
      baseFare,
      taxesAndFees,
      totalBeforeDiscount,
      discountAmount,
      walletMatch: isWalletMatch(selectedFlight, ownedCards),
      offerLabel: selectedFlight.appliedOffer ? getOfferTravelerLabel(selectedFlight.appliedOffer) : null,
    };
  }, [ownedCards, selectedFlight]);

  const handleProceed = async () => {
    if (!selectedFlight || !summary) return;

    if (!canProceedToBooking) {
      setBookingError("Live booking is unavailable for this fare. Return to results and choose a fare marked ready to book.");
      return;
    }

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
      if (!bookingUrl && selectedFlight.searchId && selectedFlight.bookingToken) {
        const generated = await createBookingLinkAction(selectedFlight.searchId, selectedFlight.bookingToken);
        if (generated?.url) bookingUrl = generated.url;
      }

      if (!bookingUrl) {
        setBookingError("We could not prepare a booking page for this fare. Return to results and refresh the live fare.");
        return;
      }

      const opened = window.open(bookingUrl, "_blank", "noopener,noreferrer");
      clear();
      if (!opened) {
        window.location.assign(bookingUrl);
      }
    } catch (error) {
      console.error("Booking redirect failed:", error);
      setBookingError("We could not open the booking page right now. Please try again in a moment.");
    } finally {
      setIsRedirecting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="surface-card inline-flex items-center gap-3 rounded-[28px] px-6 py-5 text-sm text-[var(--text-secondary)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your selected fare…
        </div>
      </div>
    );
  }

  if (!selectedFlight || !summary) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <div className="surface-card max-w-lg rounded-[32px] p-8 text-center">
          <h1 className="mb-3 text-2xl font-semibold">No fare is ready for checkout</h1>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            The checkout session has expired or no longer contains a fare. Start a fresh search to choose a route again.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--accent-cta)] px-4 py-3 text-sm font-semibold text-[var(--text-inverse)]"
          >
            Start a new search
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
      <div className="container-app py-6 md:py-8">
        <section className="surface-panel rounded-[34px] p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] transition-colors hover:bg-[var(--accent-primary-dim)]"
                aria-label="Back to results"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="min-w-0">
                <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Checkout</div>
                <h1 className="text-balance text-2xl font-semibold md:text-3xl">Review this fare before you leave AirBook</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-secondary)]">
                  <span>{getAirportDisplay(selectedFlight.origin)}</span>
                  <span className="text-[var(--text-muted)]">→</span>
                  <span>{getAirportDisplay(selectedFlight.destination)}</span>
                  <span className="text-[var(--text-muted)]">•</span>
                  <span>{travelDateLabel}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[22rem] lg:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Fare state", value: canProceedToBooking ? "Ready to book" : "Reference only" },
                { label: "Wallet match", value: summary.walletMatch ? "Matched" : "Not matched" },
                { label: "Stops", value: selectedFlight.stops === 0 ? "Direct" : `${selectedFlight.stops} stop${selectedFlight.stops > 1 ? "s" : ""}` },
                { label: "Payable fare", value: formatPrice(selectedFlight.price) },
              ].map((item) => (
                <div key={item.label} className="surface-card rounded-[22px] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.label}</div>
                  <div className="mt-2 text-lg font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <main className="mx-auto mt-6 grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.2fr)_380px]">
          <div className="space-y-6">
            {!canProceedToBooking ? (
              <section className="flex items-start gap-3 rounded-[28px] border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10 p-5">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-red)]" />
                <div>
                  <h2 className="text-sm font-semibold">Booking unavailable for this fare</h2>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                    This selection is still visible for route context only. Return to results and choose a fare marked ready to book when live handoff is available.
                  </p>
                </div>
              </section>
            ) : null}

            <section className="surface-card overflow-hidden rounded-[32px]">
              <div className="flex flex-col gap-4 border-b border-[var(--border-default)] bg-[var(--bg-subtle)] p-5 md:flex-row md:items-center md:justify-between md:p-6">
                <div className="flex items-center gap-3">
                  <AirlineLogo
                    src={summary.logoUrl}
                    alt={summary.airlineName}
                    seed={summary.airlineName}
                    size={46}
                    className="bg-[var(--bg-base)]"
                  />
                  <div>
                    <div className="text-sm font-semibold">{summary.airlineName}</div>
                    <div className="mt-1 text-xs font-mono text-[var(--text-muted)]">
                      {selectedFlight.flightNumber || "Flight details pending"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  {summary.walletMatch ? (
                    <span className="status-pill border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/10 text-[var(--accent-green)]">
                      <Wallet className="h-3 w-3" />
                      Wallet matched
                    </span>
                  ) : null}
                  <span className="status-pill border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-muted)]">
                    {selectedFlight.stops === 0 ? "Direct" : `${selectedFlight.stops} stop${selectedFlight.stops > 1 ? "s" : ""}`}
                  </span>
                  <span
                    className={`status-pill ${
                      canProceedToBooking
                        ? "border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/10 text-[var(--accent-green)]"
                        : "border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-muted)]"
                    }`}
                  >
                    {canProceedToBooking ? <ShieldCheck className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {canProceedToBooking ? "Ready to book" : "Reference only"}
                  </span>
                </div>
              </div>

              <div className="p-5 md:p-6">
                <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-6">
                  <div>
                    <div className="text-3xl font-semibold font-mono-price">{formatTime(selectedFlight.departureTime)}</div>
                    <div className="mt-1 font-semibold">{selectedFlight.origin}</div>
                    <div className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">{getAirportDisplay(selectedFlight.origin)}</div>
                  </div>

                  <div className="relative flex flex-col items-center px-2">
                    <Plane className="mb-2 h-5 w-5 text-[var(--text-muted)]" />
                    <div className="absolute top-1/2 -z-10 h-px w-full min-w-[88px] -translate-y-1/2 border-t-2 border-dashed border-[var(--border-strong)] md:min-w-[160px]" />
                    <span className="bg-[var(--bg-base)] px-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      {formatDuration(selectedFlight.durationMinutes)}
                    </span>
                  </div>

                  <div className="text-left md:text-right">
                    <div className="text-3xl font-semibold font-mono-price">{formatTime(selectedFlight.arrivalTime)}</div>
                    <div className="mt-1 font-semibold">{selectedFlight.destination}</div>
                    <div className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">{getAirportDisplay(selectedFlight.destination)}</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Briefcase,
                  title: "Baggage",
                  body: formatBaggageSummary(selectedFlight),
                },
                {
                  icon: ShieldCheck,
                  title: "Cancellation",
                  body: formatCancellationSummary(selectedFlight),
                },
                {
                  icon: CheckCircle2,
                  title: "Next step",
                  body: canProceedToBooking
                    ? "You will complete payment on the final booking page after a secure handoff from this screen."
                    : "This fare is not ready for checkout yet. Return to results and retry a live fare.",
                },
              ].map((item) => (
                <div key={item.title} className="surface-card rounded-[24px] p-5">
                  <item.icon className="mb-3 h-5 w-5 text-[var(--accent-cta)]" />
                  <h2 className="mb-2 text-sm font-semibold">{item.title}</h2>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{item.body}</p>
                </div>
              ))}
            </section>

            <section className="surface-card rounded-[32px] p-5 md:p-6">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <TicketPercent className="h-5 w-5 text-[var(--accent-green)]" />
                    Savings guidance before you pay
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                    Review the most relevant saving paths before you open the final booking page.
                  </p>
                </div>
              </div>

              {isLoadingOffers ? (
                <div className="inline-flex items-center gap-3 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-5 text-sm text-[var(--text-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading savings guidance for this fare…
                </div>
              ) : applicableOffers.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {displayedOffers.map((item, index) => (
                      <OfferClaimGuide
                        key={item.offer.id || index}
                        offer={item.offer}
                        discount={item.discount}
                        isBestOffer={index === 0}
                      />
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
                          <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          Show {applicableOffers.length - 2} more options
                          <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  ) : null}
                </>
              ) : (
                <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-5 text-sm leading-relaxed text-[var(--text-secondary)]">
                  No additional savings paths were returned for this fare beyond the payable price already shown here.
                </div>
              )}
            </section>
          </div>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="surface-panel rounded-[32px] p-6">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Fare summary</div>
                  <h2 className="text-xl font-semibold">Final payable amount</h2>
                </div>
                <span className="status-pill border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                  {canProceedToBooking ? "Ready to book" : "Reference only"}
                </span>
              </div>

              <div className="mb-6 space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Base fare</span>
                  <span className="font-medium font-mono-price">{formatPrice(summary.baseFare)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Taxes & fees</span>
                  <span className="font-medium font-mono-price">{formatPrice(summary.taxesAndFees)}</span>
                </div>

                {selectedFlight.appliedOffer && summary.discountAmount > 0 ? (
                  <div className="flex items-start justify-between border-t border-[var(--border-muted)] pt-2">
                    <div>
                      <span className="flex items-center gap-1.5 font-semibold text-[var(--accent-green)]">
                        <TicketPercent className="h-4 w-4" />
                        Savings applied
                      </span>
                      <div className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                        {summary.offerLabel || selectedFlight.appliedOffer.name}
                      </div>
                    </div>
                    <span className="font-bold font-mono-price text-[var(--accent-green)]">-{formatPrice(summary.discountAmount)}</span>
                  </div>
                ) : null}
              </div>

              <div className="mb-5 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-base)] p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">You pay now</div>
                    <div className="mt-1 text-[11px] text-[var(--text-muted)]">Visible fare before the final booking confirmation page</div>
                  </div>
                  <div className="text-3xl font-semibold font-mono-price text-[var(--accent-cta)]">
                    {formatPrice(selectedFlight.price)}
                  </div>
                </div>
              </div>

              <div
                className={`mb-5 flex items-start gap-3 rounded-[24px] p-4 ${
                  canProceedToBooking
                    ? "border border-[var(--accent-cta)]/18 bg-[var(--accent-primary-dim)]"
                    : "border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10"
                }`}
              >
                {canProceedToBooking ? (
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-cta)]" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-red)]" />
                )}
                <div>
                  <div className="text-sm font-semibold">
                    {canProceedToBooking ? "Secure booking handoff" : "Booking handoff unavailable"}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {canProceedToBooking
                      ? "Continue when you are satisfied with the fare, savings, and baggage context shown on this page."
                      : "This fare cannot continue to the final booking page yet. Return to results and retry a ready-to-book option."}
                  </p>
                </div>
              </div>

              {bookingError ? (
                <div className="mb-5 rounded-[20px] border border-[var(--accent-red)]/20 bg-[var(--accent-red)]/10 px-4 py-3 text-sm text-[var(--accent-red)]">
                  {bookingError}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleProceed}
                disabled={isRedirecting || !canProceedToBooking}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-cta)] py-4 text-[15px] font-semibold text-[var(--text-inverse)] transition-opacity hover:opacity-90 disabled:opacity-70"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opening booking page…
                  </>
                ) : !canProceedToBooking ? (
                  <>
                    Booking unavailable for this fare
                    <AlertCircle className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Proceed to booking
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </button>

              {canProceedToBooking ? (
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
              ) : null}

              <div className="mt-6 space-y-3 border-t border-[var(--border-default)] pt-5">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">What happens next</div>
                {(
                  canProceedToBooking
                    ? [
                        "We open the final booking page in a new tab when possible, with a same-tab fallback if needed.",
                        "You review baggage, timing, and final fare rules on that page before you pay.",
                        "If you are still comparing routes, use price freeze before you leave this screen.",
                      ]
                    : [
                        "Return to results and retry live availability for this route.",
                        "Save a price alert while you wait for a ready-to-book fare.",
                        "Review final baggage and refund terms only once checkout becomes available again.",
                      ]
                ).map((item) => (
                  <div key={item} className="flex items-start gap-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-green)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </main>
      </div>

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
