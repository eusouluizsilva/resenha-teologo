import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  DashboardEmptyState,
  DashboardPageShell,
} from '@/components/dashboard/PageShell'
import {
  brandInputClass,
  brandPanelClass,
  brandStatusPillClass,
  cn,
} from '@/lib/brand'
import { useCreatorId } from '@/lib/useCreatorId'

type CourseRow = {
  courseId: string
  courseTitle: string
  percentage: number
  completedLessons: number
  totalLessons: number
  certificateIssued: boolean
  finalScore?: number
  completedAt?: number
  enrolledAt: number
  quizScores: { lessonId: string; lessonTitle: string; score: number; passed: boolean }[]
}

type StudentRow = {
  studentId: string
  name: string
  email: string
  avatarUrl?: string
  handle?: string
  publicProfile: boolean
  coursesEnrolled: number
  coursesCompleted: number
  totalQuizzes: number
  averageScore: number | null
  courses: CourseRow[]
  lastEnrolledAt: number
}

type StudentsPayload = {
  courses: { id: string; title: string }[]
  students: StudentRow[]
}

type CertificateFilter = 'all' | 'with' | 'without'
type ProfileFilter = 'all' | 'public' | 'private'
type SortKey = 'recent' | 'name' | 'mostCourses' | 'mostCompleted' | 'highestScore'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function scoreTone(score: number): 'success' | 'accent' | 'neutral' {
  if (score >= 80) return 'success'
  if (score >= 60) return 'accent'
  return 'neutral'
}

function CourseDetail({ course }: { course: CourseRow }) {
  return (
    <div className="rounded-xl border border-white/7 bg-white/[0.02] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">{course.courseTitle}</p>
        <div className="flex flex-wrap items-center gap-2">
          {course.certificateIssued && (
            <span className={brandStatusPillClass('success')}>Certificado</span>
          )}
          {typeof course.finalScore === 'number' && (
            <span className={brandStatusPillClass(scoreTone(course.finalScore))}>
              Nota final {course.finalScore}%
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[#F37E20] transition-all"
            style={{ width: `${course.percentage}%` }}
          />
        </div>
        <span className="text-xs text-white/56">
          {course.completedLessons}/{course.totalLessons} aulas · {course.percentage}%
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/42">
        <span>Matrícula: {formatDate(course.enrolledAt)}</span>
        {course.completedAt && <span>Concluiu: {formatDate(course.completedAt)}</span>}
        {course.quizScores.length > 0 && (
          <span>
            {course.quizScores.length}{' '}
            {course.quizScores.length === 1 ? 'quiz feito' : 'quizzes feitos'}
          </span>
        )}
      </div>

      {course.quizScores.length > 0 && (
        <div className="mt-3 border-t border-white/6 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/42">
            Notas por aula
          </p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {course.quizScores.map((q) => (
              <li
                key={q.lessonId}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/6 bg-white/[0.02] px-3 py-1.5"
              >
                <span className="truncate text-xs text-white/72">{q.lessonTitle}</span>
                <span
                  className={cn(
                    'flex-shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold',
                    q.score >= 80
                      ? 'bg-emerald-400/12 text-emerald-300'
                      : q.score >= 60
                        ? 'bg-[#F37E20]/14 text-[#F2BD8A]'
                        : 'bg-rose-400/12 text-rose-300'
                  )}
                >
                  {q.score}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function StudentCard({ student }: { student: StudentRow }) {
  const [expanded, setExpanded] = useState(false)
  const initials = student.name.slice(0, 2).toUpperCase()

  return (
    <div className={cn('p-5', brandPanelClass)}>
      <div className="flex items-start gap-4">
        {student.avatarUrl ? (
          <img
            src={student.avatarUrl}
            alt={student.name}
            className="h-12 w-12 flex-shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#F37E20]/16 bg-[#F37E20]/10">
            <span className="text-sm font-semibold text-[#F2BD8A]">{initials}</span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {student.handle ? (
              <Link
                to={`/${student.handle}`}
                target="_blank"
                className="text-base font-semibold text-white hover:text-[#F2BD8A]"
              >
                {student.name}
              </Link>
            ) : (
              <p className="text-base font-semibold text-white">{student.name}</p>
            )}
            {student.handle && (
              <span className="text-xs text-white/42">@{student.handle}</span>
            )}
            {student.publicProfile && (
              <span className={brandStatusPillClass('info')}>Perfil público</span>
            )}
          </div>
          {student.email && (
            <p className="mt-0.5 text-xs text-white/42">{student.email}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="text-white/56">
              <span className="font-semibold text-white">{student.coursesEnrolled}</span>{' '}
              {student.coursesEnrolled === 1 ? 'curso' : 'cursos'}
            </span>
            <span className="text-white/56">
              <span className="font-semibold text-white">{student.coursesCompleted}</span>{' '}
              {student.coursesCompleted === 1 ? 'certificado' : 'certificados'}
            </span>
            <span className="text-white/56">
              <span className="font-semibold text-white">{student.totalQuizzes}</span>{' '}
              {student.totalQuizzes === 1 ? 'quiz' : 'quizzes'}
            </span>
            {student.averageScore !== null && (
              <span className="text-white/56">
                Média final{' '}
                <span className="font-semibold text-white">{student.averageScore}%</span>
              </span>
            )}
            <span className="text-white/36">
              Última matrícula: {formatDate(student.lastEnrolledAt)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/62 transition-all hover:border-white/20 hover:text-white"
        >
          {expanded ? 'Recolher' : 'Ver cursos'}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-2 border-t border-white/6 pt-4">
          {student.courses.map((c) => (
            <CourseDetail key={c.courseId} course={c} />
          ))}
        </div>
      )}
    </div>
  )
}

const filterSelectClass = cn(
  brandInputClass,
  'h-11 cursor-pointer appearance-none bg-no-repeat py-0 pr-10 text-sm'
)
const filterSelectStyle = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%23ffffff80' stroke-width='1.5'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5'/%3E%3C/svg%3E\")",
  backgroundPosition: 'right 14px center',
  backgroundSize: '12px 12px',
} as const

export function AlunosPage() {
  const creatorId = useCreatorId()
  const data = useQuery(
    api.enrollments.listStudentsByCreator,
    creatorId ? { creatorId } : 'skip'
  ) as StudentsPayload | undefined

  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [certificateFilter, setCertificateFilter] = useState<CertificateFilter>('all')
  const [profileFilter, setProfileFilter] = useState<ProfileFilter>('all')
  const [sort, setSort] = useState<SortKey>('recent')

  const filtered = useMemo(() => {
    if (!data) return [] as StudentRow[]
    const term = search.trim().toLowerCase()

    let list = data.students.filter((s) => {
      if (term) {
        const hit =
          s.name.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term) ||
          s.handle?.toLowerCase().includes(term)
        if (!hit) return false
      }
      if (courseFilter !== 'all') {
        if (!s.courses.some((c) => c.courseId === courseFilter)) return false
      }
      if (certificateFilter === 'with' && s.coursesCompleted === 0) return false
      if (certificateFilter === 'without' && s.coursesCompleted > 0) return false
      if (profileFilter === 'public' && !s.publicProfile) return false
      if (profileFilter === 'private' && s.publicProfile) return false
      return true
    })

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name, 'pt-BR')
        case 'mostCourses':
          return b.coursesEnrolled - a.coursesEnrolled
        case 'mostCompleted':
          return b.coursesCompleted - a.coursesCompleted
        case 'highestScore':
          return (b.averageScore ?? -1) - (a.averageScore ?? -1)
        case 'recent':
        default:
          return b.lastEnrolledAt - a.lastEnrolledAt
      }
    })

    return list
  }, [data, search, courseFilter, certificateFilter, profileFilter, sort])

  const totalStudents = data?.students.length ?? 0
  const courses = data?.courses ?? []

  return (
    <DashboardPageShell
      eyebrow="Professor"
      title="Meus alunos"
      description="Acompanhe quem está matriculado em seus cursos, progresso individual e certificados emitidos."
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Buscar por nome, email ou @handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(brandInputClass, 'max-w-md')}
          />
          {data !== undefined && (
            <span className="text-xs text-white/42">
              {filtered.length} de {totalStudents}{' '}
              {totalStudents === 1 ? 'aluno' : 'alunos'}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className={filterSelectClass}
            style={filterSelectStyle}
            aria-label="Filtrar por curso"
          >
            <option value="all">Todos os cursos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            value={certificateFilter}
            onChange={(e) => setCertificateFilter(e.target.value as CertificateFilter)}
            className={filterSelectClass}
            style={filterSelectStyle}
            aria-label="Filtrar por certificado"
          >
            <option value="all">Certificado: todos</option>
            <option value="with">Com certificado</option>
            <option value="without">Sem certificado</option>
          </select>

          <select
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value as ProfileFilter)}
            className={filterSelectClass}
            style={filterSelectStyle}
            aria-label="Filtrar por perfil"
          >
            <option value="all">Perfil: todos</option>
            <option value="public">Perfil público</option>
            <option value="private">Perfil privado</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={filterSelectClass}
            style={filterSelectStyle}
            aria-label="Ordenar"
          >
            <option value="recent">Matrícula mais recente</option>
            <option value="name">Nome (A-Z)</option>
            <option value="mostCourses">Mais cursos</option>
            <option value="mostCompleted">Mais concluídos</option>
            <option value="highestScore">Maior média</option>
          </select>
        </div>
      </div>

      {data === undefined ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <DashboardEmptyState
          icon={
            <svg
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          }
          title={
            search ||
            courseFilter !== 'all' ||
            certificateFilter !== 'all' ||
            profileFilter !== 'all'
              ? 'Nenhum aluno encontrado'
              : 'Ainda sem alunos'
          }
          description={
            search ||
            courseFilter !== 'all' ||
            certificateFilter !== 'all' ||
            profileFilter !== 'all'
              ? 'Ajuste os filtros para ver mais alunos.'
              : 'Quando alguém se matricular em um dos seus cursos, vai aparecer aqui.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((student) => (
            <StudentCard key={student.studentId} student={student} />
          ))}
        </div>
      )}
    </DashboardPageShell>
  )
}
