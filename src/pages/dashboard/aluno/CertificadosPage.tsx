import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import { brandPanelClass, brandStatusPillClass, cn } from '@/lib/brand'
import { deriveVerificationCode } from '@/lib/certificate'
import { CertificatePreview } from '@/components/certificate/CertificatePreview'

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(ts))
}

function levelLabel(level: string) {
  if (level === 'iniciante') return 'Iniciante'
  if (level === 'intermediario') return 'Intermediario'
  return 'Avancado'
}

type PreviewData = {
  studentName: string
  courseTitle: string
  creatorName: string
  completedAt: number
  finalScore?: number
  verificationCode: string
  totalDurationSeconds?: number
  lessonsCount?: number
}

export function CertificadosPage() {
  const data = useQuery(api.enrollments.listCertificates)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState<PreviewData | null>(null)

  const isLoading = data === undefined

  async function handleShare(courseTitle: string, code: string) {
    const url = `https://resenhadoteologo.com/verificar/${code}`
    const shareText = `Concluí o curso "${courseTitle}" na Resenha do Teólogo. Verifique meu certificado:`
    const shareData = { title: 'Meu certificado', text: shareText, url }

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // usuário cancelou ou API falhou: caímos no fallback de copiar
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${url}`)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 2400)
    } catch {
      // noop
    }
  }

  return (
    <DashboardPageShell
      eyebrow="Aluno"
      title="Certificados"
      description="Seus certificados de conclusao emitidos pela plataforma. Media minima de 70% para emissao."
      maxWidthClass="max-w-5xl"
      actions={
        <Link
          to="/dashboard/certificados/como-conseguir"
          className="inline-flex items-center gap-2 rounded-2xl border border-[#F37E20]/22 bg-[#F37E20]/10 px-5 py-3 text-sm font-semibold text-[#F2BD8A] transition-all duration-200 hover:border-[#F37E20]/40 hover:bg-[#F37E20]/16"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          Como conseguir
        </Link>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={cn('animate-pulse p-6', brandPanelClass)}>
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-white/8" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-1/2 rounded-lg bg-white/8" />
                  <div className="h-4 w-1/3 rounded-lg bg-white/6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          }
          title="Nenhum certificado ainda"
          description="Conclua um curso com media igual ou superior a 70% para receber seu certificado de conclusao automaticamente."
          action={
            <Link
              to="/dashboard/meus-cursos"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#F37E20] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#e06e10]"
            >
              Ver meus cursos
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {data.map((row) => {
            const { enrollment, course, studentName, creatorName, totalDurationSeconds, publishedLessonsCount } = row
            if (!course) return null

            const verificationCode = deriveVerificationCode(enrollment._id)
            const handlePreview = () => {
              setPreviewing({
                studentName,
                courseTitle: course.title,
                creatorName,
                completedAt: enrollment.completedAt ?? Date.now(),
                finalScore: enrollment.finalScore,
                verificationCode,
                totalDurationSeconds,
                lessonsCount: publishedLessonsCount,
              })
            }

            return (
              <div
                key={enrollment._id}
                className={cn(
                  'flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between',
                  brandPanelClass,
                )}
              >
                <div className="flex items-center gap-5">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-emerald-400/18 bg-emerald-400/8 text-emerald-300">
                    <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.58 3.737 3.745 3.745 0 01-3.596 1.436 3.745 3.745 0 01-2.807 1.324 3.745 3.745 0 01-2.807-1.324 3.745 3.745 0 01-3.597-1.436 3.745 3.745 0 01-.58-3.737A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.58-3.737 3.745 3.745 0 013.597-1.436 3.745 3.745 0 012.807-1.324 3.745 3.745 0 012.807 1.324 3.745 3.745 0 013.596 1.436 3.745 3.745 0 01.58 3.737A3.745 3.745 0 0121 12z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg font-semibold text-white">{course.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className={brandStatusPillClass('success')}>Concluido</span>
                      <span className={brandStatusPillClass('neutral')}>{levelLabel(course.level)}</span>
                      {enrollment.finalScore !== undefined && (
                        <span className={brandStatusPillClass('accent')}>Nota: {enrollment.finalScore.toFixed(0)}%</span>
                      )}
                      {enrollment.completedAt && (
                        <span className="text-xs text-white/36">{formatDate(enrollment.completedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                  <div className="flex items-center gap-1">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Concluí o curso "${course.title}" na Resenha do Teólogo. Verifique meu certificado: https://resenhadoteologo.com/verificar/${verificationCode}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Compartilhar no WhatsApp"
                      aria-label="Compartilhar no WhatsApp"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/4 text-white/72 transition-all hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://resenhadoteologo.com/verificar/${verificationCode}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Compartilhar no LinkedIn"
                      aria-label="Compartilhar no LinkedIn"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/4 text-white/72 transition-all hover:border-sky-400/30 hover:bg-sky-400/10 hover:text-sky-300"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Concluí o curso "${course.title}" na Resenha do Teólogo.`)}&url=${encodeURIComponent(`https://resenhadoteologo.com/verificar/${verificationCode}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Compartilhar no X (Twitter)"
                      aria-label="Compartilhar no X"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/4 text-white/72 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/4 px-4 py-2.5 text-sm font-semibold text-white/82 transition-all duration-200 hover:border-white/22 hover:bg-white/8"
                    onClick={() => handleShare(course.title, verificationCode)}
                    title="Copiar link do certificado"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                    {copiedCode === verificationCode ? 'Copiado' : 'Copiar link'}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition-all duration-200 hover:border-emerald-400/35 hover:bg-emerald-400/14"
                    onClick={handlePreview}
                    title="Visualizar e imprimir certificado"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Visualizar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {previewing && (
        <CertificatePreview data={previewing} onClose={() => setPreviewing(null)} />
      )}
    </DashboardPageShell>
  )
}
