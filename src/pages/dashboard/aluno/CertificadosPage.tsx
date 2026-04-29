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
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/4 px-4 py-2.5 text-sm font-semibold text-white/82 transition-all duration-200 hover:border-white/22 hover:bg-white/8"
                    onClick={() => handleShare(course.title, verificationCode)}
                    title="Compartilhar certificado"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                    {copiedCode === verificationCode ? 'Link copiado' : 'Compartilhar'}
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
