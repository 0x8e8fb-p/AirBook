import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FareCracker — India's Smartest Flight Deal Finder",
    template: "%s | FareCracker",
  },
  description:
    "Compare flight prices across every Indian airline and OTA. Apply coupons, optimize credit cards, and find the TRUE cheapest fare. Save up to 40% on every booking.",
  keywords: [
    "cheap flights India",
    "flight deals",
    "flight comparison",
    "IndiGo deals",
    "Air India offers",
    "MakeMyTrip coupons",
    "cheapest flights",
    "fare comparison",
    "flight booking India",
  ],
  authors: [{ name: "FareCracker" }],
  openGraph: {
    title: "FareCracker — Har Flight Ka Jugaad 🇮🇳",
    description:
      "India's first app that finds the TRUE cheapest flight by combining coupons, credit card cashback, and bank offers. One search. Every deal.",
    type: "website",
    locale: "en_IN",
    siteName: "FareCracker",
  },
  twitter: {
    card: "summary_large_image",
    title: "FareCracker — India's Smartest Flight Deal Finder",
    description:
      "Compare prices across every airline & OTA. Auto-apply coupons. Optimize your credit card. Find the cheapest fare.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#030712",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
