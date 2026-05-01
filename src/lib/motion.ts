import type { Variants, Transition } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'

const spring: Transition = { duration: 0.52, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
const fast: Transition = { duration: 0.36, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: spring },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.36, ease: 'easeOut' } },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

export const scaleSoft: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: fast },
}

export const pageEnter = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: fast },
  exit: { opacity: 0, y: -8, transition: { duration: 0.24, ease: 'easeIn' as const } },
}

// Helper: variants colapsadas pra atender prefers-reduced-motion (WCAG 2.3.3).
// Componentes JS-driven (m.div) não respeitam o media query CSS sozinhos, então
// passam isso quando `useReducedMotionVariants()` retorna true.
const REDUCED_NONE: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { duration: 0 } },
}

export function useMotionVariants() {
  const reduce = useReducedMotion()
  if (!reduce) {
    return { fadeUp, fadeIn, staggerContainer, scaleSoft, pageEnter }
  }
  return {
    fadeUp: REDUCED_NONE,
    fadeIn: REDUCED_NONE,
    staggerContainer: { hidden: {}, visible: {} } as Variants,
    scaleSoft: REDUCED_NONE,
    pageEnter: {
      initial: { opacity: 1 },
      animate: { opacity: 1, transition: { duration: 0 } },
      exit: { opacity: 1, transition: { duration: 0 } },
    },
  }
}
