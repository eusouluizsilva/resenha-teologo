// Painel lateral retrátil para consulta bíblica em qualquer página onde o
// estudante precise do texto à mão (AulaPage, CadernoPage, futura BibliaPage).
// Carrega versículos via Bolls.life com cache em memória (lib/bible/api.ts).
//
// Estado é controlado por dois props: `open` (visibilidade) e `onClose`. O pai
// decide a UI do trigger (ex.: AulaPage tem um botão flutuante).
//
// Quando o pai passa `initialRef` (ex.: aluno clicou num versículo ligado à
// aula), o painel pré-seleciona livro/capítulo correspondente.

import { useEffect, useMemo, useState } from 'react'
import { BIBLE_BOOKS, getBibleBook } from '@/lib/bible/books'
import { BIBLE_SOURCES, DEFAULT_BIBLE_SOURCE_ID, getBibleSource } from '@/lib/bible/translations'
import { fetchChapter, type BibleVerse } from '@/lib/bible/api'

export type BiblePanelInitialRef = {
  bookSlug: string
  chapter: number
  verseStart?: number
  verseEnd?: number
}

type Props = {
  open: boolean
  onClose: () => void
  initialRef?: BiblePanelInitialRef
}

const STORAGE_KEY = 'rdt_bible_panel_v1'

export function BiblePanel({ open, onClose, initialRef }: Props) {
  const [sourceId, setSourceId] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_BIBLE_SOURCE_ID
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored && getBibleSource(stored) ? stored : DEFAULT_BIBLE_SOURCE_ID
  })
  const [bookSlug, setBookSlug] = useState<string>(initialRef?.bookSlug ?? 'joao')
  const [chapter, setChapter] = useState<number>(initialRef?.chapter ?? 1)
  const [verses, setVerses] = useState<BibleVerse[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialRef) return
    setBookSlug(initialRef.bookSlug)
    setChapter(initialRef.chapter)
  }, [initialRef])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, sourceId)
    }
  }, [sourceId])

  const book = useMemo(() => getBibleBook(bookSlug), [bookSlug])
  const source = useMemo(() => getBibleSource(sourceId), [sourceId])

  const filteredSources = useMemo(() => {
    if (!book) return BIBLE_SOURCES
    return BIBLE_SOURCES.filter((s) => s.testaments.includes(book.testament))
  }, [book])

  // Se a fonte atual não é compatível com o testamento do livro selecionado,
  // troca automaticamente pra primeira compatível (evita request inválido).
  useEffect(() => {
    if (!book) return
    const ok = source && source.testaments.includes(book.testament)
    if (!ok && filteredSources.length > 0) {
      setSourceId(filteredSources[0].id)
    }
  }, [book, source, filteredSources])

  useEffect(() => {
    if (!open) return
    if (!book) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchChapter({ sourceId, bookSlug, chapter })
      .then((data) => {
        if (cancelled) return
        setVerses(data)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Erro ao carregar capítulo')
        setVerses(null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, sourceId, bookSlug, chapter, book])

  const verseStart = initialRef?.verseStart
  const verseEnd = initialRef?.verseEnd

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[#F7F5F2] shadow-2xl"
        role="dialog"
        aria-label="Bíblia"
      >
        <header className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#6B7280]">Bíblia</p>
            <h2 className="font-['Source_Serif_4'] text-xl font-semibold text-[#111827]">
              {book?.name ?? 'Selecione um livro'} {chapter}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-[#111827] hover:bg-black/5"
            aria-label="Fechar painel da Bíblia"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="grid grid-cols-3 gap-2 border-b border-black/10 px-5 py-3">
          <select
            value={bookSlug}
            onChange={(e) => {
              setBookSlug(e.target.value)
              setChapter(1)
            }}
            className="col-span-2 rounded-md border border-black/10 bg-white px-2 py-2 text-sm text-[#111827]"
            aria-label="Livro"
          >
            {BIBLE_BOOKS.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
          <select
            value={chapter}
            onChange={(e) => setChapter(Number(e.target.value))}
            className="rounded-md border border-black/10 bg-white px-2 py-2 text-sm text-[#111827]"
            aria-label="Capítulo"
          >
            {Array.from({ length: book?.chapters ?? 1 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>Cap. {n}</option>
            ))}
          </select>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="col-span-3 rounded-md border border-black/10 bg-white px-2 py-2 text-sm text-[#111827]"
            aria-label="Tradução"
          >
            {filteredSources.map((s) => (
              <option key={s.id} value={s.id}>{s.label} · {s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading && (
            <p className="text-sm text-[#6B7280]">Carregando capítulo...</p>
          )}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {!loading && !error && verses && (
            <div className="space-y-3 font-['Source_Serif_4'] text-[15px] leading-[1.7] text-[#111827]">
              {verses.map((v) => {
                const highlighted =
                  verseStart !== undefined &&
                  verseEnd !== undefined &&
                  v.verse >= verseStart &&
                  v.verse <= verseEnd
                return (
                  <p
                    key={v.pk}
                    className={
                      highlighted
                        ? 'rounded-md bg-[#F37E20]/10 p-2 ring-1 ring-[#F37E20]/30'
                        : ''
                    }
                  >
                    <sup className="mr-1 text-[10px] font-bold text-[#F37E20]">{v.verse}</sup>
                    {v.text}
                  </p>
                )
              })}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-black/10 px-5 py-3">
          <button
            type="button"
            onClick={() => setChapter((c) => Math.max(1, c - 1))}
            disabled={chapter <= 1}
            className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#111827] hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Capítulo anterior
          </button>
          <span className="text-xs text-[#6B7280]">
            {book?.name} {chapter} / {book?.chapters}
          </span>
          <button
            type="button"
            onClick={() => setChapter((c) => Math.min(book?.chapters ?? 1, c + 1))}
            disabled={!book || chapter >= book.chapters}
            className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#111827] hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próximo
          </button>
        </footer>
      </aside>
    </>
  )
}
