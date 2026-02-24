/**
 * ProjectSlider — Interactive project showcase with sliding cards and animated text.
 * Horizontal carousel with snap scrolling, auto-play, and keyboard navigation.
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
  icon: string; // SVG path
  href: string;
  github?: string;
  status: string;
}

interface Props {
  projects?: Project[];
  className?: string;
}

const DEFAULT_PROJECTS: Project[] = [
  {
    title: "SpectraKit",
    description: "Unified spectroscopy toolkit for IR, Raman, and UV-Vis analysis. Preprocessing pipelines, format parsers, spectral matching, and publication-quality plots.",
    tags: ["Python", "PyPI", "MIT"],
    color: "#4ECDC4",
    icon: "M16 18l6-6-6-6M8 6l-6 6 6 6",
    href: "/projects/spectrakit",
    github: "https://github.com/tkart25/spectrakit",
    status: "Published on PyPI",
  },
  {
    title: "SPECTRE",
    description: "Hybrid Mamba-Transformer foundation model for vibrational spectroscopy. Wavelet embeddings, MoE routing, VIB disentanglement, and few-shot calibration transfer.",
    tags: ["PyTorch", "CUDA", "Research"],
    color: "#C9A04A",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    href: "/projects/spectre",
    github: "https://github.com/ktubhyam/SpectralFM",
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
    <p className="mt-5 text-sm font-mono text-text-muted leading-relaxed max-w-xl">
      {displayed}
      {!done && <span className="animate-blink text-text-muted/70">▌</span>}
    </p>
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
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0, filter: "blur(4px)" }),
    center: { x: 0, opacity: 1, filter: "blur(0px)" },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0, filter: "blur(4px)" }),
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-secondary min-h-[340px] md:min-h-[300px]">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={active}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 md:p-8"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border"
                  style={{ borderColor: `${project.color}30`, backgroundColor: `${project.color}10` }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={project.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={project.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-mono font-medium text-text-primary tracking-tight">
                    {project.title}
                  </h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: project.color }}>
                    {project.status}
                  </span>
                </div>
              </div>

              {/* Counter */}
              <span className="text-xs font-mono text-text-muted/50 flex-shrink-0">
                {String(active + 1).padStart(2, "0")}/{String(projects.length).padStart(2, "0")}
              </span>
            </div>

            {/* Description with terminal typewriter */}
            <TypewriterDescription key={active} text={project.description} />

            {/* Tags */}
            <div className="mt-5 flex flex-wrap gap-2">
              {project.tags.map((tag, i) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="text-[10px] font-mono rounded-full px-2.5 py-0.5 border"
                  style={{
                    color: `${project.color}cc`,
                    borderColor: `${project.color}20`,
                    backgroundColor: `${project.color}08`,
                  }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>

            {/* Links */}
            <div className="mt-6 flex items-center gap-4">
              <a
                href={project.href}
                className="text-xs font-mono transition-colors duration-200"
                style={{ color: `${project.color}aa` }}
                onMouseEnter={(e) => (e.currentTarget.style.color = project.color)}
                onMouseLeave={(e) => (e.currentTarget.style.color = `${project.color}aa`)}
              >
                View project &rarr;
              </a>
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-text-muted/50 hover:text-text-muted transition-colors duration-200"
                >
                  GitHub &nearr;
                </a>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation dots + arrows */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {projects.map((p, i) => (
            <button
              key={i}
              onClick={() => interact(() => goTo(i))}
              className="group relative h-8 flex items-center"
              aria-label={`Go to ${p.title}`}
            >
              <div
                className="h-[3px] rounded-full transition-all duration-500"
                style={{
                  width: i === active ? 32 : 12,
                  backgroundColor: i === active ? p.color : "rgba(255,255,255,0.1)",
                }}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => interact(prev)}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-hover transition-colors"
            aria-label="Previous project"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => interact(next)}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-hover transition-colors"
            aria-label="Next project"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
