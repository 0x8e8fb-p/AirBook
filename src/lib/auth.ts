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
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const identifier = credentials.email.toLowerCase();

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { mobile: identifier }],
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        if (user.email && !user.emailVerified) {
          throw new Error("Please verify your email address before logging in");
        }

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.sub = user.id;
      }
      if (token.sub && (user || trigger === "update" || !token.username)) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { username: true, mobile: true, dob: true },
          });
          if (dbUser) {
            token.username = dbUser.username;
            token.mobile = dbUser.mobile;
            token.dob = dbUser.dob?.toISOString() ?? null;
          }
        } catch {
          // ignore — token keeps prior values
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
        (session.user as any).username = token.username ?? null;
        (session.user as any).mobile = token.mobile ?? null;
        (session.user as any).dob = token.dob ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/api/auth/error",
  },
};
