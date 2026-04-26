import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { cookies } from "next/headers";

import { SmoothScrollProvider } from "@/lib/lenis";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeFab } from "@/components/theme/ThemeFab";
import { EnvWarningBanner } from "@/components/layout/EnvWarningBanner";
import type { ThemeMode, ThemeName } from "@/lib/theme/types";

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-data",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "AirBook — The sky is not the limit. It's the beginning.",
    template: "%s | AirBook",
  },
  description:
    "Discover the cheapest flights with real-time fare tracking, price alerts, ML-powered predictions, and verified bank offers. The smartest way to book flights in India.",
  keywords: [
    "cheap flights",
    "flight deals",
    "fare tracker",
    "flight comparison",
    "airbook",
    "price alerts",
    "india flights",
  ],
  authors: [{ name: "AirBook" }],
  openGraph: {
    title: "AirBook — Find Your Perfect Flight At The Best Price",
    description: "Real-time flight deals, fare tracking, and price predictions.",
    type: "website",
    locale: "en_IN",
    siteName: "AirBook",
  },
  twitter: {
    card: "summary_large_image",
    title: "AirBook — Find Your Perfect Flight At The Best Price",
    description: "Real-time flight deals and fare tracking.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#03050A",
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
    themeCookie === "warm" || themeCookie === "matte"
      ? (themeCookie satisfies ThemeName)
      : null;

  const initialTheme: ThemeName = mode === "manual" ? (themeFromCookie ?? "matte") : "matte";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={initialTheme}
      data-theme-mode={mode}
      className={`${playfair.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
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
        <Providers>
          <SmoothScrollProvider>
            <div id="app-shell" className="min-h-full flex flex-col">
              <EnvWarningBanner />
              <Navbar />
              <main className="flex-1 relative pt-14">
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
