# Multi-Feature Implementation Plan

## 1. Profile Icon Navigation
- **File:** `src/components/layout/Navbar.tsx`
- **Action:** Wrap the user profile display in a `<Link href="/profile">` so it's clickable.

## 2. Full Card Offer Content
- **File:** `src/app/profile/page.tsx` (or wherever card offers are)
- **Action:** Remove `truncate` or `line-clamp` CSS classes from the card offer description.

## 3. Checkout Page Logos
- **File:** `src/app/checkout/page.tsx`
- **Action:** Import `getAirlineLogo` and use it to display the correct airline logo and name based on the query parameters or selected flight state.

## 4. Delete Account
- **File:** `src/app/actions/authActions.ts` and `src/app/profile/page.tsx`
- **Action:** Add `deleteAccount` server action. Add a "Danger Zone" section in the profile settings with a confirmation modal/button to delete the account and sign out.

## 5. Profile Picture Upload
- **File:** `src/app/profile/page.tsx` and `src/app/actions/authActions.ts`
- **Action:** Add a file input that compresses an image to a small Base64 string and saves it to the user's `image` field in the database.

## 6. Manual Alerts
- **File:** `src/app/profile/page.tsx` and `src/app/actions/alertActions.ts`
- **Action:** Add a form in the Alerts tab to manually create a `PriceAlert` (Origin, Destination, Max Price).

## 7. Signup Email Verification
- **File:** `src/app/register/page.tsx`, `src/app/actions/authActions.ts`, and create `src/app/verify-email/page.tsx`.
- **Action:** Prevent auto-login on register. Generate a verification token, send it via Resend, and require the user to click the link to set `emailVerified` before allowing login. Update NextAuth to reject unverified emails if credentials are used.