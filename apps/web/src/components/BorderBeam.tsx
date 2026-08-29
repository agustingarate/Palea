'use client';

import type { CSSProperties } from 'react';
import {
  motion,
  useReducedMotion,
  type MotionStyle,
  type Transition,
} from 'motion/react';

type BorderBeamProps = {
  borderWidth?: number;
  className?: string;
  colorFrom?: string;
  colorHighlight?: string;
  colorTo?: string;
  delay?: number;
  duration?: number;
  initialOffset?: number;
  reverse?: boolean;
  size?: number;
  transition?: Transition;
};

/**
 * Adapted from Magic UI's Border Beam registry component for Palea's CSS and
 * reduced-motion conventions. The moving element follows a CSS offset path,
 * so it never participates in the card's layout.
 */
export function BorderBeam({
  borderWidth = 1,
  className = '',
  colorFrom = 'var(--web-accent)',
  colorHighlight = '#fff',
  colorTo = 'var(--web-data-pink)',
  delay = 0,
  duration = 8,
  initialOffset = 0,
  reverse = false,
  size = 96,
  transition,
}: BorderBeamProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return null;

  return (
    <span
      aria-hidden="true"
      className={`border-beam ${className}`}
      style={{ '--border-beam-width': `${borderWidth}px` } as CSSProperties}
    >
      <motion.span
        className="border-beam-trail"
        style={
          {
            width: size,
            backgroundImage: `radial-gradient(ellipse at center, ${colorHighlight} 0%, color-mix(in srgb, ${colorHighlight} 45%, ${colorTo}) 7%, ${colorTo} 20%, color-mix(in srgb, ${colorTo} 82%, ${colorFrom}) 32%, color-mix(in srgb, ${colorTo} 68%, ${colorFrom}) 43%, color-mix(in srgb, ${colorTo} 48%, ${colorFrom}) 54%, color-mix(in srgb, ${colorTo} 28%, ${colorFrom}) 64%, color-mix(in srgb, ${colorFrom} 14%, transparent) 74%, transparent 84%)`,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          } as MotionStyle
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration,
          delay: -delay,
          ...transition,
        }}
      />
    </span>
  );
}
