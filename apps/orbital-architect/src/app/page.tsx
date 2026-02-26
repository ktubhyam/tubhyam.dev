'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useProgressStore } from '@/stores/progressStore';
import { INITIAL_RATING } from '@/lib/game/elo';
import { FloatingParticles, DataStream, GlitchText, StatusIndicator, BorderBeam, ProgressPulse } from '@/components/ui/TerminalEffects';

function TypingText({ text, delay = 0, speed = 40, className = '', onComplete }: {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length + 1));
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      onComplete?.();
    }
  }, [started, displayed, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="cursor-blink text-accent">▌</span>
      )}
    </span>
  );
}

function CompletionRing({ completed, total, label }: { completed: number; total: number; label: string }) {
  const pct = total > 0 ? completed / total : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={70} height={70} viewBox="0 0 70 70" className="transform -rotate-90">
        <circle cx={35} cy={35} r={radius} fill="none" stroke="var(--border)" strokeWidth={3} />
        <motion.circle
          cx={35} cy={35} r={radius} fill="none"
          stroke={pct >= 1 ? 'var(--success)' : 'var(--accent)'}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, delay: 2.2, ease: 'easeOut' }}
          style={{ filter: pct > 0 ? `drop-shadow(0 0 4px ${pct >= 1 ? 'var(--success)' : 'var(--accent)'})` : 'none' }}
        />
      </svg>
      <div className="text-center -mt-[52px] mb-[18px]">
        <div className="text-sm font-bold font-mono" style={{ color: pct >= 1 ? 'var(--success)' : 'var(--accent)' }}>
          {completed}
        </div>
        <div className="text-[8px] text-foreground/25">/{total}</div>
      </div>
      <div className="text-[9px] text-foreground/25 font-mono uppercase tracking-wider">{label}</div>
    </div>
  );
}

function EloSparkline({ history }: { history: Array<{ newRating: number }> }) {
  if (history.length < 2) {
    return (
      <div className="h-[50px] flex items-center justify-center text-[10px] text-foreground/15">
        play to see your rating chart
      </div>
    );
  }

  const ratings = history.map(h => h.newRating);
  const min = Math.min(...ratings) - 20;
  const max = Math.max(...ratings) + 20;
  const range = max - min || 1;
  const width = 200;
  const height = 50;

  const points = ratings.map((r, i) => {
    const x = (i / (ratings.length - 1)) * width;
    const y = height - ((r - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map(pct => (
        <line
          key={pct}
          x1={0} y1={height * pct} x2={width} y2={height * pct}
          stroke="var(--border)" strokeWidth={0.5}
        />
      ))}
      <polygon points={areaPoints} fill="url(#homeEloGrad)" opacity={0.3} />
      <polyline points={points} fill="none" stroke="var(--cyan)" strokeWidth={1.5} />
      <circle
        cx={width}
        cy={height - ((ratings[ratings.length - 1] - min) / range) * height}
        r={2.5}
        fill="var(--cyan)"
      />
      <defs>
        <linearGradient id="homeEloGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.4} />
          <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

const gameModes = [
  {
    cmd: './campaign',
    flag: '--mode=learn',
    title: 'Campaign',
    description: 'Build atoms H(1) through Kr(36). Master quantum rules one element at a time.',
    href: '/campaign',
    color: 'var(--accent)',
    status: '36 levels',
  },
  {
    cmd: './challenge',
    flag: '--timer=30s',
    title: 'Challenge',
    description: 'Random elements. 30s timer. Boost your Elo rating under pressure.',
    href: '/challenge',
    color: 'var(--cyan)',
    status: 'ranked',
  },
  {
    cmd: './sandbox',
    flag: '--rules=off',
    title: 'Sandbox',
    description: 'No rules. No timer. Place electrons anywhere and explore freely.',
    href: '/sandbox',
    color: 'var(--success)',
    status: 'free play',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 1.8 },
  },
};

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const ACHIEVEMENT_LABELS: Record<string, string> = {
  perfect_config: 'Perfectionist',
  no_mistakes: 'Flawless',
  all_36: 'Master Architect',
  noble_2: 'Helium',
  noble_10: 'Neon',
  noble_18: 'Argon',
  noble_36: 'Krypton',
  exception_hunter: 'Exception Hunter',
};

const ALL_ACHIEVEMENT_IDS = [
  'perfect_config', 'no_mistakes', 'all_36',
  'noble_2', 'noble_10', 'noble_18', 'noble_36',
  'exception_hunter',
];

export default function Home() {
  const [bootDone, setBootDone] = useState(false);

  const eloRating = useProgressStore(s => s.eloRating);
  const campaignLevels = useProgressStore(s => s.campaignLevels);
  const achievements = useProgressStore(s => s.achievements);
  const totalScore = useProgressStore(s => s.totalScore);
  const challengeLeaderboard = useProgressStore(s => s.challengeLeaderboard);

  const completedLevels = Object.values(campaignLevels).filter(l => l.completed).length;
  const totalStars = Object.values(campaignLevels).reduce((sum, l) => sum + (l.bestStars ?? 0), 0);
  const perfectLevels = Object.values(campaignLevels).filter(l => l.bestStars === 3).length;
  const totalAttempts = Object.values(campaignLevels).reduce((sum, l) => sum + (l.attempts ?? 0), 0);
  const bestChallengeStreak = challengeLeaderboard.reduce((max, e) => Math.max(max, e.streak), 0);
  const eloChange = eloRating.current - INITIAL_RATING;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-x-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* Floating particles */}
      <FloatingParticles count={25} color="var(--cyan)" />

      {/* Data stream in background */}
      <DataStream columns={8} color="var(--cyan)" opacity={0.03} />

      {/* Ambient glow — dual color */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-accent/3 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full blur-[120px]" style={{ backgroundColor: 'rgba(0, 216, 255, 0.02)' }} />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-6">
        {/* Dual-panel layout — stacks on mobile */}
        <div className="flex flex-col lg:flex-row gap-3 items-start">

          {/* LEFT PANEL — Command menu */}
          <div className="flex-1 min-w-0 w-full lg:w-auto">
            <div className="term-panel relative">
              <BorderBeam color="var(--cyan)" duration={6} size={80} />

              <div className="term-header">
                <span className="flex-1">orbital-architect v1.0</span>
                <span className="text-cyan-dim animate-flicker">active</span>
              </div>

              <div className="p-5 space-y-3 font-mono text-sm relative">
                {/* Boot sequence */}
                <div className="text-foreground/30">
                  <TypingText text="$ initializing quantum engine..." delay={200} speed={25} />
                </div>
                <div className="text-foreground/30">
                  <TypingText
                    text="$ loading orbital configurations [1s..4p]"
                    delay={1000}
                    speed={25}
                    onComplete={() => setBootDone(true)}
                  />
                </div>

                {/* System status readout */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: bootDone ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-4 py-1.5 text-[10px] border-y border-border/50"
                >
                  <StatusIndicator label="engine" value="ready" color="var(--success)" active={bootDone} />
                  <StatusIndicator label="elements" value="36" color="var(--cyan)" active={bootDone} />
                  <StatusIndicator label="rules" value="3" color="var(--accent)" active={bootDone} />
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6, duration: 0.4 }}
                  className="py-3"
                >
                  <div className="text-xs leading-tight select-none">
                    <span className="text-shimmer text-lg font-bold tracking-widest">
                      ORBITAL ARCHITECT
                    </span>
                  </div>
                  <div className="text-foreground/40 text-xs mt-2 ml-0.5">
                    Build atoms by filling electron orbitals.
                  </div>
                  <div className="text-foreground/25 text-xs ml-0.5">
                    <GlitchText text="Aufbau · Pauli Exclusion · Hund's Rule" interval={8000} />
                  </div>
                </motion.div>

                {/* Separator */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.7, duration: 0.4 }}
                  className="h-px bg-gradient-to-r from-transparent via-border-bright to-transparent origin-left"
                />

                {/* Mode commands */}
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="space-y-1.5"
                >
                  {gameModes.map((mode) => (
                    <motion.div key={mode.title} variants={item}>
                      <Link href={mode.href}>
                        <motion.div
                          whileHover={{
                            x: 4,
                            backgroundColor: 'var(--surface-2)',
                            borderColor: 'var(--border-bright)',
                          }}
                          transition={{ duration: 0.15 }}
                          className="group flex items-start gap-2 p-3 -mx-1 border border-transparent cursor-pointer"
                        >
                          <motion.span
                            className="shrink-0 mt-px font-bold"
                            style={{ color: mode.color }}
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            {'>'}
                          </motion.span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold" style={{ color: mode.color }}>
                                {mode.cmd}
                              </span>
                              <span className="text-foreground/25">{mode.flag}</span>
                              <span
                                className="ml-auto text-[10px] px-1.5 py-0.5 border shrink-0"
                                style={{
                                  color: mode.color,
                                  borderColor: `color-mix(in srgb, ${mode.color} 30%, transparent)`,
                                  backgroundColor: `color-mix(in srgb, ${mode.color} 5%, transparent)`,
                                }}
                              >
                                {mode.status}
                              </span>
                            </div>
                            <div className="text-foreground/35 text-xs mt-0.5">
                              {mode.description}
                            </div>
                          </div>
                          <span className="text-foreground/10 group-hover:text-foreground/40 transition-colors shrink-0 mt-px">
                            →
                          </span>
                        </motion.div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Ready prompt */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.8 }}
                  className="pt-2 text-foreground/30 text-xs flex items-center gap-1"
                >
                  <span className="text-cyan/60">$</span>
                  <span>select a mode to begin</span>
                  <span className="cursor-blink text-cyan">▌</span>
                </motion.div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — Live stats dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.0, duration: 0.5 }}
            className="w-full lg:w-[320px] shrink-0 flex flex-col gap-3"
          >
            {/* Elo Rating */}
            <div className="term-panel">
              <div className="term-header">
                <span className="flex-1">elo rating</span>
                <span className="text-foreground/20 normal-case tracking-normal">live</span>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-2xl font-bold text-accent glow-accent font-mono">
                      {eloRating.current}
                    </div>
                    <div className="text-[10px] text-foreground/25 font-mono">
                      peak: {eloRating.peak}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <StatusIndicator
                      label="change"
                      value={`${eloChange >= 0 ? '+' : ''}${eloChange}`}
                      color={eloChange >= 0 ? 'var(--success)' : 'var(--error)'}
                      active={eloRating.history.length > 0}
                    />
                    <StatusIndicator
                      label="games"
                      value={String(eloRating.history.length)}
                      color="var(--cyan)"
                      active={eloRating.history.length > 0}
                    />
                  </div>
                </div>
                <EloSparkline history={eloRating.history} />
              </div>
            </div>

            {/* Campaign Progress — visual rings */}
            <div className="term-panel">
              <div className="term-header">campaign progress</div>
              <div className="p-3">
                {/* Completion rings */}
                <div className="flex items-center justify-around mb-3">
                  <CompletionRing completed={completedLevels} total={36} label="elements" />
                  <CompletionRing completed={totalStars} total={108} label="stars" />
                  <CompletionRing completed={perfectLevels} total={36} label="perfect" />
                </div>

                {/* Stats row */}
                <div className="flex justify-between text-[10px] font-mono border-t border-border/30 pt-2">
                  <div className="text-center">
                    <div className="text-foreground/25">attempts</div>
                    <div className="text-cyan font-bold">{totalAttempts}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-foreground/25">score</div>
                    <div className="text-accent font-bold">{totalScore}</div>
                  </div>
                  {bestChallengeStreak > 0 && (
                    <div className="text-center">
                      <div className="text-foreground/25">best streak</div>
                      <div className="text-warning font-bold">{bestChallengeStreak}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="term-panel">
              <div className="term-header">
                <span className="flex-1">achievements</span>
                <span className="text-foreground/20 normal-case tracking-normal">
                  {achievements.length}/{ALL_ACHIEVEMENT_IDS.length}
                </span>
              </div>
              <div className="p-3">
                <div className="flex flex-wrap gap-1.5">
                  {ALL_ACHIEVEMENT_IDS.map(id => {
                    const earned = achievements.includes(id);
                    return (
                      <motion.div
                        key={id}
                        className={`text-[10px] font-mono px-2 py-1 border transition-all ${
                          earned
                            ? 'border-accent/40 bg-accent/5 text-accent'
                            : 'border-border/20 text-foreground/15'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        title={ACHIEVEMENT_LABELS[id]}
                      >
                        {earned ? ACHIEVEMENT_LABELS[id] : '???'}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* More stats link */}
            <Link
              href="/stats"
              className="text-[10px] text-foreground/20 hover:text-cyan/60 transition-colors font-mono text-center py-1"
            >
              [view detailed stats →]
            </Link>
          </motion.div>
        </div>

        {/* Status bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="flex items-center justify-between mt-3 text-[10px] text-foreground/20 font-mono px-1"
        >
          <span>elements 1–36</span>
          <span className="text-cyan-dim">H → Kr</span>
          <a href="https://tubhyam.dev" target="_blank" rel="noopener noreferrer" className="hover:text-foreground/40 transition-colors">tubhyam.dev</a>
        </motion.div>
      </div>
    </div>
  );
}
