import type { Transition, Variants } from 'framer-motion';

// Shared spring configs
export const spring = {
  default: { type: 'spring', stiffness: 350, damping: 25 } as Transition,
  snappy: { type: 'spring', stiffness: 450, damping: 28 } as Transition,
  gentle: { type: 'spring', stiffness: 200, damping: 20 } as Transition,
};

// Modal overlay (backdrop + panel)
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalPanel: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 25, delay: 0.05 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 16,
    transition: { duration: 0.15 },
  },
};

// Toast notifications
export const toast: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

// Staggered list container + items
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, x: -6 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 },
  },
};

// Interactive elements
export const buttonHover = { scale: 1.05, y: -1 };
export const buttonTap = { scale: 0.95 };

// Pop-in for individual elements (electrons, badges, etc.)
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 450, damping: 25 },
  },
  exit: { opacity: 0, scale: 0, transition: { duration: 0.1 } },
};

// Fade slide (for info panels, tooltips)
export const fadeSlide: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: 6, transition: { duration: 0.12 } },
};
