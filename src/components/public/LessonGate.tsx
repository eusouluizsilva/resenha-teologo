// Overlay sobre a thumbnail de uma aula no preview público. CTA principal:
// criar conta + matricular. Secundário: já tenho conta. Texto enfatiza que
// é gratuito e que certificado exige login (nudge de conversão).

import { Link } from 'react-router-dom'

interface LessonGateProps {
  thumbnailUrl: string | null
  courseId: string
  courseSlug: string | null
  isAuthenticated: boolean
}

export function LessonGate({ thumbnailUrl, courseId, courseSlug, isAuthenticated }: LessonGateProps) {
  const courseRef = courseSlug ?? courseId
  const returnPath = `/cursos/${courseRef}`
  const ctaPrimaryHref = isAuthenticated
    ? `/cursos/${courseRef}`
    : `/cadastro?redirect=${encodeURIComponent(returnPath)}`
  const ctaSecondaryHref = `/entrar?redirect=${encodeURIComponent(returnPath)}`

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[1.6rem] border border-white/8 bg-[#0A0E13] shadow-[0_28px_80px_rgba(0,0,0,0.4)]">
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,20,26,0.50)_0%,rgba(10,14,19,0.86)_100%)]" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#F37E20]/30 bg-[#F37E20]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F2BD8A]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#F37E20]" />
          100% gratuito
        </span>
        <h2 className="mt-4 max-w-md font-display text-2xl font-bold leading-tight text-white md:text-3xl">
          {isAuthenticated
            ? 'Matricule-se e assista esta aula agora.'
            : 'Crie sua conta gratuita para assistir esta aula.'}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-white/72">
          Acesso ao curso completo, quizzes, certificado oficial e caderno digital. Sem cartão de crédito, sem mensalidade.
        </p>

        <div className="mt-7 flex w-full max-w-sm flex-col gap-3">
          <Link
            to={ctaPrimaryHref}
            className="inline-flex items-center justify-center rounded-2xl bg-[#F37E20] px-6 py-3.5 text-sm font-bold text-white shadow-[0_18px_50px_rgba(243,126,32,0.30)] transition-all hover:bg-[#e06e10]"
          >
            {isAuthenticated ? 'Ir para a página do curso' : 'Criar conta gratuita e assistir'}
          </Link>
          {!isAuthenticated && (
            <Link
              to={ctaSecondaryHref}
              className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white/76 transition-all hover:border-white/20 hover:text-white"
            >
              Já tenho conta. Entrar
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
