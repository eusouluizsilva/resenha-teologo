import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

// Toast de celebração mostrado quando o aluno conclui uma aula. Aparece UMA
// vez por transição (não-concluída → concluída) e permanece 4s ou até o
// usuário fechar. Sem dependência de canvas-confetti: usa SVG + framer-motion
// para criar um pequeno burst on-brand. Respeita prefers-reduced-motion.

const PARTICLES = Array.from({ length: 12 }).map((_, i) => {
  const angle = (i / 12) * Math.PI * 2
  const radius = 70 + (i % 3) * 8
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    delay: i * 0.025,
    color: i % 3 === 0 ? '#F37E20' : i % 3 === 1 ? '#F2BD8A' : '#FFFFFF',
    size: i % 2 === 0 ? 6 : 4,
  }
})

export function ToastCelebracaoAula({
  trigger,
  onClose,
}: {
  // Incrementa para disparar o toast (use timestamp ou contador). 0 não
  // dispara — útil para evitar firing no primeiro render quando a aula já
  // estava concluída.
  trigger: number
  onClose?: () => void
}) {
  const [open, setOpen] = useState(false)
  const lastTriggerRef = useRef(0)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (trigger === 0 || trigger === lastTriggerRef.current) return
    lastTriggerRef.current = trigger
    setOpen(true)
    const timer = setTimeout(() => setOpen(false), 4000)
    return () => clearTimeout(timer)
  }, [trigger])

  const handleDismiss = () => {
    setOpen(false)
    onClose?.()
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.36, ease: 'easeOut' }}
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center px-4"
        >
          <div className="pointer-events-auto relative flex items-center gap-3 rounded-2xl border border-emerald-400/24 bg-[#0F141A]/95 px-5 py-3 text-sm text-white shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-md">
            {/* Burst de partículas atrás do checkmark */}
            {!prefersReduced ? (
              <div className="pointer-events-none absolute left-7 top-1/2 -z-0 h-0 w-0">
                {PARTICLES.map((p, i) => (
                  <motion.span
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                    animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: [0, 1, 0.6] }}
                    transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
                    className="absolute block rounded-full"
                    style={{
                      width: p.size,
                      height: p.size,
                      backgroundColor: p.color,
                      left: -p.size / 2,
                      top: -p.size / 2,
                    }}
                  />
                ))}
              </div>
            ) : null}

            <motion.div
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/15 text-emerald-300"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </motion.div>

            <div className="relative z-10">
              <p className="font-display text-sm font-bold leading-snug">Aula concluída</p>
              <p className="mt-0.5 text-xs text-white/56">+10 pontos. Bom trabalho.</p>
            </div>

            <Link
              to="/dashboard/conquistas"
              onClick={handleDismiss}
              className="relative z-10 ml-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/72 transition-colors hover:border-white/24 hover:bg-white/[0.08] hover:text-white"
            >
              Ver conquistas
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Fechar"
              className="relative z-10 ml-1 rounded-full p-1 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
