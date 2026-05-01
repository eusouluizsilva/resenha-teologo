import { useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import { brandInputClass, brandPanelClass, brandStatusPillClass, cn } from '@/lib/brand'

type InstitutionRow = {
  _id: Id<'institutions'>
  name: string
  memberRole: 'dono' | 'admin' | 'membro'
}

type SortMode = 'lessons_desc' | 'completed_desc' | 'recent' | 'name_asc'

function formatDate(ts?: number | null) {
  if (!ts) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(ts),
  )
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function RelatoriosPage() {
  const institutions = useQuery(api.institutions.listByUser) as InstitutionRow[] | undefined
  const ownedOrAdmin = institutions?.filter((i) => i.memberRole !== 'membro') ?? []
  const [activeId, setActiveId] = useState<Id<'institutions'> | null>(null)
  const currentId = activeId ?? ownedOrAdmin[0]?._id ?? null
  const report = useQuery(
    api.institutions.listMembersReport,
    currentId ? { institutionId: currentId } : 'skip',
  )
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('lessons_desc')

  const filtered = useMemo(() => {
    if (!report) return []
    const q = search.trim().toLowerCase()
    let list = report
    if (q) {
      list = list.filter((m) =>
        (m.name + ' ' + (m.email ?? '')).toLowerCase().includes(q),
      )
    }
    const sorted = [...list]
    if (sortMode === 'lessons_desc') {
      sorted.sort((a, b) => b.lessonsCompleted - a.lessonsCompleted)
    } else if (sortMode === 'completed_desc') {
      sorted.sort((a, b) => b.coursesCompleted - a.coursesCompleted)
    } else if (sortMode === 'recent') {
      sorted.sort((a, b) => (b.lastActivity ?? 0) - (a.lastActivity ?? 0))
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    }
    return sorted
  }, [report, search, sortMode])

  function exportCsv() {
    if (!report) return
    const header = [
      'Nome',
      'Email',
      'Papel',
      'Cursos matriculados',
      'Cursos concluídos',
      'Aulas concluídas',
      'Última atividade',
      'Entrou em',
    ]
    const rows = filtered.map((m) => [
      csvEscape(m.name),
      csvEscape(m.email ?? ''),
      csvEscape(m.role),
      csvEscape(m.coursesEnrolled),
      csvEscape(m.coursesCompleted),
      csvEscape(m.lessonsCompleted),
      csvEscape(m.lastActivity ? new Date(m.lastActivity).toISOString() : ''),
      csvEscape(new Date(m.addedAt).toISOString()),
    ])
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-membros-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (institutions === undefined) {
    return (
      <DashboardPageShell eyebrow="Instituição" title="Relatórios" description="">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
        </div>
      </DashboardPageShell>
    )
  }

  if (ownedOrAdmin.length === 0) {
    return (
      <DashboardPageShell
        eyebrow="Instituição"
        title="Relatórios"
        description="Apenas dono ou admin de instituição vê relatórios."
      >
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          }
          title="Sem permissão"
          description="Você precisa ser dono ou admin de uma instituição para acessar relatórios."
        />
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell
      eyebrow="Instituição"
      title="Relatórios"
      description="Engajamento por membro: matrículas, conclusões e última atividade nos cursos vinculados à instituição."
    >
      {ownedOrAdmin.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {ownedOrAdmin.map((inst) => (
            <button
              key={inst._id}
              type="button"
              onClick={() => setActiveId(inst._id)}
              className={cn(
                'rounded-2xl border px-4 py-2 text-sm font-medium transition-all',
                currentId === inst._id
                  ? 'border-[#F37E20]/40 bg-[#F37E20]/10 text-[#F2BD8A]'
                  : 'border-white/10 bg-white/4 text-white/72 hover:border-white/20 hover:bg-white/8',
              )}
            >
              {inst.name}
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className={cn(brandInputClass, 'flex-1')}
        />
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className={cn(brandInputClass, 'sm:w-56')}
        >
          <option value="lessons_desc">Mais aulas concluídas</option>
          <option value="completed_desc">Mais cursos concluídos</option>
          <option value="recent">Atividade recente</option>
          <option value="name_asc">Nome (A-Z)</option>
        </select>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!report || report.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2.5 text-sm font-medium text-white/82 transition-all hover:border-white/22 hover:bg-white/8 disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Exportar CSV
        </button>
      </div>

      {report === undefined ? (
        <div className={cn('animate-pulse p-6', brandPanelClass)}>
          <div className="h-4 w-32 rounded-full bg-white/8" />
        </div>
      ) : report.length === 0 ? (
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
          title="Sem membros ativos"
          description="Convide pessoas para a instituição para começar a ver relatórios."
        />
      ) : (
        <div className={cn('overflow-hidden', brandPanelClass)}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.16em] text-white/48">
                  <th className="px-4 py-3 text-left font-semibold">Membro</th>
                  <th className="px-4 py-3 text-left font-semibold">Papel</th>
                  <th className="px-4 py-3 text-right font-semibold">Matrículas</th>
                  <th className="px-4 py-3 text-right font-semibold">Concluídos</th>
                  <th className="px-4 py-3 text-right font-semibold">Aulas</th>
                  <th className="px-4 py-3 text-left font-semibold">Última atividade</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.memberId} className="border-b border-white/4 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {m.avatarUrl ? (
                          <img
                            src={m.avatarUrl}
                            alt=""
                            loading="lazy"
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-xs font-semibold text-white/82">
                            {m.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{m.name}</p>
                          {m.email && <p className="truncate text-xs text-white/48">{m.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={brandStatusPillClass(
                          m.role === 'dono' ? 'accent' : m.role === 'admin' ? 'info' : 'neutral',
                        )}
                      >
                        {m.role === 'dono' ? 'Dono' : m.role === 'admin' ? 'Admin' : 'Membro'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-white/82">
                      {m.coursesEnrolled}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-white/82">
                      {m.coursesCompleted}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-white/82">
                      {m.lessonsCompleted}
                    </td>
                    <td className="px-4 py-3 text-white/56">{formatDate(m.lastActivity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardPageShell>
  )
}
