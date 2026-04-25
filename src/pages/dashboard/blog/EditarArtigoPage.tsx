import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { brandSecondaryButtonClass } from '@/lib/brand'
import { DashboardPageShell } from '@/components/dashboard/PageShell'
import { ArticleEditor } from './ArticleEditor'

export function EditarArtigoPage() {
  const { postId } = useParams<{ postId: string }>()
  const post = useQuery(
    api.posts.getMineForEditor,
    postId ? { postId: postId as Id<'posts'> } : 'skip',
  )

  if (!postId) return <Navigate to="/dashboard/blog" replace />

  if (post === undefined) {
    return (
      <DashboardPageShell eyebrow="Editar artigo" title="Carregando" description="">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
        </div>
      </DashboardPageShell>
    )
  }

  if (post === null) {
    return (
      <DashboardPageShell
        eyebrow="Editar artigo"
        title="Artigo não encontrado"
        description="Este artigo não existe ou não pertence a você."
        maxWidthClass="max-w-2xl"
        actions={
          <Link to="/dashboard/blog" className={brandSecondaryButtonClass}>
            Voltar
          </Link>
        }
      >
        <div />
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell
      eyebrow="Editar artigo"
      title={post.title || 'Sem título'}
      description="Edite o conteúdo, troque a capa, ajuste a categoria. Use 'Salvar e republicar' para refletir mudanças no artigo já publicado."
      maxWidthClass="max-w-4xl"
      actions={
        <Link to="/dashboard/blog" className={brandSecondaryButtonClass}>
          Voltar para meus artigos
        </Link>
      }
    >
      <ArticleEditor
        mode={{
          kind: 'edit',
          postId: post._id,
          initial: {
            title: post.title,
            excerpt: post.excerpt,
            bodyMarkdown: post.bodyMarkdown,
            categorySlug: post.categorySlug,
            tagSlugs: post.tagSlugs,
            status: post.status,
            authorIdentity: post.authorIdentity,
            authorInstitutionId: post.authorInstitutionId,
            coverImageStorageId: post.coverImageStorageId,
            coverImageUrl: post.coverImageUrl,
            slug: post.slug,
          },
        }}
      />
    </DashboardPageShell>
  )
}
