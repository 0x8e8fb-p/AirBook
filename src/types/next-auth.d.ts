import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      username?: string | null;
      mobile?: string | null;
      dob?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string | null;
    mobile?: string | null;
    dob?: string | null;
  }
}
