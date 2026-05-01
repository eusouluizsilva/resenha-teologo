// Editor compartilhado para criação e edição de artigo. Renderiza dois modos:
// 'create' chama posts.createDraft, 'edit' chama posts.updateDraft. Em ambos
// o autor pode publicar/despublicar/remover usando os botões de ação no
// rodapé. Cover via Cloudflare R2 (useR2Upload → presigned PUT).

import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { fadeUp, staggerContainer } from '@/lib/motion'
import {
  brandInputClass,
  brandPanelClass,
  brandPrimaryButtonClass,
  brandSecondaryButtonClass,
  cn,
} from '@/lib/brand'
import { ArticleBody } from '@/components/blog/ArticleBody'
import { IdentitySelector, type IdentityValue } from '@/components/blog/IdentitySelector'
import { useR2Upload } from '@/lib/r2Upload'

const MAX_COVER_BYTES = 5 * 1024 * 1024
const MAX_INLINE_IMAGE_BYTES = 5 * 1024 * 1024

type Mode =
  | { kind: 'create' }
  | {
      kind: 'edit'
      postId: Id<'posts'>
      initial: {
        title: string
        excerpt: string
        bodyMarkdown: string
        categorySlug: string
        tagSlugs: string[]
        status: 'draft' | 'scheduled' | 'published' | 'unlisted' | 'removed'
        authorIdentity: 'aluno' | 'criador' | 'instituicao'
        authorInstitutionId: Id<'institutions'> | null
        coverImageR2Key: string | null
        coverImageUrl: string | null
        slug: string
      }
    }

interface ArticleEditorProps {
  mode: Mode
}

export function ArticleEditor({ mode }: ArticleEditorProps) {
  const navigate = useNavigate()
  const categoriesQuery = useQuery(api.postCategories.list, {})
  const categories = useMemo(() => categoriesQuery ?? [], [categoriesQuery])

  const createDraft = useMutation(api.posts.createDraft)
  const updateDraft = useMutation(api.posts.updateDraft)
  const publish = useMutation(api.posts.publish)
  const unpublish = useMutation(api.posts.unpublish)
  const softDelete = useMutation(api.posts.softDeleteMine)
  const { upload: uploadToR2, uploading: r2Uploading } = useR2Upload()

  const initial = mode.kind === 'edit' ? mode.initial : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '')
  const [body, setBody] = useState(initial?.bodyMarkdown ?? '')
  const [categorySlug, setCategorySlug] = useState(initial?.categorySlug ?? '')
  const [tagsInput, setTagsInput] = useState(initial?.tagSlugs.join(', ') ?? '')
  const [identityValue, setIdentityValue] = useState<IdentityValue | null>(
    initial
      ? {
          identity: initial.authorIdentity,
          institutionId: initial.authorInstitutionId ?? undefined,
        }
      : null,
  )
  const [coverR2Key, setCoverR2Key] = useState<string | null>(initial?.coverImageR2Key ?? null)
  const [coverPreview, setCoverPreview] = useState<string | null>(initial?.coverImageUrl ?? null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [insertingImage, setInsertingImage] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inlineFileInputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  // Em create, se o usuário ainda não escolheu, usa a primeira categoria
  // disponível como valor efetivo. Calculado, não sincronizado via setState.
  const effectiveCategorySlug =
    categorySlug || (mode.kind === 'create' ? categories[0]?.slug ?? '' : '')

  const tags = useMemo(
    () =>
      tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5),
    [tagsInput],
  )

  function validate(): string | null {
    if (!title.trim()) return 'Título obrigatório.'
    if (!excerpt.trim()) return 'Resumo obrigatório.'
    if (!body.trim()) return 'O artigo está vazio.'
    if (!effectiveCategorySlug) return 'Selecione uma categoria.'
    if (!identityValue) return 'Escolha como você publica este artigo.'
    if (identityValue.identity === 'instituicao' && !identityValue.institutionId) {
      return 'Selecione a instituição.'
    }
    return null
  }

  async function handleCoverUpload(file: File) {
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('Envie um arquivo de imagem.')
      return
    }
    if (file.size > MAX_COVER_BYTES) {
      setError('Imagem acima de 5 MB. Reduza antes de enviar.')
      return
    }
    setBusy(true)
    try {
      const { key, publicUrl } = await uploadToR2(file, 'cover')
      setCoverR2Key(key)
      setCoverPreview(publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem.')
    } finally {
      setBusy(false)
    }
  }

  async function handleInsertInlineImage(file: File) {
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('Envie um arquivo de imagem.')
      return
    }
    if (file.size > MAX_INLINE_IMAGE_BYTES) {
      setError('Imagem acima de 5 MB. Reduza antes de enviar.')
      return
    }
    setInsertingImage(true)
    try {
      const { publicUrl } = await uploadToR2(file, 'post-image')
      const alt = file.name.replace(/\.[^.]+$/, '').slice(0, 80) || 'imagem'
      const snippet = `\n\n![${alt}](${publicUrl})\n\n`
      const textarea = bodyRef.current
      if (textarea) {
        const start = textarea.selectionStart ?? body.length
        const end = textarea.selectionEnd ?? body.length
        const next = body.slice(0, start) + snippet + body.slice(end)
        setBody(next)
        const caret = start + snippet.length
        requestAnimationFrame(() => {
          textarea.focus()
          textarea.setSelectionRange(caret, caret)
        })
      } else {
        setBody((prev) => prev + snippet)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem.')
    } finally {
      setInsertingImage(false)
    }
  }

  async function persist(): Promise<Id<'posts'> | null> {
    const v = validate()
    if (v) {
      setError(v)
      return null
    }
    if (!identityValue) return null
    setBusy(true)
    setError('')
    try {
      if (mode.kind === 'create') {
        const id = await createDraft({
          title: title.trim(),
          excerpt: excerpt.trim(),
          bodyMarkdown: body,
          categorySlug: effectiveCategorySlug,
          tags,
          authorIdentity: identityValue.identity,
          authorInstitutionId: identityValue.institutionId,
          coverImageR2Key: coverR2Key ?? undefined,
        })
        return id
      }
      await updateDraft({
        postId: mode.postId,
        title: title.trim(),
        excerpt: excerpt.trim(),
        bodyMarkdown: body,
        categorySlug: effectiveCategorySlug,
        tags,
        authorIdentity: identityValue.identity,
        authorInstitutionId: identityValue.institutionId,
        coverImageR2Key: coverR2Key ?? undefined,
      })
      return mode.postId
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveDraft() {
    const id = await persist()
    if (!id) return
    if (mode.kind === 'create') navigate(`/dashboard/blog/${id}`)
  }

  async function handlePublish() {
    const id = await persist()
    if (!id) return
    setBusy(true)
    setError('')
    try {
      await publish({ postId: id })
      navigate('/dashboard/blog')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar.')
    } finally {
      setBusy(false)
    }
  }

  async function handleUnpublish() {
    if (mode.kind !== 'edit') return
    if (!confirm('Despublicar artigo? Ele volta para rascunho e some do blog público.')) return
    setBusy(true)
    setError('')
    try {
      await unpublish({ postId: mode.postId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao despublicar.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (mode.kind !== 'edit') return
    if (!confirm('Remover artigo permanentemente? Ele será ocultado do blog e do seu perfil.')) return
    setBusy(true)
    try {
      await softDelete({ postId: mode.postId })
      navigate('/dashboard/blog')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.')
      setBusy(false)
    }
  }

  const isPublished = mode.kind === 'edit' && initial?.status === 'published'

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {error && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-red-400/24 bg-red-400/8 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </motion.div>
      )}

      <motion.div variants={fadeUp} className={cn('space-y-6 p-6 sm:p-7', brandPanelClass)}>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
            Identidade
          </label>
          <IdentitySelector value={identityValue} onChange={setIdentityValue} disabled={busy} />
        </div>

        <div className="grid gap-5 md:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Ex: O que Calvino realmente disse sobre a graça comum"
              className={brandInputClass}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Categoria</label>
            <select
              value={effectiveCategorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className={brandInputClass}
            >
              <option value="">Selecione</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
            Resumo (até 220 caracteres)
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            maxLength={220}
            rows={2}
            placeholder="O gancho que aparece em listagens e em redes sociais."
            className={cn(brandInputClass, 'resize-y')}
          />
          <p className="text-[11px] text-white/32">{excerpt.length}/220</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
            Tags (até 5, separadas por vírgula)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="reforma, calvino, graca-comum"
            className={brandInputClass}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Capa</label>
          <div className="flex flex-wrap items-center gap-4">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Capa"
                className="h-28 w-44 rounded-xl border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-28 w-44 items-center justify-center rounded-xl border border-dashed border-white/12 bg-white/[0.02] text-xs text-white/40">
                Sem capa
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleCoverUpload(f)
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy || r2Uploading}
                className={brandSecondaryButtonClass}
              >
                {r2Uploading ? 'Enviando...' : coverPreview ? 'Trocar imagem' : 'Enviar imagem'}
              </button>
              {coverPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setCoverPreview(null)
                    setCoverR2Key(null)
                  }}
                  className="text-xs text-white/48 hover:text-white"
                >
                  Remover capa
                </button>
              )}
              <p className="text-[11px] text-white/32">JPG, PNG ou WebP, até 5 MB.</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className={cn('space-y-3 p-6 sm:p-7', brandPanelClass)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
            Conteúdo (Markdown)
          </label>
          <div className="flex items-center gap-4">
            {!showPreview && (
              <>
                <input
                  ref={inlineFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleInsertInlineImage(f)
                    e.target.value = ''
                  }}
                />
                <button
                  type="button"
                  onClick={() => inlineFileInputRef.current?.click()}
                  disabled={insertingImage}
                  className="text-xs font-semibold text-[#F2BD8A] hover:text-[#F37E20] disabled:opacity-50"
                >
                  {insertingImage ? 'Enviando imagem...' : 'Inserir imagem'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setShowPreview((s) => !s)}
              className="text-xs font-semibold text-[#F2BD8A] hover:text-[#F37E20]"
            >
              {showPreview ? 'Voltar a editar' : 'Ver pré-visualização'}
            </button>
          </div>
        </div>

        {showPreview ? (
          <div className="rounded-2xl border border-white/8 bg-[#F7F5F2] px-6 py-6 text-[#111827]">
            <ArticleBody markdown={body || '*(vazio)*'} />
          </div>
        ) : (
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={20}
            placeholder={`# Título principal\n\nUm parágrafo de abertura. Use \`##\` para subtítulos, \`>\` para citações e \`-\` para listas.\n\nDica: clique em "Inserir imagem" acima para subir um arquivo direto pro R2.`}
            className={cn(brandInputClass, 'font-mono text-[13px] leading-6 resize-y')}
          />
        )}
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={busy}
          className={brandSecondaryButtonClass}
        >
          {mode.kind === 'create' ? 'Salvar rascunho' : 'Salvar alterações'}
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={busy}
          className={brandPrimaryButtonClass}
        >
          {isPublished ? 'Salvar e republicar' : 'Publicar agora'}
        </button>

        {mode.kind === 'edit' && isPublished && (
          <button
            type="button"
            onClick={handleUnpublish}
            disabled={busy}
            className={brandSecondaryButtonClass}
          >
            Despublicar
          </button>
        )}
        {mode.kind === 'edit' && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-2xl border border-red-400/12 bg-red-400/6 px-5 py-3 text-sm font-semibold text-red-200 transition-colors duration-200 hover:bg-red-400/12 disabled:opacity-50"
          >
            Remover artigo
          </button>
        )}
        <Link to="/dashboard/blog" className="inline-flex items-center px-5 py-3 text-sm font-medium text-white/52 hover:text-white">
          Voltar
        </Link>
      </motion.div>
    </motion.div>
  )
}
