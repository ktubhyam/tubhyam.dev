/**
 * NewsletterSubscribe — Terminal-styled subscribe form for Buttondown.
 * Terminal chrome renders instantly. Types a command, then reveals the
 * email input. No Framer Motion dependency — uses IntersectionObserver
 * and CSS transitions.
 *
 * Uses standard form submission (not fetch) because Buttondown's
 * embed endpoint requires a Cloudflare Turnstile challenge.
 */
import { useState, useRef, useEffect } from "react";

const BUTTONDOWN_USERNAME = "latentchemistry";

export default function NewsletterSubscribe({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mirrorRef = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);
  const [typed, setTyped] = useState("");
  const [cmdDone, setCmdDone] = useState(false);
  const [focused, setFocused] = useState(false);
  const [emailVal, setEmailVal] = useState("");
  const [cursorLeft, setCursorLeft] = useState(0);

  const command = "subscribe --newsletter latent-chemistry";

  // Start animation when element enters viewport
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { rootMargin: "-40px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Type the command when in view
  useEffect(() => {
    if (!started) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(command.slice(0, i));
      if (i >= command.length) {
        clearInterval(id);
        setTimeout(() => setCmdDone(true), 300);
      }
    }, 35);
    return () => clearInterval(id);
  }, [started]);

  return (
    <div
      ref={ref}
      className={`rounded-xl border border-border overflow-hidden bg-bg-secondary relative ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface border-b border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-text-muted/60 select-none">subscribe</span>
        {!cmdDone && typed.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-[#C9A04A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A04A] animate-pulse" />
            typing
          </span>
        )}
        {cmdDone && (
          <span className="ml-auto text-[10px] font-mono text-[#34D399]/60 select-none">
            weekly · thursdays
          </span>
        )}
      </div>

      {/* Terminal content */}
      <div className="p-4 font-mono text-xs md:text-sm leading-relaxed relative overflow-hidden">
        {/* Line 1: command */}
        <div className="flex items-baseline">
          <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">1</span>
          <span>
            <span className="text-[#555]">$ </span>
            <span className="text-[#34D399]">{typed.slice(0, 9)}</span>
            <span className="text-[#e0e0e0]">{typed.slice(9)}</span>
            {!cmdDone && started && (
              <span className="inline-block w-[7px] h-[14px] bg-[#C9A04A] animate-blink ml-px translate-y-[1px]" />
            )}
          </span>
        </div>

        {/* Lines 2-4: output after command finishes — always rendered, opacity controlled */}
        <div style={{ opacity: cmdDone ? 1 : 0, transition: "opacity 0.3s ease-out" }}>
          {/* Line 2: blank */}
          <div className="flex">
            <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">2</span>
          </div>

          {/* Line 3: description */}
          <div className="flex">
            <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">3</span>
            <span className="text-[#555]">
              Deep learning for spectroscopy — delivered to your inbox.
            </span>
          </div>

          {/* Line 4: blank */}
          <div className="flex">
            <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">4</span>
          </div>
        </div>

        {/* Line 5: email input prompt — always rendered, opacity controlled */}
        <div style={{ opacity: cmdDone ? 1 : 0, transition: "opacity 0.3s ease-out 0.15s" }}>
          <form
            action={`https://buttondown.com/api/emails/embed-subscribe/${BUTTONDOWN_USERNAME}`}
            method="post"
            className="flex items-baseline"
          >
            <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]">5</span>
            <span className="text-[#C9A04A] mr-1 select-none">email:</span>
            <div
              className="flex-1 flex items-baseline relative cursor-text"
              onClick={() => inputRef.current?.focus()}
            >
              <span
                ref={mirrorRef}
                aria-hidden="true"
                className="invisible absolute whitespace-pre font-mono text-xs md:text-sm pointer-events-none"
              >{emailVal}</span>
              <input
                ref={inputRef}
                type="email"
                name="email"
                required
                autoComplete="email"
                aria-label="Email address"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onChange={(e) => {
                  setEmailVal(e.target.value);
                  requestAnimationFrame(() => {
                    if (mirrorRef.current) setCursorLeft(mirrorRef.current.getBoundingClientRect().width);
                  });
                }}
                className="w-full bg-transparent text-[#e0e0e0] outline-none caret-transparent font-mono text-xs md:text-sm peer"
                style={{ caretColor: "transparent" }}
              />
              {/* Custom blinking cursor positioned via mirror span measurement */}
              {focused && (
                <span
                  className="absolute top-0 inline-block w-[7px] h-[14px] bg-[#C9A04A] animate-blink translate-y-[1px] pointer-events-none"
                  style={{ left: `${cursorLeft}px` }}
                />
              )}
            </div>
            <button
              type="submit"
              className="ml-2 text-[#333] hover:text-[#34D399] transition-colors select-none flex-shrink-0 group"
              title="Press Enter or click to subscribe"
            >
              <span className="group-hover:hidden">⏎</span>
              <span className="hidden group-hover:inline text-[#34D399]">⏎</span>
            </button>
          </form>
        </div>

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
    </div>
  );
}
