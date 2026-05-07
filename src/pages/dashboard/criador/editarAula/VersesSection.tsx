import { useId } from 'react'
import { brandInputClass } from '@/lib/brand'
import { BIBLE_BOOKS, formatVerseReference, getBibleBook } from '@/lib/bible/books'
import { SectionCard } from './SectionCard'
import { emptyVerseRef } from './helpers'
import type { VerseRef } from './types'

function VerseRow({
  verse,
  index,
  onChange,
  onRemove,
}: {
  verse: VerseRef
  index: number
  onChange: (v: VerseRef) => void
  onRemove: () => void
}) {
  const book = getBibleBook(verse.bookSlug)
  const maxChapter = book?.chapters ?? 1
  const rowId = useId()

  function updateBook(slug: string) {
    const next = getBibleBook(slug)
    if (!next) return
    onChange({
      ...verse,
      bookSlug: slug,
      testament: next.testament,
      chapter: Math.min(verse.chapter, next.chapters),
      verseStart: 1,
      verseEnd: 1,
    })
  }

  function updateChapter(n: number) {
    const c = Math.max(1, Math.min(maxChapter, Number.isFinite(n) ? n : 1))
    onChange({ ...verse, chapter: c })
  }

  function updateVerseStart(n: number) {
    const start = Math.max(1, Number.isFinite(n) ? n : 1)
    const end = Math.max(start, verse.verseEnd)
    onChange({ ...verse, verseStart: start, verseEnd: end })
  }

  function updateVerseEnd(n: number) {
    const end = Math.max(verse.verseStart, Number.isFinite(n) ? n : verse.verseStart)
    onChange({ ...verse, verseEnd: end })
  }

  return (
    <div className="bg-[#0F141A] border border-[#2A313B] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#F37E20]/10 text-[#F37E20] text-xs font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-sm text-white/80 font-medium">
            {formatVerseReference({
              bookSlug: verse.bookSlug,
              chapter: verse.chapter,
              verseStart: verse.verseStart,
              verseEnd: verse.verseEnd,
            })}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all"
          aria-label="Remover versículo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr] gap-3">
        <div>
          <label htmlFor={`${rowId}-book`} className="block text-xs text-white/50 mb-1">Livro</label>
          <select
            id={`${rowId}-book`}
            value={verse.bookSlug}
            onChange={(e) => updateBook(e.target.value)}
            className={brandInputClass}
          >
            <optgroup label="Antigo Testamento">
              {BIBLE_BOOKS.filter((b) => b.testament === 'old').map((b) => (
                <option key={b.slug} value={b.slug}>{b.name}</option>
              ))}
            </optgroup>
            <optgroup label="Novo Testamento">
              {BIBLE_BOOKS.filter((b) => b.testament === 'new').map((b) => (
                <option key={b.slug} value={b.slug}>{b.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
        <div>
          <label htmlFor={`${rowId}-chapter`} className="block text-xs text-white/50 mb-1">Capítulo</label>
          <input
            id={`${rowId}-chapter`}
            type="number"
            min={1}
            max={maxChapter}
            value={verse.chapter}
            onChange={(e) => updateChapter(parseInt(e.target.value, 10))}
            className={brandInputClass}
          />
        </div>
        <div>
          <label htmlFor={`${rowId}-verseStart`} className="block text-xs text-white/50 mb-1">Verso inicial</label>
          <input
            id={`${rowId}-verseStart`}
            type="number"
            min={1}
            value={verse.verseStart}
            onChange={(e) => updateVerseStart(parseInt(e.target.value, 10))}
            className={brandInputClass}
          />
        </div>
        <div>
          <label htmlFor={`${rowId}-verseEnd`} className="block text-xs text-white/50 mb-1">Verso final</label>
          <input
            id={`${rowId}-verseEnd`}
            type="number"
            min={verse.verseStart}
            value={verse.verseEnd}
            onChange={(e) => updateVerseEnd(parseInt(e.target.value, 10))}
            className={brandInputClass}
          />
        </div>
      </div>
    </div>
  )
}

export function VersesSection({
  verses,
  setVerses,
}: {
  verses: VerseRef[]
  setVerses: React.Dispatch<React.SetStateAction<VerseRef[]>>
}) {
  return (
    <SectionCard
      badge="B"
      title="Versículos bíblicos"
      subtitle="Referências estruturadas. O aluno escolhe a tradução (Grego/Hebraico só ficam visíveis no testamento correspondente)."
    >
      <div className="space-y-3">
        {verses.length === 0 && (
          <p className="text-sm text-white/40 italic">
            Nenhum versículo vinculado. Use o botão abaixo para adicionar.
          </p>
        )}
        {verses.map((v, i) => (
          <VerseRow
            key={v.id}
            verse={v}
            index={i}
            onChange={(updated) => setVerses((p) => p.map((x) => (x.id === v.id ? updated : x)))}
            onRemove={() => setVerses((p) => p.filter((x) => x.id !== v.id))}
          />
        ))}

        <button
          type="button"
          onClick={() => setVerses((p) => [...p, emptyVerseRef()])}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#2A313B] text-white/40 hover:border-[#F37E20]/40 hover:text-[#F37E20] text-sm font-medium transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Adicionar versículo
        </button>
      </div>
    </SectionCard>
  )
}
