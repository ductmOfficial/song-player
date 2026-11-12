/**
 * Motion tokens. Mirrored as CSS variables in tokens.css so CSS transitions and
 * Motion (JS) animations share one vocabulary.
 */
export const duration = {
  instant: 0.08,
  fast: 0.14,
  base: 0.22,
  slow: 0.36,
  slower: 0.6,
} as const;

export const ease = {
  /** Most UI transitions */
  standard: [0.2, 0, 0, 1],
  /** Elements entering or drawing attention */
  emphasized: [0.3, 0, 0, 1],
  /** Elements leaving */
  exit: [0.3, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const spring = {
  /** Buttons, toggles: quick and firm */
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  /** Larger surfaces: player sheet, panels */
  gentle: { type: "spring", stiffness: 220, damping: 28 },
} as const;

/** Orchestrated entrance: use once per screen, not on every section. */
export const variants = {
  stagger: {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
  },
  rise: {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.emphasized } },
  },
} as const;
