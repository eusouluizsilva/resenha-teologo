// Lista de certificados do aluno em 3 estados:
//  - paid: tem certificateOrders.status='paid' → botão "Baixar PDF" via storage URL
//  - pending-payment: curso concluído (certificateIssued=true) sem order paid → CTA "Pagar R$ 29,90"
//  - locked: legacy enrollments com certificateIssued=true e sem order, OU casos onde o aluno
//            ainda não concluiu o curso (referência de progresso só, sem CTA de pagamento)
//
// Fonte de dados: combina api.enrollments.listByStudent (todas matrículas) +
// api.certificates.listMyPaidOrders (orders pagos). O legacy fallback de PDF
// client-side foi removido aqui — paid-only daqui pra frente. Quem comprou
// antes do flow paid pode usar /verificar/{code} pra validar.

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import {
  brandPanelClass,
  brandPrimaryButtonClass,
  brandSecondaryButtonClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'
import { EmptyCertificateIllustration } from '@/components/ui/EmptyIllustration'

type CardState = 'paid' | 'pending-payment' | 'locked'

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(ts))
}

function levelLabel(level: string) {
  if (level === 'iniciante') return 'Iniciante'
  if (level === 'intermediario') return 'Intermediário'
  return 'Avançado'
}

export function CertificadosPage() {
  const enrollments = useQuery(api.enrollments.listByStudent)
  const paidOrders = useQuery(api.certificates.listMyPaidOrders)

  const isLoading = enrollments === undefined || paidOrders === undefined

  // Index dos paid orders por courseId pra cruzar com enrollments em O(1).
  const ordersByCourseId = useMemo(() => {
    const map = new Map<string, NonNullable<typeof paidOrders>[number]>()
    for (const o of paidOrders ?? []) {
      map.set(o.courseId, o)
    }
    return map
  }, [paidOrders])

  const cards = useMemo(() => {
    if (!enrollments) return []
    return enrollments
      .filter((row): row is NonNullable<typeof row> => !!row && !!row.course)
      .map((row) => {
        const courseId = row.course._id
        const paid = ordersByCourseId.get(courseId as string)
        let state: CardState = 'locked'
        if (paid) state = 'paid'
        else if (row.enrollment.certificateIssued) state = 'pending-payment'
        return { row, paid, state }
      })
      .sort((a, b) => {
        // Ordem: paid → pending → locked. Dentro do mesmo bucket, mais recente primeiro.
        const order: Record<CardState, number> = { paid: 0, 'pending-payment': 1, locked: 2 }
        if (order[a.state] !== order[b.state]) return order[a.state] - order[b.state]
        const aTs = a.paid?.paidAt ?? a.row.enrollment.completedAt ?? a.row.enrollment._creationTime
        const bTs = b.paid?.paidAt ?? b.row.enrollment.completedAt ?? b.row.enrollment._creationTime
        return bTs - aTs
      })
  }, [enrollments, ordersByCourseId])

  return (
    <DashboardPageShell
      eyebrow="Aluno"
      title="Certificados"
      description="Emita o PDF oficial dos cursos que você concluiu, com QR code e verificação pública."
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
      ) : cards.length === 0 ? (
        <DashboardEmptyState
          illustration={<EmptyCertificateIllustration />}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          }
          title="Nenhum certificado disponível"
          description="Matricule-se em um curso e conclua todas as aulas (com média mínima de 70%) para liberar a emissão do certificado."
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
          {cards.map(({ row, paid, state }) => (
            <CertificateCard
              key={row.enrollment._id}
              courseId={row.course._id}
              courseTitle={row.course.title}
              level={row.course.level}
              percentage={row.percentage}
              completedAt={row.enrollment.completedAt}
              finalScore={row.enrollment.finalScore}
              state={state}
              orderId={paid?._id}
              verificationCode={paid?.verificationCode}
              hasPdf={!!paid?.hasPdf}
              paidAt={paid?.paidAt ?? null}
            />
          ))}
        </div>
      )}
    </DashboardPageShell>
  )
}

type CertificateCardProps = {
  courseId: Id<'courses'>
  courseTitle: string
  level: string
  percentage: number
  completedAt: number | undefined
  finalScore: number | undefined
  state: CardState
  orderId?: Id<'certificateOrders'>
  verificationCode?: string
  hasPdf: boolean
  paidAt: number | null
}

function CertificateCard(props: CertificateCardProps) {
  const { courseTitle, level, percentage, completedAt, finalScore, state, courseId, verificationCode } = props

  const tone = state === 'paid' ? 'success' : state === 'pending-payment' ? 'accent' : 'neutral'
  const label = state === 'paid' ? 'Emitido' : state === 'pending-payment' ? 'Pronto para emitir' : 'Em andamento'

  return (
    <div
      className={cn(
        'flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between',
        brandPanelClass,
      )}
    >
      <div className="flex items-center gap-5">
        <div
          className={cn(
            'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border',
            state === 'paid' && 'border-emerald-400/18 bg-emerald-400/8 text-emerald-300',
            state === 'pending-payment' && 'border-[#F37E20]/22 bg-[#F37E20]/10 text-[#F37E20]',
            state === 'locked' && 'border-white/10 bg-white/4 text-white/40',
          )}
        >
          {state === 'locked' ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          ) : (
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.58 3.737 3.745 3.745 0 01-3.596 1.436 3.745 3.745 0 01-2.807 1.324 3.745 3.745 0 01-2.807-1.324 3.745 3.745 0 01-3.597-1.436 3.745 3.745 0 01-.58-3.737A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.58-3.737 3.745 3.745 0 013.597-1.436 3.745 3.745 0 012.807-1.324 3.745 3.745 0 012.807 1.324 3.745 3.745 0 013.596 1.436 3.745 3.745 0 01.58 3.737A3.745 3.745 0 0121 12z" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold text-white">{courseTitle}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className={brandStatusPillClass(tone)}>{label}</span>
            <span className={brandStatusPillClass('neutral')}>{levelLabel(level)}</span>
            {state !== 'locked' && finalScore !== undefined && (
              <span className={brandStatusPillClass('accent')}>Nota: {finalScore.toFixed(0)}%</span>
            )}
            {state === 'locked' && (
              <span className="text-xs text-white/45">Progresso: {percentage}%</span>
            )}
            {state !== 'locked' && completedAt && (
              <span className="text-xs text-white/36">{formatDate(completedAt)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        {state === 'paid' && verificationCode && (
          <PaidActions
            orderId={props.orderId!}
            courseTitle={courseTitle}
            verificationCode={verificationCode}
            hasPdf={props.hasPdf}
          />
        )}
        {state === 'pending-payment' && (
          <Link
            to={`/dashboard/certificado/${courseId}/checkout`}
            className={cn(brandPrimaryButtonClass)}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            Pagar R$ 29,90
          </Link>
        )}
        {state === 'locked' && (
          <Link
            to={`/dashboard/meus-cursos/${courseId}`}
            className={cn(brandSecondaryButtonClass)}
          >
            Continuar curso
          </Link>
        )}
      </div>
    </div>
  )
}

function PaidActions({
  orderId,
  courseTitle,
  verificationCode,
  hasPdf,
}: {
  orderId: Id<'certificateOrders'>
  courseTitle: string
  verificationCode: string
  hasPdf: boolean
}) {
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const downloadUrl = useQuery(
    api.certificates.getMyCertificateDownloadUrl,
    hasPdf ? { orderId } : 'skip',
  )

  const verifyUrl = `https://resenhadoteologo.com/verificar/${verificationCode}`
  const shareText = `Concluí o curso "${courseTitle}" na Resenha do Teólogo. Verifique meu certificado:`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${shareText} ${verifyUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // noop
    }
  }

  async function handleDownload() {
    if (!downloadUrl) return
    setDownloading(true)
    try {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setTimeout(() => setDownloading(false), 600)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${verifyUrl}`)}`}
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
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`}
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
        <button
          type="button"
          onClick={handleCopy}
          title="Copiar link de verificação"
          aria-label="Copiar link de verificação"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/4 text-white/72 transition-all hover:border-white/22 hover:bg-white/8"
        >
          {copied ? (
            <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={!hasPdf || !downloadUrl || downloading}
        className={cn(
          'inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition-all duration-200 hover:border-emerald-400/35 hover:bg-emerald-400/14 disabled:cursor-not-allowed disabled:opacity-50',
        )}
        title={hasPdf ? 'Baixar PDF do certificado' : 'PDF sendo gerado, aguarde...'}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        {hasPdf ? (downloading ? 'Abrindo...' : 'Baixar PDF') : 'Gerando PDF...'}
      </button>
    </>
  )
}
