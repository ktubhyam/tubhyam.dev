import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vibescope.tubhyam.dev"),
  title: "VibeScope — 3D Molecular Vibration Visualizer",
  description:
    "Explore molecular vibrations in 3D. Select a molecule, pick a normal mode, and watch atoms oscillate with IR/Raman spectrum overlay.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg text-text antialiased">
        {children}
      </body>
    </html>
  );
}
