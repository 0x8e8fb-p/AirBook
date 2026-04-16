# Password Reset Implementation & Google Sign-In Debug

## 1. Goal
1. Fix Google Sign-In so it successfully logs in or creates new accounts.
2. Implement a proper password reset flow in the Profile Settings, sending an email via Resend, leading to a new password form.

## 2. Components
1. **Google OAuth Issue**:
   - The user gets redirected to `/login` without being logged in. We've added the `error` param display on `/login` and server-side logs to see exactly *why* NextAuth is failing the Google OAuth flow.
2. **Password Reset Token**:
   - We will use the `VerificationToken` table in Prisma.
3. **Resend Email Integration**:
   - Use `resend` package to send an email with `http://localhost:3000/reset-password?token=XYZ`.
4. **Reset Password UI**:
   - Add a button in Profile Settings -> Account Details: "Reset Password via Email".
   - Create `/reset-password` page that validates the token and shows a "New Password" & "Confirm Password" form.
   - Update `authActions.ts` with `sendResetEmail` and `updatePassword` server actions.

## 3. Execution Steps
1. Install `resend` package.
2. Create `sendResetEmail` action.
3. Add Reset Password button to `src/app/profile/page.tsx`.
4. Create `src/app/reset-password/page.tsx`.
5. Update `authActions.ts` with `updatePassword` logic.