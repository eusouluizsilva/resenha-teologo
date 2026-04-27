import { isOfficialHandle } from '@/lib/verified'
import { cn } from '@/lib/brand'

type Size = 'xs' | 'sm' | 'md' | 'lg'

const sizeMap: Record<Size, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

// Selo de verificacao estilo Instagram. Estrela serrilhada azul com check
// branco. Renderiza inline com o nome do autor. Use <VerifiedBadge handle={...}/>
// para deixar o componente decidir se mostra ou nao baseado no handle oficial,
// ou <VerifiedBadge force /> quando ja sabe que deve mostrar.
export function VerifiedBadge({
  handle,
  force = false,
  size = 'sm',
  className,
}: {
  handle?: string | null
  force?: boolean
  size?: Size
  className?: string
}) {
  if (!force && !isOfficialHandle(handle)) return null

  return (
    <svg
      viewBox="0 0 24 24"
      aria-label="Perfil verificado"
      role="img"
      className={cn('inline-block flex-shrink-0 align-middle', sizeMap[size], className)}
    >
      <title>Perfil verificado</title>
      <path
        fill="#1D9BF0"
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
      />
      <path
        fill="#FFFFFF"
        d="M16.32 9.36 11 14.68l-3.36-3.36 1.41-1.41L11 11.86l3.91-3.91 1.41 1.41z"
      />
    </svg>
  )
}
