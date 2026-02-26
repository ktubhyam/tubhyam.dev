export const metadata = {
  title: 'Spectrum-to-Structure',
  description: 'ML model predicts 3D molecular structure from vibrational spectra',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
