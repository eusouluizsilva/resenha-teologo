import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { brandPanelClass, brandStatusPillClass, cn } from '@/lib/brand'

// Card de programa de indicacao. Mostra o link unico do usuario, total de
// indicados e indicados que ja concluiram um curso. Gera o codigo no
// primeiro carregamento (via ensureMyCode) e persiste em users.referralCode.

export function ReferralCard() {
  const stats = useQuery(api.referrals.getMyStats, {})
  const ensureCode = useMutation(api.referrals.ensureMyCode)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (stats !== undefined && stats !== null && !stats.code) {
      ensureCode({}).catch(() => {})
    }
  }, [stats, ensureCode])

  if (stats === undefined) {
    return (
      <div className={cn('animate-pulse p-6', brandPanelClass)}>
        <div className="h-4 w-1/3 rounded bg-white/8" />
        <div className="mt-4 h-12 rounded bg-white/8" />
      </div>
    )
  }
  if (stats === null) return null

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://resenhadoteologo.com'
  const link = stats.code ? `${origin}/cadastro?ref=${stats.code}` : ''

  function handleCopy() {
    if (!link) return
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShare() {
    if (!link) return
    if (navigator.share) {
      navigator
        .share({
          title: 'Estudos teológicos gratuitos',
          text: 'Conheça a Resenha do Teólogo, cursos gratuitos de teologia.',
          url: link,
        })
        .catch(() => {})
    } else {
      handleCopy()
    }
  }

  return (
    <div className={cn('p-6 sm:p-7', brandPanelClass)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F2BD8A]">
            Indique amigos
          </p>
          <h3 className="mt-2 font-display text-lg font-bold leading-snug text-white">
            Compartilhe a Resenha do Teólogo
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/52">
            Quando alguém se cadastra pelo seu link e conclui um curso, contabilizamos como uma indicação.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={link}
          readOnly
          aria-label="Seu link de indicação"
          className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/80 focus:border-[#F37E20]/40 focus:bg-white/[0.05] focus:outline-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          disabled={!link}
          className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-xs font-semibold text-white/72 transition-all hover:border-white/20 hover:bg-white/8 disabled:opacity-40"
        >
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={!link}
          className="rounded-2xl border border-[#F37E20]/30 bg-[#F37E20]/10 px-4 py-3 text-xs font-semibold text-[#F2BD8A] transition-all hover:bg-[#F37E20]/20 disabled:opacity-40"
        >
          Compartilhar
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Total
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Concluíram curso
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-white">{stats.completed}</p>
        </div>
        <div className="hidden rounded-2xl border border-white/8 bg-white/[0.02] p-4 sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Em aberto
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-white">
            {stats.total - stats.completed}
          </p>
        </div>
      </div>

      {stats.recent.length > 0 ? (
        <div className="mt-5 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Últimas indicações
          </p>
          {stats.recent.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3"
            >
              <p className="truncate text-sm text-white/72">{r.name}</p>
              <span
                className={brandStatusPillClass(
                  r.status === 'completed' ? 'success' : r.status === 'registered' ? 'accent' : 'neutral',
                )}
              >
                {r.status === 'completed'
                  ? 'Concluiu curso'
                  : r.status === 'registered'
                  ? 'Cadastrado'
                  : 'Pendente'}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
