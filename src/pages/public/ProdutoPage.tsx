import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { brandPanelClass, brandPrimaryButtonClass, brandStatusPillClass, cn } from '@/lib/brand'
import { useBreadcrumbJsonLd, useJsonLd, useSeo } from '@/lib/seo'
import { PublicPageShell } from '@/components/layout/PublicPageShell'

type Product = {
  _id: Id<'products'>
  title: string
  slug: string
  description: string
  shortDescription: string | null
  type: 'fisico' | 'digital' | 'servico'
  priceCents: number
  compareAtCents: number | null
  coverUrl: string | null
  galleryUrls: string[]
  stock: number | null
  externalUrl: string | null
  creatorName: string
  creatorHandle: string | null
  creatorAvatar: string | null
}

const TYPE_LABEL: Record<Product['type'], string> = {
  fisico: 'Produto físico',
  digital: 'Produto digital',
  servico: 'Serviço',
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function ProdutoPage() {
  const { slug } = useParams<{ slug: string }>()
  const product = useQuery(
    api.products.getBySlugPublic,
    slug ? { slug } : 'skip',
  ) as Product | null | undefined

  const { isSignedIn } = useAuth()
  const createOrder = useMutation(api.orders.create)

  const [activeImage, setActiveImage] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<
    { ok: boolean; message: string; orderId?: Id<'orders'> } | null
  >(null)

  useSeo({
    title: product ? `${product.title} - Loja` : 'Produto - Loja',
    description: product?.shortDescription ?? product?.description.slice(0, 160) ?? 'Produto teológico',
    url: `https://resenhadoteologo.com/loja/${slug}`,
    image: product?.coverUrl ?? null,
    type: 'website',
  })
  useBreadcrumbJsonLd([
    { name: 'Início', url: 'https://resenhadoteologo.com/' },
    { name: 'Loja', url: 'https://resenhadoteologo.com/loja' },
    ...(product ? [{ name: product.title, url: `https://resenhadoteologo.com/loja/${slug}` }] : []),
  ])
  useJsonLd(
    product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.title,
          description: product.shortDescription ?? product.description.slice(0, 200),
          image: product.coverUrl ?? undefined,
          brand: { '@type': 'Brand', name: product.creatorName },
          offers: {
            '@type': 'Offer',
            url: `https://resenhadoteologo.com/loja/${slug}`,
            priceCurrency: 'BRL',
            price: (product.priceCents / 100).toFixed(2),
            availability:
              product.stock === 0
                ? 'https://schema.org/OutOfStock'
                : 'https://schema.org/InStock',
          },
        }
      : null,
  )

  if (product === undefined) {
    return (
      <PublicPageShell>
        <div className="flex min-h-screen items-center justify-center bg-[#0F141A]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
        </div>
      </PublicPageShell>
    )
  }

  if (product === null) {
    return (
      <PublicPageShell>
        <div className="min-h-screen bg-[#0F141A] text-white">
          <div className="mx-auto max-w-2xl px-4 py-20 text-center">
            <h1 className="font-display text-3xl font-bold">Produto não encontrado</h1>
            <p className="mt-3 text-sm text-white/56">
              Este produto não está disponível ou foi removido.
            </p>
            <Link
              to="/loja"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/4 px-5 py-3 text-sm font-medium text-white transition-all hover:border-white/22 hover:bg-white/8"
            >
              Ver outros produtos
            </Link>
          </div>
        </div>
      </PublicPageShell>
    )
  }

  const images = [product.coverUrl, ...product.galleryUrls].filter(Boolean) as string[]
  const currentImage = images[activeImage] ?? null
  const outOfStock = product.type === 'fisico' && product.stock === 0

  async function handleBuy() {
    if (!product) return
    if (!isSignedIn) {
      window.location.href = `/entrar?next=/loja/${product.slug}`
      return
    }
    if (product.externalUrl) {
      window.open(product.externalUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setSubmitting(true)
    setOrderResult(null)
    try {
      const orderId = await createOrder({ items: [{ productId: product._id, quantity: 1 }] })
      setOrderResult({
        ok: true,
        message:
          'Pedido registrado. Acompanhe o status em "Meus pedidos" no seu painel.',
        orderId,
      })
    } catch (e) {
      setOrderResult({
        ok: false,
        message: e instanceof Error ? e.message : 'Erro ao registrar pedido',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PublicPageShell>
      <div className="min-h-screen bg-[#0F141A] text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <nav className="mb-6 text-xs text-white/48">
            <Link to="/" className="hover:text-white">Início</Link>
            <span className="mx-2">/</span>
            <Link to="/loja" className="hover:text-white">Loja</Link>
            <span className="mx-2">/</span>
            <span className="text-white/72">{product.title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className={cn('aspect-square w-full overflow-hidden', brandPanelClass)}>
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.title}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg className="h-16 w-16 text-white/14" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={img + i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={cn(
                        'h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border transition-all',
                        i === activeImage
                          ? 'border-[#F37E20]/40'
                          : 'border-white/10 hover:border-white/20',
                      )}
                    >
                      <img src={img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={brandStatusPillClass('neutral')}>
                  {TYPE_LABEL[product.type]}
                </span>
                {product.compareAtCents && product.compareAtCents > product.priceCents ? (
                  <span className={brandStatusPillClass('accent')}>Oferta</span>
                ) : null}
                {outOfStock ? (
                  <span className={brandStatusPillClass('neutral')}>Esgotado</span>
                ) : null}
              </div>

              <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
                {product.title}
              </h1>

              <div className="mt-3 flex items-center gap-3">
                {product.creatorAvatar ? (
                  <img
                    src={product.creatorAvatar}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-xs font-semibold text-white/82">
                    {product.creatorName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="text-sm">
                  <p className="text-white/48">Vendido por</p>
                  {product.creatorHandle ? (
                    <Link
                      to={`/${product.creatorHandle}`}
                      className="font-medium text-[#F2BD8A] hover:text-[#F37E20]"
                    >
                      {product.creatorName}
                    </Link>
                  ) : (
                    <p className="font-medium text-white">{product.creatorName}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-display text-4xl font-bold text-white">
                  {formatBRL(product.priceCents)}
                </span>
                {product.compareAtCents && product.compareAtCents > product.priceCents ? (
                  <span className="text-lg text-white/36 line-through">
                    {formatBRL(product.compareAtCents)}
                  </span>
                ) : null}
              </div>

              {product.shortDescription ? (
                <p className="mt-4 text-base leading-7 text-white/72">
                  {product.shortDescription}
                </p>
              ) : null}

              <button
                type="button"
                onClick={handleBuy}
                disabled={submitting || outOfStock}
                className={cn(
                  brandPrimaryButtonClass,
                  'mt-6 w-full justify-center disabled:opacity-50',
                )}
              >
                {submitting
                  ? 'Processando...'
                  : outOfStock
                  ? 'Esgotado'
                  : product.externalUrl
                  ? 'Comprar no site do criador'
                  : 'Comprar agora'}
              </button>

              {orderResult && (
                <div
                  className={cn(
                    'mt-4 rounded-2xl border p-4 text-sm',
                    orderResult.ok
                      ? 'border-[#10B981]/30 bg-[#10B981]/8 text-[#34D399]'
                      : 'border-red-500/30 bg-red-500/8 text-red-300',
                  )}
                >
                  <p>{orderResult.message}</p>
                  {orderResult.ok && orderResult.orderId ? (
                    <Link
                      to={`/dashboard/pedidos/${orderResult.orderId}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#34D399] underline-offset-2 hover:underline"
                    >
                      Acompanhar pedido
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  ) : null}
                </div>
              )}

              <p className="mt-3 text-xs text-white/36">
                Pagamento via Stripe será habilitado em breve. Por enquanto, o pedido
                fica registrado e o criador entra em contato.
              </p>

              <div className={cn('mt-8 p-6', brandPanelClass)}>
                <h2 className="font-display text-lg font-semibold text-white">
                  Sobre este produto
                </h2>
                <div className="mt-3 whitespace-pre-line text-sm leading-7 text-white/72">
                  {product.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
