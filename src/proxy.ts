import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimit, getClientIp, rateLimitHeaders } from "@/lib/api/rateLimit";

const RATE_LIMITS: { pattern: RegExp; limit: number; windowSec: number; tag: string }[] = [
  { pattern: /^\/api\/search(\/|$)/, limit: 60, windowSec: 60, tag: "search" },
  { pattern: /^\/api\/calendar(\/|$)/, limit: 30, windowSec: 60, tag: "calendar" },
  { pattern: /^\/api\/airports(\/|$)/, limit: 120, windowSec: 60, tag: "airports" },
  { pattern: /^\/api\/prices(\/|$)/, limit: 60, windowSec: 60, tag: "prices" },
];

const PROTECTED_PAGES = [/^\/profile(\/|$)/, /^\/checkout(\/|$)/];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  for (const rule of RATE_LIMITS) {
    if (rule.pattern.test(pathname)) {
      const ip = getClientIp(req);
      const result = await rateLimit({
        key: `rl:${rule.tag}:${ip}`,
        limit: rule.limit,
        windowSec: rule.windowSec,
      });
      if (!result.allowed) {
        return NextResponse.json(
          { error: "Too many requests", retryAfterSec: rule.windowSec },
          { status: 429, headers: { ...rateLimitHeaders(result), "Retry-After": String(rule.windowSec) } },
        );
      }
      const res = NextResponse.next();
      for (const [k, v] of Object.entries(rateLimitHeaders(result))) res.headers.set(k, v);
      return res;
    }
  }

  if (PROTECTED_PAGES.some((p) => p.test(pathname))) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/search/:path*",
    "/api/calendar/:path*",
    "/api/airports/:path*",
    "/api/prices/:path*",
    "/profile/:path*",
    "/checkout/:path*",
  ],
};
