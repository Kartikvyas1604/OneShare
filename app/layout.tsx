import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Floorline — deposit USDC from any chain, pick a loss limit",
  description:
    "Deposit USDC from any of 30+ chains, pick a loss limit, and own a self-managing slice of NVIDIA as a NEAR NFT. The reserve sits in a separate escrow contract; the de-risk rule is automated and backtested.",
  keywords: ["NEAR", "intents", "chain signatures", "NEP-171", "loss limit", "tokenized stocks"],
  openGraph: {
    title: "Floorline — deposit USDC from any chain, pick a loss limit",
    description:
      "Own a self-managing tokenized-equity position as a NEAR NFT. Worst case in dollars, set before you deposit.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Floorline — deposit USDC from any chain, pick a loss limit",
    description:
      "Own a self-managing tokenized-equity position as a NEAR NFT. Worst case in dollars, set before you deposit.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0e0e10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
