import type { Metadata } from "next";
import "./globals.css";
import { delight, lato, roboto } from "./fonts";
import { PrivyProvider } from "./context/PrivyContext";
import { SolanaProvider } from "./context/SolanaContext";

export const metadata: Metadata = {
  title: "Meme Launchpad - Launch & Trade Solana Meme Tokens",
  description:
    "The ultimate platform for launching and trading meme tokens on Solana. Create, discover, and trade the hottest meme coins with real-time updates and seamless wallet integration.",
  keywords: [
    "meme tokens",
    "solana",
    "cryptocurrency",
    "token launch",
    "defi",
    "trading",
    "blockchain",
  ],
  authors: [{ name: "Meme Launchpad Team" }],
  creator: "Meme Launchpad",
  publisher: "Meme Launchpad",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Meme Launchpad - Launch & Trade Solana Meme Tokens",
    description:
      "The ultimate platform for launching and trading meme tokens on Solana. Create, discover, and trade the hottest meme coins with real-time updates and seamless wallet integration.",
    url: "/",
    siteName: "Meme Launchpad",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Meme Launchpad - Solana Meme Token Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meme Launchpad - Launch & Trade Solana Meme Tokens",
    description:
      "The ultimate platform for launching and trading meme tokens on Solana. Create, discover, and trade the hottest meme coins.",
    images: ["/og-image.png"],
    creator: "@memelaunchpad",
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lato.variable} ${roboto.variable} ${delight.variable} antialiased`}
      >
        <PrivyProvider>
          <SolanaProvider network="devnet">{children}</SolanaProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
