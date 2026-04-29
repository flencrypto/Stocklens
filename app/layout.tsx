import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const SITE_URL = "https://stock-lens.mrflen.com";
const TITLE = "StockLens — Track markets. Spot trends. Trade smarter.";
const DESCRIPTION =
  "Generate investor-grade 2-page infographics for any stock, crypto token, or Ethereum contract address. Live market data, AI insights, and premium dark-theme charts.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | StockLens",
  },
  description: DESCRIPTION,
  applicationName: "StockLens",
  keywords: [
    "stocks",
    "market data",
    "charts",
    "watchlist",
    "portfolio",
    "trading",
    "finance",
    "crypto",
    "investment",
    "infographic",
    "StockLens",
  ],
  authors: [{ name: "flencrypto" }],
  creator: "flencrypto",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "StockLens",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "StockLens — Track markets. Spot trends. Trade smarter.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/twitter-image.png"],
    creator: "@flencrypto",
    site: "@flencrypto",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F19" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
