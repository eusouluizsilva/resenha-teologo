// Helpers compartilhados pelas seções da landing. Só componentes aqui (Fast
// Refresh exige separação): hooks/utils ficam em `useInView.ts`.

export function CheckMark({ muted = false }: { muted?: boolean }) {
  return muted ? (
    <svg className="mx-auto h-4 w-4 text-white/25" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg className="mx-auto h-5 w-5 text-[#F37E20]" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function XMark() {
  return (
    <svg className="mx-auto h-4 w-4 text-white/15" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
}

type SectionIntroProps = {
  eyebrow: string
  title: string
  description: string
  light?: boolean
  centered?: boolean
}

export function SectionIntro({ eyebrow, title, description, light = false, centered = false }: SectionIntroProps) {
  const titleColor = light ? 'text-[#111827]' : 'text-white'
  const textColor = light ? 'text-[#5A6472]' : 'text-white/55'

  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : ''}>
      <span className={`text-xs font-semibold uppercase tracking-[0.28em] ${light ? 'text-[#A05F26]' : 'text-[#F37E20]'}`}>
        {eyebrow}
      </span>
      <h2 className={`mt-4 font-display text-3xl font-bold leading-tight md:text-4xl ${titleColor}`}>{title}</h2>
      <p className={`mt-4 max-w-2xl text-sm leading-7 md:text-base ${textColor} ${centered ? 'mx-auto' : ''}`}>{description}</p>
    </div>
  )
}

export function CoursePlaceholderCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-dashed border-[#CFC2B2] bg-white/55">
      <div className="relative flex aspect-[16/9] w-full items-center justify-center bg-[#F37E20]/6">
        <svg className="h-12 w-12 text-[#F37E20]/35" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
        <span className="absolute left-3 top-3 rounded-full border border-[#CFC2B2] bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9D7B5E]">
          Em breve
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A05F26]/70">
          Novos cursos
        </p>
        <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-[#5A6472]">
          Mais cursos chegando em breve
        </h3>
        <p className="mt-2 line-clamp-3 font-serif text-sm leading-6 text-[#7A8390]">
          Estamos preparando novos cursos teológicos para você. Volte em breve para conferir.
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-[#9CA3AF]">
          <div className="h-6 w-6 rounded-full border border-dashed border-[#CFC2B2]" />
          <span>Resenha do Teólogo</span>
        </div>
      </div>
    </div>
  )
}
