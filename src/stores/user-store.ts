import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  ownedCards: string[]; // Array of bank/card prefixes like 'HDFC', 'SBI', 'CRED_PAY'
  setCards: (cards: string[]) => void;
  toggleCard: (cardId: string) => void;
  clearCards: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ownedCards: [],
      setCards: (cards) => set({ ownedCards: cards }),
      toggleCard: (cardId) =>
        set((state) => ({
          ownedCards: state.ownedCards.includes(cardId)
            ? state.ownedCards.filter((c) => c !== cardId)
            : [...state.ownedCards, cardId],
        })),
      clearCards: () => set({ ownedCards: [] }),
    }),
    {
      name: 'thewingsscan-user-storage',
    }
  )
);