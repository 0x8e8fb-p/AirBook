# User Dashboard / Profile Implementation Plan

## 1. Goal
Create a `/profile` page for authenticated users to view their account details, manage their saved credit cards (wallet), and see the flight routes they are actively tracking.

## 2. Components
1. **Profile Layout**:
   - Split into a Sidebar/Tabs navigation and a Main Content area.
   - Tabs: "Account", "My Wallet", "Tracked Flights".

2. **"Account" Tab**:
   - Display User Avatar, Name, and Email (fetched from NextAuth session).
   - Basic sign out button.

3. **"My Wallet" Tab**:
   - Re-use the existing wallet logic from `WalletModal`, but rendered inline.
   - Allows users to check/uncheck their owned cards and hit "Save Wallet".
   - Shows a summary of potential savings they unlocked.

4. **"Tracked Flights" Tab**:
   - A list of routes the user is interested in tracking.
   - *Database update*: We need a `TrackedRoute` model linking a `User` to a specific origin/destination/date, so we can display their personal tracked prices here.
   - For now, we will mock this or show a "Coming soon: Manage your active price drop alerts here."

## 3. Execution Steps
1. Create `src/app/profile/page.tsx` and ensure it is protected (redirects to home or login if not authenticated).
2. Build the Profile UI with the Shadcn/Tailwind aesthetic.
3. Wire up the "My Wallet" tab to use the `syncWallet` and `getUserWallet` Server Actions.
4. Update `schema.prisma` if we want to actually implement `TrackedRoute` linking to users.