import { useEffect, useId, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { DashboardPageShell } from '@/components/dashboard/PageShell'
import {
  brandInputClass,
  brandPanelClass,
  brandPrimaryButtonClass,
  brandSecondaryButtonClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'

type CourseOption = {
  _id: Id<'courses'>
  title: string
  isPublished: boolean
  totalLessons: number
  category: string
  level: string
  isOwn: boolean
  creatorName: string
}

export function EditarTrilhaPage() {
  const params = useParams()
  const navigate = useNavigate()
  const formId = useId()
  const pathIdRaw = params.id as Id<'learningPaths'> | undefined

  const path = useQuery(
    api.learningPaths.getById,
    pathIdRaw ? { pathId: pathIdRaw } : 'skip',
  )
  const availableCoursesData = useQuery(
    api.learningPaths.listCoursesForPath,
    pathIdRaw ? { pathId: pathIdRaw } : 'skip',
  ) as CourseOption[] | undefined
  const studentsData = useQuery(
    api.learningPaths.listPathStudents,
    pathIdRaw && path?.institutionId ? { pathId: pathIdRaw } : 'skip',
  )
  const availableMembersData = useQuery(
    api.learningPaths.listAvailableMembers,
    pathIdRaw && path?.institutionId ? { pathId: pathIdRaw } : 'skip',
  )

  const update = useMutation(api.learningPaths.update)
  const remove = useMutation(api.learningPaths.remove)
  const addItem = useMutation(api.learningPaths.addItem)
  const removeItem = useMutation(api.learningPaths.removeItem)
  const moveItem = useMutation(api.learningPaths.moveItem)
  const enrollBulk = useMutation(api.learningPaths.enrollMembersBulk)
  const removeMemberFromPath = useMutation(api.learningPaths.removeMemberFromPath)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState('')

  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [adding, setAdding] = useState(false)

  const [showAddMembers, setShowAddMembers] = useState(false)
  const [pickedMemberIds, setPickedMemberIds] = useState<Set<string>>(new Set())
  const [memberSearch, setMemberSearch] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrollMessage, setEnrollMessage] = useState('')

  useEffect(() => {
    if (!path) return
    // Hidrata o form ao carregar a trilha.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(path.title)
     
    setDescription(path.description)
     
    setCoverUrl(path.coverUrl ?? '')
  }, [path])

  const availableCourses = useMemo(() => {
    if (!availableCoursesData) return [] as CourseOption[]
    return availableCoursesData
  }, [availableCoursesData])

  const filteredAvailableMembers = useMemo(() => {
    if (!availableMembersData) return []
    const term = memberSearch.trim().toLowerCase()
    if (!term) return availableMembersData
    return availableMembersData.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.email ?? '').toLowerCase().includes(term),
    )
  }, [availableMembersData, memberSearch])

  if (!pathIdRaw) return null
  const pathId = pathIdRaw

  if (path === undefined) {
    return (
      <DashboardPageShell
        eyebrow="Plano de estudo"
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
        eyebrow="Plano de estudo"
        title="Plano não encontrado"
        description="Este plano foi removido ou você não tem acesso."
      >
        <Link
          to="/dashboard/trilhas"
          className={brandSecondaryButtonClass}
        >
          Voltar
        </Link>
      </DashboardPageShell>
    )
  }

  if (!path.canEdit) {
    return (
      <DashboardPageShell
        eyebrow="Plano de estudo"
        title="Sem permissão"
        description="Você não pode editar este plano."
      >
        <Link
          to="/dashboard/trilhas"
          className={brandSecondaryButtonClass}
        >
          Voltar
        </Link>
      </DashboardPageShell>
    )
  }

  const isInstitutional = !!path.institutionId
  const eyebrow = isInstitutional ? 'Plano de estudo' : 'Trilha'
  const itemNoun = isInstitutional ? 'cursos no plano' : 'cursos da trilha'

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

  function toggleMember(userId: string) {
    setPickedMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  function selectAllVisibleMembers() {
    setPickedMemberIds(new Set(filteredAvailableMembers.map((m) => m.userId)))
  }

  function clearMemberSelection() {
    setPickedMemberIds(new Set())
  }

  async function handleEnrollSelected() {
    if (pickedMemberIds.size === 0) return
    setEnrolling(true)
    setEnrollMessage('')
    setError('')
    try {
      const ids = Array.from(pickedMemberIds)
      const result = await enrollBulk({ pathId, memberUserIds: ids })
      setEnrollMessage(
        `${result.added} aluno(s) adicionado(s)${
          result.skipped > 0 ? ` · ${result.skipped} já matriculado(s) ou inválido(s)` : ''
        }.`,
      )
      setPickedMemberIds(new Set())
      setMemberSearch('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao matricular alunos.')
    } finally {
      setEnrolling(false)
    }
  }

  async function handleRemoveStudent(studentId: string, name: string) {
    if (!window.confirm(`Remover "${name}" deste plano de estudo?`)) return
    setError('')
    try {
      await removeMemberFromPath({ pathId, studentId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao remover aluno.')
    }
  }

  const trailTitle = path.title
  async function handleDelete() {
    if (!window.confirm(`Excluir "${trailTitle}"? Esta ação é irreversível.`)) return
    await remove({ pathId })
    navigate('/dashboard/trilhas')
  }

  return (
    <DashboardPageShell
      eyebrow={eyebrow}
      title={path.title}
      description={
        isInstitutional
          ? 'Configure os cursos do plano e matricule os alunos da instituição.'
          : 'Configure a sequência de cursos, capa e descrição.'
      }
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
              {path.isPublished ? 'Publicado' : 'Rascunho'}
            </span>
            {isInstitutional && (
              <span className={brandStatusPillClass('info')}>Plano institucional</span>
            )}
            <span className="text-xs text-white/40">/{path.slug}</span>
          </div>
          <div className="grid gap-4">
            <div>
              <label htmlFor={`${formId}-title`} className="mb-1.5 block text-xs font-medium text-white/52">
                Título
              </label>
              <input
                id={`${formId}-title`}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={brandInputClass}
              />
            </div>
            <div>
              <label htmlFor={`${formId}-description`} className="mb-1.5 block text-xs font-medium text-white/52">
                Descrição
              </label>
              <textarea
                id={`${formId}-description`}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={brandInputClass}
              />
            </div>
            <div>
              <label htmlFor={`${formId}-coverUrl`} className="mb-1.5 block text-xs font-medium text-white/52">
                URL da capa (opcional)
              </label>
              <input
                id={`${formId}-coverUrl`}
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className={brandInputClass}
                placeholder="https://..."
              />
            </div>
          </div>
          {error && (
            <p role="alert" className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
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
            <h3 className="text-sm font-semibold text-white">
              {isInstitutional ? 'Cursos do plano' : 'Cursos da trilha'}
            </h3>
            <span className="text-xs text-white/48">
              {path.items.length} {itemNoun}
            </span>
          </div>

          {path.items.length === 0 ? (
            <p className="text-sm text-white/52">
              Adicione cursos abaixo. A ordem é mostrada ao aluno na página do plano.
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
                      <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem({ itemId: it.itemId, direction: 'down' })}
                      disabled={idx === path.items.length - 1}
                      className="rounded-lg border border-white/10 bg-white/4 px-2 py-1 text-xs text-white/72 disabled:opacity-30 hover:border-white/22 hover:bg-white/8"
                      aria-label="Mover para baixo"
                    >
                      <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm(`Remover "${it.title}" do plano?`)) return
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
                  ? 'Nenhum curso disponível'
                  : isInstitutional
                    ? 'Selecione um curso do catálogo'
                    : 'Selecione um curso seu'}
              </option>
              {availableCourses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                  {c.isPublished ? '' : ' (rascunho)'}
                  {isInstitutional && !c.isOwn ? ` · ${c.creatorName}` : ''}
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
          {isInstitutional && (
            <p className="mt-3 text-xs text-white/48">
              Você pode adicionar qualquer curso publicado do catálogo da plataforma, além
              dos cursos da própria instituição.
            </p>
          )}
        </div>

        {isInstitutional && (
          <div className={cn('p-6', brandPanelClass)}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white">Alunos do plano</h3>
                <p className="mt-0.5 text-xs text-white/48">
                  Apenas membros da instituição podem ser matriculados aqui.
                </p>
              </div>
              <span className="text-xs text-white/48">
                {studentsData?.length ?? 0} aluno(s)
              </span>
            </div>

            {studentsData === undefined ? (
              <div className={cn('h-20 animate-pulse', brandPanelClass)} />
            ) : studentsData.length === 0 ? (
              <p className="text-sm text-white/52">
                Nenhum aluno matriculado ainda. Use o botão abaixo para escolher membros
                da instituição.
              </p>
            ) : (
              <ul className="space-y-2">
                {studentsData.map((s) => {
                  const pct =
                    s.totalCourses > 0
                      ? Math.round((s.completedCourses / s.totalCourses) * 100)
                      : 0
                  return (
                    <li
                      key={s.enrollmentId}
                      className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3"
                    >
                      {s.avatarUrl ? (
                        <img
                          src={s.avatarUrl}
                          alt=""
                          className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F37E20]/12 text-xs font-semibold text-[#F2BD8A]">
                          {s.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {s.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-white/48">
                          {s.email ?? ''}
                        </p>
                      </div>
                      <div className="hidden flex-col items-end gap-0.5 sm:flex">
                        <span className="text-xs font-semibold text-[#F2BD8A]">
                          {pct}%
                        </span>
                        <span className="text-[10px] text-white/40">
                          {s.completedCourses}/{s.totalCourses} cursos
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(s.studentId, s.name)}
                        className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20"
                      >
                        Remover
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddMembers((v) => !v)
                  setEnrollMessage('')
                }}
                className={cn(brandPrimaryButtonClass, 'px-5 py-2.5 text-sm')}
              >
                {showAddMembers ? 'Fechar' : 'Adicionar alunos'}
              </button>
              {enrollMessage && (
                <p className="text-xs text-emerald-300">{enrollMessage}</p>
              )}
            </div>

            {showAddMembers && (
              <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                {availableMembersData === undefined ? (
                  <div className="h-20 animate-pulse rounded-xl bg-white/4" />
                ) : availableMembersData.length === 0 ? (
                  <p className="text-sm text-white/52">
                    Todos os membros ativos da instituição já estão matriculados aqui.
                  </p>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <input
                        type="search"
                        placeholder="Buscar por nome ou email"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className={cn(brandInputClass, 'flex-1 min-w-[220px]')}
                      />
                      <button
                        type="button"
                        onClick={selectAllVisibleMembers}
                        className="rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-xs font-semibold text-white/82 hover:border-white/22 hover:bg-white/8"
                      >
                        Selecionar todos
                      </button>
                      <button
                        type="button"
                        onClick={clearMemberSelection}
                        disabled={pickedMemberIds.size === 0}
                        className="rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-xs font-semibold text-white/82 disabled:opacity-40 hover:border-white/22 hover:bg-white/8"
                      >
                        Limpar
                      </button>
                    </div>

                    <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                      {filteredAvailableMembers.length === 0 ? (
                        <li className="px-2 py-3 text-xs text-white/48">
                          Nenhum membro encontrado para "{memberSearch}".
                        </li>
                      ) : (
                        filteredAvailableMembers.map((m) => {
                          const checked = pickedMemberIds.has(m.userId)
                          return (
                            <li key={m.memberId}>
                              <label
                                className={cn(
                                  'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition-colors',
                                  checked
                                    ? 'border-[#F37E20]/40 bg-[#F37E20]/8'
                                    : 'border-white/8 bg-white/[0.02] hover:border-white/14 hover:bg-white/4',
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleMember(m.userId)}
                                  className="h-4 w-4 cursor-pointer accent-[#F37E20]"
                                />
                                {m.avatarUrl ? (
                                  <img
                                    src={m.avatarUrl}
                                    alt=""
                                    className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/8 text-xs font-semibold text-white/72">
                                    {m.name.slice(0, 1).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-white">
                                    {m.name}
                                  </p>
                                  <p className="truncate text-xs text-white/48">
                                    {m.email ?? ''}
                                  </p>
                                </div>
                                <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                                  {m.role}
                                </span>
                              </label>
                            </li>
                          )
                        })
                      )}
                    </ul>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-white/52">
                        {pickedMemberIds.size} aluno(s) selecionado(s)
                      </p>
                      <button
                        type="button"
                        onClick={handleEnrollSelected}
                        disabled={pickedMemberIds.size === 0 || enrolling}
                        className={cn(brandPrimaryButtonClass, 'px-5 py-2.5 text-sm')}
                      >
                        {enrolling
                          ? 'Matriculando...'
                          : `Matricular ${pickedMemberIds.size > 0 ? pickedMemberIds.size : ''}`.trim()}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className={cn('p-6', brandPanelClass)}>
          <h3 className="text-sm font-semibold text-white">Zona perigosa</h3>
          <p className="mt-1 text-xs text-white/48">
            Excluir o plano remove também todas as matrículas dos alunos. A ação é irreversível.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 transition-all hover:bg-red-500/20"
          >
            Excluir {isInstitutional ? 'plano' : 'trilha'}
          </button>
        </div>
      </div>
    </DashboardPageShell>
  )
}
