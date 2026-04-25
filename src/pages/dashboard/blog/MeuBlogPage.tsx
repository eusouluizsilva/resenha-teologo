import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { brandPanelClass, brandPrimaryButtonClass, brandSecondaryButtonClass, cn } from '@/lib/brand'
import {
  DashboardEmptyState,
  DashboardPageShell,
  DashboardSectionLabel,
  DashboardStatusPill,
} from '@/components/dashboard/PageShell'

const statusLabel: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  published: 'Publicado',
  unlisted: 'Não listado',
  removed: 'Removido',
}

const statusTone: Record<string, 'success' | 'info' | 'accent' | 'neutral'> = {
  draft: 'neutral',
  scheduled: 'info',
  published: 'success',
  unlisted: 'accent',
  removed: 'neutral',
}

function formatDate(ts: number | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function MeuBlogPage() {
  const posts = useQuery(api.posts.listMine, {})
  const softDelete = useMutation(api.posts.softDeleteMine)

  const isLoading = posts === undefined
  const list = posts ?? []
  const drafts = list.filter((p) => p.status === 'draft' || p.status === 'scheduled')
  const published = list.filter((p) => p.status === 'published' || p.status === 'unlisted')

  async function handleDelete(id: Id<'posts'>) {
    if (!confirm('Remover este artigo? Esta ação ocultará o artigo do blog e do seu perfil.')) return
    await softDelete({ postId: id })
  }

  return (
    <DashboardPageShell
      eyebrow="Editorial"
      title="Meus artigos"
      description="Escreva, revise e publique no blog. Cada artigo aparece no /blog e no seu perfil público."
      actions={
        <Link to="/dashboard/blog/novo" className={brandPrimaryButtonClass}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo artigo
        </Link>
      }
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
        {isLoading ? (
          <motion.div variants={fadeUp} className={cn('flex min-h-[40vh] items-center justify-center', brandPanelClass)}>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
          </motion.div>
        ) : list.length === 0 ? (
          <motion.div variants={fadeUp}>
            <DashboardEmptyState
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              }
              title="Você ainda não publicou nada"
              description="Comece com um rascunho. Publique quando estiver pronto, ou agende para mais tarde. Tudo em Markdown, com preview ao vivo."
              action={
                <Link to="/dashboard/blog/novo" className={brandPrimaryButtonClass}>
                  Escrever primeiro artigo
                </Link>
              }
            />
          </motion.div>
        ) : (
          <>
            {drafts.length > 0 && (
              <motion.section variants={fadeUp} className="space-y-4">
                <DashboardSectionLabel>Em produção</DashboardSectionLabel>
                <div className="grid gap-4 lg:grid-cols-2">
                  {drafts.map((p) => (
                    <PostRow key={p._id} post={p} onDelete={handleDelete} />
                  ))}
                </div>
              </motion.section>
            )}

            {published.length > 0 && (
              <motion.section variants={fadeUp} className="space-y-4">
                <DashboardSectionLabel>Publicados</DashboardSectionLabel>
                <div className="grid gap-4 lg:grid-cols-2">
                  {published.map((p) => (
                    <PostRow key={p._id} post={p} onDelete={handleDelete} />
                  ))}
                </div>
              </motion.section>
            )}
          </>
        )}
      </motion.div>
    </DashboardPageShell>
  )
}

type PostListItem = {
  _id: Id<'posts'>
  title: string
  excerpt: string
  status: 'draft' | 'scheduled' | 'published' | 'unlisted' | 'removed'
  publishedAt: number | null
  updatedAt: number
  likeCount: number
  commentCount: number
  viewCount: number
  categorySlug: string
}

function PostRow({ post, onDelete }: { post: PostListItem; onDelete: (id: Id<'posts'>) => void }) {
  return (
    <div className={cn('p-5', brandPanelClass)}>
      <div className="flex items-start justify-between gap-3">
        <DashboardStatusPill tone={statusTone[post.status] ?? 'neutral'}>
          {statusLabel[post.status] ?? post.status}
        </DashboardStatusPill>
        <span className="text-[11px] uppercase tracking-[0.16em] text-white/28">
          {post.categorySlug.replace(/-/g, ' ')}
        </span>
      </div>

      <h3 className="mt-4 font-display text-xl font-bold leading-tight text-white">{post.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/52">{post.excerpt}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] py-2">
          <p className="font-display text-base font-bold text-white">{post.viewCount.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/28">Leituras</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] py-2">
          <p className="font-display text-base font-bold text-white">{post.likeCount}</p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/28">Curtidas</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] py-2">
          <p className="font-display text-base font-bold text-white">{post.commentCount}</p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/28">Comentários</p>
        </div>
      </div>

      <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-white/30">
        {post.status === 'published' ? `Publicado em ${formatDate(post.publishedAt)}` : `Atualizado em ${formatDate(post.updatedAt)}`}
      </p>

      <div className="mt-4 flex gap-3">
        <Link to={`/dashboard/blog/${post._id}`} className={cn('flex-1', brandSecondaryButtonClass)}>
          Editar
        </Link>
        <button
          onClick={() => onDelete(post._id)}
          className="inline-flex items-center justify-center rounded-2xl border border-red-400/12 bg-red-400/6 px-4 py-3 text-sm font-semibold text-red-200 transition-colors duration-200 hover:bg-red-400/12"
        >
          Remover
        </button>
      </div>
    </div>
  )
}
