import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { cn } from '@/lib/brand'

// Command palette global (Cmd+K / Ctrl+K). Permite buscar cursos, criadores
// e artigos a partir de qualquer rota. Atalhos rapidos para paginas chave
// quando o termo esta vazio. Resultados sao consultados em tempo real do
// Convex (api.search.globalSearch) com debounce simples.

type FlatItem =
  | { kind: 'shortcut'; label: string; description?: string; href: string }
  | { kind: 'course'; label: string; description?: string; href: string }
  | { kind: 'creator'; label: string; description?: string; href: string }
  | { kind: 'post'; label: string; description?: string; href: string }

const SHORTCUTS: Array<{ label: string; description: string; href: string }> = [
  { label: 'Início', description: 'Ir para o painel principal', href: '/dashboard' },
  { label: 'Catálogo de cursos', description: 'Ver todos os cursos publicados', href: '/cursos' },
  { label: 'Bíblia', description: 'Abrir leitor bíblico', href: '/biblia' },
  { label: 'Loja', description: 'Produtos e materiais teológicos', href: '/loja' },
  { label: 'Blog', description: 'Artigos e reflexões', href: '/blog' },
  { label: 'Configurações de funções', description: 'Ativar ou desativar funções', href: '/dashboard/funcoes' },
  { label: 'Suporte', description: 'Falar com a equipe', href: '/contato' },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Atalho global Cmd+K / Ctrl+K. Tambem fecha com Esc.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey
      if (cmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open) {
      // Reseta busca/seleção sempre que o palette reabre.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery('')
       
      setActiveIndex(0)
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [open])

  // Trava scroll quando aberto.
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  const trimmed = query.trim()
  const shouldSearch = trimmed.length >= 2
  const results = useQuery(
    api.search.globalSearch,
    shouldSearch ? { q: trimmed } : 'skip',
  )

  const items = useMemo<FlatItem[]>(() => {
    if (!shouldSearch) {
      return SHORTCUTS.map((s) => ({ kind: 'shortcut' as const, ...s }))
    }
    if (!results) return []

    const flat: FlatItem[] = []
    results.courses.forEach((c) => {
      flat.push({
        kind: 'course',
        label: c.title,
        description: c.category ? `Curso, ${c.category}` : 'Curso',
        href: `/cursos/${c.slug}`,
      })
    })
    results.creators.forEach((u) => {
      flat.push({
        kind: 'creator',
        label: u.name ?? u.handle,
        description: `@${u.handle}`,
        href: `/${u.handle}`,
      })
    })
    results.posts.forEach((p) => {
      flat.push({
        kind: 'post',
        label: p.title,
        description: `Artigo de ${p.authorName}`,
        href: `/blog/${p.handle}/${p.slug}`,
      })
    })
    return flat
  }, [shouldSearch, results])

  useEffect(() => {
    // Mantém o índice ativo dentro do range quando a lista muda.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeIndex >= items.length) setActiveIndex(0)
  }, [items.length, activeIndex])

  function go(href: string) {
    setOpen(false)
    navigate(href)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = items[activeIndex]
      if (item) go(item.href)
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Busca global"
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-24 sm:pt-32"
    >
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-white/10',
          'bg-[#0F141A] shadow-[0_60px_180px_rgba(0,0,0,0.6)]',
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
          <svg className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Buscar cursos, criadores, artigos..."
            aria-label="Termo de busca"
            className="flex-1 bg-transparent text-base text-white placeholder:text-white/36 focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/52 sm:inline-block">
            Esc
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
          {!shouldSearch ? (
            <div>
              <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                Atalhos
              </p>
              {items.map((item, i) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => go(item.href)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition-colors',
                    activeIndex === i ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]',
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{item.label}</p>
                    {item.description ? (
                      <p className="truncate text-xs text-white/48">{item.description}</p>
                    ) : null}
                  </div>
                  <svg className="h-4 w-4 flex-shrink-0 text-white/28" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ))}
            </div>
          ) : results === undefined ? (
            <div className="px-4 py-10 text-center text-sm text-white/52">Buscando...</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-white/52">
              Nenhum resultado para "{trimmed}".
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item, i) => (
                <button
                  key={`${item.kind}-${item.href}`}
                  type="button"
                  onClick={() => go(item.href)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition-colors',
                    activeIndex === i ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]',
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{item.label}</p>
                    {item.description ? (
                      <p className="truncate text-xs text-white/48">{item.description}</p>
                    ) : null}
                  </div>
                  <span className="rounded-full border border-white/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/52">
                    {item.kind === 'course' ? 'Curso' : item.kind === 'creator' ? 'Criador' : 'Artigo'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/6 px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-white/36">
          <span>Navegue com setas, abra com Enter</span>
          <span>
            <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-white/52">Cmd</kbd>
            {' + '}
            <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-white/52">K</kbd>
          </span>
        </div>
      </div>
    </div>
  )
}
