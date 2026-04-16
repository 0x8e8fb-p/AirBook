# User Card Profiles Implementation Plan

## 1. Goal
Currently, the offer engine applies the absolute best offer available in the entire Indian market to determine the "Effective Price". However, a user might not own the specific credit card (e.g., HDFC) required for that lowest price.
We need to allow users to select which cards/banks they own so the `calculateBestEffectivePrice` engine only calculates discounts based on their *actual* eligible cards.

## 2. Components
1. **User Profile Store (Zustand)**:
   - Create a global store `src/stores/user-store.ts` that persists to `localStorage`.
   - Store an array of owned Bank/Card IDs (e.g., `['HDFC_CC', 'SBI_CC', 'AMAZON_PAY']`).

2. **Offer Engine Update (`src/lib/flight/offerEngine.ts`)**:
   - Update `calculateBestEffectivePrice` to accept an optional array of `userCards`.
   - If `userCards` is provided and not empty, filter the `INDIAN_BANK_OFFERS` array to only include offers where the user owns the required card.
   - If `userCards` is empty, default to showing the absolute lowest price across *all* cards (to entice them to get the card, but perhaps flag it as "Potential Savings").

3. **UI Dashboard Integration (`src/app/search/page.tsx`)**:
   - Add a "My Wallet" or "My Cards" button in the Filters Sidebar or Header.
   - When clicked, open a Modal/Drawer containing checkboxes for all supported banks (HDFC, ICICI, SBI, Axis, etc.).
   - When the user selects their cards, instantly re-trigger or re-calculate the flight prices.

## 3. Execution Steps
1. Create `src/stores/user-store.ts`.
2. Refactor `offerEngine.ts` to support `userCards` filtering.
3. Update `flightActions.ts` and `live-flight-mapper.ts` to accept `userCards` from the frontend.
4. Build the `WalletModal` component and integrate it into the Search Page.