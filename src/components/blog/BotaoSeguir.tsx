// Botão Seguir autor com popover de preferências de notificação. Anônimos
// que clicam são levados para /entrar com return.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'

interface FollowButtonProps {
  authorUserId: string
  authorName: string
  // Variante: padrão usa cores light (blog/perfil); 'dark' para painéis escuros.
  tone?: 'light' | 'dark'
}

export function BotaoSeguir({ authorUserId, authorName, tone = 'light' }: FollowButtonProps) {
  const navigate = useNavigate()
  const { user, isSignedIn } = useUser()
  const isSelf = isSignedIn && user?.id === authorUserId
  const state = useQuery(
    api.profileFollows.isFollowing,
    isSignedIn && !isSelf ? { authorUserId } : 'skip',
  )
  const follow = useMutation(api.profileFollows.follow)
  const unfollow = useMutation(api.profileFollows.unfollow)
  const updatePrefs = useMutation(api.profileFollows.updateNotifyPrefs)

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!popoverOpen) return
    function onClick(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [popoverOpen])

  if (isSelf) return null

  const isFollowing = state?.following ?? false

  async function handleClick() {
    if (!isSignedIn) {
      const next = encodeURIComponent(window.location.pathname + window.location.search)
      navigate(`/entrar?return=${next}`)
      return
    }
    if (isFollowing) {
      setPopoverOpen((p) => !p)
      return
    }
    if (pending) return
    setPending(true)
    try {
      await follow({ authorUserId })
    } finally {
      setPending(false)
    }
  }

  async function setPref(key: 'notifyArticles' | 'notifyCourses' | 'notifyLessons', value: boolean) {
    await updatePrefs({ authorUserId, [key]: value })
  }

  async function handleUnfollow() {
    await unfollow({ authorUserId })
    setPopoverOpen(false)
  }

  const baseLight =
    'inline-flex items-center gap-2 rounded-2xl border border-[#E6DBCF] bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] transition-all duration-200 hover:border-[#F37E20]/40 hover:text-[#F37E20]'
  const activeLight =
    'inline-flex items-center gap-2 rounded-2xl border border-[#F37E20]/40 bg-[#F37E20]/10 px-4 py-2.5 text-sm font-semibold text-[#F37E20] transition-all duration-200'
  const baseDark =
    'inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:border-[#F37E20]/40 hover:text-[#F2BD8A]'
  const activeDark =
    'inline-flex items-center gap-2 rounded-2xl border border-[#F37E20]/40 bg-[#F37E20]/10 px-4 py-2.5 text-sm font-semibold text-[#F2BD8A]'

  return (
    <div ref={popRef} className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={
          isFollowing
            ? tone === 'dark' ? activeDark : activeLight
            : tone === 'dark' ? baseDark : baseLight
        }
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
          {isFollowing ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          )}
        </svg>
        {isFollowing ? `Seguindo` : `Seguir ${authorName.split(' ')[0]}`}
      </button>

      {isFollowing && popoverOpen && state?.prefs && (
        <div
          className={
            tone === 'dark'
              ? 'absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-white/10 bg-[#151B23] p-4 text-sm text-white/80 shadow-[0_24px_72px_rgba(0,0,0,0.4)]'
              : 'absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-[#E6DBCF] bg-white p-4 text-sm text-[#111827] shadow-[0_24px_72px_rgba(17,24,39,0.12)]'
          }
        >
          <p className={tone === 'dark' ? 'text-xs uppercase tracking-[0.18em] text-white/40' : 'text-xs uppercase tracking-[0.18em] text-[#9CA3AF]'}>
            Preferências
          </p>
          <PrefRow
            tone={tone}
            label="Novos artigos"
            checked={state.prefs.notifyArticles}
            onChange={(v) => setPref('notifyArticles', v)}
          />
          <PrefRow
            tone={tone}
            label="Novos cursos"
            checked={state.prefs.notifyCourses}
            onChange={(v) => setPref('notifyCourses', v)}
          />
          <PrefRow
            tone={tone}
            label="Aulas individuais"
            checked={state.prefs.notifyLessons}
            onChange={(v) => setPref('notifyLessons', v)}
          />
          <button
            onClick={handleUnfollow}
            className={
              tone === 'dark'
                ? 'mt-3 w-full rounded-xl border border-red-400/20 bg-red-400/8 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-400/14'
                : 'mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100'
            }
          >
            Deixar de seguir
          </button>
        </div>
      )}
    </div>
  )
}

function PrefRow({
  tone,
  label,
  checked,
  onChange,
}: {
  tone: 'light' | 'dark'
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      className={
        tone === 'dark'
          ? 'mt-2 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2'
          : 'mt-2 flex items-center justify-between rounded-xl border border-[#EFE6D9] bg-[#FCF9F4] px-3 py-2'
      }
    >
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#F37E20]"
      />
    </label>
  )
}
