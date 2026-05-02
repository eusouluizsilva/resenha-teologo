import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import {
  DashboardPageShell,
  DashboardSectionLabel,
} from '@/components/dashboard/PageShell'
import {
  brandInputClass,
  brandPanelClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type Course = {
  _id: Id<'courses'>
  title: string
  slug: string | null
  category: string
  level: string
  isPublished: boolean
  totalLessons: number
  totalStudents: number
  createdAt: number
  passingScore: number
  releaseStatus: 'in_progress' | 'complete'
  visibility: 'public' | 'institution'
  institutionId: Id<'institutions'> | null
  institutionName: string | null
  creatorId: string
  creatorName: string
  creatorHandle: string | null
  avgRating: number | null
  ratingsCount: number
}

type FilterKey = 'all' | 'published' | 'draft' | 'in_progress' | 'institution'

const FILTERS: { value: FilterKey; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'published', label: 'Publicados' },
  { value: 'draft', label: 'Rascunhos' },
  { value: 'in_progress', label: 'Em produção' },
  { value: 'institution', label: 'Restritos a instituição' },
]

function CourseRow({
  course,
  institutions,
}: {
  course: Course
  institutions: { _id: Id<'institutions'>; name: string }[]
}) {
  const updateCourse = useMutation(api.admin.updateCourseAsAdmin)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scoreDraft, setScoreDraft] = useState(String(course.passingScore))

  async function patch(field: string, args: Parameters<typeof updateCourse>[0]) {
    setSaving(field)
    setError(null)
    try {
      await updateCourse(args)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(null)
    }
  }

  async function commitScore() {
    const next = Number(scoreDraft)
    if (!Number.isFinite(next) || next === course.passingScore) {
      setScoreDraft(String(course.passingScore))
      return
    }
    if (next < 70 || next > 100) {
      setError('Nota mínima entre 70 e 100.')
      setScoreDraft(String(course.passingScore))
      return
    }
    await patch('score', { courseId: course._id, passingScore: next })
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{course.title}</p>
          <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-white/52">
            <span>
              por{' '}
              {course.creatorHandle ? (
                <Link
                  to={`/${course.creatorHandle}`}
                  target="_blank"
                  className="text-[#F2BD8A] hover:text-[#F37E20]"
                >
                  {course.creatorName}
                </Link>
              ) : (
                course.creatorName
              )}
            </span>
            <span className="text-white/24">·</span>
            <span>{course.totalLessons} aulas</span>
            <span className="text-white/24">·</span>
            <span>{course.totalStudents} alunos</span>
            <span className="text-white/24">·</span>
            <span>{formatDate(course.createdAt)}</span>
            {course.avgRating !== null && course.ratingsCount > 0 && (
              <>
                <span className="text-white/24">·</span>
                <span className="inline-flex items-center gap-1">
                  <svg
                    aria-hidden="true"
                    className="h-3 w-3 text-[#F37E20]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                  {course.avgRating.toFixed(1)} ({course.ratingsCount})
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {course.slug && (
            <Link
              to={`/cursos/${course.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F2BD8A] hover:text-[#F37E20]"
            >
              Ver
              <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] p-2.5">
          <input
            type="checkbox"
            checked={course.isPublished}
            disabled={saving !== null}
            onChange={(e) =>
              patch('publish', { courseId: course._id, isPublished: e.target.checked })
            }
            className="h-4 w-4 cursor-pointer accent-[#F37E20]"
          />
          <span className="text-xs font-medium text-white">
            {course.isPublished ? 'Publicado' : 'Rascunho'}
          </span>
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-2 px-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/52">
            Nota mín
          </span>
          <input
            type="number"
            min={70}
            max={100}
            value={scoreDraft}
            onChange={(e) => setScoreDraft(e.target.value)}
            onBlur={commitScore}
            disabled={saving !== null}
            className={cn(brandInputClass, 'h-8 w-16 px-2 py-0 text-center text-xs')}
          />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-2 px-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/52">
            Estado
          </span>
          <select
            value={course.releaseStatus}
            disabled={saving !== null}
            onChange={(e) =>
              patch('release', {
                courseId: course._id,
                releaseStatus: e.target.value as 'in_progress' | 'complete',
              })
            }
            className={cn(brandInputClass, 'h-8 cursor-pointer appearance-none px-2 py-0 text-xs')}
          >
            <option value="complete" className="bg-[#151B23]">Completo</option>
            <option value="in_progress" className="bg-[#151B23]">Em produção</option>
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-2 px-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/52">
            Acesso
          </span>
          <select
            value={course.visibility}
            disabled={saving !== null}
            onChange={(e) =>
              patch('visibility', {
                courseId: course._id,
                visibility: e.target.value as 'public' | 'institution',
              })
            }
            className={cn(brandInputClass, 'h-8 cursor-pointer appearance-none px-2 py-0 text-xs')}
          >
            <option value="public" className="bg-[#151B23]">Público</option>
            <option value="institution" className="bg-[#151B23]">Restrito a instituição</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-2 px-2.5">
          <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/52">
            Instituição
          </span>
          <select
            value={course.institutionId ?? ''}
            disabled={saving !== null}
            onChange={(e) =>
              patch('institution', {
                courseId: course._id,
                institutionId:
                  e.target.value === ''
                    ? null
                    : (e.target.value as Id<'institutions'>),
              })
            }
            className={cn(brandInputClass, 'h-8 flex-1 cursor-pointer appearance-none px-2 py-0 text-xs')}
          >
            <option value="" className="bg-[#151B23]">Nenhuma</option>
            {institutions.map((i) => (
              <option key={i._id} value={i._id} className="bg-[#151B23]">
                {i.name}
              </option>
            ))}
          </select>
        </label>
        <span className={brandStatusPillClass(course.isPublished ? 'success' : 'neutral')}>
          {course.isPublished ? 'Publicado' : 'Rascunho'}
        </span>
        {course.releaseStatus === 'in_progress' && (
          <span className={brandStatusPillClass('info')}>Em produção</span>
        )}
        {course.visibility === 'institution' && (
          <span className={brandStatusPillClass('accent')}>
            {course.institutionName ?? 'Sem vínculo'}
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-rose-400/30 bg-rose-400/[0.06] p-2 text-[11px] text-rose-200">
          {error}
        </p>
      )}
    </div>
  )
}

export function CursosAdminPage() {
  const isAdmin = useQuery(api.admin.amIAdmin, {})
  const courses = useQuery(api.admin.listAllCourses, isAdmin ? {} : 'skip')
  const institutions = useQuery(api.admin.listAllInstitutions, isAdmin ? {} : 'skip')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = useMemo<Course[]>(() => {
    if (!courses) return []
    const q = search.trim().toLowerCase()
    return courses.filter((c) => {
      if (q) {
        const matches =
          c.title.toLowerCase().includes(q) ||
          c.creatorName.toLowerCase().includes(q) ||
          (c.creatorHandle ?? '').toLowerCase().includes(q)
        if (!matches) return false
      }
      if (filter === 'published') return c.isPublished
      if (filter === 'draft') return !c.isPublished
      if (filter === 'in_progress') return c.releaseStatus === 'in_progress'
      if (filter === 'institution') return c.visibility === 'institution'
      return true
    })
  }, [courses, search, filter])

  if (isAdmin === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
      </div>
    )
  }

  if (isAdmin === false) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardPageShell
      eyebrow="Administração"
      title="Cursos da plataforma"
      description="Edite publicação, nota mínima, estado de produção e vinculação à instituição. Alterações são salvas automaticamente."
    >
      <div>
        <DashboardSectionLabel>
          {courses ? `${courses.length} cursos no total` : 'Carregando'}
        </DashboardSectionLabel>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, professor ou handle"
            className={cn(brandInputClass, 'flex-1')}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition',
                  active
                    ? 'border-[#F37E20] bg-[#F37E20]/14 text-[#F2BD8A]'
                    : 'border-white/10 bg-white/[0.03] text-white/52 hover:border-white/20 hover:text-white/82',
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {courses && (search || filter !== 'all') && (
          <p className="mt-2 text-[11px] text-white/42">
            Exibindo {filtered.length} de {courses.length} cursos.
          </p>
        )}

        <div className={cn('mt-4 divide-y divide-white/6', brandPanelClass)}>
          {courses === undefined ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-12 text-center text-sm text-white/42">
              {search ? 'Nenhum curso encontrado.' : 'Nenhum curso cadastrado.'}
            </p>
          ) : (
            filtered.map((c) => (
              <CourseRow key={c._id} course={c} institutions={institutions ?? []} />
            ))
          )}
        </div>
      </div>
    </DashboardPageShell>
  )
}
