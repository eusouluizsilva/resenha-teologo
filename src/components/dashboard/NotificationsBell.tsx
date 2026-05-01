import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { cn } from '@/lib/brand'
import type { Id } from '@convex/_generated/dataModel'

// Sino de notificações do dashboard. Lê as 20 mais recentes e o count de não
// lidas via queries reativas do Convex. Clique em uma notificação marca como
// lida e, se houver link, navega até ele. Fechar o popover clicando fora.

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

  const notifications = useQuery(api.notifications.listMine, {})
  const unread = useQuery(api.notifications.countUnread, {}) ?? 0
  const markRead = useMutation(api.notifications.markRead)
  const markAllRead = useMutation(api.notifications.markAllRead)

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

  const handleClick = async (id: Id<'notifications'>) => {
    try {
      await markRead({ id })
    } catch { /* best-effort */ }
  }

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
            {notifications === undefined ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-white/48">Você ainda não tem notificações.</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/6">
                {notifications.map((n) => {
                  const isUnread = !n.readAt
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
                          </p>
                          {n.body ? (
                            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/48">
                              {n.body}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[11px] uppercase tracking-wider text-white/32">
                            {timeAgo(n.createdAt)}
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
                      <li key={n._id}>
                        <Link
                          to={n.link}
                          className={cls}
                          onClick={() => {
                            void handleClick(n._id)
                            setOpen(false)
                          }}
                        >
                          {body}
                        </Link>
                      </li>
                    )
                  }

                  return (
                    <li key={n._id}>
                      <button
                        type="button"
                        onClick={() => void handleClick(n._id)}
                        className={cn(cls, 'w-full')}
                      >
                        {body}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
