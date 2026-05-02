import { useId, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  DashboardPageShell,
  DashboardSectionLabel,
} from '@/components/dashboard/PageShell'
import {
  brandInputClass,
  brandPanelClass,
  brandPrimaryButtonClass,
  brandSecondaryButtonClass,
  cn,
} from '@/lib/brand'

type Segment = 'all' | 'aluno' | 'criador' | 'instituicao' | 'sem_funcao'

const SEGMENT_LABELS: Record<Segment, string> = {
  all: 'Todos os usuários',
  aluno: 'Apenas alunos',
  criador: 'Apenas professores',
  instituicao: 'Apenas instituições',
  sem_funcao: 'Sem função ativa (onboarding incompleto)',
}

const LINK_SUGGESTIONS: { label: string; value: string }[] = [
  { label: 'Catálogo de cursos', value: '/cursos' },
  { label: 'Blog', value: '/blog' },
  { label: 'Painel do aluno', value: '/dashboard/aluno' },
  { label: 'Bíblia', value: '/dashboard/biblia' },
  { label: 'Caderno', value: '/dashboard/caderno' },
  { label: 'Funções', value: '/dashboard/funcoes' },
  { label: 'Perfil público', value: '/dashboard/perfil' },
  { label: 'Certificados', value: '/dashboard/certificados' },
]

function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function PreviewBell({
  title,
  body,
  hasLink,
}: {
  title: string
  body: string
  hasLink: boolean
}) {
  const showTitle = title.trim() || 'Título da notificação'
  const showBody = body.trim()
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#151B23] shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
        <p className="text-sm font-semibold text-white">Notificações</p>
        <span className="text-xs font-medium text-[#F2BD8A]">Marcar todas como lidas</span>
      </div>
      <div className={cn('px-4 py-3', 'bg-[#F37E20]/5')}>
        <div className="flex items-start gap-3">
          <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#F37E20]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-white">{showTitle}</p>
            {showBody ? (
              <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/48">
                {showBody}
              </p>
            ) : null}
            <p className="mt-1 text-[11px] uppercase tracking-wider text-white/32">agora</p>
          </div>
        </div>
        {hasLink ? (
          <p className="mt-3 ml-5 text-[11px] uppercase tracking-[0.18em] text-white/28">
            clique abre o link informado
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function NotificacoesAdminPage() {
  const isAdmin = useQuery(api.admin.amIAdmin, {})
  const formId = useId()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [segment, setSegment] = useState<Segment>('all')
  const [dedupeKey, setDedupeKey] = useState('')
  const [dedupeTouched, setDedupeTouched] = useState(false)
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<
    | { kind: 'ok'; message: string }
    | { kind: 'err'; message: string }
    | null
  >(null)

  const audience = useQuery(
    api.admin.previewBroadcastAudience,
    isAdmin ? { segment } : 'skip',
  )
  const recent = useQuery(api.admin.listRecentBroadcasts, isAdmin ? {} : 'skip')
  const sendBroadcast = useMutation(api.admin.sendBroadcastNotification)

  const autoDedupe = useMemo(() => {
    const today = new Date()
    const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const slug = slugify(title) || 'broadcast'
    return `${slug}_${ymd}`
  }, [title])

  const effectiveDedupe = dedupeTouched ? dedupeKey : autoDedupe

  if (isAdmin === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
      </div>
    )
  }
  if (isAdmin === false) return <Navigate to="/dashboard" replace />

  const titleLen = title.length
  const bodyLen = body.length
  const titleTooLong = titleLen > 120
  const bodyTooLong = bodyLen > 500
  const linkInvalid =
    link.trim().length > 0 &&
    !link.trim().startsWith('/') &&
    !link.trim().startsWith('http')
  const dedupeInvalid = effectiveDedupe.trim().length === 0
  const canSend =
    !sending &&
    title.trim().length > 0 &&
    !titleTooLong &&
    !bodyTooLong &&
    !linkInvalid &&
    !dedupeInvalid

  const handleSend = async () => {
    if (!canSend) return
    const eligible = audience?.eligible ?? 0
    const ok = window.confirm(
      `Enviar notificação para ${eligible.toLocaleString('pt-BR')} ${eligible === 1 ? 'pessoa' : 'pessoas'}?\n\nQuem já tiver recebido com a mesma chave de deduplicação não receberá de novo.`,
    )
    if (!ok) return

    setSending(true)
    setFeedback(null)
    try {
      const result = await sendBroadcast({
        title: title.trim(),
        body: body.trim() ? body.trim() : undefined,
        link: link.trim() ? link.trim() : undefined,
        dedupeKey: effectiveDedupe.trim(),
        segment,
      })
      setFeedback({
        kind: 'ok',
        message: `Enviado para ${result.inserted.toLocaleString('pt-BR')} ${result.inserted === 1 ? 'pessoa' : 'pessoas'}. ${result.skipped} ignorada${result.skipped === 1 ? '' : 's'} por duplicidade.`,
      })
      setTitle('')
      setBody('')
      setLink('')
      setDedupeKey('')
      setDedupeTouched(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao enviar notificação.'
      setFeedback({ kind: 'err', message })
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardPageShell
      eyebrow="Administração"
      title="Notificações do sininho"
      description="Envie um aviso in-app para todos os usuários ou para um segmento. Ideal para anúncios da plataforma, novos recursos, manutenções, lançamentos e comunicados editoriais."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className={cn('p-6 sm:p-7', brandPanelClass)}>
            <DashboardSectionLabel>Conteúdo</DashboardSectionLabel>

            <div className="mt-5 space-y-5">
              <div>
                <div className="flex items-end justify-between gap-3">
                  <label htmlFor={`${formId}-title`} className="block text-xs font-semibold uppercase tracking-[0.18em] text-white/52">
                    Título
                  </label>
                  <span
                    className={cn(
                      'font-mono text-[11px]',
                      titleTooLong ? 'text-rose-300' : 'text-white/36',
                    )}
                  >
                    {titleLen}/120
                  </span>
                </div>
                <input
                  id={`${formId}-title`}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Caderno digital agora disponível"
                  className={cn(brandInputClass, 'mt-2')}
                  maxLength={140}
                />
              </div>

              <div>
                <div className="flex items-end justify-between gap-3">
                  <label htmlFor={`${formId}-body`} className="block text-xs font-semibold uppercase tracking-[0.18em] text-white/52">
                    Mensagem (opcional)
                  </label>
                  <span
                    className={cn(
                      'font-mono text-[11px]',
                      bodyTooLong ? 'text-rose-300' : 'text-white/36',
                    )}
                  >
                    {bodyLen}/500
                  </span>
                </div>
                <textarea
                  id={`${formId}-body`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Resumo curto do anúncio. Aparece em duas linhas no popover do sininho."
                  rows={4}
                  className={cn(brandInputClass, 'mt-2 resize-none')}
                  maxLength={600}
                />
              </div>

              <div>
                <label htmlFor={`${formId}-link`} className="block text-xs font-semibold uppercase tracking-[0.18em] text-white/52">
                  Link (opcional)
                </label>
                <input
                  id={`${formId}-link`}
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="/cursos"
                  className={cn(brandInputClass, 'mt-2 font-mono text-sm')}
                />
                {linkInvalid ? (
                  <p className="mt-1 text-xs text-rose-300/90">
                    Use uma rota interna começando com / ou uma URL externa começando com http.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-white/36">
                    Quando preenchido, clicar na notificação navega para esse destino.
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {LINK_SUGGESTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setLink(s.value)}
                      className="rounded-lg border border-white/8 bg-white/4 px-2.5 py-1 text-[11px] font-medium text-white/64 transition hover:border-[#F37E20]/35 hover:text-white"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={cn('p-6 sm:p-7', brandPanelClass)}>
            <DashboardSectionLabel>Público</DashboardSectionLabel>
            <p className="mt-1 text-xs text-white/42">
              O segmento usa as funções ativadas em /dashboard/funcoes. Quem ainda não escolheu nenhuma função entra em "sem função ativa".
            </p>

            <div className="mt-5 grid gap-2">
              {(Object.keys(SEGMENT_LABELS) as Segment[]).map((s) => {
                const active = segment === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSegment(s)}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition',
                      active
                        ? 'border-[#F37E20]/45 bg-[#F37E20]/[0.08] text-white'
                        : 'border-white/8 bg-white/[0.03] text-white/72 hover:border-white/16',
                    )}
                  >
                    <span className="text-sm font-medium">{SEGMENT_LABELS[s]}</span>
                    <span
                      className={cn(
                        'h-4 w-4 flex-shrink-0 rounded-full border-2',
                        active ? 'border-[#F37E20] bg-[#F37E20]' : 'border-white/24',
                      )}
                    />
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">
                  Vai notificar
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-white">
                  {audience === undefined
                    ? '...'
                    : `${audience.eligible.toLocaleString('pt-BR')} ${audience.eligible === 1 ? 'pessoa' : 'pessoas'}`}
                </p>
              </div>
              <p className="text-right text-[11px] text-white/36">
                de {audience === undefined ? '...' : audience.totalUsers.toLocaleString('pt-BR')} cadastrados
              </p>
            </div>
          </section>

          <section className={cn('p-6 sm:p-7', brandPanelClass)}>
            <DashboardSectionLabel>Deduplicação</DashboardSectionLabel>
            <p className="mt-1 text-xs text-white/42">
              Cada envio recebe uma chave única. Reenviar com a mesma chave não duplica a notificação para quem já recebeu. Ideal para retomar um envio que falhou no meio.
            </p>

            <div className="mt-4">
              <label htmlFor={`${formId}-dedupeKey`} className="block text-xs font-semibold uppercase tracking-[0.18em] text-white/52">
                Chave de deduplicação
              </label>
              <input
                id={`${formId}-dedupeKey`}
                type="text"
                value={effectiveDedupe}
                onChange={(e) => {
                  setDedupeKey(e.target.value)
                  setDedupeTouched(true)
                }}
                className={cn(brandInputClass, 'mt-2 font-mono text-sm')}
              />
              {dedupeTouched ? (
                <button
                  type="button"
                  onClick={() => {
                    setDedupeTouched(false)
                    setDedupeKey('')
                  }}
                  className="mt-2 text-xs font-medium text-[#F2BD8A] hover:text-[#F37E20]"
                >
                  Voltar para chave automática
                </button>
              ) : (
                <p className="mt-1 text-xs text-white/36">
                  Gerada automaticamente a partir do título e da data. Edite se quiser controlar manualmente.
                </p>
              )}
            </div>
          </section>

          {feedback ? (
            <div
              className={cn(
                'rounded-2xl border px-5 py-4 text-sm',
                feedback.kind === 'ok'
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                  : 'border-rose-400/30 bg-rose-400/10 text-rose-100',
              )}
            >
              {feedback.message}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={brandPrimaryButtonClass}
            >
              {sending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                  Enviar notificação
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle('')
                setBody('')
                setLink('')
                setDedupeKey('')
                setDedupeTouched(false)
                setSegment('all')
                setFeedback(null)
              }}
              disabled={sending}
              className={brandSecondaryButtonClass}
            >
              Limpar formulário
            </button>
          </div>
        </div>

        <aside className="space-y-6">
          <div>
            <DashboardSectionLabel>Pré-visualização</DashboardSectionLabel>
            <p className="mt-1 text-xs text-white/42">
              Como aparece no popover do sininho do header.
            </p>
            <div className="mt-4">
              <PreviewBell title={title} body={body} hasLink={link.trim().length > 0} />
            </div>
          </div>

          <div className={cn('p-5', brandPanelClass)}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/42">
              Para que serve
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/72">
              <li>Anunciar novo recurso ou nova área da plataforma.</li>
              <li>Comunicar manutenções, mudanças nos termos, política de privacidade.</li>
              <li>Divulgar lançamento de curso, série, eBook, evento ao vivo.</li>
              <li>Lembretes de onboarding (completar perfil, ativar funções).</li>
              <li>Reconhecimento e celebração (marcos, top do mês).</li>
              <li>Pesquisas e enquetes com link externo.</li>
            </ul>
          </div>
        </aside>
      </div>

      <section>
        <DashboardSectionLabel>Histórico de envios</DashboardSectionLabel>
        <p className="mt-1 text-xs text-white/42">
          Últimos broadcasts agrupados por chave de deduplicação. Mostra quantas pessoas receberam cada envio.
        </p>
        <div className={cn('mt-4 divide-y divide-white/6', brandPanelClass)}>
          {recent === undefined ? (
            <div className="flex items-center justify-center p-10">
              <div className="h-6 w-6 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
            </div>
          ) : recent.length === 0 ? (
            <p className="p-5 text-sm text-white/42">
              Nenhum broadcast enviado ainda. O primeiro envio aparecerá aqui.
            </p>
          ) : (
            recent.map((r) => (
              <div key={r.dedupeKey} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{r.title}</p>
                    {r.body ? (
                      <p className="mt-1 line-clamp-2 text-sm text-white/60">{r.body}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/42">
                      <span className="font-mono">{r.dedupeKey}</span>
                      {r.link ? (
                        <>
                          <span className="text-white/24">·</span>
                          <span className="font-mono">{r.link}</span>
                        </>
                      ) : null}
                      <span className="text-white/24">·</span>
                      <span>{formatDate(r.firstAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-display text-2xl font-bold text-white">
                      {r.count.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-white/36">
                      {r.count === 1 ? 'pessoa' : 'pessoas'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </DashboardPageShell>
  )
}
