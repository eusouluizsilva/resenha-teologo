export function CourseProgressRow({
  courseTitle,
  percentage,
  completedLessons,
  totalLessons,
  certificateIssued,
}: {
  courseTitle: string
  percentage: number
  completedLessons: number
  totalLessons: number
  certificateIssued: boolean
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/7 bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-white leading-snug">{courseTitle}</p>
        {certificateIssued ? (
          <span className="flex-shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
            Concluído
          </span>
        ) : null}
      </div>
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-xs text-white/40">
          <span>{completedLessons} de {totalLessons} aulas</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[#F37E20] transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}
