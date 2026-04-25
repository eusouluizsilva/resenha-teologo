import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { DashboardPageShell, DashboardEmptyState } from '@/components/dashboard/PageShell'
import {
  brandInputClass,
  brandPanelClass,
  brandPanelSoftClass,
  brandPrimaryButtonClass,
  brandSecondaryButtonClass,
  cn,
} from '@/lib/brand'
import { fadeUp, staggerContainer } from '@/lib/motion'

type Deck = {
  _id: Id<'flashcardDecks'>
  title: string
  courseId?: Id<'courses'>
  courseTitle: string | null
  createdAt: number
  updatedAt?: number
  totalCards: number
  dueNow: number
}

type Card = {
  _id: Id<'flashcards'>
  deckId: Id<'flashcardDecks'>
  front: string
  back: string
  easiness: number
  intervalDays: number
  repetitions: number
  dueAt: number
  lastReviewedAt?: number
  createdAt: number
}

function formatRelativeDue(ts: number): string {
  const diff = ts - Date.now()
  if (diff <= 0) return 'pronto para revisar'
  const days = Math.round(diff / 86_400_000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'amanhã'
  if (days < 30) return `em ${days} dias`
  const months = Math.round(days / 30)
  return `em ${months} mês${months > 1 ? 'es' : ''}`
}

function DeckCard({
  deck,
  onStudy,
  onManage,
  onDelete,
  onRename,
}: {
  deck: Deck
  onStudy: () => void
  onManage: () => void
  onDelete: () => void
  onRename: () => void
}) {
  const hasDue = deck.dueNow > 0
  return (
    <div className={cn('flex flex-col gap-4 p-5', brandPanelSoftClass)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold text-white">{deck.title}</p>
          {deck.courseTitle && (
            <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-white/36">
              {deck.courseTitle}
            </p>
          )}
        </div>
        <span
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            hasDue
              ? 'border-[#F37E20]/30 bg-[#F37E20]/10 text-[#F2BD8A]'
              : 'border-white/10 bg-white/4 text-white/48',
          )}
        >
          {hasDue ? `${deck.dueNow} para hoje` : 'em dia'}
        </span>
      </div>

      <div className="flex items-baseline gap-3 text-xs text-white/48">
        <span>{deck.totalCards} {deck.totalCards === 1 ? 'card' : 'cards'}</span>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onStudy}
          disabled={deck.totalCards === 0}
          className={cn(brandPrimaryButtonClass, 'flex-1 disabled:opacity-40')}
        >
          {hasDue ? `Estudar ${deck.dueNow}` : 'Estudar'}
        </button>
        <button
          type="button"
          onClick={onManage}
          className="rounded-2xl border border-white/10 px-3 py-3 text-xs font-semibold text-white/78 hover:border-white/20 hover:text-white"
        >
          Cards
        </button>
        <button
          type="button"
          onClick={onRename}
          className="rounded-2xl border border-white/10 px-3 py-3 text-xs font-semibold text-white/62 hover:border-white/20 hover:text-white"
        >
          Renomear
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-2xl border border-white/10 px-3 py-3 text-xs font-semibold text-white/48 hover:border-red-400/30 hover:text-red-300"
        >
          Excluir
        </button>
      </div>
    </div>
  )
}

function CreateDeckForm({ onCreated, onCancel }: { onCreated: (id: Id<'flashcardDecks'>) => void; onCancel: () => void }) {
  const createDeck = useMutation(api.flashcards.createDeck)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || busy) return
    setBusy(true)
    try {
      const id = await createDeck({ title: title.trim() })
      setTitle('')
      onCreated(id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-3 p-5', brandPanelSoftClass)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">
        Novo deck
      </p>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ex. Teologia Paulina"
        className={brandInputClass}
        maxLength={120}
        autoFocus
      />
      <div className="flex gap-2">
        <button type="submit" disabled={!title.trim() || busy} className={brandPrimaryButtonClass}>
          {busy ? 'Criando...' : 'Criar deck'}
        </button>
        <button type="button" onClick={onCancel} className={brandSecondaryButtonClass}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

function DeckManager({
  deckId,
  onClose,
}: {
  deckId: Id<'flashcardDecks'>
  onClose: () => void
}) {
  const data = useQuery(api.flashcards.listCardsInDeck, { deckId })
  const createCard = useMutation(api.flashcards.createCard)
  const updateCard = useMutation(api.flashcards.updateCard)
  const deleteCard = useMutation(api.flashcards.deleteCard)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<Id<'flashcards'> | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!front.trim() || !back.trim() || busy) return
    setBusy(true)
    try {
      await createCard({ deckId, front: front.trim(), back: back.trim() })
      setFront('')
      setBack('')
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveEdit(id: Id<'flashcards'>) {
    if (!editFront.trim() || !editBack.trim()) return
    await updateCard({ id, front: editFront.trim(), back: editBack.trim() })
    setEditingId(null)
  }

  async function handleDelete(id: Id<'flashcards'>) {
    if (!confirm('Remover este card?')) return
    await deleteCard({ id })
  }

  if (data === undefined) {
    return (
      <div className={cn('animate-pulse p-6', brandPanelClass)}>
        <div className="h-4 w-32 rounded-full bg-white/8" />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-6 p-6', brandPanelClass)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">Deck</p>
          <h3 className="mt-1 font-display text-xl font-bold text-white">{data.deck.title}</h3>
          <p className="mt-0.5 text-sm text-white/48">
            {data.cards.length} {data.cards.length === 1 ? 'card' : 'cards'}
          </p>
        </div>
        <button type="button" onClick={onClose} className={brandSecondaryButtonClass}>
          Voltar
        </button>
      </div>

      <form onSubmit={handleCreate} className={cn('flex flex-col gap-3 p-4', brandPanelSoftClass)}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">
          Novo card
        </p>
        <input
          type="text"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="Pergunta (frente)"
          className={brandInputClass}
          maxLength={500}
        />
        <textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder="Resposta (verso)"
          rows={3}
          className={cn(brandInputClass, 'resize-none')}
          maxLength={2000}
        />
        <button type="submit" disabled={!front.trim() || !back.trim() || busy} className={brandPrimaryButtonClass}>
          {busy ? 'Adicionando...' : 'Adicionar card'}
        </button>
      </form>

      {data.cards.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/48">Este deck ainda não tem cards.</p>
      ) : (
        <ul className="space-y-3">
          {data.cards.map((card) => {
            const isEditing = editingId === card._id
            return (
              <li key={card._id} className={cn('p-4', brandPanelSoftClass)}>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editFront}
                      onChange={(e) => setEditFront(e.target.value)}
                      className={brandInputClass}
                      maxLength={500}
                    />
                    <textarea
                      value={editBack}
                      onChange={(e) => setEditBack(e.target.value)}
                      rows={3}
                      className={cn(brandInputClass, 'resize-none')}
                      maxLength={2000}
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleSaveEdit(card._id)} className={brandPrimaryButtonClass}>
                        Salvar
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className={brandSecondaryButtonClass}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-white/92">{card.front}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white/62">{card.back}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-white/36">
                      <span>Próxima revisão {formatRelativeDue(card.dueAt)}</span>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(card._id)
                            setEditFront(card.front)
                            setEditBack(card.back)
                          }}
                          className="font-semibold text-white/48 hover:text-[#F2BD8A]"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(card._id)}
                          className="font-semibold text-white/48 hover:text-red-300"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function StudySession({
  deckId,
  onExit,
}: {
  deckId: Id<'flashcardDecks'>
  onExit: () => void
}) {
  const dueCards = useQuery(api.flashcards.listDueCards, { deckId }) as Card[] | undefined
  const reviewCard = useMutation(api.flashcards.reviewCard)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const sessionCards = useMemo(() => dueCards ?? [], [dueCards])
  const current = sessionCards[index]

  async function handleGrade(grade: 0 | 1 | 2 | 3) {
    if (!current || busy) return
    setBusy(true)
    try {
      await reviewCard({ id: current._id, grade })
      const next = index + 1
      if (next >= sessionCards.length) {
        setDone(true)
      } else {
        setIndex(next)
        setRevealed(false)
      }
    } finally {
      setBusy(false)
    }
  }

  if (dueCards === undefined) {
    return (
      <div className={cn('animate-pulse p-6', brandPanelClass)}>
        <div className="h-4 w-40 rounded-full bg-white/8" />
      </div>
    )
  }

  if (sessionCards.length === 0 || done) {
    return (
      <div className={cn('flex flex-col items-center gap-5 p-10 text-center', brandPanelClass)}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F37E20]/10 text-[#F37E20]">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <p className="font-display text-xl font-bold text-white">
            {done ? 'Sessão concluída' : 'Nada para revisar agora'}
          </p>
          <p className="mt-1 text-sm text-white/48">
            {done
              ? 'Os cards foram reagendados conforme seu desempenho.'
              : 'Volte mais tarde ou adicione novos cards a este deck.'}
          </p>
        </div>
        <button type="button" onClick={onExit} className={brandSecondaryButtonClass}>
          Voltar aos decks
        </button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-5 p-6', brandPanelClass)}>
      <div className="flex items-center justify-between text-xs text-white/48">
        <span>Card {index + 1} de {sessionCards.length}</span>
        <button type="button" onClick={onExit} className="font-semibold text-white/62 hover:text-white">
          Sair
        </button>
      </div>

      <div className="flex min-h-[220px] flex-col justify-center gap-5 rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-8 text-center">
        <p className="font-display text-xl font-semibold text-white">{current.front}</p>
        {revealed && (
          <>
            <div className="mx-auto h-px w-16 bg-white/10" />
            <p className="whitespace-pre-wrap font-serif text-base leading-7 text-white/78">
              {current.back}
            </p>
          </>
        )}
      </div>

      {!revealed ? (
        <button type="button" onClick={() => setRevealed(true)} className={brandPrimaryButtonClass}>
          Revelar resposta
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => handleGrade(0)}
            disabled={busy}
            className="rounded-2xl border border-red-400/30 bg-red-400/10 px-3 py-3 text-sm font-semibold text-red-200 hover:bg-red-400/15 disabled:opacity-40"
          >
            Errei
          </button>
          <button
            type="button"
            onClick={() => handleGrade(1)}
            disabled={busy}
            className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-3 py-3 text-sm font-semibold text-amber-200 hover:bg-amber-400/15 disabled:opacity-40"
          >
            Difícil
          </button>
          <button
            type="button"
            onClick={() => handleGrade(2)}
            disabled={busy}
            className="rounded-2xl border border-sky-400/30 bg-sky-400/10 px-3 py-3 text-sm font-semibold text-sky-200 hover:bg-sky-400/15 disabled:opacity-40"
          >
            Bom
          </button>
          <button
            type="button"
            onClick={() => handleGrade(3)}
            disabled={busy}
            className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/15 disabled:opacity-40"
          >
            Fácil
          </button>
        </div>
      )}
    </div>
  )
}

type ViewMode = { kind: 'list' } | { kind: 'manage'; deckId: Id<'flashcardDecks'> } | { kind: 'study'; deckId: Id<'flashcardDecks'> }

export function FlashcardsPage() {
  const decks = useQuery(api.flashcards.listMyDecks, {}) as Deck[] | undefined
  const renameDeck = useMutation(api.flashcards.renameDeck)
  const deleteDeck = useMutation(api.flashcards.deleteDeck)
  const [view, setView] = useState<ViewMode>({ kind: 'list' })
  const [creating, setCreating] = useState(false)

  const isLoading = decks === undefined
  const list = decks ?? []

  async function handleRename(deck: Deck) {
    const next = prompt('Novo nome do deck:', deck.title)
    if (!next || !next.trim() || next.trim() === deck.title) return
    await renameDeck({ id: deck._id, title: next.trim() })
  }

  async function handleDelete(deck: Deck) {
    if (!confirm(`Excluir o deck "${deck.title}" e todos os seus cards?`)) return
    await deleteDeck({ id: deck._id })
  }

  if (view.kind === 'study') {
    return (
      <DashboardPageShell
        eyebrow="Flashcards"
        title="Sessão de revisão"
        description="Avalie cada card honestamente, a próxima revisão é calculada automaticamente."
        maxWidthClass="max-w-3xl"
      >
        <StudySession deckId={view.deckId} onExit={() => setView({ kind: 'list' })} />
      </DashboardPageShell>
    )
  }

  if (view.kind === 'manage') {
    return (
      <DashboardPageShell
        eyebrow="Flashcards"
        title="Gerenciar cards"
        description="Adicione, edite e remova cards deste deck."
        maxWidthClass="max-w-3xl"
      >
        <DeckManager deckId={view.deckId} onClose={() => setView({ kind: 'list' })} />
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell
      eyebrow="Aluno"
      title="Flashcards"
      description="Memorize conceitos teológicos com revisão espaçada. Crie decks por tema e revise quando a plataforma lembrar."
      maxWidthClass="max-w-6xl"
      actions={
        list.length > 0 && !creating ? (
          <button type="button" onClick={() => setCreating(true)} className={brandPrimaryButtonClass}>
            Novo deck
          </button>
        ) : null
      }
    >
      {isLoading ? (
        <div className={cn('animate-pulse p-6', brandPanelClass)}>
          <div className="h-4 w-32 rounded-full bg-white/8" />
        </div>
      ) : creating ? (
        <CreateDeckForm
          onCreated={(id) => {
            setCreating(false)
            setView({ kind: 'manage', deckId: id })
          }}
          onCancel={() => setCreating(false)}
        />
      ) : list.length === 0 ? (
        <DashboardEmptyState
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
            </svg>
          }
          title="Ainda sem decks"
          description="Decks ajudam a memorizar doutrinas, nomes bíblicos, datas e conceitos. Crie o primeiro e comece a revisar."
          action={
            <button type="button" onClick={() => setCreating(true)} className={brandPrimaryButtonClass}>
              Criar meu primeiro deck
            </button>
          }
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {list.map((deck) => (
            <motion.div key={deck._id} variants={fadeUp}>
              <DeckCard
                deck={deck}
                onStudy={() => setView({ kind: 'study', deckId: deck._id })}
                onManage={() => setView({ kind: 'manage', deckId: deck._id })}
                onRename={() => handleRename(deck)}
                onDelete={() => handleDelete(deck)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardPageShell>
  )
}
