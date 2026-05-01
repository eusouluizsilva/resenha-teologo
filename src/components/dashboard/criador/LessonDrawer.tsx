import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { brandInputClass, brandPanelClass, brandPrimaryButtonClass, brandSecondaryButtonClass, cn } from '@/lib/brand'
import { DashboardSectionLabel, DashboardStatusPill } from '@/components/dashboard/PageShell'
import { uuid } from '@/lib/uuid'

// Drawer para CRIAR uma nova aula. Campos avançados (versículos estruturados,
// materiais PDF/TXT, toggle de retry) ficam na EditarAulaPage, acessada após
// a criação. Aqui só pedimos o mínimo para inserir a aula no módulo.

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuizOption = { id: string; text: string }
export type QuizQuestion = {
  id: string
  text: string
  options: QuizOption[]
  correctId: string
  explanation: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return uuid() }

function detectVideo(url: string) {
  if (!url) return { embedUrl: null, label: '', color: '' }
  const yt = url.match(/(?:youtu\.be\/|[?&]v=|embed\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { embedUrl: `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`, label: 'YouTube', color: '#FF0000' }
  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vi) return { embedUrl: `https://player.vimeo.com/video/${vi[1]}`, label: 'Vimeo', color: '#1AB7EA' }
  const lo = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/)
  if (lo) return { embedUrl: `https://www.loom.com/embed/${lo[1]}`, label: 'Loom', color: '#625DF5' }
  const gd = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (gd) return { embedUrl: `https://drive.google.com/file/d/${gd[1]}/preview`, label: 'Google Drive', color: '#4285F4' }
  if (url.includes('pandavideo')) return { embedUrl: url.includes('embed') ? url : null, label: 'Panda Video', color: '#F37E20' }
  if (url.includes('mediadelivery.net') || url.includes('bunnycdn')) return { embedUrl: url, label: 'Bunny.net', color: '#FF6633' }
  return { embedUrl: null, label: '', color: '' }
}

function emptyQuestion(): QuizQuestion {
  return {
    id: uid(),
    text: '',
    options: [
      { id: uid(), text: '' },
      { id: uid(), text: '' },
      { id: uid(), text: '' },
      { id: uid(), text: '' },
    ],
    correctId: '',
    explanation: '',
  }
}

const inputCls = brandInputClass
const LETTERS = ['A', 'B', 'C', 'D']
const MIN_QUIZ = 5
const MAX_QUIZ = 20
const PLATFORMS = [
  { name: 'YouTube', example: 'youtube.com/watch?v=...' },
  { name: 'Vimeo', example: 'vimeo.com/123456789' },
  { name: 'Loom', example: 'loom.com/share/...' },
  { name: 'Panda Video', example: 'pandavideo.com/...' },
  { name: 'Google Drive', example: 'drive.google.com/file/d/...' },
  { name: 'Bunny.net', example: 'iframe.mediadelivery.net/...' },
]

// ─── Video ────────────────────────────────────────────────────────────────────

function VideoSection({ url, setUrl, description, setDescription }: {
  url: string
  setUrl: (v: string) => void
  description: string
  setDescription: (v: string) => void
}) {
  const [showPlatforms, setShowPlatforms] = useState(false)
  const info = detectVideo(url)

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-white/80">URL do vídeo</label>
          <button
            type="button"
            onClick={() => setShowPlatforms(p => !p)}
            className="text-xs text-[#F37E20] hover:text-white transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            Plataformas suportadas
          </button>
        </div>
        <AnimatePresence>
          {showPlatforms && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden mb-3"
            >
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#0F141A] rounded-lg border border-[#2A313B]">
                {PLATFORMS.map(p => (
                  <div key={p.name} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F37E20] flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-white/70">{p.name}</p>
                      <p className="text-xs text-white/25">{p.example}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="relative">
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className={`${inputCls} ${info.label ? 'pr-32' : ''}`}
          />
          {info.label && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${info.color}25`, border: `1px solid ${info.color}40`, color: info.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: info.color }} />
              {info.label}
            </div>
          )}
        </div>
      </div>
      {info.embedUrl && (
        <div className="aspect-video rounded-xl overflow-hidden bg-black border border-[#2A313B]">
          <iframe
            src={info.embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title="Preview"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1.5">
          Descrição da aula{' '}
          <span className="text-white/30 font-normal text-xs">Visível abaixo do player</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Descreva o que o aluno vai aprender nesta aula..."
          className={`${inputCls} resize-none`}
        />
      </div>
    </div>
  )
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

function QuestionCard({ q, index, onChange, onDelete }: {
  q: QuizQuestion
  index: number
  onChange: (u: QuizQuestion) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-[#0F141A] border border-[#2A313B] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setOpen(p => !p)}>
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-[#F37E20]/10 text-[#F37E20] text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <p className="text-sm text-white truncate max-w-xs">
            {q.text || <span className="text-white/30 italic">Sem texto</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {q.correctId && (
            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
              Resposta definida
            </span>
          )}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-1 rounded text-white/20 hover:text-red-400 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <svg
            className={`w-4 h-4 text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-[#2A313B] pt-4 space-y-4">
              <textarea
                value={q.text}
                onChange={e => onChange({ ...q, text: e.target.value })}
                rows={2}
                placeholder="Texto da pergunta..."
                className={`${inputCls} resize-none`}
              />
              <div>
                <p className="text-xs font-medium text-white/40 mb-2">
                  Alternativas, clique no círculo para marcar a correta
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onChange({ ...q, correctId: opt.id })}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          q.correctId === opt.id
                            ? 'border-emerald-400 bg-emerald-400/20'
                            : 'border-[#2A313B] hover:border-white/30'
                        }`}
                      >
                        {q.correctId === opt.id ? (
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <span className="text-xs text-white/30 font-medium">{LETTERS[i]}</span>
                        )}
                      </button>
                      <input
                        value={opt.text}
                        onChange={e => onChange({ ...q, options: q.options.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o) })}
                        placeholder={`Alternativa ${LETTERS[i]}`}
                        className={`${inputCls} flex-1`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-white/40 mb-1.5">
                  Explicação da resposta correta{' '}
                  <span className="text-white/25 font-normal">(opcional)</span>
                </p>
                <textarea
                  value={q.explanation}
                  onChange={e => onChange({ ...q, explanation: e.target.value })}
                  rows={2}
                  placeholder="Explique por que esta é a resposta correta..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onClose: () => void
  moduleId: Id<'modules'> | null
  courseId: Id<'courses'>
  creatorId: string | null
  lessonOrder: number
}

export function LessonDrawer({ open, onClose, moduleId, courseId, creatorId, lessonOrder }: Props) {
  const createLesson = useMutation(api.lessons.create)
  const upsertQuiz = useMutation(api.quizzes.upsert)

  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function resetForm() {
    setTitle('')
    setVideoUrl('')
    setDescription('')
    setIsPublished(false)
    setQuestions([])
    setError('')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  const belowMin = questions.length > 0 && questions.length < MIN_QUIZ
  const canSave = !belowMin && title.trim().length > 0 && videoUrl.trim().length > 0

  async function handleSave() {
    if (!canSave || !moduleId || !creatorId) return
    setSaving(true)
    setError('')
    try {
      const lessonId = await createLesson({
        moduleId,
        courseId,
        creatorId,
        title: title.trim(),
        description: description.trim() || undefined,
        youtubeUrl: videoUrl.trim(),
        order: lessonOrder,
        hasMandatoryQuiz: questions.length >= MIN_QUIZ,
      })

      if (questions.length >= MIN_QUIZ) {
        await upsertQuiz({
          lessonId,
          courseId,
          creatorId,
          questions: questions.map(q => ({
            id: q.id,
            text: q.text,
            options: q.options,
            correctOptionId: q.correctId,
            explanation: q.explanation || undefined,
          })),
        })
      }

      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar aula.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-white/8 bg-[linear-gradient(180deg,rgba(13,18,24,0.98)_0%,rgba(10,14,20,0.98)_100%)] shadow-[0_30px_100px_rgba(0,0,0,0.32)]"
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-white/8 px-6 py-4">
              <div className="flex-1 mr-4">
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Título da aula..."
                  className="w-full bg-transparent font-display text-xl font-bold text-white placeholder-white/20 focus:outline-none"
                />
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/24">Nova aula</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button type="button" onClick={() => setIsPublished(p => !p)}>
                  <DashboardStatusPill tone={isPublished ? 'success' : 'neutral'}>
                    {isPublished ? 'Publicada' : 'Rascunho'}
                  </DashboardStatusPill>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave || saving}
                  title={
                    !title.trim()
                      ? 'Adicione um título'
                      : !videoUrl.trim()
                      ? 'Adicione a URL do vídeo'
                      : belowMin
                      ? `Adicione pelo menos ${MIN_QUIZ} perguntas ao quiz`
                      : ''
                  }
                  className={brandPrimaryButtonClass}
                >
                  {saving ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  )}
                  {saving ? 'Salvando...' : 'Salvar aula'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className={brandSecondaryButtonClass}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div className="mx-6 mt-4 rounded-[1.3rem] border border-red-400/18 bg-red-400/8 px-4 py-4 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="mx-6 mt-4 rounded-[1.1rem] border border-[#F37E20]/20 bg-[#F37E20]/6 px-4 py-3 text-xs text-[#F2BD8A]">
              Após criar, use o editor completo da aula para adicionar versículos bíblicos estruturados,
              materiais em PDF/TXT e permitir refazer o quiz.
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">
                <div className={cn('overflow-hidden', brandPanelClass)}>
                  <div className="border-b border-white/8 px-5 py-4">
                    <DashboardSectionLabel>Vídeo da aula</DashboardSectionLabel>
                    <p className="mt-2 text-sm leading-7 text-white/54">Cole a URL de qualquer plataforma compatível.</p>
                  </div>
                  <div className="p-5">
                    <VideoSection
                      url={videoUrl}
                      setUrl={setVideoUrl}
                      description={description}
                      setDescription={setDescription}
                    />
                  </div>
                </div>

                <div className={cn('overflow-hidden', brandPanelClass)}>
                  <div className="border-b border-white/8 px-5 py-4">
                    <DashboardSectionLabel>Perguntas do quiz</DashboardSectionLabel>
                    <p className="mt-2 text-sm leading-7 text-white/54">
                      Mínimo {MIN_QUIZ}, máximo {MAX_QUIZ} perguntas. ({questions.length}/{MAX_QUIZ})
                    </p>
                  </div>
                  <div className="p-5 space-y-3">
                    {belowMin && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm text-amber-400/80">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        {questions.length === 0
                          ? `Adicione pelo menos ${MIN_QUIZ} perguntas para ativar o quiz.`
                          : `Faltam ${MIN_QUIZ - questions.length} pergunta${MIN_QUIZ - questions.length > 1 ? 's' : ''} para atingir o mínimo.`
                        }
                      </div>
                    )}
                    {questions.length === 0 && !belowMin && (
                      <p className="text-center text-sm text-white/25 py-4">
                        Nenhuma pergunta adicionada. O quiz é opcional.
                      </p>
                    )}
                    {questions.map((q, i) => (
                      <QuestionCard
                        key={q.id}
                        q={q}
                        index={i}
                        onChange={updated => setQuestions(p => p.map(x => x.id === q.id ? updated : x))}
                        onDelete={() => setQuestions(p => p.filter(x => x.id !== q.id))}
                      />
                    ))}
                    {questions.length < MAX_QUIZ && (
                      <button
                        type="button"
                        onClick={() => setQuestions(p => [...p, emptyQuestion()])}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#2A313B] text-white/40 hover:border-[#F37E20]/40 hover:text-[#F37E20] text-sm font-medium transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Adicionar pergunta {questions.length > 0 && `(${questions.length}/${MAX_QUIZ})`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
