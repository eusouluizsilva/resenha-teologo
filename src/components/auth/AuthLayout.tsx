import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { staggerContainer } from '@/lib/motion'
import { brandEyebrowClass, brandPanelClass, brandPanelLightClass, cn } from '@/lib/brand'

interface Props {
  children: React.ReactNode
  maxWidth?: string
  asideEyebrow: string
  asideTitle: string
  asideDescription: string
  highlights?: string[]
  quote?: string
  quoteReference?: string
  imageSrc?: string
}

export function AuthLayout({
  children,
  maxWidth = 'max-w-xl',
  asideEyebrow,
  asideTitle,
  asideDescription,
  highlights = [],
  quote,
  quoteReference,
  imageSrc = '/fotos/library-hall.jpg',
}: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0F141A] px-6 py-8 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[6%] top-[12%] h-56 w-56 rounded-full bg-[#F37E20]/10 blur-[120px]" />
        <div className="absolute right-[10%] top-[16%] h-72 w-72 rounded-full bg-white/4 blur-[140px]" />
        <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(15,20,26,0.22)_0%,rgba(15,20,26,0)_100%)]" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col gap-6 lg:grid lg:grid-cols-[1.05fr_0.95fr]"
      >
        <aside className={cn('relative hidden overflow-hidden p-8 lg:flex lg:flex-col lg:justify-center lg:gap-12', brandPanelClass)}>
          <div className="absolute inset-0">
            <img src={imageSrc} alt="" className="h-full w-full object-cover opacity-[0.16]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,18,0.62)_0%,rgba(15,20,26,0.92)_54%,rgba(15,20,26,0.98)_100%)]" />
          </div>

          <div className="relative z-10 flex justify-center">
            <Link to="/" className="inline-flex items-center">
              <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-24 w-auto" />
            </Link>
          </div>

          <div className="relative z-10 max-w-xl">
            <p className={brandEyebrowClass}>{asideEyebrow}</p>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.02] text-white xl:text-5xl">
              {asideTitle}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-white/66">{asideDescription}</p>

            {highlights.length > 0 && (
              <div className="mt-8 space-y-3">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[1.35rem] border border-white/7 bg-white/[0.03] px-5 py-4 text-sm leading-7 text-white/72"
                  >
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#F37E20]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(quote || quoteReference) && (
            <div className={cn('relative z-10 mt-8 max-w-md p-6', brandPanelLightClass)}>
              {quote && (
                <p className="text-lg leading-8 text-[#1C2430]" style={{ fontFamily: 'Source Serif 4, serif' }}>
                  {quote}
                </p>
              )}
              {quoteReference && (
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8B6D56]">
                  {quoteReference}
                </p>
              )}
            </div>
          )}
        </aside>

        <div className="flex min-h-full items-center justify-center">
          <div className={cn('w-full p-6 sm:p-8', maxWidth, brandPanelClass)}>
            <div className="mb-8 lg:hidden">
              <Link to="/" className="inline-flex items-center gap-3">
                <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-10 w-auto" />
              </Link>
              <p className={cn('mt-8', brandEyebrowClass)}>{asideEyebrow}</p>
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white">{asideTitle}</h1>
              <p className="mt-3 max-w-lg text-sm leading-7 text-white/62">{asideDescription}</p>
            </div>

            {children}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
