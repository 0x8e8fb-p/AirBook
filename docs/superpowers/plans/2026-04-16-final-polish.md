# Final UI/UX Polish Implementation Plan

## 1. Goal
Audit the application from end-to-end to ensure the user experience is flawless. This includes verifying mobile responsiveness, fixing z-index issues (e.g., overlapping modals or dropdowns), polishing the homepage search form interactions, and ensuring loading states are smooth and consistent.

## 2. Components
1. **Search Form (Homepage & Results Header)**:
   - Ensure the date picker is easily tappable on mobile devices.
   - Verify the passenger count popover doesn't overflow the screen or get hidden behind other elements.
   - Make sure the "Swap Origin/Destination" button has a satisfying hover/click state.

2. **Loading States (Skeletons)**:
   - Replace the generic "Searching..." text on `search/page.tsx` with a proper Skeleton Loader for flight cards to avoid layout shift.

3. **Modals & Overlays**:
   - Check the `WalletModal` z-index to ensure it sits above the `Navbar` when opened.
   - Ensure the mobile navigation menu works correctly and closes when a link is clicked.

4. **Empty States & Errors**:
   - Ensure the "No flights found" state looks good on all screen sizes.
   - Polish the error boundaries if a search completely fails.

## 3. Execution Steps
1. Update `src/app/search/page.tsx` to include a `FlightCardSkeleton` component.
2. Verify and adjust `z-index` classes in `src/components/layout/Navbar.tsx` and `WalletModal` (inside `search/page.tsx`).
3. Polish the `SearchForm` component (if extracted) or the inline search headers for mobile padding.