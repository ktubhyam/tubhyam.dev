/**
 * ChatWidget — Quick info FAB with pre-set Q&A pairs.
 * Clearly labeled as "Quick Answers" — no pretense of live AI chat.
 * Users click a question to see the answer.
 */
import { useState, useRef, useEffect } from "react";

interface QA {
  q: string;
  a: string;
}

const QUICK_ANSWERS: QA[] = [
  {
    q: "What do you work on?",
    a: "Computational chemistry + ML — building models that decode molecular structure from vibrational spectra (IR & Raman).",
  },
  {
    q: "What's your research about?",
    a: "I'm developing the first formal identifiability theory for the spectral inverse problem, connecting group theory, information theory, and deep learning.",
  },
  {
    q: "Are you open to collaborate?",
    a: "Yes! Open to research collaborations, open-source contributions, and interesting conversations about spectroscopy or ML. Reach out via the contact form.",
  },
  {
    q: "What tools do you use?",
    a: "Python, PyTorch, and CUDA for ML. TypeScript, React, and Three.js for interactive visualizations. All running on 4x RTX 5090.",
  },
  {
    q: "Where do you study?",
    a: "ICT Mumbai (Institute of Chemical Technology), graduating 2030. Focused on computational chemistry and machine learning.",
  },
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 51,
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "flex-end",
        gap: "0.5rem",
      }}
    >
      {/* Q&A Panel */}
      {open && (
        <div
          style={{
            width: 300,
            maxHeight: 400,
            overflowY: "auto",
            borderRadius: 14,
            background: "rgba(0, 0, 0, 0.92)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            padding: "12px",
            animation: "chatPanelIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div style={{ fontSize: 10, fontFamily: "monospace", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            Quick Answers
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {QUICK_ANSWERS.map((qa, i) => (
              <button
                key={i}
                onClick={() => setSelectedIdx(selectedIdx === i ? null : i)}
                style={{
                  textAlign: "left",
                  background: selectedIdx === i ? "rgba(201, 160, 74, 0.08)" : "rgba(255, 255, 255, 0.02)",
                  border: selectedIdx === i ? "1px solid rgba(201, 160, 74, 0.2)" : "1px solid rgba(255, 255, 255, 0.04)",
                  borderRadius: 10,
                  padding: "8px 11px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontSize: 12, color: selectedIdx === i ? "#E8D5A8" : "#999", lineHeight: 1.4 }}>
                  {qa.q}
                </div>
                {selectedIdx === i && (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "#888",
                      lineHeight: 1.5,
                      marginTop: 6,
                      paddingTop: 6,
                      borderTop: "1px solid rgba(255,255,255,0.04)",
                      animation: "chatMsgIn 0.2s ease-out",
                    }}
                  >
                    {qa.a}
                  </div>
                )}
              </button>
            ))}
          </div>

          <a
            href="#contact"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              textAlign: "center",
              fontSize: 11,
              fontFamily: "monospace",
              color: "#C9A04A",
              opacity: 0.7,
              marginTop: 10,
              padding: "6px 0",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "0.7"; }}
          >
            Send a message &rarr;
          </a>
        </div>
      )}

      {/* FAB trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Quick answers"
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "rgba(0, 0, 0, 0.85)",
          border: open
            ? "1px solid rgba(201, 160, 74, 0.3)"
            : "1px solid rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: open
            ? "0 0 16px rgba(201, 160, 74, 0.12)"
            : "none",
          animation: !open ? "chatBreath 3s ease-in-out infinite" : "none",
          flexShrink: 0,
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={open ? "#C9A04A" : "#707070"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "stroke 0.3s ease" }}
        >
          {open ? (
            <>
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </>
          ) : (
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
          )}
        </svg>
      </button>

      {/* Scoped keyframes */}
      <style>{`
        @keyframes chatBreath {
          0%, 100% { box-shadow: 0 0 0 rgba(201, 160, 74, 0); }
          50% { box-shadow: 0 0 12px rgba(201, 160, 74, 0.1); }
        }
        @keyframes chatPanelIn {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatMsgIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
