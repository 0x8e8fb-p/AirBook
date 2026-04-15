import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";

import { SmoothScrollProvider } from "@/lib/lenis";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeFab } from "@/components/theme/ThemeFab";
import { createClient } from "@/utils/supabase/server";
import type { ThemeMode, ThemeName } from "@/lib/theme/types";
import type { User } from "@supabase/supabase-js";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "AirBook — Find Flights. Break the Price.",
    template: "%s | AirBook",
  },
  description:
    "Discover the cheapest flights with real-time fare tracking, price alerts, and deal analysis. The smartest way to book flights.",
  keywords: [
    "cheap flights",
    "flight deals",
    "fare tracker",
    "flight comparison",
    "airbook",
    "price alerts",
  ],
  authors: [{ name: "AirBook" }],
  openGraph: {
    title: "AirBook — Find Flights. Break the Price.",
    description: "Real-time flight deals, fare tracking, and price alerts.",
    type: "website",
    locale: "en_IN",
    siteName: "AirBook",
  },
  twitter: {
    card: "summary_large_image",
    title: "AirBook — Find Flights. Break the Price.",
    description: "Real-time flight deals and fare tracking.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090B",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeModeCookie = cookieStore.get("airbook_theme_mode")?.value;
  const themeCookie = cookieStore.get("airbook_theme")?.value;

  const mode: ThemeMode = themeModeCookie === "manual" ? "manual" : "system";
  const themeFromCookie =
    themeCookie === "warm" ||
    themeCookie === "matte"
      ? (themeCookie satisfies ThemeName)
      : null;

  const initialTheme: ThemeName = mode === "manual" ? (themeFromCookie ?? "warm") : "warm";

  const hasSupabaseEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let initialUser: User | null = null;
  if (hasSupabaseEnv) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getSession();
    initialUser = data.session?.user ?? null;
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={initialTheme}
      data-theme-mode={mode}
      className={`${geist.variable} ${geistMono.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var d=document.documentElement;var m=d.dataset.themeMode;if(m==='system'){var dark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;d.dataset.theme=dark?'matte':'warm';}}catch(e){}})();",
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
        <SmoothScrollProvider>
          <div id="app-shell" className="min-h-full flex flex-col">
            <Navbar initialUser={initialUser} />
            <main className="flex-1 relative pt-14">
              {children}
            </main>
          </div>
          <ThemeFab />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
