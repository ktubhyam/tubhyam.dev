/**
 * BlogTerminal — Animated terminal-style blog listing.
 * Types out a command, then reveals posts one by one with staggered animation.
 * Each post has a colored accent bar and hover state.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView } from "motion/react";

interface BlogPost {
  id: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
}

interface Props {
  posts: BlogPost[];
  className?: string;
}

const COLORS = ["#A78BFA", "#C9A04A", "#4ECDC4"];

export default function BlogTerminal({ posts, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const [typedCmd, setTypedCmd] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [revealedPosts, setRevealedPosts] = useState(0);
  const [showFooter, setShowFooter] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const command = "ls -la posts/";

  // Type command, then stagger-reveal posts
  useEffect(() => {
    if (!isInView) return;

    let i = 0;
    const typeId = setInterval(() => {
      i++;
      setTypedCmd(command.slice(0, i));
      if (i >= command.length) {
        clearInterval(typeId);

        // Pause, then reveal posts
        setTimeout(() => {
          let p = 0;
          const revealId = setInterval(() => {
            p++;
            setRevealedPosts(p);
            if (p >= posts.length) {
              clearInterval(revealId);
              setTimeout(() => {
                setShowFooter(true);
                setTimeout(() => setShowCursor(false), 800);
              }, 250);
            }
          }, 180);
        }, 400);
      }
    }, 45);

    return () => clearInterval(typeId);
  }, [isInView, posts.length]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
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
        <span className="ml-2 text-[10px] font-mono text-text-muted/60 select-none">blog</span>
        {revealedPosts < posts.length && typedCmd.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-[#C9A04A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A04A] animate-pulse" />
            loading
          </span>
        )}
        {revealedPosts >= posts.length && (
          <a
            href="/blog"
            className="ml-auto text-[10px] font-mono text-text-muted/40 hover:text-text-muted transition-colors"
          >
            all posts →
          </a>
        )}
      </div>

      {/* Terminal content */}
      <div className="p-4 font-mono text-xs md:text-sm leading-relaxed relative overflow-hidden">
        {/* Command line */}
        <div className="flex items-center">
          <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">1</span>
          <span>
            <span className="text-[#555]">$ </span>
            <span className="text-[#34D399]">{typedCmd.slice(0, 2)}</span>
            <span className="text-[#e0e0e0]">{typedCmd.slice(2)}</span>
            {typedCmd.length < command.length && showCursor && (
              <span className="inline-block w-[7px] h-[14px] bg-[#C9A04A] animate-blink ml-px translate-y-[1px]" />
            )}
          </span>
        </div>

        {/* Blank line after command */}
        {typedCmd.length >= command.length && (
          <div className="flex">
            <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">2</span>
          </div>
        )}

        {/* Post entries */}
        {posts.slice(0, revealedPosts).map((post, i) => {
          const color = COLORS[i % COLORS.length];
          const lineNum = i * 2 + 3;
          const isHovered = hoveredIdx === i;

          return (
            <motion.a
              key={post.id}
              href={`/blog/${post.id}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="block -mx-4 rounded transition-all duration-200"
              style={{
                borderLeft: `2px solid ${isHovered ? color : "transparent"}`,
                backgroundColor: isHovered ? `${color}08` : "transparent",
                paddingLeft: "14px",
                paddingRight: "16px",
                paddingTop: "4px",
                paddingBottom: "4px",
                marginTop: i === 0 ? "0px" : "2px",
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Title line */}
              <div className="flex items-baseline">
                <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">{lineNum}</span>
                <span className="flex-1 flex items-baseline gap-3 min-w-0">
                  <span className="text-[#555] flex-shrink-0">{post.date}</span>
                  <span
                    className="truncate transition-colors duration-200"
                    style={{ color: isHovered ? color : "#ccc" }}
                  >
                    {post.title}
                  </span>
                  <span
                    className="hidden md:inline-flex items-center text-[10px] flex-shrink-0 rounded-full px-2 py-0.5 transition-all duration-200"
                    style={{
                      backgroundColor: `${color}15`,
                      color: `${color}`,
                      opacity: isHovered ? 1 : 0.4,
                    }}
                  >
                    →
                  </span>
                </span>
              </div>

              {/* Description + tags line */}
              <div className="flex">
                <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">{lineNum + 1}</span>
                <span className="flex-1 flex items-baseline gap-2 min-w-0">
                  <span className="text-[#555] truncate flex-1">
                    {post.description.length > 90
                      ? post.description.slice(0, 90) + "..."
                      : post.description}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 flex-shrink-0">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] transition-opacity duration-200"
                        style={{ color, opacity: isHovered ? 0.8 : 0.35 }}
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
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
            className="flex mt-2"
          >
            <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">
              {posts.length * 2 + 3}
            </span>
            <span>
              <span className="text-[#555]">$ </span>
              <span className="text-[#555]">{posts.length} posts</span>
              {showCursor && (
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
