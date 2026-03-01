/**
 * FileTree — Animated project structure that reveals files one by one.
 * Each file type has a distinct color. Folders expand with subtle animation.
 */
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";

interface TreeNode {
  name: string;
  type: "folder" | "file";
  color?: string;
  children?: TreeNode[];
}

interface Props {
  tree?: TreeNode[];
  title?: string;
  className?: string;
}

const FILE_COLORS: Record<string, string> = {
  ".py": "#4ECDC4",
  ".ts": "#60A5FA",
  ".tsx": "#60A5FA",
  ".json": "#C9A04A",
  ".yaml": "#C9A04A",
  ".yml": "#C9A04A",
  ".md": "#A78BFA",
  ".toml": "#FF6B6B",
  ".css": "#34D399",
  ".sh": "#FF6B6B",
};

function getFileColor(name: string): string {
  for (const [ext, color] of Object.entries(FILE_COLORS)) {
    if (name.endsWith(ext)) return color;
  }
  return "#888";
}

const DEFAULT_TREE: TreeNode[] = [
  {
    name: "spektron/", type: "folder", children: [
      {
        name: "src/", type: "folder", children: [
          {
            name: "models/", type: "folder", children: [
              { name: "embedding.py", type: "file" },
              { name: "transformer.py", type: "file" },
              { name: "moe.py", type: "file" },
              { name: "heads.py", type: "file" },
            ],
          },
          {
            name: "data/", type: "folder", children: [
              { name: "datasets.py", type: "file" },
              { name: "augment.py", type: "file" },
            ],
          },
          { name: "config.py", type: "file" },
          { name: "train.py", type: "file" },
        ],
      },
      { name: "pyproject.toml", type: "file" },
      { name: "README.md", type: "file" },
    ],
  },
];

// Flatten tree for sequential reveal
function flattenTree(nodes: TreeNode[], depth = 0): { node: TreeNode; depth: number; isLast: boolean }[] {
  const result: { node: TreeNode; depth: number; isLast: boolean }[] = [];
  for (let k = 0; k < nodes.length; k++) {
    const node = nodes[k];
    const isLast = k === nodes.length - 1;
    result.push({ node, depth, isLast });
    if (node.children) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

export default function FileTree({
  tree = DEFAULT_TREE,
  title = "project — file structure",
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [visibleCount, setVisibleCount] = useState(0);

  const flatNodes = flattenTree(tree);

  useEffect(() => {
    if (!isInView) return;
    let count = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        count++;
        setVisibleCount(count);
        if (count >= flatNodes.length) clearInterval(interval);
      }, 80);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [isInView, flatNodes.length]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-border overflow-hidden bg-bg-secondary ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface border-b border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-text-muted/60 select-none">{title}</span>
      </div>

      {/* Tree */}
      <div className="p-4 font-mono text-[11px] leading-[1.7]">
        {flatNodes.slice(0, visibleCount).map(({ node, depth, isLast }, i) => {
          const isFolder = node.type === "folder";
          const color = isFolder ? "#C9A04A" : getFileColor(node.name);

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5"
              style={{ paddingLeft: `${depth * 16}px` }}
            >
              {/* Tree lines */}
              {depth > 0 && (
                <span className="text-[#333] select-none">
                  {isLast ? "└─" : "├─"}
                </span>
              )}

              {/* Icon */}
              {isFolder ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill={color} opacity={0.7}>
                  <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" opacity={0.7}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              )}

              {/* Name */}
              <span style={{ color }}>{node.name}</span>
            </motion.div>
          );
        })}

        {/* Blinking cursor */}
        {visibleCount > 0 && visibleCount < flatNodes.length && (
          <span className="inline-block w-[7px] h-[13px] bg-[#C9A04A] animate-blink ml-px translate-y-[2px]" />
        )}
      </div>
    </motion.div>
  );
}
