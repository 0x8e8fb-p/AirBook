import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SmoothScrollProvider } from "@/lib/lenis";
import { Navbar } from "@/components/layout/Navbar";
import { ScrollProgressBar } from "@/components/layout/ScrollProgressBar";

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
  themeColor: "#08090D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${dmSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
        <SmoothScrollProvider>
          <ScrollProgressBar />
          <Navbar />
          <main className="flex-1 relative pt-16">
            {children}
          </main>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
