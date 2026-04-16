# NextAuth Email/Password & Fix Redirect URI

## 1. Goal
The user is experiencing two issues:
1. **Google OAuth 400: redirect_uri_mismatch**: This occurs because the `Authorized redirect URIs` configured in the Google Cloud Console do not match the URL NextAuth is sending (`http://localhost:3000/api/auth/callback/google`).
2. **Feature Request**: The user wants a standard username/password (Credentials) login system instead of *only* Google OAuth.

## 2. Components
1. **Prisma Schema Update**:
   - Add a `password` field (hashed) to the `User` model.
2. **NextAuth Configuration (`src/lib/auth.ts`)**:
   - Add `CredentialsProvider`.
   - Implement authorization logic using `bcryptjs` to compare passwords.
3. **Login Page (`src/app/login/page.tsx`)**:
   - Build a custom sign-in page with an email/password form, a "Sign in with Google" button, and a link to register.
   - Build a register page (`src/app/register/page.tsx`) to create new accounts.
4. **Dependencies**:
   - Install `bcryptjs` and `@types/bcryptjs`.

## 3. Execution Steps
1. Install `bcryptjs`.
2. Update `prisma/schema.prisma` and push the new `password` column to the Supabase database.
3. Create the `register` Server Action.
4. Update `src/lib/auth.ts` with `CredentialsProvider`.
5. Build the custom `/login` and `/register` UI pages.
6. Update the `Navbar.tsx` to point to `/login` instead of automatically triggering Google OAuth.
7. Provide instructions to the user on how to fix the Google Cloud Console redirect URI.