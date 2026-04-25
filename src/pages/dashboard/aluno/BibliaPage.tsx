// Página standalone de leitura bíblica (/dashboard/biblia). Usa a mesma lib
// fetchChapter da BiblePanel, mas em layout full-page editorial pra estudo
// dedicado. Persistência local: tradução, livro e capítulo atuais.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BIBLE_BOOKS, getBibleBook } from '@/lib/bible/books'
import { BIBLE_SOURCES, DEFAULT_BIBLE_SOURCE_ID, getBibleSource } from '@/lib/bible/translations'
import { fetchChapter, type BibleVerse } from '@/lib/bible/api'

const STORAGE_KEY = 'rdt_biblia_state_v1'

type SavedState = {
  sourceId: string
  bookSlug: string
  chapter: number
}

function loadSaved(): SavedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedState
    if (
      parsed.sourceId &&
      parsed.bookSlug &&
      typeof parsed.chapter === 'number' &&
      getBibleSource(parsed.sourceId) &&
      getBibleBook(parsed.bookSlug)
    ) {
      return parsed
    }
  } catch {
    // estado corrompido, descarta
  }
  return null
}

export default function BibliaPage() {
  const saved = loadSaved()
  const [sourceId, setSourceId] = useState<string>(saved?.sourceId ?? DEFAULT_BIBLE_SOURCE_ID)
  const [bookSlug, setBookSlug] = useState<string>(saved?.bookSlug ?? 'joao')
  const [chapter, setChapter] = useState<number>(saved?.chapter ?? 1)
  const [verses, setVerses] = useState<BibleVerse[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const book = useMemo(() => getBibleBook(bookSlug), [bookSlug])
  const source = useMemo(() => getBibleSource(sourceId), [sourceId])

  const filteredSources = useMemo(() => {
    if (!book) return BIBLE_SOURCES
    return BIBLE_SOURCES.filter((s) => s.testaments.includes(book.testament))
  }, [book])

  useEffect(() => {
    if (!book) return
    const ok = source && source.testaments.includes(book.testament)
    if (!ok && filteredSources.length > 0) {
      setSourceId(filteredSources[0].id)
    }
  }, [book, source, filteredSources])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sourceId, bookSlug, chapter }),
      )
    }
  }, [sourceId, bookSlug, chapter])

  useEffect(() => {
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
  }, [sourceId, bookSlug, chapter, book])

  return (
    <div className="min-h-full bg-[#F7F5F2]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-[#6B7280]">Bíblia</p>
            <h1 className="font-['Source_Serif_4'] text-2xl font-bold text-[#111827]">
              {book?.name ?? 'Selecione um livro'} {chapter}
            </h1>
          </div>
          <Link
            to="/dashboard"
            className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#111827] hover:bg-black/5"
          >
            Voltar ao painel
          </Link>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-2 px-4 pb-4 sm:px-6">
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
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {loading && <p className="text-sm text-[#6B7280]">Carregando capítulo...</p>}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {!loading && !error && verses && (
          <article className="space-y-4 font-['Source_Serif_4'] text-[17px] leading-[1.8] text-[#111827]">
            {verses.map((v) => (
              <p key={v.pk}>
                <sup className="mr-1 text-[11px] font-bold text-[#F37E20]">{v.verse}</sup>
                {v.text}
              </p>
            ))}
          </article>
        )}

        <nav className="mt-10 flex items-center justify-between border-t border-black/10 pt-6">
          <button
            type="button"
            onClick={() => setChapter((c) => Math.max(1, c - 1))}
            disabled={chapter <= 1}
            className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
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
            className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próximo
          </button>
        </nav>
      </main>
    </div>
  )
}
