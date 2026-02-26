/**
 * BlogListTerminal — Full terminal-styled blog listing for the /blog page.
 * Types a command, then reveals posts one by one with staggered animation.
 * Each post cycles through the site's accent color palette.
 */
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";

interface BlogPost {
  id: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  readingTime: number;
}

interface Props {
  posts: BlogPost[];
  className?: string;
}

const ACCENT_COLORS = ["#A78BFA", "#C9A04A", "#4ECDC4", "#34D399", "#60A5FA", "#FF6B6B"];
const LINES_PER_POST = 4;

function LineNum({ n }: { n: number }) {
  return (
    <span className="w-7 text-right mr-3 select-none flex-shrink-0 text-[#333] text-[11px]">
      {n}
    </span>
  );
}

export default function BlogListTerminal({ posts, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const [typedCmd, setTypedCmd] = useState("");
  const [cmdDone, setCmdDone] = useState(false);
  const [revealCount, setRevealCount] = useState(0);
  const [showFooter, setShowFooter] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [cursorVisible, setCursorVisible] = useState(true);

  const command = "find ./posts -type f --sort=newest";

  useEffect(() => {
    if (!isInView) return;

    let i = 0;
    const typeId = setInterval(() => {
      i++;
      setTypedCmd(command.slice(0, i));
      if (i >= command.length) {
        clearInterval(typeId);
        setTimeout(() => {
          setCmdDone(true);
          let p = 0;
          const revealId = setInterval(() => {
            p++;
            setRevealCount(p);
            if (p >= posts.length) {
              clearInterval(revealId);
              setTimeout(() => {
                setShowFooter(true);
                // Hide footer cursor after 3s so it doesn't compete with newsletter input
                setTimeout(() => setCursorVisible(false), 3000);
              }, 300);
            }
          }, 120);
        }, 350);
      }
    }, 35);

    return () => clearInterval(typeId);
  }, [isInView, posts.length]);

  const postLine = (i: number) => 3 + i * LINES_PER_POST;
  const footerLine = 3 + posts.length * LINES_PER_POST;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-border overflow-hidden bg-bg-secondary relative ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface border-b border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-text-muted/60 select-none">~/blog</span>
        {!cmdDone && typedCmd.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-[#C9A04A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A04A] animate-pulse" />
            searching
          </span>
        )}
        {cmdDone && (
          <span className="ml-auto text-[10px] font-mono text-[#34D399]/60 select-none">
            {posts.length} results
          </span>
        )}
      </div>

      {/* Terminal content */}
      <div className="p-4 font-mono text-xs md:text-sm leading-relaxed relative overflow-hidden">
        {/* Command line */}
        <div className="flex items-center">
          <LineNum n={1} />
          <span>
            <span className="text-[#555]">$ </span>
            <span className="text-[#34D399]">{typedCmd.slice(0, 4)}</span>
            <span className="text-[#e0e0e0]">{typedCmd.slice(4)}</span>
            {!cmdDone && (
              <span className="inline-block w-[7px] h-[14px] bg-[#C9A04A] animate-blink ml-px translate-y-[1px]" />
            )}
          </span>
        </div>

        {/* Blank line */}
        {cmdDone && (
          <div className="flex">
            <LineNum n={2} />
          </div>
        )}

        {/* Post entries */}
        {posts.slice(0, revealCount).map((post, i) => {
          const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
          const isHovered = hoveredIdx === i;
          const ln = postLine(i);

          return (
            <motion.a
              key={post.id}
              href={`/blog/${post.id}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="block -mx-4 rounded transition-all duration-200"
              style={{
                borderLeft: `2px solid ${isHovered ? color : "transparent"}`,
                backgroundColor: isHovered ? `${color}08` : "transparent",
                paddingLeft: "14px",
                paddingRight: "16px",
                paddingTop: "6px",
                paddingBottom: "6px",
                marginTop: i === 0 ? "0px" : "2px",
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Line 1: date + reading time */}
              <div className="flex items-baseline">
                <LineNum n={ln} />
                <span className="flex items-baseline gap-2">
                  <span
                    className="transition-colors duration-200"
                    style={{ color: isHovered ? color : "#666" }}
                  >
                    {post.date}
                  </span>
                  <span className="text-[#333]">·</span>
                  <span className="text-[#444]">{post.readingTime} min read</span>
                </span>
              </div>

              {/* Line 2: title */}
              <div className="flex items-baseline">
                <LineNum n={ln + 1} />
                <span className="flex-1 flex items-baseline gap-3 min-w-0">
                  <span
                    className="text-sm md:text-base font-medium transition-colors duration-200"
                    style={{ color: isHovered ? color : "#e0e0e0" }}
                  >
                    {post.title}
                  </span>
                  <span
                    className="hidden md:inline-flex items-center text-[10px] flex-shrink-0 rounded-full px-2 py-0.5 transition-all duration-200"
                    style={{
                      backgroundColor: `${color}15`,
                      color,
                      opacity: isHovered ? 1 : 0,
                    }}
                  >
                    read →
                  </span>
                </span>
              </div>

              {/* Line 3: description */}
              <div className="flex items-baseline">
                <LineNum n={ln + 2} />
                <span className="text-[#555] leading-relaxed">
                  {post.description.length > 120
                    ? post.description.slice(0, 120) + "\u2026"
                    : post.description}
                </span>
              </div>

              {/* Line 4: tags */}
              <div className="flex items-center">
                <LineNum n={ln + 3} />
                <span className="flex items-center gap-1.5 flex-wrap">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] rounded-full px-2 py-0.5 transition-all duration-200"
                      style={{
                        backgroundColor: `${color}${isHovered ? "20" : "10"}`,
                        color,
                        opacity: isHovered ? 1 : 0.5,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              </div>
            </motion.a>
          );
        })}

        {/* Footer */}
        {showFooter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex mt-3"
          >
            <LineNum n={footerLine} />
            <span>
              <span className="text-[#555]">$ </span>
              <span className="text-[#34D399]">{posts.length}</span>
              <span className="text-[#555]"> posts found</span>
              {cursorVisible && (
                <span className="inline-block w-[7px] h-[14px] bg-[#C9A04A] animate-blink ml-1 translate-y-[1px]" />
              )}
            </span>
          </motion.div>
        )}

        {/* Scanline overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
            backgroundSize: "100% 4px",
          }}
        />
      </div>
    </motion.div>
  );
}
