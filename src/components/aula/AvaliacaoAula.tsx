// Avaliação da aula em 5 estrelas. Aluno matriculado pode avaliar a aula
// específica (1 por par aluno+aula, sobrescreve em re-submit). Mostra média
// agregada e contagem de avaliações abaixo. Light theme (área do aluno).
//
// Diferente do AvaliacaoCursoModal (avalia o curso inteiro pós-conclusão),
// este widget é granular por aula e pode ser usado a qualquer momento.

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { cn } from '@/lib/brand'

type AvaliacaoAulaProps = {
  lessonId: Id<'lessons'>
}

export function AvaliacaoAula({ lessonId }: AvaliacaoAulaProps) {
  const myRating = useQuery(api.student.getMyLessonRating, { lessonId })
  const aggregate = useQuery(api.student.getLessonAggregateRating, { lessonId })
  const rateLesson = useMutation(api.student.rateLesson)

  const [hovered, setHovered] = useState<number | null>(null)
  const [pendingStars, setPendingStars] = useState<number | null>(null)
  // localReview = null significa "ainda não editado", então caímos para
  // myRating.review. Quando o user digita, virou string e ganhamos prioridade.
  const [localReview, setLocalReview] = useState<string | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const review = localReview ?? myRating?.review ?? ''
  const currentStars = pendingStars ?? myRating?.stars ?? 0
  const display = hovered ?? currentStars

  async function persist(stars: number, withReview?: string) {
    setError(null)
    setSaving(true)
    try {
      await rateLesson({
        lessonId,
        stars,
        review: withReview?.trim() || undefined,
      })
      setSubmitted(true)
      window.setTimeout(() => setSubmitted(false), 2400)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao salvar avaliação'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleClick(stars: number) {
    setPendingStars(stars)
    setShowReview(true)
    await persist(stars, review)
  }

  async function handleSaveReview() {
    if (!currentStars) return
    await persist(currentStars, review)
  }

  const avg = aggregate?.avg ?? 0
  const count = aggregate?.count ?? 0

  return (
    <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
            Avalie esta aula
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Sua nota ajuda o professor a melhorar o conteúdo.
          </p>
        </div>
        {count > 0 ? (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="h-4 w-4 text-[#F37E20]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <span className="font-semibold text-gray-700">{avg.toFixed(1)}</span>
            <span>({count} {count === 1 ? 'avaliação' : 'avaliações'})</span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-1" role="radiogroup" aria-label="Avaliação em estrelas">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= display
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={n === currentStars}
              aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(n)}
              onBlur={() => setHovered(null)}
              onClick={() => handleClick(n)}
              disabled={saving}
              className={cn(
                'rounded-md p-1 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F37E20]',
                saving ? 'opacity-60' : 'hover:scale-110',
              )}
            >
              <svg
                className={cn(
                  'h-7 w-7 transition-colors',
                  active ? 'text-[#F37E20]' : 'text-gray-300',
                )}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </button>
          )
        })}
        {myRating ? (
          <span className="ml-2 text-xs font-medium text-emerald-600">
            Você já avaliou esta aula{submitted ? ': salvo!' : ''}
          </span>
        ) : submitted ? (
          <span className="ml-2 text-xs font-medium text-emerald-600">Salvo!</span>
        ) : null}
      </div>

      {(showReview || myRating) && currentStars > 0 ? (
        <div className="mt-4">
          <label
            htmlFor={`review-${lessonId}`}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400"
          >
            Comentário (opcional)
          </label>
          <textarea
            id={`review-${lessonId}`}
            value={review}
            onChange={(e) => setLocalReview(e.target.value.slice(0, 600))}
            placeholder="O que mais te marcou nesta aula?"
            rows={3}
            className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F37E20] focus:outline-none focus:ring-2 focus:ring-[#F37E20]/20"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[10px] text-gray-400">{review.length}/600</p>
            <button
              type="button"
              onClick={handleSaveReview}
              disabled={saving || review.trim() === (myRating?.review ?? '').trim()}
              className="rounded-xl bg-[#F37E20] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#e06e10] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar comentário'}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs text-red-600" role="alert">{error}</p>
      ) : null}
    </section>
  )
}
