"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, ShieldCheck, CreditCard, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flightId = searchParams.get("flightId");

  const [step, setStep] = useState(0);

  useEffect(() => {
    // Simulate booking/redirection gateway steps
    const timer1 = setTimeout(() => setStep(1), 2000); // Verifying fare
    const timer2 = setTimeout(() => setStep(2), 4000); // Securing connection
    const timer3 = setTimeout(() => setStep(3), 6000); // Ready/Redirect

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-4">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => router.back()}
        className="absolute top-6 left-6 p-2 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.button>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-md w-full p-8 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--bg-elevated)]">
          <motion.div
            className="h-full gradient-primary"
            initial={{ width: "0%" }}
            animate={{ width: step === 3 ? "100%" : `${(step + 1) * 25}%` }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </div>

        <div className="mb-8 relative h-24 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }}>
                <Plane className="w-12 h-12 text-[var(--color-primary)] animate-pulse" />
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="step1" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }}>
                <ShieldCheck className="w-12 h-12 text-[var(--color-savings)]" />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }}>
                <CreditCard className="w-12 h-12 text-blue-400" />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 className="w-16 h-16 text-[var(--color-savings-light)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <h2 className="text-2xl font-bold mb-3 tracking-tight">
          {step === 0 && "Verifying Live Fares..."}
          {step === 1 && "Securing Connection..."}
          {step === 2 && "Preparing Checkout..."}
          {step === 3 && "Booking Confirmed!"}
        </h2>
        
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          {step < 3 
            ? "Please do not refresh or close this screen. We are communicating with the airline systems."
            : "This is a demo environment. Real flight APIs will route you directly to the airline gateway."}
        </p>

        {step === 3 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className="btn-primary w-full"
          >
            Return to Search
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Loader2 className="w-8 h-8 text-[var(--color-primary)]" />
          </motion.div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
