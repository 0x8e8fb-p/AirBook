import type { Metadata, Viewport } from "next";
import "./globals.css";

import { SmoothScrollProvider } from "@/lib/lenis";
import { CustomCursor } from "@/components/ui/CustomCursor";

export const metadata: Metadata = {
  title: {
    default: "Atmos — Velocity Engine",
    template: "%s | Atmos",
  },
  description:
    "The world's most elegant flight orchestration. No ads, no popups. Just pure, immersive travel intelligence.",
  keywords: [
    "cheap flights India",
    "flight deals",
    "flight comparison",
    "atmos flights",
  ],
  authors: [{ name: "Atmos" }],
  openGraph: {
    title: "Atmos — Immersive Travel",
    description:
      "Advanced supersonic flight orchestration and dynamic pricing.",
    type: "website",
    locale: "en_IN",
    siteName: "Atmos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atmos — Immersive Travel",
    description: "Advanced supersonic flight orchestration.",
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
  themeColor: "#080C14", // matches new background
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <head>
        {/* Load Clash Display since @fontsource package does not exist */}
        <link href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)]">
        <SmoothScrollProvider>
          <CustomCursor />
          <main className="flex-1 overflow-hidden relative">
            {children}
          </main>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
