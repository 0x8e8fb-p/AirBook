import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { FlightResult } from "@/lib/types";

interface CheckoutState {
  selectedFlight: FlightResult | null;
  setSelectedFlight: (flight: FlightResult | null) => void;
  clear: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      selectedFlight: null,
      setSelectedFlight: (flight) => set({ selectedFlight: flight }),
      clear: () => set({ selectedFlight: null }),
    }),
    {
      name: "airbook-checkout-store",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
