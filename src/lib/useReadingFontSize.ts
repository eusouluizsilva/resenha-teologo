import { useEffect, useState } from 'react'

// Controle de tamanho da letra para áreas de leitura (Bíblia, blog post, modo
// leitura do caderno). 4 níveis salvos no localStorage com a mesma chave entre
// telas pra a preferência valer pra toda a leitura.

export type ReadingFontSize = 'sm' | 'md' | 'lg' | 'xl'

const STORAGE_KEY = 'rdt_reading_font_size_v1'
const DEFAULT: ReadingFontSize = 'md'

function read(): ReadingFontSize {
  if (typeof localStorage === 'undefined') return DEFAULT
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'sm' || raw === 'md' || raw === 'lg' || raw === 'xl') return raw
  } catch { /* ignore */ }
  return DEFAULT
}

export function useReadingFontSize(): [ReadingFontSize, (s: ReadingFontSize) => void] {
  const [size, setSize] = useState<ReadingFontSize>(() => read())

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, size) } catch { /* ignore */ }
  }, [size])

  return [size, setSize]
}

// Tamanhos pensados pra texto editorial (~16px base, escala generosa para
// leitura prolongada).
export const READING_FONT_SIZES: Record<ReadingFontSize, { fontSize: string; lineHeight: string }> = {
  sm: { fontSize: '15px', lineHeight: '1.7' },
  md: { fontSize: '17px', lineHeight: '1.8' },
  lg: { fontSize: '19px', lineHeight: '1.85' },
  xl: { fontSize: '22px', lineHeight: '1.9' },
}
