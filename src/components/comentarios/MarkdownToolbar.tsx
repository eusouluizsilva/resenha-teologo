import type { RefObject } from 'react'

type Props = {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (next: string) => void
  variant?: 'light' | 'dark'
}

function wrapSelection(
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (next: string) => void,
  before: string,
  after: string,
  fallback: string,
) {
  const start = textarea.selectionStart ?? value.length
  const end = textarea.selectionEnd ?? value.length
  const selected = value.slice(start, end)
  const inner = selected || fallback
  const next = `${value.slice(0, start)}${before}${inner}${after}${value.slice(end)}`
  onChange(next)
  requestAnimationFrame(() => {
    textarea.focus()
    const cursorStart = start + before.length
    const cursorEnd = cursorStart + inner.length
    textarea.setSelectionRange(cursorStart, cursorEnd)
  })
}

export function MarkdownToolbar({ textareaRef, value, onChange, variant = 'light' }: Props) {
  const baseBtn =
    variant === 'light'
      ? 'rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-600 hover:border-[#F37E20]/40 hover:text-[#F37E20]'
      : 'rounded-md border border-white/10 bg-white/4 px-2 py-1 text-xs font-semibold text-white/72 hover:border-[#F37E20]/40 hover:text-[#F37E20]'

  function handleClick(before: string, after: string, fallback: string) {
    const ta = textareaRef.current
    if (!ta) return
    wrapSelection(ta, value, onChange, before, after, fallback)
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => handleClick('**', '**', 'negrito')}
        className={baseBtn}
        title="Negrito (markdown **texto**)"
      >
        <span className="font-bold">B</span>
      </button>
      <button
        type="button"
        onClick={() => handleClick('*', '*', 'itálico')}
        className={baseBtn}
        title="Itálico (markdown *texto*)"
      >
        <span className="italic">I</span>
      </button>
      <button
        type="button"
        onClick={() => handleClick('`', '`', 'código')}
        className={baseBtn}
        title="Código (markdown `texto`)"
      >
        <span className="font-mono">{'<>'}</span>
      </button>
      <button
        type="button"
        onClick={() => handleClick('> ', '', 'citação')}
        className={baseBtn}
        title="Citação (markdown > texto)"
      >
        &gt;
      </button>
    </div>
  )
}
