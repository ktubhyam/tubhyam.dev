export const SITE = {
  title: "Tubhyam Karthikeyan",
  description:
    "Computational chemist, ML researcher, and open-source builder. Exploring the intersection of science, AI, and interactive simulations.",
  url: "https://tubhyam.dev",
  author: "Tubhyam Karthikeyan",
  email: "takarthikeyan25@gmail.com",
  github: "https://github.com/tkart25",
  twitter: "https://twitter.com/tkart25",
  linkedin: "https://linkedin.com/in/tkart25",
} as const;

export const NAV_LINKS = [
  { label: "Projects", href: "/projects" },
  { label: "Simulations", href: "/simulations" },
  { label: "Research", href: "/research" },
  { label: "Blog", href: "/blog" },
] as const;

export const SOCIAL_LINKS = [
  { label: "GitHub", href: SITE.github, icon: "github" },
  { label: "Twitter", href: SITE.twitter, icon: "twitter" },
  { label: "LinkedIn", href: SITE.linkedin, icon: "linkedin" },
  { label: "Email", href: `mailto:${SITE.email}`, icon: "mail" },
  { label: "RSS", href: "/rss.xml", icon: "rss" },
] as const;
