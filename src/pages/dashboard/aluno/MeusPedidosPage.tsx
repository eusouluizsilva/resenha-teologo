import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import { brandPanelClass, brandStatusPillClass, cn } from '@/lib/brand'

type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

type OrderRow = {
  _id: Id<'orders'>
  amountCents: number
  currency: string
  status: OrderStatus
  items: Array<{ title: string; quantity: number }>
  createdAt: number
  updatedAt: number
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

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ts))
}

export function MeusPedidosPage() {
  const orders = useQuery(api.orders.listMine, {}) as OrderRow[] | undefined
  const isLoading = orders === undefined

  return (
    <DashboardPageShell
      eyebrow="Aluno"
      title="Meus pedidos"
      description="Acompanhe o status de cada compra feita na plataforma. Clique em um pedido para ver a linha do tempo completa."
      maxWidthClass="max-w-5xl"
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn('h-24 animate-pulse', brandPanelClass)}
            />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          }
          title="Nenhum pedido ainda"
          description="Quando você comprar um produto na loja, ele aparecerá aqui com a linha do tempo da entrega."
          action={
            <Link
              to="/loja"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#F37E20]/22 bg-[#F37E20]/10 px-5 py-3 text-sm font-semibold text-[#F2BD8A] transition-all hover:border-[#F37E20]/40 hover:bg-[#F37E20]/16"
            >
              Ir para a loja
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const totalQty = order.items.reduce((acc, it) => acc + it.quantity, 0)
            const summary =
              order.items.length === 1
                ? order.items[0].title
                : `${order.items[0].title} +${order.items.length - 1}`
            return (
              <Link
                key={order._id}
                to={`/dashboard/pedidos/${order._id}`}
                className={cn(
                  'group flex flex-col gap-3 p-5 transition-all hover:border-white/16 sm:flex-row sm:items-center sm:justify-between sm:p-6',
                  brandPanelClass,
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={brandStatusPillClass(statusTone(order.status))}>
                      {STATUS_LABEL[order.status]}
                    </span>
                    <span className="text-xs text-white/40">
                      Pedido #{order._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-2 truncate font-display text-base font-semibold text-white">
                    {summary}
                  </p>
                  <p className="mt-1 text-xs text-white/52">
                    {totalQty} {totalQty === 1 ? 'item' : 'itens'} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="font-display text-lg font-semibold text-white">
                    {formatBRL(order.amountCents, order.currency)}
                  </span>
                  <svg
                    className="h-5 w-5 text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-[#F2BD8A]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </DashboardPageShell>
  )
}
