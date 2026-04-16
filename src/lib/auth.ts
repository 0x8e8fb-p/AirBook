import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        });

        console.log("[Auth] User found:", user?.email);

        if (!user || !user.password) {
          console.error("[Auth] No user found or no password hash");
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        console.log("[Auth] Password is valid:", isValid);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return user;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[Auth] signIn callback:", { userEmail: user?.email, accountProvider: account?.provider });
      
      // If logging in with Google, ensure the user exists or is created properly
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          });
          
          if (!existingUser) {
            console.log("[Auth] Creating new user from Google profile:", user.email);
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
                emailVerified: new Date(),
              }
            });
          }
        } catch (error) {
          console.error("[Auth] Error handling Google sign in:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: '/login',
    error: '/api/auth/error',
  }
};