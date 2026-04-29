import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DashboardPageShell } from '@/components/dashboard/PageShell'
import {
  brandPanelClass,
  brandPanelSoftClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'

type RuleCardProps = {
  step: number
  title: string
  description: string
  highlight?: string
  icon: ReactNode
}

function RuleCard({ step, title, description, highlight, icon }: RuleCardProps) {
  return (
    <div className={cn('flex gap-4 p-5 sm:gap-5 sm:p-6', brandPanelClass)}>
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#F37E20]/18 bg-[#F37E20]/10 text-[#F2BD8A] sm:h-14 sm:w-14">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/42">
          Passo {step}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold text-white sm:text-xl">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-white/72">{description}</p>
        {highlight && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#F37E20]/16 bg-[#F37E20]/10 px-3 py-1.5 text-xs font-medium text-[#F2BD8A]">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {highlight}
          </p>
        )}
      </div>
    </div>
  )
}

export function ComoConseguirCertificadoPage() {
  return (
    <DashboardPageShell
      eyebrow="Aluno"
      title="Como conseguir seu certificado"
      description="O passo a passo e as regras de aprovação para receber automaticamente seu certificado de conclusão."
      maxWidthClass="max-w-4xl"
      actions={
        <Link
          to="/dashboard/certificados"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/4 px-5 py-3 text-sm font-semibold text-white/82 transition-all duration-200 hover:border-white/22 hover:bg-white/8"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para certificados
        </Link>
      }
    >
      <div
        className={cn(
          'flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6',
          brandPanelSoftClass,
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-emerald-400/24 bg-emerald-400/10 text-emerald-300">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-display text-base font-semibold text-white sm:text-lg">
              Aprovação a partir de 70%
            </p>
            <p className="mt-0.5 text-sm text-white/56">
              A média mínima de aprovação é de 70%. O certificado é emitido automaticamente
              assim que você cumpre todos os requisitos abaixo.
            </p>
          </div>
        </div>
        <span className={brandStatusPillClass('success')}>Emissão automática</span>
      </div>

      <div className="space-y-3">
        <RuleCard
          step={1}
          title="Conclua todas as aulas publicadas"
          description="Assista cada aula até o final. Cada aula só é marcada como concluída quando o vídeo é assistido integralmente — pular trechos não conta como concluído."
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          }
        />

        <RuleCard
          step={2}
          title="Responda os quizzes obrigatórios"
          description="As aulas com quiz obrigatório precisam ser respondidas para liberar o certificado. A nota de cada quiz é registrada e usada no cálculo da média final."
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          }
        />

        <RuleCard
          step={3}
          title="Atinja média igual ou superior a 70%"
          description="A nota final do curso é a média das notas dos quizzes obrigatórios. Para emitir o certificado, essa média precisa ser igual ou superior a 70%."
          highlight="Cursos podem definir corte maior, nunca menor que 70%"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />

        <RuleCard
          step={4}
          title="Resolva pendências de retentativa"
          description="Se o professor permitiu refazer um quiz e você pediu nova tentativa, é necessário reassistir a aula e completar o quiz antes que o certificado possa ser emitido. Enquanto houver retentativa pendente, a nota não conta para a média."
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          }
        />

        <RuleCard
          step={5}
          title="O curso precisa estar concluído pelo professor"
          description="Para cursos com lançamento em produção (aulas saindo aos poucos), o certificado só é emitido quando o professor marca o curso como completo — mesmo que você já tenha assistido todas as aulas disponíveis até o momento."
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className={cn('p-5 sm:p-6', brandPanelClass)}>
        <h3 className="font-display text-base font-semibold text-white sm:text-lg">
          Perguntas frequentes
        </h3>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-white/72">
          <div>
            <p className="font-semibold text-white">Posso refazer um quiz que fui mal?</p>
            <p className="mt-1">
              Só se o professor da aula tiver liberado a retentativa. Quando liberada,
              você precisa reassistir a aula completa antes de o quiz reabrir; depois
              disso, sua nova nota substitui a anterior na média final.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Onde encontro meus certificados emitidos?</p>
            <p className="mt-1">
              Em{' '}
              <Link to="/dashboard/certificados" className="text-[#F2BD8A] hover:underline">
                Aluno → Certificados
              </Link>
              . Cada certificado tem um código de verificação público e pode ser
              compartilhado, baixado em PDF ou impresso.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">A nota mínima de 70% pode ser maior?</p>
            <p className="mt-1">
              Sim. O professor pode exigir corte maior em cursos específicos, mas a
              plataforma nunca permite corte abaixo de 70%.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Concluí todas as aulas e ainda não recebi.</p>
            <p className="mt-1">
              Verifique se há quiz obrigatório pendente, retentativa em aberto, ou se o
              curso ainda está marcado como em produção. Em caso de dúvida, fale com o
              professor pela aba de perguntas do curso.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          to="/dashboard/meus-cursos"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#F37E20] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#e06e10]"
        >
          Continuar meus estudos
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
        <Link
          to="/dashboard/certificados"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/4 px-6 py-3 text-sm font-semibold text-white/82 transition-all duration-200 hover:border-white/22 hover:bg-white/8"
        >
          Ver meus certificados
        </Link>
      </div>
    </DashboardPageShell>
  )
}
