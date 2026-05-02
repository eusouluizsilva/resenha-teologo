import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import {
  brandInputClass,
  brandPanelClass,
  brandPrimaryButtonClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'

type ProductRow = Doc<'products'>

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

const TYPE_LABEL: Record<ProductRow['type'], string> = {
  fisico: 'Físico',
  digital: 'Digital',
  servico: 'Serviço',
}

function StatusPill({ status }: { status: ProductRow['status'] }) {
  const tone = status === 'published' ? 'success' : status === 'draft' ? 'neutral' : 'info'
  const label = status === 'published' ? 'Publicado' : status === 'draft' ? 'Rascunho' : 'Arquivado'
  return <span className={brandStatusPillClass(tone)}>{label}</span>
}

function NewProductModal({ onClose }: { onClose: () => void }) {
  const create = useMutation(api.products.create)
  const formId = useId()
  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ProductRow['type']>('fisico')
  const [price, setPrice] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const priceNum = Number(price.replace(',', '.'))
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError('Preço inválido')
      return
    }
    setSubmitting(true)
    try {
      await create({
        title: title.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        type,
        priceCents: Math.round(priceNum * 100),
        coverUrl: coverUrl.trim() || undefined,
        externalUrl: externalUrl.trim() || undefined,
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar produto')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className={cn('w-full max-w-2xl space-y-4 p-6 sm:p-8', brandPanelClass)}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-2xl font-bold text-white">Novo produto</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/56 transition-all hover:text-white"
            aria-label="Fechar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor={`${formId}-title`} className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
              Título
            </label>
            <input
              id={`${formId}-title`}
              type="text"
              required
              minLength={3}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(brandInputClass, 'mt-1.5 w-full')}
              placeholder="Ex: Comentário de Romanos"
            />
          </div>

          <div>
            <label htmlFor={`${formId}-shortDescription`} className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
              Descrição curta (catálogo)
            </label>
            <input
              id={`${formId}-shortDescription`}
              type="text"
              maxLength={180}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className={cn(brandInputClass, 'mt-1.5 w-full')}
              placeholder="Resumo de uma linha"
            />
          </div>

          <div>
            <label htmlFor={`${formId}-description`} className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
              Descrição completa
            </label>
            <textarea
              id={`${formId}-description`}
              required
              rows={5}
              minLength={20}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(brandInputClass, 'mt-1.5 w-full resize-y')}
              placeholder="Descreva o produto em detalhes."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${formId}-type`} className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
                Tipo
              </label>
              <select
                id={`${formId}-type`}
                value={type}
                onChange={(e) => setType(e.target.value as ProductRow['type'])}
                className={cn(brandInputClass, 'mt-1.5 w-full')}
              >
                <option value="fisico">Físico</option>
                <option value="digital">Digital</option>
                <option value="servico">Serviço</option>
              </select>
            </div>

            <div>
              <label htmlFor={`${formId}-price`} className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
                Preço (R$)
              </label>
              <input
                id={`${formId}-price`}
                type="text"
                required
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={cn(brandInputClass, 'mt-1.5 w-full')}
                placeholder="59,90"
              />
            </div>
          </div>

          <div>
            <label htmlFor={`${formId}-coverUrl`} className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
              URL da capa (opcional)
            </label>
            <input
              id={`${formId}-coverUrl`}
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className={cn(brandInputClass, 'mt-1.5 w-full')}
              placeholder="https://..."
            />
          </div>

          <div>
            <label htmlFor={`${formId}-externalUrl`} className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56">
              Link externo (opcional)
            </label>
            <input
              id={`${formId}-externalUrl`}
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className={cn(brandInputClass, 'mt-1.5 w-full')}
              placeholder="Amazon, Hotmart, site próprio..."
            />
            <p className="mt-1 text-xs text-white/36">
              Se preenchido, o botão Comprar redireciona para este link em vez de criar pedido interno.
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/8 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-2xl border border-white/12 bg-white/4 px-5 py-3 text-sm font-medium text-white/82 transition-all hover:border-white/22 hover:bg-white/8 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={cn(brandPrimaryButtonClass, 'disabled:opacity-50')}
          >
            {submitting ? 'Salvando...' : 'Criar produto'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function MinhaLojaPage() {
  const products = useQuery(api.products.listMine, {}) as ProductRow[] | undefined
  const setStatus = useMutation(api.products.setStatus)
  const remove = useMutation(api.products.remove)
  const [creating, setCreating] = useState(false)

  async function togglePublish(p: ProductRow) {
    const next = p.status === 'published' ? 'draft' : 'published'
    await setStatus({ productId: p._id as Id<'products'>, status: next })
  }

  async function handleArchive(p: ProductRow) {
    if (!window.confirm(`Arquivar "${p.title}"?`)) return
    await setStatus({ productId: p._id as Id<'products'>, status: 'archived' })
  }

  async function handleDelete(p: ProductRow) {
    if (!window.confirm(`Excluir "${p.title}"? Esta ação não pode ser desfeita.`)) return
    await remove({ productId: p._id as Id<'products'> })
  }

  return (
    <DashboardPageShell
      eyebrow="Loja"
      title="Minha loja"
      description="Cadastre livros, ebooks ou serviços. Publique para aparecer no catálogo público."
      actions={
        <button
          type="button"
          onClick={() => setCreating(true)}
          className={brandPrimaryButtonClass}
        >
          Novo produto
        </button>
      }
    >
      {products === undefined ? (
        <div className={cn('animate-pulse p-6', brandPanelClass)}>
          <div className="h-4 w-32 rounded-full bg-white/8" />
        </div>
      ) : products.length === 0 ? (
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          }
          title="Nenhum produto ainda"
          description="Crie seu primeiro produto. Pode ser um livro físico, ebook ou link externo."
          action={
            <button
              type="button"
              onClick={() => setCreating(true)}
              className={brandPrimaryButtonClass}
            >
              Criar produto
            </button>
          }
        />
      ) : (
        <ul className={cn('divide-y divide-white/6 overflow-hidden', brandPanelClass)}>
          {products.map((p) => (
            <li
              key={p._id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
            >
              {p.coverUrl ? (
                <img
                  src={p.coverUrl}
                  alt=""
                  loading="lazy"
                  className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-white/8" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-display text-base font-semibold text-white">
                    {p.title}
                  </p>
                  <StatusPill status={p.status} />
                </div>
                <p className="mt-0.5 text-xs text-white/48">
                  {TYPE_LABEL[p.type]} · {formatBRL(p.priceCents)}
                  {p.stock !== undefined && p.stock !== null && p.type === 'fisico'
                    ? ` · ${p.stock} em estoque`
                    : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {p.status === 'published' && (
                  <Link
                    to={`/loja/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-white/12 bg-white/4 px-3 py-2 text-xs font-medium text-white/82 transition-all hover:border-white/22 hover:bg-white/8"
                  >
                    Ver
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => togglePublish(p)}
                  className="rounded-xl border border-[#F37E20]/22 bg-[#F37E20]/8 px-3 py-2 text-xs font-medium text-[#F2BD8A] transition-all hover:border-[#F37E20]/40 hover:bg-[#F37E20]/14"
                >
                  {p.status === 'published' ? 'Despublicar' : 'Publicar'}
                </button>
                {p.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => handleArchive(p)}
                    className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-xs font-medium text-white/56 transition-all hover:border-white/22 hover:text-white"
                  >
                    Arquivar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(p)}
                  className="rounded-xl border border-red-500/22 bg-red-500/4 px-3 py-2 text-xs font-medium text-red-300 transition-all hover:border-red-500/40 hover:bg-red-500/10"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {creating && <NewProductModal onClose={() => setCreating(false)} />}
    </DashboardPageShell>
  )
}
