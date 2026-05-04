import { Skeleton } from '@/components/ui/Skeleton'

// Skeleton da página de aula. Reproduz o layout: barra superior, área do
// player 16:9 ocupando o topo, título + meta abaixo, lista de aulas no aside
// (md+). Mostrado enquanto a query principal `student.getLesson` resolve.
export function AulaPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      <div className="border-b border-[#E6DBCF] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Skeleton variant="light" className="h-4 w-40" />
          <Skeleton variant="light" className="h-8 w-24" rounded="full" />
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton variant="light" className="aspect-video w-full" rounded="2xl" />
          <Skeleton variant="light" className="h-7 w-3/4" />
          <Skeleton variant="light" className="h-4 w-1/2" />
          <div className="mt-6 space-y-2">
            <Skeleton variant="light" className="h-3.5 w-full" />
            <Skeleton variant="light" className="h-3.5 w-11/12" />
            <Skeleton variant="light" className="h-3.5 w-9/12" />
          </div>
        </div>
        <aside className="space-y-3">
          <Skeleton variant="light" className="h-5 w-32" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-[#E6DBCF] bg-white p-3">
              <Skeleton variant="light" className="h-8 w-8" rounded="full" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="light" className="h-3.5 w-3/4" />
                <Skeleton variant="light" className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
