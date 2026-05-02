// Página de checkout do certificado pago R$ 29,90 (one-time payment).
// Mostra um mockup do certificado com nome do aluno aplicado em marca d'água
// translúcida + lista do que está incluso, e dispara Stripe Checkout via
// api.stripe.createCertificateCheckout. O PDF real só é gerado server-side
// pelo webhook após o pagamento confirmado (convex/certificatesPdf.ts).

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAction, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { useCurrentAppUser } from '@/lib/currentUser'
import { DashboardPageShell } from '@/components/dashboard/PageShell'
import {
  brandPanelClass,
  brandPrimaryButtonClass,
  brandSecondaryButtonClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'

const PRICE_LABEL = 'R$ 29,90'

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(ts))
}

const INCLUDED_ITEMS = [
  {
    title: 'PDF oficial em alta resolução',
    description: 'A4 paisagem, pronto pra impressão e envio digital.',
  },
  {
    title: 'QR code de verificação pública',
    description: 'Qualquer recrutador escaneia e confirma a autenticidade.',
  },
  {
    title: 'Página pública de validação',
    description: 'URL única em resenhadoteologo.com/verificar/...',
  },
  {
    title: 'Compartilhamento direto',
    description: 'Botões prontos pro LinkedIn, WhatsApp e X.',
  },
  {
    title: 'Reemissão ilimitada',
    description: 'Baixe quantas vezes quiser, sem custo extra.',
  },
]

export function CheckoutCertificadoPage() {
  const { courseId: courseIdParam } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const courseId = courseIdParam as Id<'courses'> | undefined

  const { currentUser, isLoading: userLoading } = useCurrentAppUser()
  const enrollments = useQuery(api.enrollments.listByStudent)
  const order = useQuery(
    api.certificates.getMyOrderForCourse,
    courseId ? { courseId } : 'skip',
  )
  const createCheckout = useAction(api.stripe.createCertificateCheckout)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enrollmentRow = useMemo(() => {
    if (!enrollments || !courseId) return null
    return enrollments.find(
      (row): row is NonNullable<typeof row> =>
        !!row && (row.course?._id as string) === (courseId as string),
    )
  }, [enrollments, courseId])

  const isLoading = enrollments === undefined || order === undefined || userLoading
  const eligible = !!enrollmentRow?.enrollment.certificateIssued
  const alreadyPaid = order?.status === 'paid'

  // Se já pagou, redireciona pra lista (UX coerente: nada a fazer aqui).
  useEffect(() => {
    if (alreadyPaid) {
      navigate('/dashboard/certificados', { replace: true })
    }
  }, [alreadyPaid, navigate])

  async function handlePay() {
    if (!courseId) return
    setError(null)
    setSubmitting(true)
    try {
      const origin = window.location.origin
      const result = await createCheckout({
        courseId,
        successUrl: `${origin}/dashboard/certificados?status=success`,
        cancelUrl: `${origin}/dashboard/certificado/${courseId}/checkout?status=canceled`,
      })
      if (result?.url) {
        window.location.href = result.url
      } else {
        throw new Error('Stripe não retornou URL de checkout')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao iniciar checkout')
      setSubmitting(false)
    }
  }

  return (
    <DashboardPageShell
      eyebrow="Aluno"
      title="Emitir certificado"
      description="Garanta o PDF oficial do seu certificado de conclusão, com QR code e verificação pública."
      maxWidthClass="max-w-6xl"
      actions={
        <Link
          to="/dashboard/certificados"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-white/72 transition-all hover:border-white/22 hover:bg-white/8"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Voltar
        </Link>
      }
    >
      {isLoading ? (
        <div className={cn('animate-pulse space-y-4 p-8', brandPanelClass)}>
          <div className="h-7 w-2/3 rounded-lg bg-white/8" />
          <div className="h-4 w-1/3 rounded-lg bg-white/6" />
          <div className="mt-6 h-72 rounded-2xl bg-white/4" />
        </div>
      ) : !courseId || !enrollmentRow ? (
        <div className={cn('p-10 text-center', brandPanelClass)}>
          <p className="font-display text-lg font-semibold text-white">Curso não encontrado</p>
          <p className="mt-2 text-sm text-white/55">
            Você precisa estar matriculado neste curso para emitir o certificado.
          </p>
          <Link to="/dashboard/meus-cursos" className={cn('mt-6', brandPrimaryButtonClass)}>
            Ver meus cursos
          </Link>
        </div>
      ) : !eligible ? (
        <div className={cn('p-10 text-center', brandPanelClass)}>
          <p className="font-display text-lg font-semibold text-white">Curso ainda não concluído</p>
          <p className="mt-2 text-sm text-white/55">
            Conclua todas as aulas e atinja a média mínima de 70% nos quizzes para liberar a emissão do certificado.
          </p>
          <p className="mt-1 text-xs text-white/40">
            Progresso atual: {enrollmentRow.percentage}% ({enrollmentRow.completedLessons}/{enrollmentRow.totalLessons} aulas)
          </p>
          <Link
            to={`/dashboard/meus-cursos/${courseId}`}
            className={cn('mt-6', brandPrimaryButtonClass)}
          >
            Continuar curso
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Coluna esquerda: mockup do certificado */}
          <div className={cn('overflow-hidden p-2', brandPanelClass)}>
            <CertificateMockup
              studentName={currentUser?.name ?? 'Seu nome aqui'}
              courseTitle={enrollmentRow.course.title}
              completedAt={enrollmentRow.enrollment.completedAt}
              finalScore={enrollmentRow.enrollment.finalScore}
            />
            <p className="px-6 py-4 text-center text-[11px] uppercase tracking-[0.22em] text-white/40">
              Pré-visualização. O PDF oficial não terá a marca de água.
            </p>
          </div>

          {/* Coluna direita: pricing + lista de inclusos + CTA */}
          <div className="space-y-6">
            <div className={cn('p-7', brandPanelClass)}>
              <span className={brandStatusPillClass('accent')}>Curso concluído</span>
              <h3 className="mt-4 font-display text-2xl font-semibold text-white">
                {enrollmentRow.course.title}
              </h3>
              <p className="mt-1 text-sm text-white/55">
                Emissão única, pagamento seguro via Stripe.
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold text-white">{PRICE_LABEL}</span>
                <span className="text-sm text-white/50">pagamento único</span>
              </div>
              <p className="mt-1 text-xs text-white/40">
                Aceita Pix, cartão de crédito e boleto. Taxas inclusas no preço.
              </p>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-400/22 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handlePay}
                disabled={submitting}
                className={cn('mt-6 w-full', brandPrimaryButtonClass)}
              >
                {submitting ? 'Abrindo checkout...' : `Pagar ${PRICE_LABEL} e emitir`}
              </button>
              <Link
                to="/dashboard/certificados"
                className={cn('mt-3 w-full', brandSecondaryButtonClass)}
              >
                Cancelar
              </Link>
            </div>

            <div className={cn('p-7', brandPanelClass)}>
              <h4 className="font-display text-base font-semibold text-white">O que está incluso</h4>
              <ul className="mt-5 space-y-4">
                {INCLUDED_ITEMS.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl border border-[#F37E20]/22 bg-[#F37E20]/10 text-[#F37E20]">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-white/50">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-5 text-xs text-white/55">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#F2BD8A]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25h.75v3.75M12 8.25h.008" />
              </svg>
              <p>
                Pagamento processado pela Stripe (PCI-DSS Nível 1). A Resenha do Teólogo nunca armazena dados do seu cartão.
                Após a confirmação, seu certificado é gerado automaticamente em até 30 segundos.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardPageShell>
  )
}

function CertificateMockup({
  studentName,
  courseTitle,
  completedAt,
  finalScore,
}: {
  studentName: string
  courseTitle: string
  completedAt?: number
  finalScore?: number
}) {
  const dateLabel = completedAt ? formatDate(completedAt) : 'data da conclusão'
  return (
    <div
      className="relative overflow-hidden rounded-[1.6rem]"
      style={{
        background: 'linear-gradient(180deg, #F7F5F2 0%, #F1ECE3 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(243,126,32,0.18)',
      }}
    >
      {/* Borda decorativa orange */}
      <div
        className="absolute inset-3 rounded-[1.2rem]"
        style={{
          border: '1.5px solid #F37E20',
          boxShadow: 'inset 0 0 0 3px rgba(247,245,242,1), inset 0 0 0 4px rgba(243,126,32,0.4)',
        }}
        aria-hidden
      />

      {/* Marca de água */}
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-[5rem] font-bold uppercase tracking-[0.4em]"
        style={{ color: 'rgba(243,126,32,0.08)', transform: 'rotate(-22deg)' }}
        aria-hidden
      >
        Pré-visualização
      </span>

      <div className="relative px-10 py-12 text-center" style={{ color: '#0F141A', fontFamily: 'Times New Roman, serif' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.36em]" style={{ color: '#F37E20' }}>
          Resenha do Teólogo
        </p>
        <h2 className="mt-5 text-3xl font-bold" style={{ color: '#0F141A' }}>
          Certificado de Conclusão
        </h2>

        <p className="mt-7 italic" style={{ color: '#4B5563' }}>
          Conferimos o presente certificado a
        </p>
        <p className="mt-3 text-2xl font-bold" style={{ color: '#0F141A' }}>
          {studentName}
        </p>

        <p className="mt-5 italic" style={{ color: '#4B5563' }}>
          por concluir com aproveitamento o curso
        </p>
        <p className="mt-3 text-lg font-bold leading-snug" style={{ color: '#0F141A' }}>
          {courseTitle}
        </p>

        <p className="mt-7 text-sm" style={{ color: '#374151' }}>
          {finalScore !== undefined
            ? `Concluído em ${dateLabel} com nota final ${Math.round(finalScore)}%.`
            : `Concluído em ${dateLabel}.`}
        </p>

        <div className="mt-10 flex items-end justify-between text-[10px]" style={{ color: '#6B7280' }}>
          <span>Código: XXXXXXXXXXXXXXXX</span>
          <span>Verificação: resenhadoteologo.com/verificar</span>
        </div>
      </div>
    </div>
  )
}
