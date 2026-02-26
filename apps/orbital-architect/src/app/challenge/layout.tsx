import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Challenge Mode",
  description: "Random elements, 30-second timer. Build electron configurations under pressure and climb the Elo leaderboard.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
