import { create } from 'zustand';
import { FlightResult } from '@/lib/types';

interface CheckoutState {
  selectedFlight: FlightResult | null;
  setSelectedFlight: (flight: FlightResult | null) => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  selectedFlight: null,
  setSelectedFlight: (flight) => set({ selectedFlight: flight }),
}));