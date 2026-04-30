import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { DashboardPageShell } from '@/components/dashboard/PageShell'
import {
  brandInputClass,
  brandPanelClass,
  brandPrimaryButtonClass,
  brandSecondaryButtonClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'
import { useCreatorId } from '@/lib/useCreatorId'

type CourseOption = {
  _id: Id<'courses'>
  title: string
  isPublished: boolean
  totalLessons: number
}

export function EditarTrilhaPage() {
  const params = useParams()
  const navigate = useNavigate()
  const pathIdRaw = params.id as Id<'learningPaths'> | undefined

  const path = useQuery(
    api.learningPaths.getById,
    pathIdRaw ? { pathId: pathIdRaw } : 'skip',
  )

  const creatorId = useCreatorId()
  const myCourses = useQuery(
    api.courses.listByCreator,
    creatorId ? { creatorId } : 'skip',
  ) as CourseOption[] | undefined

  const update = useMutation(api.learningPaths.update)
  const remove = useMutation(api.learningPaths.remove)
  const addItem = useMutation(api.learningPaths.addItem)
  const removeItem = useMutation(api.learningPaths.removeItem)
  const moveItem = useMutation(api.learningPaths.moveItem)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState('')

  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!path) return
    setTitle(path.title)
    setDescription(path.description)
    setCoverUrl(path.coverUrl ?? '')
  }, [path])

  const availableCourses = useMemo(() => {
    if (!myCourses || !path) return [] as CourseOption[]
    const taken = new Set(path.items.map((i) => i.courseId))
    return myCourses.filter((c) => !taken.has(c._id))
  }, [myCourses, path])

  if (!pathIdRaw) return null
  const pathId = pathIdRaw

  if (path === undefined) {
    return (
      <DashboardPageShell
        eyebrow="Trilha"
        title="Carregando..."
        description=""
      >
        <div className={cn('h-32 animate-pulse', brandPanelClass)} />
      </DashboardPageShell>
    )
  }

  if (path === null) {
    return (
      <DashboardPageShell
        eyebrow="Trilha"
        title="Trilha não encontrada"
        description="Esta trilha foi removida ou você não tem acesso."
      >
        <Link
          to="/dashboard/trilhas"
          className={brandSecondaryButtonClass}
        >
          Voltar para trilhas
        </Link>
      </DashboardPageShell>
    )
  }

  if (!path.canEdit) {
    return (
      <DashboardPageShell
        eyebrow="Trilha"
        title="Sem permissão"
        description="Você não pode editar esta trilha."
      >
        <Link
          to="/dashboard/trilhas"
          className={brandSecondaryButtonClass}
        >
          Voltar para trilhas
        </Link>
      </DashboardPageShell>
    )
  }

  async function handleSaveBasics() {
    setSaving(true)
    setError('')
    try {
      await update({
        pathId,
        title: title.trim(),
        description: description.trim(),
        coverUrl: coverUrl.trim(),
      })
      setSavedAt(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublish(next: boolean) {
    setError('')
    try {
      await update({ pathId, isPublished: next })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao alterar publicação.')
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCourseId) return
    setAdding(true)
    setError('')
    try {
      await addItem({
        pathId,
        courseId: selectedCourseId as Id<'courses'>,
      })
      setSelectedCourseId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao adicionar curso.')
    } finally {
      setAdding(false)
    }
  }

  const trailTitle = path.title
  async function handleDelete() {
    if (!window.confirm(`Excluir a trilha "${trailTitle}"? Esta ação é irreversível.`)) return
    await remove({ pathId })
    navigate('/dashboard/trilhas')
  }

  return (
    <DashboardPageShell
      eyebrow="Trilha"
      title={path.title}
      description="Configure a sequência de cursos, capa e descrição."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/dashboard/trilhas" className={brandSecondaryButtonClass}>
            Voltar
          </Link>
          {path.isPublished ? (
            <button
              type="button"
              onClick={() => handleTogglePublish(false)}
              className={brandSecondaryButtonClass}
            >
              Despublicar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleTogglePublish(true)}
              className={brandPrimaryButtonClass}
            >
              Publicar
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className={cn('p-6', brandPanelClass)}>
          <div className="mb-4 flex items-center gap-2">
            <span className={brandStatusPillClass(path.isPublished ? 'success' : 'neutral')}>
              {path.isPublished ? 'Publicada' : 'Rascunho'}
            </span>
            <span className="text-xs text-white/40">/{path.slug}</span>
          </div>
          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/52">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={brandInputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/52">
                Descrição
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={brandInputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/52">
                URL da capa (opcional)
              </label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className={brandInputClass}
                placeholder="https://..."
              />
            </div>
          </div>
          {error && (
            <p className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {error}
            </p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveBasics}
              disabled={saving || title.trim().length < 3}
              className={cn(brandPrimaryButtonClass, 'px-5 py-2.5 text-sm')}
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
            {savedAt && (
              <p className="text-xs text-emerald-300">
                Salvo às{' '}
                {new Date(savedAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>

        <div className={cn('p-6', brandPanelClass)}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">Cursos da trilha</h3>
            <span className="text-xs text-white/48">
              {path.items.length} curso(s)
            </span>
          </div>

          {path.items.length === 0 ? (
            <p className="text-sm text-white/52">
              Adicione cursos abaixo. A ordem é mostrada ao aluno na página da trilha.
            </p>
          ) : (
            <ul className="space-y-2">
              {path.items.map((it, idx) => (
                <li
                  key={it.itemId}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#F37E20]/12 text-xs font-semibold text-[#F2BD8A]">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {it.title}
                    </p>
                    <p className="mt-0.5 text-xs text-white/48">
                      {it.totalLessons} aulas · {it.isPublished ? 'Publicado' : 'Rascunho'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem({ itemId: it.itemId, direction: 'up' })}
                      disabled={idx === 0}
                      className="rounded-lg border border-white/10 bg-white/4 px-2 py-1 text-xs text-white/72 disabled:opacity-30 hover:border-white/22 hover:bg-white/8"
                      aria-label="Mover para cima"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem({ itemId: it.itemId, direction: 'down' })}
                      disabled={idx === path.items.length - 1}
                      className="rounded-lg border border-white/10 bg-white/4 px-2 py-1 text-xs text-white/72 disabled:opacity-30 hover:border-white/22 hover:bg-white/8"
                      aria-label="Mover para baixo"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm(`Remover "${it.title}" da trilha?`)) return
                        removeItem({ itemId: it.itemId })
                      }}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20"
                    >
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddItem} className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="flex-1 min-w-[220px] rounded-2xl border border-white/10 bg-[#10161E] px-4 py-3 text-base text-white"
              disabled={availableCourses.length === 0}
            >
              <option value="">
                {availableCourses.length === 0
                  ? 'Você não tem cursos disponíveis'
                  : 'Selecione um curso seu'}
              </option>
              {availableCourses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title} {c.isPublished ? '' : '(rascunho)'}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!selectedCourseId || adding}
              className={cn(brandPrimaryButtonClass, 'px-5 py-2.5 text-sm')}
            >
              {adding ? 'Adicionando...' : 'Adicionar curso'}
            </button>
          </form>
        </div>

        <div className={cn('p-6', brandPanelClass)}>
          <h3 className="text-sm font-semibold text-white">Zona perigosa</h3>
          <p className="mt-1 text-xs text-white/48">
            Excluir a trilha remove também todas as matrículas dos alunos. A ação é irreversível.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 transition-all hover:bg-red-500/20"
          >
            Excluir trilha
          </button>
        </div>
      </div>
    </DashboardPageShell>
  )
}
