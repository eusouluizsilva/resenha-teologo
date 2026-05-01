import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { brandPanelClass, brandStatusPillClass, cn } from '@/lib/brand'
import { useSeo } from '@/lib/seo'

// Página pública de status. Faz HEAD em endpoints chave (Convex, Clerk e o
// próprio domínio) e mostra um status simples ok/lento/falha. Não substitui
// um statuspage.io de verdade mas serve como sinal honesto pra quem desconfia
// que está fora do ar.

type CheckStatus = 'pending' | 'ok' | 'slow' | 'down'

type Check = {
  name: string
  description: string
  url: string
  status: CheckStatus
  durationMs: number | null
}

const SLOW_THRESHOLD_MS = 1500

const INITIAL_CHECKS: Check[] = [
  {
    name: 'Site',
    description: 'Página pública resenhadoteologo.com',
    url: 'https://resenhadoteologo.com/',
    status: 'pending',
    durationMs: null,
  },
  {
    name: 'API Convex',
    description: 'Backend de cursos, usuários e progresso',
    url: 'https://api.convex.dev/version',
    status: 'pending',
    durationMs: null,
  },
  {
    name: 'Clerk Auth',
    description: 'Autenticação e gerenciamento de sessão',
    url: 'https://clerk.com/',
    status: 'pending',
    durationMs: null,
  },
  {
    name: 'Bing IndexNow',
    description: 'Notificação automática de novas páginas',
    url: 'https://api.indexnow.org/',
    status: 'pending',
    durationMs: null,
  },
]

async function ping(url: string): Promise<{ ok: boolean; durationMs: number }> {
  const start = performance.now()
  try {
    await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
    return { ok: true, durationMs: performance.now() - start }
  } catch {
    return { ok: false, durationMs: performance.now() - start }
  }
}

function StatusBadge({ status }: { status: CheckStatus }) {
  if (status === 'ok') return <span className={brandStatusPillClass('success')}>Operacional</span>
  if (status === 'slow') return <span className={brandStatusPillClass('accent')}>Lento</span>
  if (status === 'down') return <span className={cn(brandStatusPillClass('neutral'), 'text-red-300 border-red-400/24 bg-red-400/10')}>Indisponível</span>
  return <span className={brandStatusPillClass('neutral')}>Verificando</span>
}

export function StatusPage() {
  useSeo({
    title: 'Status da plataforma, Resenha do Teólogo',
    description:
      'Estado em tempo real dos serviços da Resenha do Teólogo, site, API, autenticação e indexação.',
    url: 'https://resenhadoteologo.com/status',
    type: 'website',
  })

  const [checks, setChecks] = useState<Check[]>(INITIAL_CHECKS)
  const [lastChecked, setLastChecked] = useState<number | null>(null)
  const [running, setRunning] = useState(false)

  async function runChecks() {
    setRunning(true)
    const results = await Promise.all(
      INITIAL_CHECKS.map(async (c) => {
        const res = await ping(c.url)
        const status: CheckStatus = !res.ok
          ? 'down'
          : res.durationMs > SLOW_THRESHOLD_MS
          ? 'slow'
          : 'ok'
        return { ...c, status, durationMs: Math.round(res.durationMs) }
      }),
    )
    setChecks(results)
    setLastChecked(Date.now())
    setRunning(false)
  }

  useEffect(() => {
    // Roda checks ao montar a página.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runChecks()
     
  }, [])

  const overall: CheckStatus = checks.some((c) => c.status === 'down')
    ? 'down'
    : checks.some((c) => c.status === 'slow')
    ? 'slow'
    : checks.every((c) => c.status === 'ok')
    ? 'ok'
    : 'pending'

  return (
    <PublicPageShell>
      <div className="min-h-screen bg-[#0F141A] text-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">Status</p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
              Como estão nossos serviços
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/56">
              Verificação automática feita do seu navegador. Se algum item estiver indisponível,
              tente novamente em alguns minutos.
            </p>
          </div>

          <div className={cn('mb-6 flex items-center justify-between gap-4 p-6', brandPanelClass)}>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">Status geral</p>
              <p className="mt-1 font-display text-xl font-bold text-white">
                {overall === 'ok' && 'Tudo funcionando'}
                {overall === 'slow' && 'Lentidão detectada'}
                {overall === 'down' && 'Falha detectada'}
                {overall === 'pending' && 'Verificando...'}
              </p>
              {lastChecked ? (
                <p className="mt-1 text-xs text-white/40">
                  Última verificação às{' '}
                  {new Intl.DateTimeFormat('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(lastChecked)}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={overall} />
              <button
                type="button"
                onClick={runChecks}
                disabled={running}
                className="rounded-2xl border border-white/10 bg-white/4 px-4 py-2 text-xs font-semibold text-white/80 transition-all hover:border-white/20 hover:bg-white/8 disabled:opacity-40"
              >
                {running ? 'Verificando...' : 'Verificar de novo'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {checks.map((c) => (
              <div
                key={c.name}
                className={cn(
                  'flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between',
                  brandPanelClass,
                )}
              >
                <div className="min-w-0">
                  <p className="font-display text-base font-semibold text-white">{c.name}</p>
                  <p className="mt-0.5 text-xs text-white/52">{c.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  {c.durationMs !== null ? (
                    <span className="text-xs text-white/40">{c.durationMs} ms</span>
                  ) : null}
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center text-sm text-white/52">
            Continua com problema?{' '}
            <Link to="/contato" className="font-semibold text-[#F2BD8A] hover:underline">
              Fale com a gente
            </Link>
            .
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
