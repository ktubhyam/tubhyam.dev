import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://nme.tubhyam.dev"),
  title: "Normal Mode Explorer — Decompose Molecular Vibrations",
  description:
    "Decompose and compare individual molecular vibrational normal modes. Visualize symmetry labels, selection rules, and energy distribution interactively.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Normal Mode Explorer",
    description:
      "Interactive 3D molecular vibration explorer. Decompose normal modes, compare IR/Raman activity, visualize symmetry elements, and hear frequency sonification.",
    type: "website",
    url: "https://nme.tubhyam.dev",
    siteName: "Normal Mode Explorer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Normal Mode Explorer",
    description:
      "Interactive 3D molecular vibration explorer with displacement arrows, Boltzmann populations, and mode superposition.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body className="min-h-screen antialiased" style={{ paddingTop: 'env(safe-area-inset-top)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>{children}</body>
    </html>
  );
}
