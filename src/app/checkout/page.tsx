"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCheckoutStore } from "@/stores/checkout-store";
import { ArrowLeft, Plane, ShieldCheck, Briefcase, ExternalLink, TicketPercent, CheckCircle2 } from "lucide-react";
import { formatPrice, formatDuration, formatTime, AIRLINES } from "@/lib/constants";
import { getAirportDisplay } from "@/lib/airports";
import { Footer } from "@/components/layout/Footer";

export default function CheckoutPage() {
  const router = useRouter();
  const { selectedFlight } = useCheckoutStore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!selectedFlight) {
      router.push("/");
    }
  }, [selectedFlight, router]);

  if (!selectedFlight) return null;

  const airlineInfo = AIRLINES[selectedFlight.airline];

  const handleProceed = () => {
    setIsRedirecting(true);
    // In a real app, this would be a deep link to the OTA or airline
    // For now, we simulate a redirect delay and open a generic booking page
    setTimeout(() => {
      let otaUrl = "https://www.google.com/travel/flights";
      if (selectedFlight.source === 'ixigo') otaUrl = "https://www.ixigo.com/flights";
      if (selectedFlight.source === 'makemytrip') otaUrl = "https://www.makemytrip.com/flights";
      if (selectedFlight.source === 'cleartrip') otaUrl = "https://www.cleartrip.com/flights";
      
      window.open(otaUrl, '_blank');
      setIsRedirecting(false);
    }, 1500);
  };

  const convenienceFee = 350;
  const baseFare = selectedFlight.basePrice || selectedFlight.price;
  const totalBeforeDiscount = baseFare + convenienceFee;
  const discountAmount = totalBeforeDiscount - selectedFlight.price;

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-subtle)] pb-20">
      {/* Header */}
      <header className="bg-[var(--bg-base)] border-b border-[var(--border-default)] sticky top-0 z-30">
        <div className="container-app py-4 flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="w-8 h-8 rounded-[var(--radius-sm)] border border-[var(--border-default)] flex items-center justify-center hover:bg-[var(--accent-primary-dim)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-semibold">Review your booking</h1>
        </div>
      </header>

      <main className="container-app py-8 max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Flight Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Flight Summary */}
            <div className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-xl)] overflow-hidden shadow-sm">
              <div className="p-5 border-b border-[var(--border-default)] bg-[var(--bg-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[var(--border-strong)] flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: airlineInfo?.color || "#3F3F46" }}>
                    {selectedFlight.airline}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{selectedFlight.airlineName}</div>
                    <div className="text-xs text-[var(--text-muted)] font-mono">{selectedFlight.flightNumber}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
                    {new Date(selectedFlight.departureTime).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-mono">
                    {formatDuration(selectedFlight.durationMinutes)}
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-center relative">
                  
                  {/* Origin */}
                  <div className="w-1/3">
                    <div className="text-2xl font-bold font-mono-price">{formatTime(selectedFlight.departureTime)}</div>
                    <div className="font-semibold mt-1">{selectedFlight.origin}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{getAirportDisplay(selectedFlight.origin)}</div>
                  </div>
                  
                  {/* Divider */}
                  <div className="flex-1 flex flex-col items-center px-4 relative">
                    <Plane className="w-5 h-5 text-[var(--text-muted)] mb-2" />
                    <div className="w-full h-px border-t-2 border-dashed border-[var(--border-strong)] absolute top-1/2 -translate-y-1/2 -z-10" />
                    <span className="text-[10px] font-medium bg-[var(--bg-base)] px-2 text-[var(--text-muted)]">
                      {selectedFlight.stops === 0 ? 'Direct' : `${selectedFlight.stops} Stop`}
                    </span>
                  </div>

                  {/* Destination */}
                  <div className="w-1/3 text-right">
                    <div className="text-2xl font-bold font-mono-price">{formatTime(selectedFlight.arrivalTime)}</div>
                    <div className="font-semibold mt-1">{selectedFlight.destination}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{getAirportDisplay(selectedFlight.destination)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Policies */}
            <div className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-6 shadow-sm">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-[var(--text-muted)]">Important Information</h3>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex gap-3">
                  <Briefcase className="w-5 h-5 text-[var(--text-secondary)] shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Baggage</h4>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Cabin: {selectedFlight.baggage.cabin.weight || 7}kg (1 piece)<br/>
                      Check-in: {selectedFlight.baggage.checked.weight || 15}kg (1 piece)
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-[var(--text-secondary)] shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Cancellation</h4>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {selectedFlight.refundable ? 'Fully Refundable' : 'Partially Refundable'}<br/>
                      Airline cancellation fee applies.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Price Breakdown */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-6 sticky top-24 shadow-sm">
              <h2 className="font-semibold text-lg mb-6">Fare Summary</h2>
              
              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Base Fare (1 Adult)</span>
                  <span className="font-mono-price font-medium">{formatPrice(baseFare)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Taxes & Fees</span>
                  <span className="font-mono-price font-medium">{formatPrice(convenienceFee)}</span>
                </div>
                
                {selectedFlight.appliedOffer && discountAmount > 0 && (
                  <div className="flex justify-between items-start pt-2 border-t border-[var(--border-muted)]">
                    <div>
                      <span className="text-[var(--accent-green)] font-semibold flex items-center gap-1.5">
                        <TicketPercent className="w-4 h-4" />
                        Bank Discount
                      </span>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-[180px] leading-tight">
                        {selectedFlight.appliedOffer.name}
                      </div>
                    </div>
                    <span className="font-mono-price font-bold text-[var(--accent-green)]">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--border-default)] mb-6">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="font-bold text-xl">Total Amount</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">Final payable amount</div>
                  </div>
                  <div className="text-3xl font-bold font-mono-price text-[var(--accent-cta)]">
                    {formatPrice(selectedFlight.price)}
                  </div>
                </div>
              </div>

              <div className="bg-[var(--accent-primary-dim)] rounded-[var(--radius-md)] p-4 mb-6 flex items-start gap-3 border border-[var(--accent-cta)]/20">
                <CheckCircle2 className="w-5 h-5 text-[var(--accent-cta)] shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  By clicking proceed, you will be redirected to the official booking page to complete your payment securely.
                </p>
              </div>

              <button 
                onClick={handleProceed}
                disabled={isRedirecting}
                className="w-full py-4 bg-[var(--accent-cta)] text-[var(--text-inverse)] font-bold rounded-[var(--radius-lg)] hover:opacity-90 disabled:opacity-70 transition-opacity flex items-center justify-center gap-2 text-[15px]"
              >
                {isRedirecting ? (
                  <>Redirecting securely...</>
                ) : (
                  <>Proceed to Booking <ExternalLink className="w-4 h-4 ml-1" /></>
                )}
              </button>
            </div>
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}