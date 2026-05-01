import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { DashboardPageShell } from '@/components/dashboard/PageShell'
import { brandPanelClass, brandStatusPillClass, cn } from '@/lib/brand'

type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

type Item = {
  productId: Id<'products'>
  title: string
  priceCents: number
  quantity: number
  slug: string | null
  coverUrl: string | null
}

type ShippingAddress = {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

type OrderDetail = {
  _id: Id<'orders'>
  amountCents: number
  shippingCents?: number
  currency: string
  status: OrderStatus
  items: Item[]
  shippingAddress?: ShippingAddress
  notes?: string
  paidAt?: number
  shippedAt?: number
  deliveredAt?: number
  cancelledAt?: number
  trackingCode?: string
  trackingUrl?: string
  createdAt: number
  updatedAt: number
  creatorName: string
  creatorHandle: string | null
  creatorEmail: string | null
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Aguardando pagamento',
  paid: 'Pagamento confirmado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

function statusTone(status: OrderStatus): 'success' | 'accent' | 'neutral' | 'info' {
  if (status === 'delivered') return 'success'
  if (status === 'paid' || status === 'shipped') return 'info'
  if (status === 'cancelled' || status === 'refunded') return 'neutral'
  return 'accent'
}

function formatBRL(cents: number, currency: string) {
  try {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency,
    })
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`
  }
}

function formatDateTime(ts: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

type Step = {
  key: 'pending' | 'paid' | 'shipped' | 'delivered'
  label: string
  description: string
  ts: number | null
  state: 'done' | 'current' | 'todo'
}

function buildTimeline(order: OrderDetail): Step[] {
  const status = order.status
  const cancelled = status === 'cancelled' || status === 'refunded'

  const _order = ['pending', 'paid', 'shipped', 'delivered'] as const
  const indexByStatus: Record<(typeof _order)[number], number> = {
    pending: 0,
    paid: 1,
    shipped: 2,
    delivered: 3,
  }
  const currentIndex = cancelled
    ? -1
    : indexByStatus[status as (typeof _order)[number]] ?? 0

  return [
    {
      key: 'pending',
      label: 'Pedido recebido',
      description: 'Seu pedido foi registrado e o vendedor foi notificado.',
      ts: order.createdAt,
      state: 'done',
    },
    {
      key: 'paid',
      label: 'Pagamento confirmado',
      description: 'O pagamento foi confirmado e o vendedor está preparando seu pedido.',
      ts: order.paidAt ?? null,
      state:
        currentIndex >= 1 ? 'done' : currentIndex === 0 ? 'current' : 'todo',
    },
    {
      key: 'shipped',
      label: 'Enviado',
      description: 'O pedido foi enviado. Quando houver código de rastreio, ele aparecerá aqui.',
      ts: order.shippedAt ?? null,
      state:
        currentIndex >= 2 ? 'done' : currentIndex === 1 ? 'current' : 'todo',
    },
    {
      key: 'delivered',
      label: 'Entregue',
      description: 'Pedido entregue ao destinatário.',
      ts: order.deliveredAt ?? null,
      state:
        currentIndex >= 3 ? 'done' : currentIndex === 2 ? 'current' : 'todo',
    },
  ]
}

export function PedidoDetalhePage() {
  const { orderId } = useParams<{ orderId: string }>()
  const order = useQuery(
    api.orders.getMine,
    orderId ? { orderId: orderId as Id<'orders'> } : 'skip',
  ) as OrderDetail | null | undefined

  if (!orderId) return <Navigate to="/dashboard/pedidos" replace />

  if (order === undefined) {
    return (
      <DashboardPageShell
        eyebrow="Aluno"
        title="Carregando pedido"
        description="Aguarde um instante."
      >
        <div className={cn('h-40 animate-pulse', brandPanelClass)} />
      </DashboardPageShell>
    )
  }

  if (order === null) {
    return (
      <DashboardPageShell
        eyebrow="Aluno"
        title="Pedido não encontrado"
        description="Este pedido não existe ou não pertence à sua conta."
      >
        <div className={cn('p-8 text-center', brandPanelClass)}>
          <Link
            to="/dashboard/pedidos"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/4 px-5 py-3 text-sm font-medium text-white transition-all hover:border-white/22 hover:bg-white/8"
          >
            Voltar para meus pedidos
          </Link>
        </div>
      </DashboardPageShell>
    )
  }

  const timeline = buildTimeline(order)
  const cancelled = order.status === 'cancelled' || order.status === 'refunded'
  const cancelledAt =
    order.status === 'cancelled'
      ? order.cancelledAt ?? order.updatedAt
      : order.status === 'refunded'
      ? order.updatedAt
      : null

  return (
    <DashboardPageShell
      eyebrow="Aluno"
      title={`Pedido #${order._id.slice(-6).toUpperCase()}`}
      description="Linha do tempo do seu pedido. Atualizamos em tempo real conforme o vendedor confirma cada etapa."
      maxWidthClass="max-w-4xl"
      actions={
        <Link
          to="/dashboard/pedidos"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/4 px-5 py-3 text-sm font-medium text-white/82 transition-all hover:border-white/22 hover:bg-white/8"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Voltar
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className={cn('p-6 sm:p-8', brandPanelClass)}>
            <div className="flex items-center gap-3">
              <span className={brandStatusPillClass(statusTone(order.status))}>
                {STATUS_LABEL[order.status]}
              </span>
              <span className="text-xs text-white/40">
                Última atualização em {formatDateTime(order.updatedAt)}
              </span>
            </div>

            <ol className="mt-8 space-y-0">
              {timeline.map((step, idx) => {
                const isLast = idx === timeline.length - 1
                const dotClass = cancelled
                  ? 'border-white/14 bg-[#1B2430] text-white/30'
                  : step.state === 'done'
                  ? 'border-emerald-400/40 bg-emerald-400/16 text-emerald-300'
                  : step.state === 'current'
                  ? 'border-[#F37E20]/40 bg-[#F37E20]/16 text-[#F2BD8A]'
                  : 'border-white/14 bg-[#1B2430] text-white/30'
                const lineClass = cancelled
                  ? 'bg-white/8'
                  : step.state === 'done'
                  ? 'bg-emerald-400/30'
                  : 'bg-white/8'
                const titleClass = cancelled
                  ? 'text-white/40'
                  : step.state === 'todo'
                  ? 'text-white/40'
                  : 'text-white'

                return (
                  <li key={step.key} className="relative flex gap-4 pb-7 last:pb-0">
                    {!isLast && (
                      <span
                        className={cn(
                          'absolute left-[15px] top-9 bottom-0 w-px',
                          lineClass,
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        'relative z-10 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border',
                        dotClass,
                      )}
                    >
                      {step.state === 'done' && !cancelled ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <span className="text-xs font-semibold tabular-nums">{idx + 1}</span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className={cn('font-display text-base font-semibold', titleClass)}>
                        {step.label}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-white/56">
                        {step.description}
                      </p>
                      {step.ts ? (
                        <p className="mt-1 text-xs text-white/40">
                          {formatDateTime(step.ts)}
                        </p>
                      ) : null}
                      {step.key === 'shipped' && order.trackingCode ? (
                        <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/4 px-3 py-2 text-xs text-white/80">
                          <span className="font-semibold text-white/60">Rastreio:</span>
                          <span className="font-mono">{order.trackingCode}</span>
                          {order.trackingUrl ? (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-[#F2BD8A] hover:text-[#F37E20]"
                            >
                              Acompanhar
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>

            {cancelled ? (
              <div className="mt-4 rounded-2xl border border-red-500/24 bg-red-500/8 p-4 text-sm text-red-200">
                <p className="font-semibold">
                  {order.status === 'refunded' ? 'Pedido reembolsado' : 'Pedido cancelado'}
                </p>
                {cancelledAt ? (
                  <p className="mt-1 text-xs text-red-200/80">
                    {formatDateTime(cancelledAt)}
                  </p>
                ) : null}
                {order.notes ? (
                  <p className="mt-2 text-xs leading-6 text-red-200/72">
                    {order.notes}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={cn('p-6 sm:p-8', brandPanelClass)}>
            <h2 className="font-display text-lg font-semibold text-white">Itens do pedido</h2>
            <div className="mt-4 divide-y divide-white/6">
              {order.items.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-white/8 bg-[#10161E]">
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white/24">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {item.slug ? (
                      <Link
                        to={`/loja/${item.slug}`}
                        className="font-medium text-white hover:text-[#F2BD8A]"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="font-medium text-white">{item.title}</p>
                    )}
                    <p className="mt-0.5 text-xs text-white/52">
                      Qtd: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {formatBRL(item.priceCents * item.quantity, order.currency)}
                    </p>
                    {item.quantity > 1 ? (
                      <p className="text-xs text-white/40">
                        {formatBRL(item.priceCents, order.currency)} cada
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 border-t border-white/6 pt-4 text-sm">
              {typeof order.shippingCents === 'number' && order.shippingCents > 0 ? (
                <div className="flex items-center justify-between text-white/64">
                  <span>Frete</span>
                  <span>{formatBRL(order.shippingCents, order.currency)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between font-display text-lg font-semibold text-white">
                <span>Total</span>
                <span>{formatBRL(order.amountCents, order.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className={cn('p-5', brandPanelClass)}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/34">
              Vendido por
            </h3>
            <p className="mt-3 font-display text-lg font-semibold text-white">
              {order.creatorName}
            </p>
            {order.creatorHandle ? (
              <Link
                to={`/${order.creatorHandle}`}
                className="mt-1 inline-block text-xs font-medium text-[#F2BD8A] hover:text-[#F37E20]"
              >
                Ver perfil do criador
              </Link>
            ) : null}
            {order.creatorEmail ? (
              <p className="mt-3 text-xs text-white/52">
                Em caso de dúvida, fale com{' '}
                <a
                  href={`mailto:${order.creatorEmail}`}
                  className="font-medium text-white/82 hover:text-[#F2BD8A]"
                >
                  {order.creatorEmail}
                </a>
              </p>
            ) : null}
          </div>

          {order.shippingAddress ? (
            <div className={cn('p-5', brandPanelClass)}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/34">
                Endereço de entrega
              </h3>
              <div className="mt-3 space-y-1 text-sm leading-6 text-white/82">
                <p className="font-medium text-white">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
                <p>
                  {order.shippingAddress.city} / {order.shippingAddress.state}
                </p>
                <p>{order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          ) : null}

          {order.notes && !cancelled ? (
            <div className={cn('p-5', brandPanelClass)}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/34">
                Observações
              </h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/72">
                {order.notes}
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </DashboardPageShell>
  )
}
