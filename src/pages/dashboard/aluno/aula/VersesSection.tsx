import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/brand'
import {
  BIBLE_BOOKS,
  formatVerseReference,
  getBibleBook,
} from '@/lib/bible/books'
import {
  BIBLE_SOURCES,
  DEFAULT_BIBLE_SOURCE_ID,
  getBibleSource,
  type BibleSource,
} from '@/lib/bible/translations'
import { fetchChapter, type BibleVerse } from '@/lib/bible/api'
import type { VerseRef } from './types'

const MAX_INLINE_VERSES = 6

function VerseCard({
  refData,
  source,
  onOpenInPanel,
}: {
  refData: VerseRef
  source: BibleSource
  onOpenInPanel: (ref: VerseRef) => void
}) {
  const book = getBibleBook(refData.bookSlug)
  const label = formatVerseReference(refData)
  const compatible = source.testaments.includes(refData.testament)
  const bibleGatewayVersion = source.bibleGatewayVersion
  const searchRef = book
    ? `${book.name} ${refData.chapter}:${refData.verseStart}${
        refData.verseEnd !== refData.verseStart ? `-${refData.verseEnd}` : ''
      }`
    : label
  const bibleGatewayHref = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(searchRef)}&version=${encodeURIComponent(bibleGatewayVersion)}`

  const [verses, setVerses] = useState<BibleVerse[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!compatible) return
    let cancelled = false
    // Loading state acompanha ciclo do fetch async.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)

    setFetchError(false)

    setExpanded(false)
    fetchChapter({
      sourceId: source.id,
      bookSlug: refData.bookSlug,
      chapter: refData.chapter,
    })
      .then((data) => {
        if (cancelled) return
        const filtered = data.filter(
          (v) => v.verse >= refData.verseStart && v.verse <= refData.verseEnd
        )
        setVerses(filtered)
      })
      .catch(() => {
        if (cancelled) return
        setFetchError(true)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [compatible, source.id, refData.bookSlug, refData.chapter, refData.verseStart, refData.verseEnd])

  const visibleVerses = useMemo(() => {
    if (!verses) return []
    if (expanded || verses.length <= MAX_INLINE_VERSES) return verses
    return verses.slice(0, MAX_INLINE_VERSES)
  }, [verses, expanded])

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="font-display text-sm font-semibold text-gray-800 truncate">
          {label}
        </span>
        <span
          className={cn(
            'flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            compatible
              ? 'bg-[#F37E20]/10 text-[#F37E20]'
              : 'bg-gray-100 text-gray-400'
          )}
        >
          {source.label}
        </span>
      </div>

      {!compatible ? (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">
            {source.label} não cobre este testamento. Escolha outra tradução
            para ver o texto.
          </p>
        </div>
      ) : loading ? (
        <div className="border-t border-gray-100 px-4 py-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-9/12 animate-pulse rounded bg-gray-100" />
        </div>
      ) : fetchError || !verses ? (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500">
            Não foi possível carregar o texto agora.
          </p>
          <a
            href={bibleGatewayHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#F37E20] hover:underline"
          >
            Abrir no BibleGateway
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M7.5 16.5L21 3m0 0h-4.875M21 3v4.875" />
            </svg>
          </a>
        </div>
      ) : verses.length === 0 ? (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">
            Versículo não encontrado nesta tradução.
          </p>
        </div>
      ) : (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-sm leading-7 text-gray-700 font-serif">
            {visibleVerses.map((v, idx) => (
              <span key={v.pk}>
                <sup className="mr-1 text-[10px] font-semibold text-[#F37E20] align-super">
                  {v.verse}
                </sup>
                {v.text}
                {idx < visibleVerses.length - 1 && ' '}
              </span>
            ))}
          </p>
          {verses.length > MAX_INLINE_VERSES && !expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-2 text-xs font-semibold text-[#F37E20] hover:underline"
            >
              Mostrar tudo ({verses.length - MAX_INLINE_VERSES} a mais)
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenInPanel(refData)}
            className="mt-2 ml-3 inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#F37E20]"
          >
            Abrir capítulo no painel
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export function VersesSection({
  versesRefs,
  onOpenInPanel,
}: {
  versesRefs: VerseRef[]
  onOpenInPanel: (ref: VerseRef) => void
}) {
  const [sourceId, setSourceId] = useState(DEFAULT_BIBLE_SOURCE_ID)

  const source = getBibleSource(sourceId) ?? BIBLE_SOURCES[0]

  const sortedRefs = useMemo(() => {
    const order = new Map(BIBLE_BOOKS.map((b, i) => [b.slug, i]))
    return [...versesRefs].sort((a, b) => {
      const ai = order.get(a.bookSlug) ?? 999
      const bi = order.get(b.bookSlug) ?? 999
      if (ai !== bi) return ai - bi
      if (a.chapter !== b.chapter) return a.chapter - b.chapter
      return a.verseStart - b.verseStart
    })
  }, [versesRefs])

  if (versesRefs.length === 0) return null

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-gray-800">
              Versículos citados
            </h2>
            <p className="text-xs text-gray-500">
              {sortedRefs.length} referência
              {sortedRefs.length !== 1 ? 's' : ''} nesta aula.
            </p>
          </div>
        </div>

        <select
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
        >
          {BIBLE_SOURCES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {sortedRefs.map((ref, i) => (
          <VerseCard
            key={`${ref.bookSlug}-${ref.chapter}-${ref.verseStart}-${ref.verseEnd}-${i}`}
            refData={ref}
            source={source}
            onOpenInPanel={onOpenInPanel}
          />
        ))}
      </div>
    </section>
  )
}
