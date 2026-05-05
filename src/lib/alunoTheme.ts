import { useEffect, useState } from 'react'

// Tema do aluno nas superficies de estudo (AulaPage, CadernoPage,
// CursoInternoPage). Persiste em localStorage. Quando 'dark' o wrapper de
// pagina recebe data-aluno-theme="dark" e o CSS scoped em index.css inverte
// fundos brancos, texto cinza e bordas claras pra paleta dark.
//
// O dashboard chrome (sidebar, top bar, paginas dark do aluno como
// AlunoDashboardPage) ja e dark e nao usa as classes alvo do override.

const STORAGE_KEY = 'aluno_theme'
const CHANGE_EVENT = 'aluno-theme-changed'

export type AlunoTheme = 'light' | 'dark'

function readSaved(): AlunoTheme {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function useAlunoTheme(): [AlunoTheme, (next: AlunoTheme) => void] {
  const [theme, setThemeState] = useState<AlunoTheme>(readSaved)

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<AlunoTheme>).detail
      if (detail === 'light' || detail === 'dark') setThemeState(detail)
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setThemeState(readSaved())
    }
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const setTheme = (next: AlunoTheme) => {
    setThemeState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore quota errors */
    }
    try {
      window.dispatchEvent(new CustomEvent<AlunoTheme>(CHANGE_EVENT, { detail: next }))
    } catch {
      /* ignore old browsers */
    }
  }

  return [theme, setTheme]
}

export function toggleAlunoTheme(theme: AlunoTheme): AlunoTheme {
  return theme === 'dark' ? 'light' : 'dark'
}
