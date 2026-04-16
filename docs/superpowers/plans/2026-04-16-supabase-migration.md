# Supabase Migration Plan

## 1. Goal
The user already has a Supabase project and wants to use it as the primary cloud database for the application. We need to migrate the Prisma configuration from local `sqlite` to Supabase's `postgresql` connection pooling.

## 2. Components
1. **Prisma Schema (`prisma/schema.prisma`)**:
   - Change the `provider` from `"sqlite"` to `"postgresql"`.
   - Supabase uses PgBouncer for connection pooling, so we need to set up two connection strings in Prisma:
     - `url`: The Transaction connection pool URL (used for regular queries).
     - `directUrl`: The Direct connection URL (used for Prisma migrations).

2. **Environment Variables (`.env.local`)**:
   - Add the new `DATABASE_URL` and `DIRECT_URL` variables with placeholders for the user's Supabase credentials.

3. **Prisma Client Generation**:
   - Delete the old `prisma/dev.db` SQLite file (since we are moving to Postgres).
   - Re-run `npx prisma generate` to update the client for PostgreSQL.

## 3. Execution Steps
1. Update `prisma/schema.prisma`.
2. Update `.env.local` to include the Supabase DB connection templates.
3. Clean up the old SQLite files.
4. Provide the user with the exact steps to get their Supabase connection strings.