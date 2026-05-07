import { Navigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  DashboardPageShell,
  DashboardSectionLabel,
} from '@/components/dashboard/PageShell'
import { brandPanelClass, cn } from '@/lib/brand'

function formatCurrency(cents: number, currency: string = 'brl') {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  })
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className={cn('p-5', brandPanelClass, accent && 'border-[#F37E20]/22 bg-[#F37E20]/[0.06]')}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/36">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/48">{sub}</p>}
    </div>
  )
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  paid: {
    label: 'Pago',
    cls: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  },
  pending: {
    label: 'Pendente',
    cls: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  },
  expired: {
    label: 'Expirado',
    cls: 'border-white/10 bg-white/4 text-white/52',
  },
  refunded: {
    label: 'Reembolsado',
    cls: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
  },
}

function stripePaymentUrl(paymentIntentId: string | null, sessionId: string) {
  if (paymentIntentId) {
    return `https://dashboard.stripe.com/payments/${paymentIntentId}`
  }
  return `https://dashboard.stripe.com/payments?query=${encodeURIComponent(sessionId)}`
}

export function CertificadosVendasPage() {
  const isAdmin = useQuery(api.admin.amIAdmin, {})
  const data = useQuery(api.admin.listCertificateOrders, isAdmin ? {} : 'skip')

  if (isAdmin === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
      </div>
    )
  }

  if (isAdmin === false) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardPageShell
      eyebrow="Administração"
      title="Vendas de certificado"
      description="Pedidos do produto Certificado R$ 29,90. Dados ao vivo do Convex; cobrança e PDF processados via Stripe."
    >
      {data === undefined ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
        </div>
      ) : (
        <>
          <div>
            <DashboardSectionLabel>Resumo financeiro</DashboardSectionLabel>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Receita líquida"
                value={formatCurrency(data.stats.netCents)}
                sub={`${formatCurrency(data.stats.grossCents)} bruto, ${formatCurrency(data.stats.refundedCents)} reembolsado`}
                accent
              />
              <StatTile
                label="Vendas concluídas"
                value={String(data.stats.paidCount)}
                sub={`${data.stats.paid30dCount} nos últimos 30 dias`}
              />
              <StatTile
                label="Receita 30 dias"
                value={formatCurrency(data.stats.gross30dCents)}
              />
              <StatTile
                label="Pendentes / Expiradas"
                value={`${data.stats.pendingCount} / ${data.stats.expiredCount}`}
                sub={`${data.stats.refundedCount} reembolsada${data.stats.refundedCount === 1 ? '' : 's'}`}
              />
            </div>
          </div>

          <div>
            <DashboardSectionLabel>Pedidos</DashboardSectionLabel>
            <p className="mt-1 text-xs text-white/42">
              Ordenado pelos mais recentes. Clique em um pedido para abrir no Stripe.
            </p>
            <div className={cn('mt-4 divide-y divide-white/6', brandPanelClass)}>
              {data.orders.length === 0 ? (
                <p className="p-5 text-sm text-white/42">Nenhum pedido ainda.</p>
              ) : (
                data.orders.map((o) => {
                  const status = STATUS_LABEL[o.status] ?? {
                    label: o.status,
                    cls: 'border-white/10 bg-white/4 text-white/52',
                  }
                  const ts = o.paidAt ?? o.refundedAt ?? o.expiredAt ?? o.createdAt
                  return (
                    <a
                      key={o._id}
                      href={stripePaymentUrl(o.stripePaymentIntentId, o.stripeSessionId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-wrap items-center gap-4 p-4 transition hover:bg-white/[0.02]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {o.buyerName}
                        </p>
                        <p className="truncate text-xs text-white/42">
                          {o.buyerEmail}
                        </p>
                      </div>
                      <div className="hidden min-w-0 flex-1 sm:block">
                        <p className="truncate text-sm text-white/72">
                          {o.courseTitle}
                        </p>
                        <p className="truncate text-[11px] text-white/36">
                          {formatDateTime(ts)}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3">
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
                            status.cls,
                          )}
                        >
                          {status.label}
                        </span>
                        <span className="font-mono text-sm font-semibold text-white">
                          {formatCurrency(o.amount, o.currency)}
                        </span>
                      </div>
                    </a>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </DashboardPageShell>
  )
}
