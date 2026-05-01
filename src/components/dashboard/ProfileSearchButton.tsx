import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'

// Lupa de busca de perfis publicos. Click abre um popover ancorado abaixo do
// botao com input ao vivo. Resultados vem de users.searchPublic, limitados a
// 10 e ordenados por match no handle. Click em resultado leva para /:handle.

export function ProfileSearchButton() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 180)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
     
    if (open) inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else setQ('')
  }, [open])

  const results = useQuery(
    api.users.searchPublic,
    open && debounced.trim().length >= 2 ? { q: debounced } : 'skip',
  )

  const term = debounced.trim()
  const hasTerm = term.length >= 2
  const isLoading = hasTerm && results === undefined

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Buscar perfis"
        title="Buscar perfis"
        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-white/64 transition-all hover:border-[#F37E20]/40 hover:bg-[#F37E20]/10 hover:text-[#F2BD8A]"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10a7.5 7.5 0 0013.15 6.65z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-[20rem] sm:w-[24rem] overflow-hidden rounded-[1.55rem] border border-white/8 bg-[linear-gradient(180deg,rgba(27,36,48,0.98)_0%,rgba(18,24,33,0.98)_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
          <div className="border-b border-white/6 p-3">
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10a7.5 7.5 0 0013.15 6.65z" />
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nome ou @username"
                className="w-full rounded-xl border border-white/8 bg-[#10161E] py-2.5 pl-9 pr-3 text-sm text-white placeholder-white/32 focus:border-[#F37E20]/50 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/12"
              />
            </div>
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {!hasTerm && (
              <p className="px-4 py-6 text-center text-xs text-white/40">
                Digite pelo menos 2 letras para buscar.
              </p>
            )}

            {isLoading && (
              <p className="px-4 py-6 text-center text-xs text-white/40">Buscando...</p>
            )}

            {hasTerm && results && results.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-white/40">
                Nenhum perfil encontrado para "{term}".
              </p>
            )}

            {hasTerm && results && results.length > 0 && (
              <ul className="py-1">
                {results.map((u) => (
                  <li key={u.handle}>
                    <Link
                      to={`/${u.handle}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/5"
                    >
                      <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#F37E20]/10">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#F2BD8A]">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{u.name}</p>
                        <p className="truncate text-xs text-white/48">@{u.handle}</p>
                      </div>
                      {u.followerCount > 0 && (
                        <span className="flex-shrink-0 text-[11px] font-medium text-white/36">
                          {u.followerCount} {u.followerCount === 1 ? 'seguidor' : 'seguidores'}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
