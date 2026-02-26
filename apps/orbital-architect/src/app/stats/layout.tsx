import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stats",
  description: "Track your Orbital Architect progress. Elo rating, campaign completion, achievements, and detailed performance stats.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
