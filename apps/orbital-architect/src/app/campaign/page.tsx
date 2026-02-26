'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProgressStore } from '@/stores/progressStore';
import { useGameStore } from '@/stores/gameStore';
import { ELEMENTS } from '@/lib/chemistry';
import { SUBSHELL_COLORS } from '@/lib/chemistry/orbitals';

const PERIOD_LABELS = [
  { period: 1, label: 'Period 1', subtitle: 'the beginning', range: [1, 2] },
  { period: 2, label: 'Period 2', subtitle: 'first shell', range: [3, 10] },
  { period: 3, label: 'Period 3', subtitle: 'the pattern', range: [11, 18] },
  { period: 4, label: 'Period 4', subtitle: 'the d-block', range: [19, 36] },
];

function StarDisplay({ stars }: { stars: 0 | 1 | 2 | 3 }) {
  return (
    <div className="flex gap-px">
      {[1, 2, 3].map((s) => (
        <span key={s} className={`text-[10px] ${s <= stars ? 'text-warning' : 'text-foreground/10'}`}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function CampaignPage() {
  const router = useRouter();
  const campaignLevels = useProgressStore(s => s.campaignLevels);
  const eloRating = useProgressStore(s => s.eloRating.current);
  const startLevel = useGameStore(s => s.startLevel);
  const setMode = useGameStore(s => s.setMode);

  const handleStartLevel = (atomicNumber: number) => {
    setMode('campaign');
    startLevel(atomicNumber);
    router.push(`/campaign/play`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Grid background */}
      <div className="fixed inset-0 dot-bg opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="term-panel mb-6">
          <div className="term-header">
            <span className="flex-1">campaign // elements 1–36</span>
            <span className="text-accent normal-case tracking-normal font-bold">{eloRating} elo</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="text-xs text-foreground/30 hover:text-foreground/50 transition-colors font-mono">
              ← back
            </Link>
            <div>
              <h1 className="text-xl font-bold">Campaign</h1>
              <p className="text-xs text-foreground/40">Build every element from Hydrogen to Krypton</p>
            </div>
            <div className="w-12" />
          </div>
        </div>

        {/* Level grid by period */}
        <div className="space-y-6">
          {PERIOD_LABELS.map((period) => (
            <div key={period.period}>
              <div className="flex items-baseline gap-2 mb-2 px-1">
                <h2 className="text-sm font-bold font-mono text-foreground/60">{period.label}</h2>
                <span className="text-xs text-foreground/20 font-mono">// {period.subtitle}</span>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
                {ELEMENTS.filter(
                  (el) => el.atomicNumber >= period.range[0] && el.atomicNumber <= period.range[1]
                ).map((element) => {
                  const progress = campaignLevels[element.atomicNumber];
                  const isUnlocked = progress?.unlocked ?? false;
                  const isCompleted = progress?.completed ?? false;
                  const stars = progress?.bestStars ?? 0;

                  let color = SUBSHELL_COLORS.s;
                  if (element.atomicNumber >= 5 && element.atomicNumber <= 10) color = SUBSHELL_COLORS.p;
                  else if (element.atomicNumber >= 13 && element.atomicNumber <= 18) color = SUBSHELL_COLORS.p;
                  else if (element.atomicNumber >= 21 && element.atomicNumber <= 30) color = SUBSHELL_COLORS.d;
                  else if (element.atomicNumber >= 31 && element.atomicNumber <= 36) color = SUBSHELL_COLORS.p;

                  return (
                    <motion.button
                      key={element.atomicNumber}
                      whileHover={isUnlocked ? { scale: 1.05, y: -1 } : {}}
                      whileTap={isUnlocked ? { scale: 0.95 } : {}}
                      disabled={!isUnlocked}
                      onClick={() => handleStartLevel(element.atomicNumber)}
                      className={`relative p-2 border text-center transition-all font-mono ${
                        isCompleted
                          ? 'border-success/30 bg-success/3'
                          : isUnlocked
                            ? 'border-border hover:border-accent/40 bg-surface cursor-pointer'
                            : 'border-border/20 bg-surface/20 opacity-30 cursor-not-allowed'
                      }`}
                      style={isCompleted ? { borderColor: `${color}30` } : {}}
                    >
                      <div className="text-[9px] text-foreground/25 leading-none">
                        {element.atomicNumber}
                      </div>
                      <div
                        className="text-lg font-bold leading-tight"
                        style={{ color: isUnlocked ? color : undefined }}
                      >
                        {element.symbol}
                      </div>
                      <div className="text-[8px] text-foreground/30 leading-none truncate">
                        {element.name}
                      </div>

                      {isCompleted && (
                        <div className="mt-0.5">
                          <StarDisplay stars={stars} />
                        </div>
                      )}

                      {element.isAufbauException && isUnlocked && (
                        <div
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-warning/80 text-[7px] flex items-center justify-center text-black font-bold"
                        >
                          !
                        </div>
                      )}

                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center text-foreground/8 text-sm">
                          ×
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
