import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { cookies } from "next/headers";

import { SmoothScrollProvider } from "@/lib/lenis";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeFab } from "@/components/theme/ThemeFab";
import { EnvWarningBanner } from "@/components/layout/EnvWarningBanner";
import { ScrollProgressBar } from "@/components/layout/ScrollProgressBar";
import type { ThemeMode, ThemeName } from "@/lib/theme/types";

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
    default: "AirBook — Search Flights With Confidence",
    template: "%s | AirBook",
  },
  description:
    "Search flights with live fare confidence, route alerts, and a premium booking flow that only continues when a fare is truly ready.",
  keywords: [
    "airbook",
    "flight search",
    "live fares",
    "fare alerts",
    "flight tracker",
    "checkout-ready flights",
  ],
  authors: [{ name: "AirBook" }],
  openGraph: {
    title: "AirBook — Search Flights With Confidence",
    description: "Premium flight search, live fare trust, and calmer booking decisions.",
    type: "website",
    locale: "en_IN",
    siteName: "AirBook",
  },
  twitter: {
    card: "summary_large_image",
    title: "AirBook — Search Flights With Confidence",
    description: "Premium flight search, live fare trust, and calmer booking decisions.",
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
  const themeModeCookie = cookieStore.get("thewingsscan_theme_mode")?.value;
  const themeCookie = cookieStore.get("thewingsscan_theme")?.value;

  const mode: ThemeMode = themeModeCookie === "manual" ? "manual" : "system";
  const themeFromCookie =
    themeCookie === "warm" ||
    themeCookie === "matte"
      ? (themeCookie satisfies ThemeName)
      : null;

  const initialTheme: ThemeName = mode === "manual" ? (themeFromCookie ?? "warm") : "warm";

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
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] relative isolate">
        <Providers>
          <SmoothScrollProvider>
            <ScrollProgressBar />
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
              <div className="hero-grid absolute inset-0 opacity-35" />
              <div className="absolute left-[12%] top-[-12rem] h-[26rem] w-[26rem] rounded-full bg-[color-mix(in_srgb,var(--accent-cyan)_14%,transparent)] blur-[130px]" />
              <div className="absolute right-[-4rem] top-[4rem] h-[24rem] w-[24rem] rounded-full bg-[color-mix(in_srgb,var(--accent-purple)_13%,transparent)] blur-[130px]" />
            </div>
            <div id="app-shell" className="min-h-full flex flex-col relative z-10">
              <EnvWarningBanner />
              <Navbar />
              <main className="relative flex-1 pt-16">
                {children}
              </main>
            </div>
            <ThemeFab />
          </SmoothScrollProvider>
        </Providers>
      </body>
    </html>
  );
}
