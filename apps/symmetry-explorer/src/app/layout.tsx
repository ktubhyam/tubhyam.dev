import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://symmetry-explorer.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Symmetry Explorer — Molecular Point Group Visualizer",
    template: "%s — Symmetry Explorer",
  },
  description:
    "Visualize molecular point groups, symmetry operations, and character tables. See how symmetry determines spectroscopic selection rules.",
  keywords: [
    "symmetry",
    "point group",
    "character table",
    "spectroscopy",
    "selection rules",
    "IR",
    "Raman",
    "group theory",
    "chemistry",
    "education",
  ],
  authors: [{ name: "Tubhyam Karthikeyan", url: "https://tubhyam.dev" }],
  creator: "Tubhyam Karthikeyan",
  openGraph: {
    title: "Symmetry Explorer",
    description:
      "Visualize molecular point groups, symmetry operations, and character tables.",
    url: SITE_URL,
    type: "website",
    siteName: "Symmetry Explorer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Symmetry Explorer",
    description:
      "Visualize molecular point groups, symmetry operations, and character tables.",
    creator: "@ktubhyam",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Symmetry Explorer",
    description:
      "Visualize molecular point groups, symmetry operations, character tables, and spectroscopic selection rules.",
    url: SITE_URL,
    applicationCategory: "EducationApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: {
      "@type": "Person",
      name: "Tubhyam Karthikeyan",
      url: "https://tubhyam.dev",
    },
  };

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
