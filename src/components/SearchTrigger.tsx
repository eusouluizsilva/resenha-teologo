import { openCommandPalette } from '@/lib/commandPalette'
import { cn } from '@/lib/brand'

// Botão visível que abre o command palette (Cmd+K). Existe pra usuários
// mobile e pra quem não conhece o atalho de teclado: Cmd+K é invisível pra
// quem não sabe que existe. Usa o evento custom em CommandPalette pra não
// precisar de prop drilling nem context provider.
//
// Variantes:
// - icon: só lupa, ideal pra topbar mobile estreito
// - default: lupa + "Buscar", ideal pra desktop com mais espaço
// - pill: lupa + placeholder + Cmd+K hint, estilo input fake (não usado ainda)

type Props = {
  variant?: 'icon' | 'default' | 'pill'
  className?: string
  theme?: 'dark' | 'light'
}

export function SearchTrigger({ variant = 'default', className, theme = 'dark' }: Props) {
  const isDark = theme === 'dark'

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={openCommandPalette}
        aria-label="Buscar"
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-2xl border transition-all',
          isDark
            ? 'border-white/8 bg-white/[0.03] text-white/72 hover:border-white/14 hover:text-white'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900',
          className,
        )}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </button>
    )
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={openCommandPalette}
        aria-label="Buscar"
        className={cn(
          'flex h-10 items-center gap-3 rounded-2xl border px-3 text-left transition-all min-w-[220px]',
          isDark
            ? 'border-white/8 bg-white/[0.03] text-white/52 hover:border-white/14'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
          className,
        )}
      >
        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <span className="flex-1 text-sm">Buscar...</span>
        <kbd className={cn(
          'hidden rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] sm:inline-block',
          isDark ? 'border-white/10 bg-white/[0.04] text-white/52' : 'border-gray-200 bg-gray-50 text-gray-500',
        )}>
          Cmd K
        </kbd>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-label="Buscar"
      className={cn(
        'flex h-10 items-center gap-2 rounded-2xl border px-3 transition-all',
        isDark
          ? 'border-white/8 bg-white/[0.03] text-white/72 hover:border-white/14 hover:text-white'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900',
        className,
      )}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <span className="text-sm font-medium">Buscar</span>
    </button>
  )
}
