/**
 * TypewriterCycle — Types out a phrase, pauses, deletes it, then types the next one.
 * Creates a looping typewriter with cursor blink. Shows what you do / what you build.
 */
import { useState, useEffect, useRef } from "react";
import { useInView } from "motion/react";

interface Props {
  phrases: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export default function TypewriterCycle({
  phrases,
  className = "",
  typingSpeed = 60,
  deletingSpeed = 35,
  pauseDuration = 2000,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true });
  const [displayed, setDisplayed] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isInView) return;

    const currentPhrase = phrases[phraseIndex];

    if (isPaused) {
      const timeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(timeout);
    }

    if (isDeleting) {
      if (displayed.length === 0) {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
        return;
      }
      const timeout = setTimeout(() => {
        setDisplayed((prev) => prev.slice(0, -1));
      }, deletingSpeed);
      return () => clearTimeout(timeout);
    }

    if (displayed.length < currentPhrase.length) {
      const timeout = setTimeout(() => {
        setDisplayed(currentPhrase.slice(0, displayed.length + 1));
      }, typingSpeed);
      return () => clearTimeout(timeout);
    }

    // Finished typing — pause
    setIsPaused(true);
  }, [displayed, isDeleting, isPaused, phraseIndex, phrases, isInView, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span ref={ref} className={className}>
      {displayed}
      <span className="inline-block w-[2px] h-[1em] bg-[#C9A04A] ml-0.5 align-middle animate-blink" />
    </span>
  );
}
