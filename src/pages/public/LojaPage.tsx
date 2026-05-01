import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { brandPanelClass, brandStatusPillClass, cn } from '@/lib/brand'
import { useBreadcrumbJsonLd, useSeo } from '@/lib/seo'
import { PublicPageShell } from '@/components/layout/PublicPageShell'

type CatalogItem = {
  _id: string
  title: string
  slug: string
  shortDescription: string | null
  type: 'fisico' | 'digital' | 'servico'
  priceCents: number
  compareAtCents: number | null
  coverUrl: string | null
  stock: number | null
  creatorName: string
  creatorHandle: string | null
}

const TYPE_LABEL: Record<CatalogItem['type'], string> = {
  fisico: 'Físico',
  digital: 'Digital',
  servico: 'Serviço',
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function ProductCard({ product }: { product: CatalogItem }) {
  return (
    <Link
      to={`/loja/${product.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden transition-all duration-200 hover:border-white/14 hover:shadow-[0_32px_80px_rgba(0,0,0,0.35)]',
        brandPanelClass,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[#111820]">
        {product.coverUrl ? (
          <img
            src={product.coverUrl}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-10 w-10 text-white/14" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-white/10 bg-[#0F141A]/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 backdrop-blur-sm">
            {TYPE_LABEL[product.type]}
          </span>
          {product.compareAtCents && product.compareAtCents > product.priceCents ? (
            <span className="rounded-full border border-[#F37E20]/30 bg-[#F37E20]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F2BD8A] backdrop-blur-sm">
              Oferta
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-semibold leading-snug text-white transition-colors duration-200 group-hover:text-[#F2BD8A]">
          {product.title}
        </h3>
        {product.shortDescription ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/48">
            {product.shortDescription}
          </p>
        ) : null}

        <div className="mt-4 flex items-end justify-between gap-2 border-t border-white/6 pt-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/36">
              {product.creatorName}
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-lg font-bold text-white">
                {formatBRL(product.priceCents)}
              </span>
              {product.compareAtCents && product.compareAtCents > product.priceCents ? (
                <span className="text-xs text-white/36 line-through">
                  {formatBRL(product.compareAtCents)}
                </span>
              ) : null}
            </div>
          </div>
          {product.type === 'fisico' && product.stock !== null && product.stock <= 3 ? (
            <span className={brandStatusPillClass('accent')}>
              {product.stock === 0 ? 'Esgotado' : `${product.stock} em estoque`}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

export function LojaPage() {
  useSeo({
    title: 'Loja de produtos teológicos',
    description:
      'Livros, ebooks e recursos teológicos selecionados para sua formação. Apoie criadores cristãos diretamente.',
    url: 'https://resenhadoteologo.com/loja',
    type: 'website',
  })
  useBreadcrumbJsonLd([
    { name: 'Início', url: 'https://resenhadoteologo.com/' },
    { name: 'Loja', url: 'https://resenhadoteologo.com/loja' },
  ])

  const products = useQuery(api.products.listPublic, {}) as CatalogItem[] | undefined
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const typeParam = params.get('tipo')
  const type: 'todos' | CatalogItem['type'] =
    typeParam === 'fisico' || typeParam === 'digital' || typeParam === 'servico'
      ? typeParam
      : 'todos'

  function updateParam(key: 'q' | 'tipo', value: string) {
    const next = new URLSearchParams(params)
    if (!value || value === 'todos') {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    if (!products) return []
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (type !== 'todos' && p.type !== type) return false
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        (p.shortDescription ?? '').toLowerCase().includes(q) ||
        p.creatorName.toLowerCase().includes(q)
      )
    })
  }, [products, search, type])

  return (
    <PublicPageShell>
      <div className="min-h-screen bg-[#0F141A] text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
              Loja
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
              Recursos para sua jornada teológica
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/56">
              Livros, ebooks e materiais selecionados pelos criadores da plataforma.
              Cada compra apoia diretamente quem produz conteúdo de formação cristã.
            </p>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => updateParam('q', e.target.value)}
              placeholder="Buscar por título, descrição ou criador..."
              aria-label="Buscar produtos"
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/36 transition-all focus:border-[#F37E20]/40 focus:bg-white/[0.05] focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'todos' as const, label: 'Todos' },
                  { value: 'fisico' as const, label: 'Físicos' },
                  { value: 'digital' as const, label: 'Digitais' },
                  { value: 'servico' as const, label: 'Serviços' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateParam('tipo', opt.value)}
                  className={cn(
                    'rounded-2xl border px-4 py-2 text-sm font-medium transition-all',
                    type === opt.value
                      ? 'border-[#F37E20]/40 bg-[#F37E20]/10 text-[#F2BD8A]'
                      : 'border-white/10 bg-white/4 text-white/72 hover:border-white/20 hover:bg-white/8',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {products === undefined ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={cn('animate-pulse aspect-[3/4]', brandPanelClass)}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={cn('p-12 text-center', brandPanelClass)}>
              <h3 className="font-display text-xl font-bold text-white">
                Nenhum produto encontrado
              </h3>
              <p className="mt-2 text-sm text-white/56">
                {products.length === 0
                  ? 'Os primeiros produtos chegarão em breve.'
                  : 'Ajuste os filtros para ver mais opções.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicPageShell>
  )
}
