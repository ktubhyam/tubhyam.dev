import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaign",
  description: "Master 36 levels from Hydrogen to Krypton. Build atoms by filling electron orbitals following aufbau, Pauli exclusion, and Hund's rule.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
