'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { GameLayout } from '@/components/game/GameLayout';
import { Tutorial, useTutorialSeen } from '@/components/game/Tutorial';
import { LevelBriefing } from '@/components/game/LevelBriefing';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useTeachingTriggers } from '@/hooks/useTeachingTriggers';

export default function CampaignPlayPage() {
  const router = useRouter();
  const phase = useGameStore(s => s.phase);
  const currentElement = useGameStore(s => s.currentElement);
  const tutorialSeen = useTutorialSeen();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  useTeachingTriggers();

  // Show briefing on level start
  useEffect(() => {
    if (phase === 'playing') {
      setShowBriefing(true);
    }
  }, [phase, currentElement]);

  // Show tutorial on first visit (after briefing dismisses)
  useEffect(() => {
    if (!tutorialSeen && phase === 'playing' && !showBriefing) {
      setShowTutorial(true);
    }
  }, [tutorialSeen, phase, showBriefing]);

  // If somehow navigated here without starting a level, redirect
  useEffect(() => {
    if (phase === 'menu' || phase === 'level-select') {
      router.push('/campaign');
    }
  }, [phase, router]);

  if (phase === 'menu' || phase === 'level-select') {
    return null;
  }

  return (
    <ErrorBoundary fallback={<div className="h-screen flex items-center justify-center bg-background font-mono text-foreground/40"><div className="term-panel p-6 text-center"><div className="text-error mb-2">rendering error</div><button onClick={() => window.location.reload()} className="text-cyan hover:text-cyan/80">reload page</button></div></div>}>
      <GameLayout />
      <AnimatePresence>
        {showBriefing && (
          <LevelBriefing
            atomicNumber={currentElement}
            onDismiss={() => setShowBriefing(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showTutorial && (
          <Tutorial onDismiss={() => setShowTutorial(false)} />
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
}
