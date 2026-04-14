"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, ShieldCheck, CreditCard, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flightId = searchParams.get("id");

  const [step, setStep] = useState(0);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 2000);
    const timer2 = setTimeout(() => setStep(2), 4000);
    const timer3 = setTimeout(() => setStep(3), 6000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, []);

  // [New] Persistence: Log the booking once confirmed
  useEffect(() => {
    if (step === 3 && !logged && flightId) {
      const { logBooking } = require('./actions');
      logBooking(flightId, 0).then(() => setLogged(true));
    }
  }, [step, logged, flightId]);

  const steps = [
    { icon: Plane, label: "Verifying fare..." },
    { icon: ShieldCheck, label: "Securing connection..." },
    { icon: CreditCard, label: "Preparing gateway..." },
    { icon: CheckCircle2, label: "Booking confirmed!" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 relative">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 w-10 h-10 rounded-full flex items-center justify-center border border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-8 text-center">
          {/* Progress bar */}
          <div className="w-full h-px bg-[var(--border-default)] mb-8 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--text-secondary)]"
              initial={{ width: "0%" }}
              animate={{ width: step === 3 ? "100%" : `${(step + 1) * 25}%` }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </div>

          {/* Icon */}
          <div className="mb-6 h-16 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                {step === 0 && <Plane className="w-10 h-10 text-[var(--text-secondary)]" />}
                {step === 1 && <ShieldCheck className="w-10 h-10 text-[var(--text-secondary)]" />}
                {step === 2 && <CreditCard className="w-10 h-10 text-[var(--text-secondary)]" />}
                {step === 3 && <CheckCircle2 className="w-10 h-10 text-[var(--accent-green)]" />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Status */}
          <h2 className="text-lg font-semibold mb-2 tracking-tight">
            {steps[step].label}
          </h2>

          <p className="text-sm text-[var(--text-muted)] mb-8 leading-relaxed">
            {step < 3
              ? "Please wait while we connect to the airline. This usually takes a few seconds."
              : "This is a demo environment. In production, you'll be redirected to the airline's booking page."}
          </p>

          {/* Stepper dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i <= step ? "w-6 bg-[var(--text-secondary)]" : "w-2 bg-[var(--border-strong)]"
                }`}
              />
            ))}
          </div>

          {/* CTA */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 rounded-[var(--radius-md)] bg-[var(--accent-cta)] text-[var(--text-inverse)] font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Back to Home
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[var(--text-muted)] animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
