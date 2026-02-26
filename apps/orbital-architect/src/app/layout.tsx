import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

const SITE_URL = "https://orbital.tubhyam.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Orbital Architect — Quantum Chemistry Puzzle Game",
    template: "%s — Orbital Architect",
  },
  description: "Build atoms by filling electron orbitals following real quantum mechanical rules. Master the Aufbau Principle, Pauli Exclusion, and Hund's Rule.",
  keywords: ["chemistry", "quantum mechanics", "electron configuration", "puzzle game", "education", "orbital", "aufbau", "periodic table"],
  authors: [{ name: "Tubhyam Karthikeyan", url: "https://tubhyam.dev" }],
  creator: "Tubhyam Karthikeyan",
  openGraph: {
    title: "Orbital Architect",
    description: "Build atoms by filling electron orbitals. A quantum chemistry puzzle game.",
    url: SITE_URL,
    type: "website",
    siteName: "Orbital Architect",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbital Architect",
    description: "Build atoms by filling electron orbitals. A quantum chemistry puzzle game.",
    creator: "@ktubhyam",
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: "JBzFZzb7pTB2nJeaKAciQHIJ2KkFqbVDLVPLU8ZtlxY",
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
    name: "Orbital Architect",
    description: "Build atoms by filling electron orbitals following real quantum mechanical rules.",
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
      </body>
    </html>
  );
}
