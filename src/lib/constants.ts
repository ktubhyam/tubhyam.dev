export const SITE = {
  title: "Tubhyam Karthikeyan",
  description:
    "Tubhyam Karthikeyan — computational chemist, ML researcher, and open-source builder at ICT Mumbai. Spectroscopy, AI, and scientific computing.",
  url: "https://tubhyam.dev",
  author: "Tubhyam Karthikeyan",
  email: "takarthikeyan25@gmail.com",
  github: "https://github.com/ktubhyam",
  twitter: "https://twitter.com/ktubhyam",
  linkedin: "https://www.linkedin.com/in/ktubhyam",
} as const;

export const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
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
