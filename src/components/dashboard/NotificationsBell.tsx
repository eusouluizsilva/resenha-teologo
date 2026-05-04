import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { cn } from '@/lib/brand'
import type { Id } from '@convex/_generated/dataModel'

// Sino de notificações do dashboard. Lista paginada com infinite-scroll, count
// de não lidas reativo, agrupamento client-side de notificações consecutivas
// do mesmo (kind, link) para evitar caixas de "5 pessoas seguiram" repetidas.
// Clique marca como lida e navega; fechar com clique fora ou Esc.

// Tipos derivados dos retornos da query Convex.
type NotifRow = {
  _id: Id<'notifications'>
  kind: string
  title: string
  body?: string
  link?: string
  readAt?: number
  createdAt: number
}

type NotifGroup = {
  key: string
  // Linha mais recente do grupo (define título e link clicado).
  representative: NotifRow
  // Outras linhas (mais antigas) que foram dobradas no grupo.
  others: NotifRow[]
  hasUnread: boolean
}

// Agrupa apenas tipos com volume potencialmente alto (followers, comentários
// na mesma thread). Tipos one-shot (welcome, certificate_issued etc.) seguem
// um por linha mesmo quando consecutivos.
const GROUPABLE_KINDS = new Set([
  'profile_followed',
  'comment_new',
  'post_comment_new',
  'comment_reply',
  'post_comment_reply',
])

function groupNotifications(rows: readonly NotifRow[]): NotifGroup[] {
  const out: NotifGroup[] = []
  for (const row of rows) {
    const isGroupable = GROUPABLE_KINDS.has(row.kind)
    const last = out[out.length - 1]
    if (
      isGroupable &&
      last &&
      last.representative.kind === row.kind &&
      (last.representative.link ?? '') === (row.link ?? '')
    ) {
      last.others.push(row)
      if (!row.readAt) last.hasUnread = true
      continue
    }
    out.push({
      key: String(row._id),
      representative: row,
      others: [],
      hasUnread: !row.readAt,
    })
  }
  return out
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d}d`
  const w = Math.floor(d / 7)
  if (w < 5) return `${w}sem`
  const mo = Math.floor(d / 30)
  return `${mo}mes`
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const {
    results: notifications,
    status,
    loadMore,
  } = usePaginatedQuery(api.notifications.listMine, {}, { initialNumItems: 20 })
  const unread = useQuery(api.notifications.countUnread, {}) ?? 0
  const markRead = useMutation(api.notifications.markRead)
  const markAllRead = useMutation(api.notifications.markAllRead)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isInitialLoading = status === 'LoadingFirstPage'
  const canLoadMore = status === 'CanLoadMore'
  const isLoadingMore = status === 'LoadingMore'

  const handleLoadMore = useCallback(() => {
    if (status === 'CanLoadMore') loadMore(20)
  }, [status, loadMore])

  // Infinite scroll: observa um sentinela no fim da lista; quando entra no
  // viewport do popover, dispara a próxima página. Reseta sempre que o
  // popover abre/fecha porque o IntersectionObserver precisa do DOM montado.
  useEffect(() => {
    if (!open) return
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) handleLoadMore()
      },
      { rootMargin: '120px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [open, handleLoadMore, notifications.length])

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (popoverRef.current?.contains(target)) return
      if (buttonRef.current?.contains(target)) return
      setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const handleOpen = () => {
    setOpen((v) => !v)
  }

  // Marca representante + dobrados como lidos quando o usuário clica no grupo.
  const handleGroupClick = (group: NotifGroup) => {
    const ids = [group.representative._id, ...group.others.map((o) => o._id)]
    Promise.all(ids.filter(Boolean).map((id) => markRead({ id }).catch(() => {}))).catch(() => {})
  }

  const groups = useMemo(() => groupNotifications(notifications as readonly NotifRow[]), [notifications])

  const handleMarkAll = async () => {
    try {
      await markAllRead({})
    } catch { /* best-effort */ }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleOpen}
        type="button"
        aria-label={unread > 0 ? `Notificações (${unread} não lidas)` : 'Notificações'}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-[#151B23]/70 text-white/72 backdrop-blur-sm transition-all duration-200 hover:border-white/16 hover:bg-[#1B2430] hover:text-white"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#F37E20] px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          ref={popoverRef}
          className="absolute right-0 top-12 z-40 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/8 bg-[#151B23] shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
        >
          <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
            <p className="text-sm font-semibold text-white">Notificações</p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs font-medium text-[#F2BD8A] hover:text-[#F37E20]"
              >
                Marcar todas como lidas
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isInitialLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
              </div>
            ) : groups.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-white/48">Você ainda não tem notificações.</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/6">
                {groups.map((g) => {
                  const n = g.representative
                  const isUnread = g.hasUnread
                  const groupedCount = g.others.length
                  const body = (
                    <>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'mt-1 h-2 w-2 flex-shrink-0 rounded-full',
                          isUnread ? 'bg-[#F37E20]' : 'bg-transparent',
                        )} />
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            'text-sm leading-snug',
                            isUnread ? 'font-semibold text-white' : 'text-white/72',
                          )}>
                            {n.title}
                            {groupedCount > 0 ? (
                              <span className="ml-1 text-xs font-medium text-white/48">
                                +{groupedCount}
                              </span>
                            ) : null}
                          </p>
                          {n.body ? (
                            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/48">
                              {n.body}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[11px] uppercase tracking-wider text-white/32">
                            {timeAgo(n.createdAt)}
                            {groupedCount > 0 ? (
                              <span className="ml-2 normal-case tracking-normal text-white/40">
                                {groupedCount + 1} no total
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </>
                  )

                  const cls = cn(
                    'block px-4 py-3 text-left transition-colors',
                    isUnread ? 'bg-[#F37E20]/5 hover:bg-[#F37E20]/10' : 'hover:bg-white/[0.03]',
                  )

                  if (n.link) {
                    return (
                      <li key={g.key}>
                        <Link
                          to={n.link}
                          className={cls}
                          onClick={() => {
                            handleGroupClick(g)
                            setOpen(false)
                          }}
                        >
                          {body}
                        </Link>
                      </li>
                    )
                  }

                  return (
                    <li key={g.key}>
                      <button
                        type="button"
                        onClick={() => handleGroupClick(g)}
                        className={cn(cls, 'w-full')}
                      >
                        {body}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            {!isInitialLoading && (canLoadMore || isLoadingMore) ? (
              <div ref={sentinelRef} className="flex items-center justify-center py-4">
                {isLoadingMore ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
                ) : (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="text-xs font-medium text-white/48 hover:text-white"
                  >
                    Carregar mais
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
