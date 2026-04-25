import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import {
  DashboardEmptyState,
  DashboardPageShell,
} from '@/components/dashboard/PageShell'
import { brandInputClass, brandPanelClass, cn } from '@/lib/brand'
import { useCreatorId } from '@/lib/useCreatorId'

type StudentRow = {
  studentId: string
  name: string
  email: string
  avatarUrl?: string
  handle?: string
  coursesEnrolled: number
  coursesCompleted: number
  courses: {
    courseId: string
    courseTitle: string
    percentage: number
    certificateIssued: boolean
    finalScore?: number
    completedAt?: number
    enrolledAt: number
  }[]
  lastEnrolledAt: number
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
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
          </div>
          {student.email && (
            <p className="mt-0.5 text-xs text-white/42">{student.email}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
            <span className="text-white/56">
              <span className="font-semibold text-white">{student.coursesEnrolled}</span>{' '}
              {student.coursesEnrolled === 1 ? 'curso' : 'cursos'}
            </span>
            <span className="text-white/56">
              <span className="font-semibold text-white">{student.coursesCompleted}</span>{' '}
              {student.coursesCompleted === 1 ? 'concluído' : 'concluídos'}
            </span>
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
            <div
              key={c.courseId}
              className="rounded-xl border border-white/7 bg-white/[0.02] px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">{c.courseTitle}</p>
                {c.certificateIssued && (
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                    Certificado
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-[#F37E20] transition-all"
                    style={{ width: `${c.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-white/56">{c.percentage}%</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-white/42">
                <span>Matrícula: {formatDate(c.enrolledAt)}</span>
                {c.finalScore !== undefined && (
                  <span>Nota final: {c.finalScore}%</span>
                )}
                {c.completedAt && <span>Concluiu: {formatDate(c.completedAt)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AlunosPage() {
  const creatorId = useCreatorId()
  const students = useQuery(
    api.enrollments.listStudentsByCreator,
    creatorId ? { creatorId } : 'skip'
  )
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!students) return [] as StudentRow[]
    const term = search.trim().toLowerCase()
    if (!term) return students as StudentRow[]
    return (students as StudentRow[]).filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.handle?.toLowerCase().includes(term)
    )
  }, [students, search])

  return (
    <DashboardPageShell
      eyebrow="Professor"
      title="Meus alunos"
      description="Acompanhe quem está matriculado em seus cursos, progresso individual e certificados emitidos."
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por nome, email ou @handle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(brandInputClass, 'max-w-md')}
        />
        {students !== undefined && (
          <span className="text-xs text-white/42">
            {filtered.length} {filtered.length === 1 ? 'aluno' : 'alunos'}
          </span>
        )}
      </div>

      {students === undefined ? (
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
          title={search ? 'Nenhum aluno encontrado' : 'Ainda sem alunos'}
          description={
            search
              ? 'Ajuste a busca ou remova o filtro para ver todos os alunos.'
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
