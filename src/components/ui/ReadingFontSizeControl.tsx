import type { ReadingFontSize } from '@/lib/useReadingFontSize'
import { cn } from '@/lib/brand'

// Controle compacto A-/A+ pra ajustar tamanho da letra em telas de leitura.
// Funciona em tema claro e escuro recebendo `theme`. Botão central mostra o
// nível atual ('A' com tamanho proporcional). Use junto do hook
// useReadingFontSize() pra persistir entre sessões.

const ORDER: ReadingFontSize[] = ['sm', 'md', 'lg', 'xl']

type Props = {
  size: ReadingFontSize
  onChange: (s: ReadingFontSize) => void
  theme?: 'light' | 'dark'
  className?: string
}

export function ReadingFontSizeControl({ size, onChange, theme = 'light', className }: Props) {
  const idx = ORDER.indexOf(size)
  const canDecrease = idx > 0
  const canIncrease = idx < ORDER.length - 1

  const baseBtn =
    theme === 'dark'
      ? 'flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/72 hover:border-white/20 hover:text-white disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-white/72'
      : 'flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-[#111827]/70 hover:border-black/20 hover:text-[#111827] disabled:opacity-30 disabled:hover:border-black/10 disabled:hover:text-[#111827]/70'

  return (
    <div
      role="group"
      aria-label="Tamanho da letra"
      className={cn('flex items-center gap-1', className)}
    >
      <button
        type="button"
        onClick={() => canDecrease && onChange(ORDER[idx - 1])}
        disabled={!canDecrease}
        aria-label="Diminuir tamanho da letra"
        className={baseBtn}
      >
        <span className="text-[11px] font-bold leading-none">A</span>
        <span className="ml-px text-[8px] font-bold leading-none">−</span>
      </button>
      <button
        type="button"
        onClick={() => canIncrease && onChange(ORDER[idx + 1])}
        disabled={!canIncrease}
        aria-label="Aumentar tamanho da letra"
        className={baseBtn}
      >
        <span className="text-[14px] font-bold leading-none">A</span>
        <span className="ml-px text-[8px] font-bold leading-none">+</span>
      </button>
    </div>
  )
}
