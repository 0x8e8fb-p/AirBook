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
        email: { label: "Email or Mobile", type: "text", placeholder: "Email or Mobile Number" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const identifier = credentials.email.toLowerCase();

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { mobile: identifier },
            ]
          }
        });

        console.log("[Auth] User found:", user?.email || user?.mobile);

        if (!user || !user.password) {
          console.error("[Auth] No user found or no password hash");
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        console.log("[Auth] Password is valid:", isValid);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email address before logging in");
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
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
        
        // Fetch fresh user data so session always has latest username/mobile/dob
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { username: true, mobile: true, dob: true }
          });
          if (dbUser) {
            (session.user as any).username = dbUser.username;
            (session.user as any).mobile = dbUser.mobile;
            (session.user as any).dob = dbUser.dob;
          }
        } catch (e) {
          console.error("Error fetching session user details:", e);
        }
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