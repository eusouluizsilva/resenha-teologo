import { useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { brandPrimaryButtonClass, cn } from '@/lib/brand'

// Modal de avaliacao pos-conclusao do curso. Aparece para o aluno quando
// o certificado e emitido e ainda nao avaliou. Cinco estrelas obrigatorias,
// comentario opcional. Pode ser dispensado e reaberto via botao na pagina
// do curso. Edita a avaliacao existente quando o aluno reabre.

interface CourseRatingModalProps {
  open: boolean
  onClose: () => void
  courseId: Id<'courses'>
  courseTitle: string
  initialStars?: number | null
  initialReview?: string | null
}

export function AvaliacaoCursoModal({
  open,
  onClose,
  courseId,
  courseTitle,
  initialStars,
  initialReview,
}: CourseRatingModalProps) {
  const [stars, setStars] = useState<number>(initialStars ?? 0)
  const [hover, setHover] = useState<number>(0)
  const [review, setReview] = useState<string>(initialReview ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rateCourse = useMutation(api.student.rateCourse)

  useEffect(() => {
    if (open) {
      // Reseta o formulário sempre que o modal abre, refletindo props atuais.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStars(initialStars ?? 0)
       
      setReview(initialReview ?? '')
       
      setError(null)
    }
  }, [open, initialStars, initialReview])

  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  async function handleSubmit() {
    if (stars < 1 || stars > 5) {
      setError('Escolha de 1 a 5 estrelas.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await rateCourse({ courseId, stars, review: review.trim() || undefined })
      onClose()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao enviar avaliação.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const display = hover || stars

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Avaliar curso ${courseTitle}`}
      className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-8"
    >
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#151B23] shadow-[0_60px_180px_rgba(0,0,0,0.6)]">
        <div className="px-6 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F2BD8A]">
            Avalie o curso
          </p>
          <h2 className="mt-2 font-display text-xl font-bold leading-tight text-white">
            {courseTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/56">
            Sua avaliação ajuda outros alunos e o professor a melhorar.
          </p>
        </div>

        <div className="px-6 pt-5">
          <div
            className="flex items-center justify-center gap-2"
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onClick={() => setStars(n)}
                aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                className="rounded-md p-1 transition-transform hover:scale-110"
              >
                <svg
                  className={cn(
                    'h-9 w-9 transition-colors',
                    display >= n ? 'fill-[#F37E20] text-[#F37E20]' : 'fill-transparent text-white/24',
                  )}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-white/52">
            {display === 0
              ? 'Toque em uma estrela'
              : display === 5
              ? 'Excelente'
              : display === 4
              ? 'Muito bom'
              : display === 3
              ? 'Bom'
              : display === 2
              ? 'Regular'
              : 'Precisa melhorar'}
          </p>
        </div>

        <div className="px-6 pt-5">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-white/56" htmlFor="course-review">
            Comentário (opcional)
          </label>
          <textarea
            id="course-review"
            value={review}
            onChange={(e) => setReview(e.target.value.slice(0, 600))}
            rows={3}
            placeholder="O que mais te marcou neste curso?"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/36 transition-all focus:border-[#F37E20]/40 focus:bg-white/[0.05] focus:outline-none"
          />
          <p className="mt-1 text-right text-[10px] uppercase tracking-[0.16em] text-white/36">
            {review.length}/600
          </p>
        </div>

        {error ? (
          <p className="px-6 pt-2 text-center text-xs text-red-300">{error}</p>
        ) : null}

        <div className="flex items-center justify-end gap-3 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-2xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white/76 transition-all hover:border-white/20 hover:bg-white/8 disabled:opacity-40"
          >
            Mais tarde
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || stars < 1}
            className={cn(brandPrimaryButtonClass, 'px-5 py-2 text-sm disabled:opacity-50')}
          >
            {submitting ? 'Enviando...' : 'Enviar avaliação'}
          </button>
        </div>
      </div>
    </div>
  )
}
