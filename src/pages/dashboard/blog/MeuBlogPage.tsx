import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { brandPanelClass, brandPrimaryButtonClass, brandSecondaryButtonClass, cn } from '@/lib/brand'
import { useCurrentAppUser } from '@/lib/currentUser'
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
  const { currentUser } = useCurrentAppUser()
  const handle = currentUser?.handle ?? null

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
                    <PostRow key={p._id} post={p} handle={handle} onDelete={handleDelete} />
                  ))}
                </div>
              </motion.section>
            )}

            {published.length > 0 && (
              <motion.section variants={fadeUp} className="space-y-4">
                <DashboardSectionLabel>Publicados</DashboardSectionLabel>
                <div className="grid gap-4 lg:grid-cols-2">
                  {published.map((p) => (
                    <PostRow key={p._id} post={p} handle={handle} onDelete={handleDelete} />
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
  slug: string
  excerpt: string
  status: 'draft' | 'scheduled' | 'published' | 'unlisted' | 'removed'
  publishedAt: number | null
  updatedAt: number
  likeCount: number
  commentCount: number
  viewCount: number
  categorySlug: string
  coverImageUrl: string | null
}

function PostRow({
  post,
  handle,
  onDelete,
}: {
  post: PostListItem
  handle: string | null
  onDelete: (id: Id<'posts'>) => void
}) {
  const canViewLive = post.status === 'published' && handle
  return (
    <div className={cn('overflow-hidden p-0', brandPanelClass)}>
      {post.coverImageUrl ? (
        <div className="relative aspect-[16/7] w-full overflow-hidden bg-white/[0.04]">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/7] w-full items-center justify-center bg-[linear-gradient(135deg,rgba(243,126,32,0.08)_0%,rgba(243,126,32,0.02)_100%)]">
          <svg className="h-10 w-10 text-white/20" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
      )}

      <div className="p-5">
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

        <div className="mt-4 flex flex-wrap gap-3">
          <Link to={`/dashboard/blog/${post._id}`} className={cn('flex-1 min-w-[8rem]', brandSecondaryButtonClass)}>
            Editar
          </Link>
          {canViewLive && (
            <a
              href={`/blog/${handle}/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#F37E20]/24 bg-[#F37E20]/10 px-4 py-3 text-sm font-semibold text-[#F2BD8A] transition-all hover:border-[#F37E20]/40 hover:bg-[#F37E20]/16 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Ver artigo
            </a>
          )}
          <button
            onClick={() => onDelete(post._id)}
            className="inline-flex items-center justify-center rounded-2xl border border-red-400/12 bg-red-400/6 px-4 py-3 text-sm font-semibold text-red-200 transition-colors duration-200 hover:bg-red-400/12"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  )
}
