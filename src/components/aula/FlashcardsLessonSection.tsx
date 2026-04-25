// Secao de flashcards integrada na pagina de aula. Permite ao aluno:
// 1. Selecionar um deck existente (preferindo o vinculado ao curso atual)
// 2. Criar deck novo ja vinculado ao curso atual
// 3. Adicionar cards rapidos (frente/verso) ao deck ativo
// 4. Listar/editar/apagar cards do deck
// Para sessao de estudo (SM-2), o link "Estudar agora" leva a /dashboard/flashcards
// que ja tem o modo study completo.

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { cn } from '@/lib/brand'

interface FlashcardsLessonSectionProps {
  courseId: Id<'courses'>
}

export function FlashcardsLessonSection({ courseId }: FlashcardsLessonSectionProps) {
  const decks = useQuery(api.flashcards.listMyDecks, {}) ?? undefined
  const [selectedDeckId, setSelectedDeckId] = useState<Id<'flashcardDecks'> | null>(null)
  const [showNewDeck, setShowNewDeck] = useState(false)
  const [newDeckTitle, setNewDeckTitle] = useState('')
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingCardId, setEditingCardId] = useState<Id<'flashcards'> | null>(null)
  const [editingFront, setEditingFront] = useState('')
  const [editingBack, setEditingBack] = useState('')

  const createDeck = useMutation(api.flashcards.createDeck)
  const deleteDeck = useMutation(api.flashcards.deleteDeck)
  const createCard = useMutation(api.flashcards.createCard)
  const updateCard = useMutation(api.flashcards.updateCard)
  const deleteCard = useMutation(api.flashcards.deleteCard)

  // Prefere automaticamente o deck vinculado ao curso atual.
  const sortedDecks = useMemo(() => {
    if (!decks) return []
    return [...decks].sort((a, b) => {
      const aMatch = a.courseId === courseId ? 0 : 1
      const bMatch = b.courseId === courseId ? 0 : 1
      if (aMatch !== bMatch) return aMatch - bMatch
      return (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)
    })
  }, [decks, courseId])

  // Deck efetivo: usa selecao explicita, ou cai no primeiro deck ordenado.
  // Derivar (em vez de setState dentro de useEffect) evita renders em cascata.
  const activeDeckId =
    selectedDeckId && sortedDecks.some((d) => d._id === selectedDeckId)
      ? selectedDeckId
      : (sortedDecks[0]?._id as Id<'flashcardDecks'> | undefined) ?? null
  const setActiveDeckId = setSelectedDeckId

  const cardsResult = useQuery(
    api.flashcards.listCardsInDeck,
    activeDeckId ? { deckId: activeDeckId } : 'skip',
  )
  const cards = cardsResult === undefined ? undefined : cardsResult.cards

  async function handleCreateDeck() {
    const title = newDeckTitle.trim()
    if (!title) return
    setBusy(true)
    setError(null)
    try {
      const id = await createDeck({ title, courseId })
      setActiveDeckId(id as Id<'flashcardDecks'>)
      setNewDeckTitle('')
      setShowNewDeck(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível criar o deck.')
    } finally {
      setBusy(false)
    }
  }

  async function handleAddCard() {
    if (!activeDeckId) return
    const f = front.trim()
    const b = back.trim()
    if (!f || !b) {
      setError('Preencha frente e verso.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await createCard({ deckId: activeDeckId, front: f, back: b })
      setFront('')
      setBack('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível adicionar.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteDeck(deckId: Id<'flashcardDecks'>, title: string) {
    if (!window.confirm(`Apagar o deck "${title}" e todos os cards?`)) return
    setBusy(true)
    setError(null)
    try {
      await deleteDeck({ id: deckId })
      setActiveDeckId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível apagar.')
    } finally {
      setBusy(false)
    }
  }

  function startEditingCard(c: { _id: Id<'flashcards'>; front: string; back: string }) {
    setEditingCardId(c._id)
    setEditingFront(c.front)
    setEditingBack(c.back)
  }

  async function commitEditCard() {
    if (!editingCardId) return
    const f = editingFront.trim()
    const b = editingBack.trim()
    if (!f || !b) {
      setEditingCardId(null)
      return
    }
    try {
      await updateCard({ id: editingCardId, front: f, back: b })
      setEditingCardId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    }
  }

  async function handleDeleteCard(cardId: Id<'flashcards'>) {
    if (!window.confirm('Apagar este card?')) return
    try {
      await deleteCard({ id: cardId })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível apagar.')
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="font-display text-lg font-bold text-gray-800">Flashcards</h2>
          <p className="text-xs text-gray-500">
            Crie cards de memorização ligados a este curso. Estude depois com revisão espaçada.
          </p>
        </div>
        <Link
          to="/dashboard/flashcards"
          className="text-xs font-semibold text-[#F37E20] hover:underline"
        >
          Estudar agora
        </Link>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
          {decks === undefined ? (
            <span className="text-xs text-gray-400">Carregando decks...</span>
          ) : sortedDecks.length === 0 && !showNewDeck ? (
            <span className="text-xs text-gray-500">Nenhum deck ainda.</span>
          ) : (
            sortedDecks.map((d) => {
              const isActive = activeDeckId === d._id
              const isFromThisCourse = d.courseId === courseId
              return (
                <button
                  key={d._id}
                  type="button"
                  onClick={() => setActiveDeckId(d._id as Id<'flashcardDecks'>)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                    isActive
                      ? 'border-[#F37E20] bg-[#F37E20]/10 text-[#F37E20]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                  )}
                >
                  {d.title}
                  {isFromThisCourse && !isActive && (
                    <span className="ml-1.5 text-[10px] font-bold text-[#F37E20]">·</span>
                  )}
                </button>
              )
            })
          )}

          {showNewDeck ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                placeholder="Título do deck"
                maxLength={120}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateDeck()
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    setShowNewDeck(false)
                    setNewDeckTitle('')
                  }
                }}
                className="w-44 rounded-full border border-[#F37E20]/40 px-3 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
              />
              <button
                type="button"
                onClick={handleCreateDeck}
                disabled={busy}
                className="rounded-full bg-[#F37E20] px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
              >
                Criar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewDeck(true)}
              className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-semibold text-gray-500 hover:border-[#F37E20]/40 hover:text-[#F37E20]"
            >
              + Novo deck
            </button>
          )}
        </div>

        {activeDeckId && (
          <>
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Adicionar card
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <textarea
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Frente (pergunta, termo, versículo...)"
                  rows={2}
                  maxLength={500}
                  className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#F37E20] focus:outline-none focus:ring-1 focus:ring-[#F37E20]"
                />
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Verso (resposta, definição, contexto...)"
                  rows={2}
                  maxLength={2000}
                  className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#F37E20] focus:outline-none focus:ring-1 focus:ring-[#F37E20]"
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                  Cards entram na fila com revisão espaçada (SM-2 simplificado).
                </p>
                <button
                  type="button"
                  onClick={handleAddCard}
                  disabled={busy || !front.trim() || !back.trim()}
                  className="rounded-xl bg-[#F37E20] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[#e06e10] disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
            </div>

            <div className="px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Cards no deck
                </p>
                {sortedDecks.find((d) => d._id === activeDeckId)?.title && (
                  <button
                    type="button"
                    onClick={() => {
                      const deck = sortedDecks.find((d) => d._id === activeDeckId)
                      if (deck) handleDeleteDeck(deck._id as Id<'flashcardDecks'>, deck.title)
                    }}
                    className="text-[11px] font-semibold text-red-500 hover:underline"
                  >
                    Apagar deck
                  </button>
                )}
              </div>

              {cards === undefined ? (
                <p className="text-xs text-gray-400">Carregando cards...</p>
              ) : cards.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Nenhum card ainda. Adicione o primeiro acima.
                </p>
              ) : (
                <ul className="space-y-2">
                  {cards.map((c) => {
                    const isEditing = editingCardId === c._id
                    return (
                      <li
                        key={c._id}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingFront}
                              onChange={(e) => setEditingFront(e.target.value)}
                              rows={2}
                              className="w-full resize-y rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                            />
                            <textarea
                              value={editingBack}
                              onChange={(e) => setEditingBack(e.target.value)}
                              rows={2}
                              className="w-full resize-y rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={commitEditCard}
                                className="rounded-lg bg-[#F37E20] px-3 py-1 text-xs font-semibold text-white"
                              >
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCardId(null)}
                                className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-800">{c.front}</p>
                              <p className="mt-1 text-xs text-gray-600">{c.back}</p>
                            </div>
                            <div className="flex flex-shrink-0 gap-2">
                              <button
                                type="button"
                                onClick={() => startEditingCard(c)}
                                className="text-[11px] font-semibold text-gray-500 hover:text-[#F37E20]"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCard(c._id as Id<'flashcards'>)}
                                className="text-[11px] font-semibold text-red-400 hover:text-red-600"
                              >
                                Apagar
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
