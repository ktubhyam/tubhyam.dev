'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * BorderBeam — a bright dot that travels along a panel's border.
 * Wrap around a term-panel or any positioned container.
 */
export function BorderBeam({
  color = 'var(--cyan)',
  duration = 4,
  size = 60,
  delay = 0,
}: {
  color?: string;
  duration?: number;
  size?: number;
  delay?: number;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
      {/* Top edge */}
      <div
        className="absolute top-0 h-px"
        style={{
          width: `${size}px`,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          animation: `border-beam-x ${duration}s ${delay}s linear infinite`,
          opacity: 0.7,
        }}
      />
      {/* Bottom edge */}
      <div
        className="absolute bottom-0 h-px"
        style={{
          width: `${size}px`,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          animation: `border-beam-x ${duration}s ${delay + duration / 2}s linear infinite`,
          opacity: 0.7,
        }}
      />
      {/* Left edge */}
      <div
        className="absolute left-0 w-px"
        style={{
          height: `${size}px`,
          background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
          animation: `border-beam-y ${duration}s ${delay + duration / 4}s linear infinite`,
          opacity: 0.7,
        }}
      />
      {/* Right edge */}
      <div
        className="absolute right-0 w-px"
        style={{
          height: `${size}px`,
          background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
          animation: `border-beam-y ${duration}s ${delay + (duration * 3) / 4}s linear infinite`,
          opacity: 0.7,
        }}
      />
    </div>
  );
}

/**
 * ScanLine — a horizontal line that sweeps down a container periodically.
 */
export function ScanLine({
  color = 'var(--cyan)',
  speed = 8,
  opacity = 0.06,
}: {
  color?: string;
  speed?: number;
  opacity?: number;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
      <div
        className="absolute left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${color} 20%, ${color} 80%, transparent 100%)`,
          opacity,
          animation: `scan-line ${speed}s linear infinite`,
        }}
      />
    </div>
  );
}

/**
 * FloatingParticles — tiny dots that drift upward like data ascending.
 * Particles are generated client-side only to avoid hydration mismatch.
 */
export function FloatingParticles({
  count = 20,
  color = 'var(--cyan)',
}: {
  count?: number;
  color?: string;
}) {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; delay: number; duration: number; size: number; opacity: number }>
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 6 + Math.random() * 8,
        size: 1 + Math.random() * 2,
        opacity: 0.1 + Math.random() * 0.3,
      }))
    );
  }, [count]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: '-5%',
            width: p.size,
            height: p.size,
            backgroundColor: color,
            opacity: 0,
          }}
          animate={{
            y: [0, -900],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

/**
 * DataStream — scrolling characters in the background, matrix-style but subtle.
 */
export function DataStream({
  columns = 12,
  color = 'var(--cyan)',
  opacity = 0.04,
}: {
  columns?: number;
  color?: string;
  opacity?: number;
}) {
  const chars = '01αβγδεθλμπσφψωΔΣΩ∞∑∫∂√≈≠±';
  const [streams, setStreams] = useState<Array<{ id: number; col: number; chars: string[]; delay: number; speed: number }>>([]);

  useEffect(() => {
    const s = Array.from({ length: columns }, (_, i) => ({
      id: i,
      col: (i / columns) * 100 + Math.random() * (100 / columns),
      chars: Array.from({ length: 8 + Math.floor(Math.random() * 12) }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ),
      delay: Math.random() * 6,
      speed: 4 + Math.random() * 6,
    }));
    setStreams(s);
  }, [columns]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none font-mono" style={{ opacity }}>
      {streams.map((stream) => (
        <motion.div
          key={stream.id}
          className="absolute text-[10px] leading-tight whitespace-pre"
          style={{
            left: `${stream.col}%`,
            top: '-20%',
            color,
          }}
          animate={{ y: ['0%', '120vh'] }}
          transition={{
            duration: stream.speed,
            delay: stream.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {stream.chars.map((c, i) => (
            <div key={i} style={{ opacity: 1 - i * 0.08 }}>{c}</div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * GlitchText — text with an occasional horizontal glitch.
 */
export function GlitchText({
  text,
  className = '',
  interval = 5000,
}: {
  text: string;
  className?: string;
  interval?: number;
}) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 150);
    }, interval + Math.random() * 2000);
    return () => clearInterval(id);
  }, [interval]);

  return (
    <span className={`relative inline-block ${className}`}>
      <span className={glitching ? 'invisible' : ''}>{text}</span>
      {glitching && (
        <>
          <span
            className="absolute top-0 left-0"
            style={{
              color: 'var(--cyan)',
              clipPath: 'inset(20% 0 40% 0)',
              transform: 'translateX(2px)',
            }}
          >
            {text}
          </span>
          <span
            className="absolute top-0 left-0"
            style={{
              color: 'var(--error)',
              clipPath: 'inset(60% 0 0 0)',
              transform: 'translateX(-2px)',
            }}
          >
            {text}
          </span>
          <span className="absolute top-0 left-0">{text}</span>
        </>
      )}
    </span>
  );
}

/**
 * StatusIndicator — pulsing dot with label, used for live status displays.
 */
export function StatusIndicator({
  label,
  value,
  color = 'var(--cyan)',
  active = true,
}: {
  label: string;
  value: string;
  color?: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          backgroundColor: active ? color : 'var(--border-bright)',
          boxShadow: active ? `0 0 6px ${color}` : 'none',
          animation: active ? 'glow-breathe 2s ease-in-out infinite' : 'none',
        }}
      />
      <span className="text-foreground/30">{label}</span>
      <span style={{ color: active ? color : 'var(--foreground)' }} className="font-bold">
        {value}
      </span>
    </div>
  );
}

/**
 * AnimatedCounter — number that animates when it changes.
 */
export function AnimatedCounter({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    const start = prevValue.current;
    const end = value;
    const diff = end - start;
    const steps = Math.min(Math.abs(diff), 20);
    const stepDuration = 300 / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      setDisplayValue(Math.round(start + diff * progress));
      if (step >= steps) {
        clearInterval(interval);
        setDisplayValue(end);
      }
    }, stepDuration);

    prevValue.current = value;
    return () => clearInterval(interval);
  }, [value]);

  return <span className={className}>{displayValue}</span>;
}

/**
 * ProgressPulse — a mini progress bar with a pulsing leading edge.
 */
export function ProgressPulse({
  progress,
  color = 'var(--accent)',
  height = 2,
}: {
  progress: number;
  color?: string;
  height?: number;
}) {
  return (
    <div className="w-full bg-border relative overflow-hidden" style={{ height }}>
      <motion.div
        className="h-full relative"
        style={{ backgroundColor: color }}
        animate={{ width: `${Math.min(progress * 100, 100)}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Pulsing leading edge */}
        {progress < 1 && (
          <div
            className="absolute right-0 top-0 w-2 h-full animate-pulse-glow"
            style={{
              background: `linear-gradient(90deg, transparent, ${color})`,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
