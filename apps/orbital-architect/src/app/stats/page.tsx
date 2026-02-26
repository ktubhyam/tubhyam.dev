'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useProgressStore } from '@/stores/progressStore';
import { useEducationStore } from '@/stores/educationStore';
import { INITIAL_RATING } from '@/lib/game/elo';
import { EDUCATION_CONTENT } from '@/lib/education';
import { StatusIndicator } from '@/components/ui/TerminalEffects';

function EloSparkline({ history }: { history: Array<{ newRating: number }> }) {
  if (history.length < 2) {
    return <div className="text-[10px] text-foreground/20 py-4">not enough data for chart</div>;
  }

  const ratings = history.map(h => h.newRating);
  const min = Math.min(...ratings) - 20;
  const max = Math.max(...ratings) + 20;
  const range = max - min || 1;
  const width = 300;
  const height = 80;

  const points = ratings.map((r, i) => {
    const x = (i / (ratings.length - 1)) * width;
    const y = height - ((r - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(pct => (
        <line
          key={pct}
          x1={0} y1={height * pct} x2={width} y2={height * pct}
          stroke="var(--border)" strokeWidth={0.5}
        />
      ))}
      {/* Fill area */}
      <polygon
        points={areaPoints}
        fill="url(#eloGradient)"
        opacity={0.3}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="var(--cyan)"
        strokeWidth={1.5}
      />
      {/* Current dot */}
      <circle
        cx={width}
        cy={height - ((ratings[ratings.length - 1] - min) / range) * height}
        r={3}
        fill="var(--cyan)"
      />
      <defs>
        <linearGradient id="eloGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.4} />
          <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AchievementBadge({ id, earned }: { id: string; earned: boolean }) {
  const labels: Record<string, { name: string; desc: string }> = {
    perfect_config: { name: 'Perfectionist', desc: '3 stars on any level' },
    no_mistakes: { name: 'Flawless', desc: 'Complete with 0 mistakes, 0 hints' },
    all_36: { name: 'Master Architect', desc: 'Complete all 36 elements' },
    noble_2: { name: 'Helium', desc: '3★ on He' },
    noble_10: { name: 'Neon', desc: '3★ on Ne' },
    noble_18: { name: 'Argon', desc: '3★ on Ar' },
    noble_36: { name: 'Krypton', desc: '3★ on Kr' },
    exception_hunter: { name: 'Exception Hunter', desc: 'Perfect on Cr or Cu' },
  };

  const info = labels[id] ?? { name: id, desc: '' };

  return (
    <div
      className={`border p-2 text-center font-mono transition-all ${
        earned
          ? 'border-accent/40 bg-accent/5'
          : 'border-border/30 bg-surface/30 opacity-30'
      }`}
      title={info.desc}
    >
      <div className={`text-xs font-bold ${earned ? 'text-accent' : 'text-foreground/20'}`}>
        {info.name}
      </div>
      <div className="text-[9px] text-foreground/30 mt-0.5">{info.desc}</div>
    </div>
  );
}

export default function StatsPage() {
  const eloRating = useProgressStore(s => s.eloRating);
  const campaignLevels = useProgressStore(s => s.campaignLevels);
  const achievements = useProgressStore(s => s.achievements);
  const totalScore = useProgressStore(s => s.totalScore);
  const challengeLeaderboard = useProgressStore(s => s.challengeLeaderboard);
  const seenContentIds = useEducationStore(s => s.seenContentIds);

  // Compute stats
  const completedLevels = Object.values(campaignLevels).filter(l => l.completed).length;
  const totalStars = Object.values(campaignLevels).reduce((sum, l) => sum + (l.bestStars ?? 0), 0);
  const perfectLevels = Object.values(campaignLevels).filter(l => l.bestStars === 3).length;
  const totalAttempts = Object.values(campaignLevels).reduce((sum, l) => sum + (l.attempts ?? 0), 0);
  const bestChallengeStreak = challengeLeaderboard.reduce((max, e) => Math.max(max, e.streak), 0);
  const conceptsLearned = seenContentIds.length;
  const totalConcepts = EDUCATION_CONTENT.filter(e => e.showOnce).length;

  const allAchievementIds = [
    'perfect_config', 'no_mistakes', 'all_36',
    'noble_2', 'noble_10', 'noble_18', 'noble_36',
    'exception_hunter',
  ];

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="fixed inset-0 dot-bg opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto p-6 pb-20">
        {/* Header */}
        <div className="term-panel mb-6">
          <div className="term-header">
            <span className="flex-1">stats // player profile</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="text-xs text-foreground/30 hover:text-foreground/50 transition-colors font-mono">
              ← back
            </Link>
            <h1 className="text-xl font-bold">Statistics</h1>
            <div className="w-12" />
          </div>
        </div>

        {/* Elo Rating Card */}
        <div className="term-panel mb-4">
          <div className="term-header">elo rating</div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-3xl font-bold text-accent glow-accent font-mono">
                  {eloRating.current}
                </div>
                <div className="text-xs text-foreground/30 mt-0.5">
                  peak: {eloRating.peak}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <StatusIndicator
                  label="change"
                  value={
                    eloRating.history.length > 0
                      ? `${eloRating.current - INITIAL_RATING >= 0 ? '+' : ''}${eloRating.current - INITIAL_RATING}`
                      : '0'
                  }
                  color={eloRating.current >= INITIAL_RATING ? 'var(--success)' : 'var(--error)'}
                  active
                />
                <StatusIndicator
                  label="games"
                  value={String(eloRating.history.length)}
                  color="var(--cyan)"
                  active
                />
              </div>
            </div>
            <EloSparkline history={eloRating.history} />
            <div className="flex justify-between text-[9px] text-foreground/20 font-mono mt-1">
              <span>oldest</span>
              <span>most recent</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { label: 'completed', value: `${completedLevels}/36`, color: 'var(--accent)' },
            { label: 'total_stars', value: `${totalStars}/${36 * 3}`, color: 'var(--warning)' },
            { label: 'perfect_3★', value: String(perfectLevels), color: 'var(--success)' },
            { label: 'attempts', value: String(totalAttempts), color: 'var(--cyan)' },
            { label: 'total_score', value: String(totalScore), color: 'var(--accent)' },
            { label: 'best_challenge', value: String(bestChallengeStreak), color: 'var(--warning)' },
            { label: 'achievements', value: `${achievements.length}/${allAchievementIds.length}`, color: 'var(--cyan)' },
            { label: 'elo_peak', value: String(eloRating.peak), color: 'var(--accent)' },
            { label: 'concepts', value: `${conceptsLearned}/${totalConcepts}`, color: 'var(--success)' },
          ].map((stat) => (
            <div key={stat.label} className="term-panel p-3 text-center font-mono">
              <div className="text-[10px] text-foreground/30 uppercase tracking-wider">{stat.label}</div>
              <div className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="term-panel mb-4">
          <div className="term-header">achievements</div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {allAchievementIds.map((id) => (
              <AchievementBadge key={id} id={id} earned={achievements.includes(id)} />
            ))}
          </div>
        </div>

        {/* Challenge Leaderboard */}
        {challengeLeaderboard.length > 0 && (
          <div className="term-panel">
            <div className="term-header">challenge leaderboard</div>
            <div className="p-3 space-y-1 font-mono text-xs">
              {challengeLeaderboard.slice(0, 10).map((entry, i) => (
                <div key={i} className="flex items-center justify-between border border-border/40 p-2 bg-black/10">
                  <span className="text-foreground/25 w-6">#{i + 1}</span>
                  <span className="text-accent font-bold">+{entry.score} elo</span>
                  <span className="text-cyan">{entry.streak} elements</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
