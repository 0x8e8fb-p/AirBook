import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { cookies } from "next/headers";

import { SmoothScrollProvider } from "@/lib/lenis";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeFab } from "@/components/theme/ThemeFab";
import { EnvWarningBanner } from "@/components/layout/EnvWarningBanner";
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
    default: "TheWingScan — Search Flights",
    template: "%s | TheWingScan",
  },
  description: "Search flights, create fare alerts, and check flight status.",
  keywords: [
    "thewingsscan",
    "flight search",
    "live fares",
    "fare alerts",
    "flight tracker",
    "checkout-ready flights",
  ],
  authors: [{ name: "TheWingScan" }],
  openGraph: {
    title: "TheWingScan — Search Flights",
    description: "Search flights, create fare alerts, and check flight status.",
    type: "website",
    locale: "en_IN",
    siteName: "TheWingScan",
  },
  twitter: {
    card: "summary_large_image",
    title: "TheWingScan — Search Flights",
    description: "Search flights, create fare alerts, and check flight status.",
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
            {/* ScrollProgressBar was removed: it called setState on every
                scroll event, causing a React re-render at scroll rate.
                Decorative-only feature; the cost wasn't worth it. */}
            {/* The previous full-viewport ambient wrapper (hero-grid +
                two blur-[130px] orbs) was removed: that 130px blur on
                26rem elements sat behind every page and dominated the
                paint budget on scroll. Pages that want ambient now own
                a single scoped layer in their hero section. */}
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
