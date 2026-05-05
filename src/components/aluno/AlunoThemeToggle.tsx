import { useAlunoTheme, toggleAlunoTheme } from '@/lib/alunoTheme'
import { cn } from '@/lib/brand'

// Pill compacto pra trocar entre light/dark nas superficies de estudo.
// Tem variante 'light' (fundo claro) e 'dark' (fundo dark) pra combinar com
// a header onde for plugado. O proprio botao mostra sol no light e lua no
// dark, sinalizando o tema *atual*.
export function AlunoThemeToggle({
  variant = 'light',
  size = 'md',
  className,
}: {
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md'
  className?: string
}) {
  const [theme, setTheme] = useAlunoTheme()
  const isDark = theme === 'dark'

  const sizing = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-4.5 w-4.5'

  const surface =
    variant === 'dark'
      ? 'border-white/12 bg-white/[0.04] text-white/72 hover:border-white/24 hover:text-white'
      : isDark
        ? 'border-white/12 bg-white/[0.06] text-white/80 hover:border-white/24 hover:text-white'
        : 'border-[#E6DBCF] bg-white text-gray-600 hover:border-[#F37E20]/40 hover:text-[#F37E20]'

  return (
    <button
      type="button"
      onClick={() => setTheme(toggleAlunoTheme(theme))}
      aria-label={isDark ? 'Trocar para tema claro' : 'Trocar para tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      className={cn(
        'inline-flex items-center justify-center rounded-full border transition-all',
        sizing,
        surface,
        className,
      )}
    >
      {isDark ? (
        <svg className={iconSize} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        <svg className={iconSize} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  )
}
