import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "OneShare — Own $10 of NVIDIA in 60 seconds",
  description:
    "Buy tokenized US equities with any token on any chain. Receive a NEAR position NFT that manages itself with stop-loss, take-profit, and DCA rules enforced onchain.",
  keywords: ["NEAR", "Solana", "tokenized stocks", "xStocks", "intents", "chain signatures"],
  authors: [{ name: "OneShare" }],
  openGraph: {
    title: "OneShare — Own $10 of NVIDIA in 60 seconds",
    description:
      "Buy tokenized US equities with any token on any chain. Self-managing positions on NEAR.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OneShare — Own $10 of NVIDIA in 60 seconds",
    description:
      "Buy tokenized US equities with any token on any chain. Self-managing positions on NEAR.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
