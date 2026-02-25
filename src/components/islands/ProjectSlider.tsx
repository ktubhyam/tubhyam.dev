/**
 * ProjectSlider — Terminal-styled project showcase carousel.
 * Matches TerminalBlock aesthetic: traffic lights, title bar, scanlines, monospace.
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

/** Typewriter hook — types out text character by character, resets on change. */
function useTypewriter(text: string, speed = 25) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        setDone(true);
        clearInterval(id);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return { displayed, done };
}

interface Project {
  title: string;
  description: string;
  tags: string[];
  color: string;
  icon: string;
  href: string;
  github?: string;
  pypi?: string;
  status: string;
}

interface Props {
  projects?: Project[];
  className?: string;
}

const DEFAULT_PROJECTS: Project[] = [
  {
    title: "SpectraKit",
    description: "Spectral preprocessing library for IR, Raman, and NIR. Functional API over NumPy arrays — baseline correction, smoothing, normalization, scatter correction, peak analysis, and 6-format I/O. v1.7.1, 619 tests, two core deps.",
    tags: ["Python", "PyPI", "v1.7.1"],
    color: "#4ECDC4",
    icon: "M16 18l6-6-6-6M8 6l-6 6 6 6",
    href: "/projects/spectrakit",
    github: "https://github.com/ktubhyam/spectrakit",
    pypi: "https://pypi.org/project/pyspectrakit/",
    status: "Published — pip install pyspectrakit",
  },
  {
    title: "Spekron",
    description: "Hybrid Mamba-Transformer foundation model for vibrational spectroscopy. Wavelet embeddings, MoE routing, VIB disentanglement, and few-shot calibration transfer.",
    tags: ["PyTorch", "CUDA", "Research"],
    color: "#C9A04A",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    href: "/projects/spekron",
    github: "https://github.com/ktubhyam/Spekron",
    status: "In Development",
  },
  {
    title: "ReactorTwin",
    description: "Surrogate digital twin for industrial chemical reactors. Neural ODEs and PINNs for real-time simulation, anomaly detection, and what-if analysis.",
    tags: ["PyTorch", "Neural ODEs", "PINNs"],
    color: "#A78BFA",
    icon: "M10 2v8l-6 12h16l-6-12V2M8 2h8",
    href: "/projects/reactor-twin",
    github: "https://github.com/ktubhyam/reactor-twin",
    status: "In Development",
  },
];

function TypewriterDescription({ text }: { text: string }) {
  const { displayed, done } = useTypewriter(text, 18);
  return (
    <span className="text-[#888]">
      {displayed}
      {!done && <span className="inline-block w-[7px] h-[14px] bg-[#C9A04A] animate-blink ml-px translate-y-[2px]" />}
    </span>
  );
}

export default function ProjectSlider({ projects = DEFAULT_PROJECTS, className = "" }: Props) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const project = projects[active];

  function goTo(idx: number) {
    setDirection(idx > active ? 1 : -1);
    setActive(idx);
  }

  function next() {
    setDirection(1);
    setActive((prev) => (prev + 1) % projects.length);
  }

  function prev() {
    setDirection(-1);
    setActive((prev) => (prev - 1 + projects.length) % projects.length);
  }

  // Auto-play
  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Reset timer on manual interaction
  function interact(fn: () => void) {
    clearInterval(timerRef.current);
    fn();
    timerRef.current = setInterval(next, 5000);
  }

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") interact(next);
      if (e.key === "ArrowLeft") interact(prev);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const variants = {
    enter: (d: number) => ({ opacity: 0, y: d > 0 ? 12 : -12 }),
    center: { opacity: 1, y: 0 },
    exit: (d: number) => ({ opacity: 0, y: d > 0 ? -12 : 12 }),
  };

  return (
    <div className={`relative ${className}`}>
      <div className="rounded-xl border border-border overflow-hidden bg-bg-secondary relative">
        {/* Title bar — matches TerminalBlock */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface border-b border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
            <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
            <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
          </div>
          <span className="ml-2 text-[10px] font-mono text-text-muted/60 select-none">projects</span>

          {/* Navigation arrows in title bar */}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => interact(prev)}
              className="w-5 h-5 flex items-center justify-center text-text-muted/40 hover:text-text-muted transition-colors"
              aria-label="Previous project"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="text-[10px] font-mono text-text-muted/40 tabular-nums">
              {active + 1}/{projects.length}
            </span>
            <button
              onClick={() => interact(next)}
              className="w-5 h-5 flex items-center justify-center text-text-muted/40 hover:text-text-muted transition-colors"
              aria-label="Next project"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Terminal content */}
        <div className="p-4 font-mono text-xs md:text-sm leading-relaxed min-h-[220px] relative overflow-hidden">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={active}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Line 1: project name */}
              <div className="flex">
                <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">1</span>
                <span>
                  <span className="text-[#555]">$ </span>
                  <span className="text-[#34D399]">cat</span>
                  <span className="text-[#e0e0e0]"> {project.title.toLowerCase().replace(/\s+/g, "-")}</span>
                  <span className="text-[#555]">/README.md</span>
                </span>
              </div>

              {/* Line 2: blank */}
              <div className="flex">
                <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">2</span>
              </div>

              {/* Line 3: title with color */}
              <div className="flex">
                <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">3</span>
                <span>
                  <span className="text-[#555]"># </span>
                  <span style={{ color: project.color }}>{project.title}</span>
                  <span className="text-[#555]"> — </span>
                  <span className="text-[#555] text-[10px] uppercase tracking-wider">{project.status}</span>
                </span>
              </div>

              {/* Line 4: blank */}
              <div className="flex">
                <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">4</span>
              </div>

              {/* Line 5: description with typewriter */}
              <div
                className="flex"
                style={{
                  backgroundColor: "rgba(201, 160, 74, 0.04)",
                  borderLeft: "2px solid rgba(201, 160, 74, 0.3)",
                  paddingLeft: "6px",
                  marginLeft: "-8px",
                }}
              >
                <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">5</span>
                <span className="flex-1">
                  <TypewriterDescription key={active} text={project.description} />
                </span>
              </div>

              {/* Line 6: blank */}
              <div className="flex">
                <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">6</span>
              </div>

              {/* Line 7: tags */}
              <div className="flex">
                <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">7</span>
                <span>
                  <span className="text-[#555]">tags: </span>
                  {project.tags.map((tag, i) => (
                    <span key={tag}>
                      <span style={{ color: project.color }}>{tag}</span>
                      {i < project.tags.length - 1 && <span className="text-[#333]"> · </span>}
                    </span>
                  ))}
                </span>
              </div>

              {/* Line 8: blank */}
              <div className="flex">
                <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">8</span>
              </div>

              {/* Line 9: links */}
              <div className="flex">
                <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">9</span>
                <span>
                  <a
                    href={project.href}
                    className="transition-colors duration-200 hover:underline"
                    style={{ color: project.color }}
                  >
                    View project →
                  </a>
                  {project.github && (
                    <>
                      <span className="text-[#333]">  ·  </span>
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#555] hover:text-[#888] transition-colors duration-200 hover:underline"
                      >
                        GitHub ↗
                      </a>
                    </>
                  )}
                  {project.pypi && (
                    <>
                      <span className="text-[#333]">  ·  </span>
                      <a
                        href={project.pypi}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#555] hover:text-[#888] transition-colors duration-200 hover:underline"
                      >
                        PyPI ↗
                      </a>
                    </>
                  )}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Scanline overlay — matches TerminalBlock */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
              backgroundSize: "100% 4px",
            }}
          />
        </div>
      </div>

      {/* Navigation dots */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {projects.map((p, i) => (
          <button
            key={i}
            onClick={() => interact(() => goTo(i))}
            className="h-6 flex items-center"
            aria-label={`Go to ${p.title}`}
          >
            <div
              className="h-[2px] rounded-full transition-all duration-500"
              style={{
                width: i === active ? 24 : 8,
                backgroundColor: i === active ? p.color : "rgba(255,255,255,0.08)",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
