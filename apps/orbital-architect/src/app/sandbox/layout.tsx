import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sandbox",
  description: "Free exploration mode. Place electrons anywhere, break quantum rules, and explore any element with no timer or scoring.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
