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
    default: "Atmos — India's Smartest Flight Deal Finder",
    template: "%s | Atmos",
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
  authors: [{ name: "Atmos" }],
  openGraph: {
    title: "Atmos — Premium Flight Engineering",
    description:
      "Advanced 120Hz flight orchestration and dynamic pricing.",
    type: "website",
    locale: "en_IN",
    siteName: "Atmos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atmos — Premium Flight Engineering",
    description: "Advanced 120Hz flight orchestration and dynamic pricing.",
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
