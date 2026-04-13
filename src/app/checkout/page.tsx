"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, ShieldCheck, CreditCard, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { MagneticButton } from "@/components/ui/MagneticButton";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flightId = searchParams.get("id");

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
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.05)_0%,transparent_70%)] pointer-events-none" />

      <MagneticButton
        onClick={() => router.back()}
        className="absolute top-8 left-8 w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/40 text-white/60 hover:text-white transition-all z-10"
      >
        <ArrowLeft className="w-6 h-6" />
      </MagneticButton>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-10 text-center relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--color-accent-cyan)] via-[var(--color-accent-violet)] to-[var(--color-accent-cyan)] bg-[length:200%_auto] animate-[gradient_2s_linear_infinite]"
              initial={{ width: "0%" }}
              animate={{ width: step === 3 ? "100%" : `${(step + 1) * 25}%` }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>

          <div className="mb-10 mt-4 relative h-28 flex items-center justify-center">
            <div className="absolute inset-0 bg-[var(--color-accent-cyan)]/10 blur-3xl rounded-full scale-150" />
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="step0" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, opacity: 0, rotate: 45 }}>
                  <Plane className="w-16 h-16 text-[var(--color-accent-cyan)] animate-pulse" />
                </motion.div>
              )}
              {step === 1 && (
                <motion.div key="step1" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }}>
                  <ShieldCheck className="w-16 h-16 text-[var(--color-accent-amber)]" />
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="step2" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }}>
                  <CreditCard className="w-16 h-16 text-[var(--color-accent-violet)]" />
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="step3" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 className="w-20 h-20 text-[var(--color-accent-cyan)] drop-shadow-[0_0_20px_rgba(0,229,255,0.5)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <h2 className="text-2xl font-bold mb-4 font-display tracking-wide uppercase">
            {step === 0 && "Verifying Live Vectors..."}
            {step === 1 && "Securing Connection..."}
            {step === 2 && "Preparing Gateway..."}
            {step === 3 && "Booking Trajectory Confirmed!"}
          </h2>
          
          <p className="text-sm text-white/50 mb-8 font-mono leading-relaxed">
            {step < 3 
              ? "Establishing secure uplink. Please maintain connection with this terminal while we negotiate with orbital carriers."
              : "This is a controlled simulation environment. Real orbital API calls will route you directly to the airline gateway."}
          </p>

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <MagneticButton
                onClick={() => router.push("/")}
                className="w-full py-4 rounded-xl bg-[var(--color-accent-cyan)] hover:bg-cyan-400 text-black font-bold font-mono tracking-widest uppercase transition-colors"
              >
                Return to Radar
              </MagneticButton>
            </motion.div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Loader2 className="w-10 h-10 text-[var(--color-accent-cyan)]" />
          </motion.div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
