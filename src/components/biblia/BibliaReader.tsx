// Leitor bíblico standalone, reutilizável entre rota pública (/biblia) e
// rota interna (/dashboard/biblia). Usa fetchChapter + state local; persiste
// tradução, livro e capítulo no localStorage. Para usuários autenticados,
// carrega highlights e notas do Convex e permite editá-los inline.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { BIBLE_BOOKS, getBibleBook } from '@/lib/bible/books'
import { BIBLE_SOURCES, DEFAULT_BIBLE_SOURCE_ID, getBibleSource } from '@/lib/bible/translations'
import { fetchChapter, type BibleVerse } from '@/lib/bible/api'

const STORAGE_KEY = 'rdt_biblia_state_v1'

const HIGHLIGHT_COLORS: { id: string; label: string; bg: string }[] = [
  { id: 'yellow', label: 'Amarelo', bg: '#FEF3C7' },
  { id: 'green', label: 'Verde', bg: '#D1FAE5' },
  { id: 'blue', label: 'Azul', bg: '#DBEAFE' },
  { id: 'pink', label: 'Rosa', bg: '#FCE7F3' },
  { id: 'orange', label: 'Laranja', bg: '#FFE4CC' },
]

function colorBg(color: string | undefined): string | undefined {
  if (!color) return undefined
  return HIGHLIGHT_COLORS.find((c) => c.id === color)?.bg
}

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

interface BibliaReaderProps {
  backHref?: string
  backLabel?: string
}

export function BibliaReader({ backHref, backLabel = 'Voltar' }: BibliaReaderProps) {
  const saved = loadSaved()
  const [sourceId, setSourceId] = useState<string>(saved?.sourceId ?? DEFAULT_BIBLE_SOURCE_ID)
  const [bookSlug, setBookSlug] = useState<string>(saved?.bookSlug ?? 'joao')
  const [chapter, setChapter] = useState<number>(saved?.chapter ?? 1)
  const [verses, setVerses] = useState<BibleVerse[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeVerse, setActiveVerse] = useState<number | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<Id<'bibleNotes'> | null>(null)
  const [editingDraft, setEditingDraft] = useState('')
  const [newNoteVerse, setNewNoteVerse] = useState<number | null>(null)
  const [newNoteDraft, setNewNoteDraft] = useState('')

  const popoverRef = useRef<HTMLDivElement | null>(null)

  const { isSignedIn } = useUser()

  const book = useMemo(() => getBibleBook(bookSlug), [bookSlug])
  const source = useMemo(() => getBibleSource(sourceId), [sourceId])

  const filteredSources = useMemo(() => {
    if (!book) return BIBLE_SOURCES
    return BIBLE_SOURCES.filter((s) => s.testaments.includes(book.testament))
  }, [book])

  const annotations = useQuery(
    api.bible.listForChapter,
    isSignedIn ? { bookSlug, chapter } : 'skip',
  )

  const setHighlight = useMutation(api.bible.setHighlight)
  const addNote = useMutation(api.bible.addNote)
  const updateNote = useMutation(api.bible.updateNote)
  const removeNote = useMutation(api.bible.removeNote)

  const highlightByVerse = useMemo(() => {
    const map = new Map<number, string>()
    annotations?.highlights.forEach((h) => map.set(h.verse, h.color))
    return map
  }, [annotations])

  const notesByVerse = useMemo(() => {
    const map = new Map<number, NonNullable<typeof annotations>['notes']>()
    if (!annotations) return map
    for (const n of annotations.notes) {
      const list = map.get(n.verse) ?? []
      list.push(n)
      map.set(n.verse, list)
    }
    return map
  }, [annotations])

  useEffect(() => {
    if (!book) return
    const ok = source && source.testaments.includes(book.testament)
    if (!ok && filteredSources.length > 0) {
      // Auto-corrige a fonte quando incompatível com o testamento.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // Limpa seleção quando o usuário troca de capítulo/livro.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveVerse(null)
     
    setEditingNoteId(null)
     
    setNewNoteVerse(null)
  }, [bookSlug, chapter])

  useEffect(() => {
    if (!book) return
    let cancelled = false
    // Loading state acompanha ciclo de vida do fetch async.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  useEffect(() => {
    if (activeVerse === null) return
    function onClick(e: MouseEvent) {
      if (!popoverRef.current) return
      if (popoverRef.current.contains(e.target as Node)) return
      const target = e.target as HTMLElement
      if (target.closest('[data-verse]')) return
      setActiveVerse(null)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [activeVerse])

  const handleHighlight = async (verse: number, color: string | null) => {
    if (!isSignedIn || !book) return
    try {
      await setHighlight({ bookSlug, chapter, verse, color })
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveNewNote = async (verse: number) => {
    if (!isSignedIn) return
    const trimmed = newNoteDraft.trim()
    if (trimmed.length === 0) {
      setNewNoteVerse(null)
      return
    }
    try {
      await addNote({ bookSlug, chapter, verse, note: trimmed })
      setNewNoteDraft('')
      setNewNoteVerse(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveEditedNote = async (id: Id<'bibleNotes'>) => {
    const trimmed = editingDraft.trim()
    if (trimmed.length === 0) {
      setEditingNoteId(null)
      return
    }
    try {
      await updateNote({ id, note: trimmed })
      setEditingNoteId(null)
      setEditingDraft('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveNote = async (id: Id<'bibleNotes'>) => {
    try {
      await removeNote({ id })
    } catch (err) {
      console.error(err)
    }
  }

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
          {backHref && (
            <Link
              to={backHref}
              className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#111827] hover:bg-black/5"
            >
              {backLabel}
            </Link>
          )}
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
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {isSignedIn && !loading && !error && (
          <p className="mb-4 text-xs text-[#6B7280]">
            Toque em um versículo para destacar com cor ou adicionar uma anotação.
          </p>
        )}
        {!loading && !error && verses && (
          <article className="space-y-4 font-['Source_Serif_4'] text-[17px] leading-[1.8] text-[#111827]">
            {verses.map((v) => {
              const color = highlightByVerse.get(v.verse)
              const verseNotes = notesByVerse.get(v.verse) ?? []
              const hasNotes = verseNotes.length > 0
              const isActive = activeVerse === v.verse
              return (
                <div key={v.pk} className="relative">
                  <p
                    data-verse={v.verse}
                    onClick={() => {
                      if (!isSignedIn) return
                      setActiveVerse((cur) => (cur === v.verse ? null : v.verse))
                    }}
                    className={`rounded-md px-2 py-1 transition-colors ${
                      isSignedIn ? 'cursor-pointer hover:bg-black/5' : ''
                    } ${isActive ? 'ring-2 ring-[#F37E20]/40' : ''}`}
                    style={color ? { backgroundColor: colorBg(color) } : undefined}
                  >
                    <sup className="mr-1 text-[11px] font-bold text-[#F37E20]">{v.verse}</sup>
                    {v.text}
                    {hasNotes && (
                      <span
                        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#F37E20]/15 align-middle text-[#F37E20]"
                        title={`${verseNotes.length} anotação${verseNotes.length > 1 ? 'es' : ''}`}
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.687a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </span>
                    )}
                  </p>

                  {isActive && isSignedIn && (
                    <div
                      ref={popoverRef}
                      className="absolute left-2 right-2 z-10 mt-1 rounded-lg border border-black/10 bg-white p-3 shadow-lg sm:left-auto sm:right-auto sm:max-w-md"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#6B7280]">Versículo {v.verse}</span>
                        <button
                          type="button"
                          onClick={() => setActiveVerse(null)}
                          className="ml-auto text-xs text-[#6B7280] hover:text-[#111827]"
                          aria-label="Fechar"
                        >
                          Fechar
                        </button>
                      </div>

                      <div className="mb-3">
                        <p className="mb-2 text-[10px] uppercase tracking-wider text-[#6B7280]">Marcador</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {HIGHLIGHT_COLORS.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleHighlight(v.verse, c.id)}
                              className={`h-7 w-7 rounded-full border transition-transform hover:scale-110 ${
                                color === c.id ? 'border-[#111827] ring-2 ring-[#F37E20]/50' : 'border-black/10'
                              }`}
                              style={{ backgroundColor: c.bg }}
                              title={c.label}
                              aria-label={`Marcar com ${c.label}`}
                            />
                          ))}
                          {color && (
                            <button
                              type="button"
                              onClick={() => handleHighlight(v.verse, null)}
                              className="rounded-md border border-black/10 px-2 py-1 text-[11px] text-[#6B7280] hover:bg-black/5"
                            >
                              Limpar
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-[10px] uppercase tracking-wider text-[#6B7280]">Anotações</p>
                        {verseNotes.length > 0 && (
                          <ul className="mb-2 space-y-2">
                            {verseNotes.map((n) => (
                              <li
                                key={String(n._id)}
                                className="rounded-md border border-black/10 bg-[#F7F5F2] p-2 text-sm text-[#111827]"
                              >
                                {editingNoteId === n._id ? (
                                  <>
                                    <textarea
                                      value={editingDraft}
                                      onChange={(e) => setEditingDraft(e.target.value)}
                                      rows={3}
                                      maxLength={2000}
                                      className="w-full rounded-md border border-black/10 bg-white p-2 text-sm text-[#111827]"
                                    />
                                    <div className="mt-2 flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditedNote(n._id)}
                                        className="rounded-md bg-[#F37E20] px-3 py-1 text-xs font-semibold text-white hover:bg-[#e06e10]"
                                      >
                                        Salvar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingNoteId(null)
                                          setEditingDraft('')
                                        }}
                                        className="rounded-md border border-black/10 px-3 py-1 text-xs text-[#6B7280] hover:bg-black/5"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <p className="whitespace-pre-wrap">{n.note}</p>
                                    <div className="mt-2 flex items-center gap-3 text-[11px] text-[#6B7280]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingNoteId(n._id)
                                          setEditingDraft(n.note)
                                        }}
                                        className="hover:text-[#111827]"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveNote(n._id)}
                                        className="hover:text-red-600"
                                      >
                                        Remover
                                      </button>
                                    </div>
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}

                        {newNoteVerse === v.verse ? (
                          <>
                            <textarea
                              value={newNoteDraft}
                              onChange={(e) => setNewNoteDraft(e.target.value)}
                              rows={3}
                              maxLength={2000}
                              autoFocus
                              placeholder="Sua reflexão sobre este versículo..."
                              className="w-full rounded-md border border-black/10 bg-white p-2 text-sm text-[#111827]"
                            />
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveNewNote(v.verse)}
                                className="rounded-md bg-[#F37E20] px-3 py-1 text-xs font-semibold text-white hover:bg-[#e06e10]"
                              >
                                Salvar anotação
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewNoteVerse(null)
                                  setNewNoteDraft('')
                                }}
                                className="rounded-md border border-black/10 px-3 py-1 text-xs text-[#6B7280] hover:bg-black/5"
                              >
                                Cancelar
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setNewNoteVerse(v.verse)
                              setNewNoteDraft('')
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-black/10 px-3 py-1 text-xs font-semibold text-[#111827] hover:bg-black/5"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Nova anotação
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </article>
        )}

        {isSignedIn && annotations && annotations.notes.length > 0 && (
          <section className="mt-10 rounded-lg border border-black/10 bg-white p-5">
            <h2 className="mb-3 font-['Source_Serif_4'] text-lg font-bold text-[#111827]">
              Suas anotações deste capítulo
            </h2>
            <ul className="space-y-3">
              {annotations.notes.map((n) => (
                <li key={String(n._id)} className="border-l-2 border-[#F37E20] pl-3">
                  <p className="text-xs font-semibold text-[#6B7280]">
                    {book?.name} {chapter}:{n.verse}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#111827]">{n.note}</p>
                </li>
              ))}
            </ul>
          </section>
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
