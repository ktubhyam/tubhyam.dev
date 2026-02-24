/**
 * SocialLinks — Animated grid of social/contact links with hover effects.
 * Each link has a colored icon, label, and subtle glow on hover.
 */
import { useRef } from "react";
import { motion, useInView } from "motion/react";

interface SocialLink {
  label: string;
  href: string;
  icon: string; // SVG path
  color: string;
  handle: string;
}

interface Props {
  className?: string;
}

const LINKS: SocialLink[] = [
  {
    label: "GitHub",
    href: "https://github.com/tkart25",
    icon: "M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z",
    color: "#e0e0e0",
    handle: "@tkart25",
  },
  {
    label: "Email",
    href: "mailto:takarthikeyan25@gmail.com",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    color: "#C9A04A",
    handle: "takarthikeyan25",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/tkart25",
    icon: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z",
    color: "#60A5FA",
    handle: "tkart25",
  },
  {
    label: "Twitter / X",
    href: "https://x.com/tkart25",
    icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    color: "#e0e0e0",
    handle: "@tkart25",
  },
  {
    label: "Google Scholar",
    href: "https://scholar.google.com/citations?user=tkart25",
    icon: "M12 2L2 7v3.5C2 16.58 6.53 21.41 12 22.5c5.47-1.09 10-5.92 10-12V7L12 2zm0 2.21L19 7.8v2.7c0 4.83-3.5 9.36-7 10.5-3.5-1.14-7-5.67-7-10.5V7.8l7-3.59zM12 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
    color: "#4285F4",
    handle: "tkart25",
  },
  {
    label: "HuggingFace",
    href: "https://huggingface.co/tkart25",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2.5 7.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm5 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 17.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z",
    color: "#FFD21E",
    handle: "tkart25",
  },
];

export default function SocialLinks({ className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`grid grid-cols-2 gap-3 ${className}`}
    >
      {LINKS.map((link, i) => (
        <motion.a
          key={link.label}
          href={link.href}
          target={link.href.startsWith("mailto:") ? undefined : "_blank"}
          rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="group flex items-center gap-3 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 hover:border-[#2a2a2a] hover:bg-[#0f0f0f] transition-all duration-200 cursor-pointer"
          style={{
            boxShadow: "none",
          }}
          whileHover={{
            boxShadow: `0 0 20px ${link.color}25, 0 0 40px ${link.color}15`,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 flex-shrink-0 transition-colors duration-200"
            style={{ color: "#555" }}
            fill={link.icon.includes("z") ? "currentColor" : "none"}
            stroke={link.icon.includes("z") ? "none" : "currentColor"}
            strokeWidth="1.5"
          >
            <path d={link.icon} />
          </svg>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-mono text-[#888] group-hover:text-[#ccc] transition-colors duration-200 truncate">
              {link.label}
            </span>
            <span
              className="text-[10px] font-mono truncate transition-colors duration-200"
              style={{ color: "#444" }}
            >
              {link.handle}
            </span>
          </div>
          <svg
            viewBox="0 0 24 24"
            className="w-3 h-3 ml-auto flex-shrink-0 text-[#333] group-hover:text-[#666] transition-all duration-200 group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </motion.a>
      ))}
    </motion.div>
  );
}
