import { useEffect, useId, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { brandInputClass, brandPanelClass, brandPrimaryButtonClass, brandSecondaryButtonClass, cn } from '@/lib/brand'
import { useCreatorId } from '@/lib/useCreatorId'
import { DashboardPageShell, DashboardSectionLabel, DashboardStatusPill } from '@/components/dashboard/PageShell'
import { InfoSection } from './editarAula/InfoSection'
import { VersesSection } from './editarAula/VersesSection'
import { MaterialsSection } from './editarAula/MaterialsSection'
import { QuizSection } from './editarAula/QuizSection'
import { PedagogicalSection } from './editarAula/PedagogicalSection'
import { MIN_QUIZ, uid } from './editarAula/helpers'
import type { EditarAulaBanner, QuizQuestion, VerseRef } from './editarAula/types'

export function EditarAulaPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const creatorId = useCreatorId()
  const formId = useId()

  const lesson = useQuery(
    api.lessons.getById,
    creatorId && lessonId ? { id: lessonId as Id<'lessons'>, creatorId } : 'skip'
  )
  const quiz = useQuery(
    api.quizzes.getByLesson,
    creatorId && lessonId ? { lessonId: lessonId as Id<'lessons'>, creatorId } : 'skip'
  )

  const updateLesson = useMutation(api.lessons.update)
  const upsertQuiz = useMutation(api.quizzes.upsert)

  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [verses, setVerses] = useState<VerseRef[]>([])
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [allowQuizRetry, setAllowQuizRetry] = useState(false)
  const [publishAtDate, setPublishAtDate] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [quizInitialized, setQuizInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [banner, setBanner] = useState<EditarAulaBanner>(null)

  useEffect(() => {
    if (lesson && !initialized) {
      // Hidrata o form da edição uma única vez quando a aula carrega.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(lesson.title)

      setVideoUrl(lesson.youtubeUrl)

      setDescription(lesson.description ?? '')

      setIsPublished(lesson.isPublished)

      setAllowQuizRetry(lesson.allowQuizRetry ?? false)
      if (typeof lesson.publishAt === 'number') {
        const d = new Date(lesson.publishAt)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        setPublishAtDate(`${yyyy}-${mm}-${dd}`)
      } else {
        setPublishAtDate('')
      }
      // Carrega versículos estruturados. Se a aula só tem o campo legado
      // (string[]), ignoramos na UI — aparecerão como "nenhum versículo"
      // e o criador pode adicionar estruturados agora.
      const existing = (lesson.versesRefs ?? []).map((v) => ({
        id: uid(),
        bookSlug: v.bookSlug,
        chapter: v.chapter,
        verseStart: v.verseStart,
        verseEnd: v.verseEnd,
        testament: v.testament,
      }))
      setVerses(existing)
      setInitialized(true)
    }
  }, [lesson, initialized])

  useEffect(() => {
    if (quiz && !quizInitialized) {
      // Hidrata as questões do quiz uma única vez quando o quiz carrega.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuestions(
        quiz.questions.map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          correctId: q.correctOptionId,
          explanation: q.explanation ?? '',
        }))
      )

      setQuizInitialized(true)
    }
  }, [quiz, quizInitialized])

  const hasQuiz = questions.length >= MIN_QUIZ
  const belowMin = questions.length > 0 && !hasQuiz
  const canSave = !belowMin && title.trim().length > 0 && videoUrl.trim().length > 0

  const saveDisabledReason = useMemo(() => {
    if (!title.trim()) return 'Adicione um título'
    if (!videoUrl.trim()) return 'Adicione a URL do vídeo'
    if (belowMin) return `Adicione pelo menos ${MIN_QUIZ} perguntas ao quiz`
    return ''
  }, [title, videoUrl, belowMin])

  async function handleSave() {
    if (!canSave || !creatorId || !lessonId || !courseId) return
    setSaving(true)
    setBanner(null)
    try {
      const versesRefs = verses.map((v) => ({
        bookSlug: v.bookSlug,
        chapter: v.chapter,
        verseStart: v.verseStart,
        verseEnd: v.verseEnd,
        testament: v.testament,
      }))

      let publishAtArg: number | null | undefined
      if (publishAtDate.trim()) {
        const ts = new Date(`${publishAtDate}T00:00:00`).getTime()
        publishAtArg = Number.isFinite(ts) ? ts : undefined
      } else {
        publishAtArg = null
      }

      await updateLesson({
        id: lessonId as Id<'lessons'>,
        creatorId,
        title: title.trim(),
        youtubeUrl: videoUrl.trim(),
        description: description.trim() || undefined,
        isPublished,
        hasMandatoryQuiz: hasQuiz,
        versesRefs: versesRefs.length > 0 ? versesRefs : undefined,
        allowQuizRetry: hasQuiz ? allowQuizRetry : false,
        publishAt: publishAtArg,
      })

      if (hasQuiz) {
        await upsertQuiz({
          lessonId: lessonId as Id<'lessons'>,
          courseId: courseId as Id<'courses'>,
          creatorId,
          questions: questions.map((q) => ({
            id: q.id,
            text: q.text,
            options: q.options,
            correctOptionId: q.correctId,
            explanation: q.explanation || undefined,
          })),
        })
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setBanner({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao salvar aula.' })
    } finally {
      setSaving(false)
    }
  }

  if (!creatorId || lesson === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
      </div>
    )
  }

  if (lesson === null) {
    return (
      <div className="px-6 py-20 text-center text-white/40">
        Aula não encontrada.{' '}
        <Link to={`/dashboard/cursos/${courseId}`} className="text-[#F2BD8A] underline underline-offset-2">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <DashboardPageShell
      eyebrow="Editor de aula"
      title={title || 'Nova aula'}
      description="Cinco seções: informações, versículos, materiais, quiz e configuração pedagógica."
      maxWidthClass="max-w-4xl"
      actions={
        <>
          <Link to={`/dashboard/cursos/${courseId}/modulos`} className={brandSecondaryButtonClass}>
            Voltar para módulos
          </Link>
          {lessonId && lessonId !== 'novo' ? (
            <Link
              to={`/dashboard/cursos/${courseId}/aula/${lessonId}/preview`}
              className={brandSecondaryButtonClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Preview
            </Link>
          ) : null}
          <button type="button" onClick={() => setIsPublished((p) => !p)}>
            <DashboardStatusPill tone={isPublished ? 'success' : 'neutral'}>
              {isPublished ? 'Publicada' : 'Rascunho'}
            </DashboardStatusPill>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !canSave}
            title={saveDisabledReason}
            className={brandPrimaryButtonClass}
          >
            {saving ? 'Salvando...' : saved ? 'Salvo' : 'Salvar aula'}
          </button>
        </>
      }
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        {banner && (
          <motion.div
            variants={fadeUp}
            role={banner.type === 'error' ? 'alert' : 'status'}
            aria-live={banner.type === 'error' ? 'assertive' : 'polite'}
            className={cn(
              'rounded-[1.3rem] border px-4 py-4 text-sm',
              banner.type === 'error'
                ? 'border-red-400/18 bg-red-400/8 text-red-200'
                : 'border-[#F37E20]/25 bg-[#F37E20]/8 text-[#F2BD8A]'
            )}
          >
            {banner.text}
          </motion.div>
        )}

        <motion.div variants={fadeUp}>
          <InfoSection
            title={title}
            setTitle={setTitle}
            url={videoUrl}
            setUrl={setVideoUrl}
            description={description}
            setDescription={setDescription}
            order={lesson.order}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <VersesSection verses={verses} setVerses={setVerses} />
        </motion.div>

        <motion.div variants={fadeUp}>
          <MaterialsSection
            lessonId={lessonId as Id<'lessons'>}
            creatorId={creatorId}
            setBanner={setBanner}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <QuizSection questions={questions} setQuestions={setQuestions} />
        </motion.div>

        <motion.div variants={fadeUp}>
          <PedagogicalSection
            allowQuizRetry={allowQuizRetry}
            setAllowQuizRetry={setAllowQuizRetry}
            hasQuiz={hasQuiz}
          />
        </motion.div>

        <motion.div variants={fadeUp} className={cn('space-y-4 p-6 sm:p-7', brandPanelClass)}>
          <DashboardSectionLabel>Agendamento (opcional)</DashboardSectionLabel>
          <p className="text-sm leading-6 text-white/60">
            Use em cursos publicados de forma incremental. Informe a data prevista de publicação para que os alunos vejam "Próxima aula em DD/MM" enquanto a aula ainda não está no ar. Não publica automaticamente, apenas comunica.
          </p>
          <div className="grid gap-3 sm:max-w-xs">
            <label htmlFor={`${formId}-publishAtDate`} className="text-sm font-medium text-white/72">Data prevista de publicação</label>
            <input
              id={`${formId}-publishAtDate`}
              type="date"
              value={publishAtDate}
              onChange={(event) => setPublishAtDate(event.target.value)}
              className={brandInputClass}
            />
            {publishAtDate && (
              <button
                type="button"
                onClick={() => setPublishAtDate('')}
                className="text-left text-xs text-white/50 underline underline-offset-2 hover:text-white/80"
              >
                Remover data prevista
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </DashboardPageShell>
  )
}
