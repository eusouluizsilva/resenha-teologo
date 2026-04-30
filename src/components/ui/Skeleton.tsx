import { cn } from '@/lib/brand'

// Componente base de skeleton. Substitui spinner em listagens e cards quando
// a query Convex está em loading. Variante 'dark' para dashboards (#0F141A) e
// 'light' para áreas brancas (caderno, leitor, blog).
export function Skeleton({
  className,
  variant = 'dark',
  rounded = 'lg',
}: {
  className?: string
  variant?: 'dark' | 'light'
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}) {
  const radiusClass =
    rounded === 'sm'
      ? 'rounded'
      : rounded === 'md'
      ? 'rounded-md'
      : rounded === 'lg'
      ? 'rounded-lg'
      : rounded === 'xl'
      ? 'rounded-xl'
      : rounded === '2xl'
      ? 'rounded-2xl'
      : 'rounded-full'

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando"
      className={cn(
        'animate-pulse',
        radiusClass,
        variant === 'dark' ? 'bg-white/8' : 'bg-[#E6DBCF]',
        className,
      )}
    />
  )
}

export function SkeletonText({
  lines = 3,
  variant = 'dark',
  className,
}: {
  lines?: number
  variant?: 'dark' | 'light'
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant={variant}
          className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({
  variant = 'dark',
  className,
}: {
  variant?: 'dark' | 'light'
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5',
        variant === 'dark'
          ? 'border-white/8 bg-white/[0.025]'
          : 'border-[#E6DBCF] bg-white',
        className,
      )}
    >
      <Skeleton variant={variant} className="h-32 w-full" rounded="xl" />
      <div className="mt-4 space-y-2">
        <Skeleton variant={variant} className="h-4 w-3/4" />
        <Skeleton variant={variant} className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonRow({
  variant = 'dark',
  className,
}: {
  variant?: 'dark' | 'light'
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Skeleton variant={variant} className="h-12 w-12" rounded="xl" />
      <div className="flex-1 space-y-2">
        <Skeleton variant={variant} className="h-4 w-2/3" />
        <Skeleton variant={variant} className="h-3 w-1/3" />
      </div>
    </div>
  )
}
