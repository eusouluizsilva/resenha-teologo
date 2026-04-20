import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { brandInputClass, brandPanelClass, brandPrimaryButtonClass, brandSecondaryButtonClass, cn } from '@/lib/brand'
import { useCreatorId } from '@/lib/useCreatorId'
import { DashboardPageShell, DashboardSectionLabel, DashboardStatusPill } from '@/components/dashboard/PageShell'

// ─── Types ────────────────────────────────────────────────────────────────────

type QuizOption = { id: string; text: string }
type QuizQuestion = {
  id: string
  text: string
  options: QuizOption[]
  correctId: string
  explanation: string
}

type Material = {
  id: string
  name: string
  size: number
  type: string
  url: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return crypto.randomUUID()
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function fileIcon(type: string) {
  if (type.includes('pdf')) return 'PDF'
  if (type.includes('word') || type.includes('document')) return 'DOC'
  if (type.includes('presentation') || type.includes('powerpoint')) return 'PPT'
  if (type.includes('sheet') || type.includes('excel')) return 'XLS'
  return 'ARQ'
}

type VideoPlatform = 'youtube' | 'vimeo' | 'loom' | 'panda' | 'drive' | 'bunny' | 'unknown'

type VideoInfo = {
  platform: VideoPlatform
  embedUrl: string | null
  label: string
  color: string
}

function detectVideo(url: string): VideoInfo {
  if (!url) return { platform: 'unknown', embedUrl: null, label: '', color: '' }

  const yt = url.match(/(?:youtu\.be\/|[?&]v=|embed\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { platform: 'youtube', embedUrl: `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`, label: 'YouTube', color: '#FF0000' }

  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vi) return { platform: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vi[1]}`, label: 'Vimeo', color: '#1AB7EA' }

  const lo = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/)
  if (lo) return { platform: 'loom', embedUrl: `https://www.loom.com/embed/${lo[1]}`, label: 'Loom', color: '#625DF5' }

  if (url.includes('pandavideo.com') || url.includes('player-vz')) return { platform: 'panda', embedUrl: url.includes('embed') ? url : null, label: 'Panda Video', color: '#F37E20' }

  const gd = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (gd) return { platform: 'drive', embedUrl: `https://drive.google.com/file/d/${gd[1]}/preview`, label: 'Google Drive', color: '#4285F4' }

  if (url.includes('iframe.mediadelivery.net') || url.includes('bunnycdn.com')) return { platform: 'bunny', embedUrl: url, label: 'Bunny.net', color: '#FF6633' }

  return { platform: 'unknown', embedUrl: null, label: '', color: '' }
}

const PLATFORMS = [
  { name: 'YouTube', example: 'youtube.com/watch?v=...' },
  { name: 'Vimeo', example: 'vimeo.com/123456789' },
  { name: 'Loom', example: 'loom.com/share/...' },
  { name: 'Panda Video', example: 'pandavideo.com/...' },
  { name: 'Google Drive', example: 'drive.google.com/file/d/...' },
  { name: 'Bunny.net', example: 'iframe.mediadelivery.net/...' },
]

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className={cn('overflow-hidden', brandPanelClass)}>
      <div className="border-b border-white/8 px-6 py-4">
        <DashboardSectionLabel>{title}</DashboardSectionLabel>
        {subtitle && <p className="mt-2 text-sm leading-7 text-white/54">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

const inputCls = brandInputClass

// ─── Video Section ─────────────────────────────────────────────────────────────

function VideoSection({ url, setUrl, description, setDescription }: {
  url: string; setUrl: (v: string) => void
  description: string; setDescription: (v: string) => void
}) {
  const [showPlatforms, setShowPlatforms] = useState(false)
  const info = detectVideo(url)
  const hasEmbed = !!info.embedUrl

  return (
    <SectionCard title="Vídeo da aula" subtitle="Cole a URL de qualquer plataforma de vídeo compatível.">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-white/80">URL do vídeo</label>
            <button
              type="button"
              onClick={() => setShowPlatforms((p) => !p)}
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
                  {PLATFORMS.map((p) => (
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
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`${inputCls} ${info.platform !== 'unknown' && url ? 'pr-28' : ''}`}
            />
            {info.platform !== 'unknown' && url && (
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${info.color}25`, border: `1px solid ${info.color}40`, color: info.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: info.color }} />
                {info.label}
              </div>
            )}
          </div>

          {url && !hasEmbed && info.platform === 'unknown' && (
            <p className="text-xs text-amber-400/80 mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Plataforma nao reconhecida. Verifique se a URL esta correta.
            </p>
          )}
        </div>

        {hasEmbed && (
          <div className="aspect-video rounded-xl overflow-hidden bg-black border border-[#2A313B]">
            <iframe
              src={info.embedUrl!}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="Preview do video"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Descricao da aula
            <span className="ml-2 text-white/30 font-normal text-xs">Visivel abaixo do player</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Descreva o que o aluno vai aprender nesta aula..."
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>
    </SectionCard>
  )
}

// ─── Materials Section ─────────────────────────────────────────────────────────

function MaterialsSection({ materials, setMaterials }: {
  materials: Material[]
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = useCallback((files: FileList) => {
    const newMaterials: Material[] = Array.from(files).map((f) => ({
      id: uid(),
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
    }))
    setMaterials((p) => [...p, ...newMaterials])
  }, [setMaterials])

  return (
    <SectionCard title="Materiais de apoio" subtitle="Storage em preparação. Esta etapa será liberada junto com a persistência real dos arquivos.">
      <div className="space-y-3">
        {materials.map((m) => (
          <div key={m.id} className="flex items-center gap-3 p-3 bg-[#0F141A] border border-[#2A313B] rounded-lg group">
            <div className="w-10 h-10 rounded-lg bg-[#F37E20]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[#F37E20] text-xs font-bold">{fileIcon(m.type)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{m.name}</p>
              <p className="text-xs text-white/30">{formatBytes(m.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => setMaterials((p) => p.filter((x) => x.id !== m.id))}
              className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/5 opacity-0 group-hover:opacity-100 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-8 transition-all duration-200 ${
            dragging ? 'border-[#F37E20] bg-[#F37E20]/5' : 'border-[#2A313B] hover:border-[#F37E20]/40'
          }`}
        >
          <div className="p-2.5 rounded-xl bg-[#F37E20]/10">
            <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-sm text-white/60 font-medium">{dragging ? 'Solte os arquivos aqui' : 'Clique ou arraste arquivos'}</p>
          <p className="text-xs text-white/30">PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX e outros</p>
        </div>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) handleFiles(e.target.files) }} />
      </div>
    </SectionCard>
  )
}

// ─── Quiz Section ──────────────────────────────────────────────────────────────

const LETTERS = ['A', 'B', 'C', 'D']
const MIN_QUIZ = 5
const MAX_QUIZ = 20

function QuestionCard({ q, index, onChange, onDelete }: {
  q: QuizQuestion
  index: number
  onChange: (updated: QuizQuestion) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-[#0F141A] border border-[#2A313B] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setOpen((p) => !p)}>
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-[#F37E20]/10 text-[#F37E20] text-xs font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <p className="text-sm text-white truncate max-w-sm">
            {q.text || <span className="text-white/30 italic">Pergunta sem texto</span>}
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
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
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
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-[#2A313B] pt-4">
              <textarea
                value={q.text}
                onChange={(e) => onChange({ ...q, text: e.target.value })}
                rows={2}
                placeholder="Digite a pergunta..."
                className={`${inputCls} resize-none`}
              />
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onChange({ ...q, correctId: opt.id })}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        q.correctId === opt.id ? 'border-emerald-400 bg-emerald-400/20' : 'border-[#2A313B] hover:border-white/30'
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
                      onChange={(e) => onChange({ ...q, options: q.options.map((o) => o.id === opt.id ? { ...o, text: e.target.value } : o) })}
                      placeholder={`Alternativa ${LETTERS[i]}`}
                      className={`${inputCls} flex-1`}
                    />
                  </div>
                ))}
              </div>
              <textarea
                value={q.explanation}
                onChange={(e) => onChange({ ...q, explanation: e.target.value })}
                rows={2}
                placeholder="Explicacao da resposta correta (opcional)..."
                className={`${inputCls} resize-none`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function QuizSection({ questions, setQuestions }: {
  questions: QuizQuestion[]
  setQuestions: React.Dispatch<React.SetStateAction<QuizQuestion[]>>
}) {
  const canAdd = questions.length < MAX_QUIZ
  const belowMin = questions.length > 0 && questions.length < MIN_QUIZ

  return (
    <SectionCard
      title="Perguntas do quiz"
      subtitle={`Minimo ${MIN_QUIZ} perguntas, maximo ${MAX_QUIZ}. (${questions.length}/${MAX_QUIZ})`}
    >
      <div className="space-y-3">
        {belowMin && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm text-amber-400/80">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {`Faltam ${MIN_QUIZ - questions.length} pergunta${MIN_QUIZ - questions.length > 1 ? 's' : ''} para atingir o minimo.`}
          </div>
        )}

        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            q={q}
            index={i}
            onChange={(updated) => setQuestions((p) => p.map((x) => x.id === q.id ? updated : x))}
            onDelete={() => setQuestions((p) => p.filter((x) => x.id !== q.id))}
          />
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => setQuestions((p) => [...p, emptyQuestion()])}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#2A313B] text-white/40 hover:border-[#F37E20]/40 hover:text-[#F37E20] text-sm font-medium transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Adicionar pergunta {questions.length > 0 && `(${questions.length}/${MAX_QUIZ})`}
          </button>
        )}
      </div>
    </SectionCard>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function EditarAulaPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const creatorId = useCreatorId()

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
  const [materials, setMaterials] = useState<Material[]>([])
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (lesson && !initialized) {
      setTitle(lesson.title)
      setVideoUrl(lesson.youtubeUrl)
      setDescription(lesson.description ?? '')
      setIsPublished(lesson.isPublished)
      setInitialized(true)
    }
  }, [lesson, initialized])

  useEffect(() => {
    if (quiz && initialized) {
      setQuestions(
        quiz.questions.map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          correctId: q.correctOptionId,
          explanation: q.explanation ?? '',
        }))
      )
    }
  }, [quiz, initialized])

  const belowMin = questions.length > 0 && questions.length < MIN_QUIZ
  const canSave = !belowMin && title.trim().length > 0 && videoUrl.trim().length > 0

  async function handleSave() {
    if (!canSave || !creatorId || !lessonId) return
    if (materials.length > 0) {
      setError('Materiais de apoio ainda não podem ser salvos nesta versão. Remova os arquivos para continuar.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateLesson({
        id: lessonId as Id<'lessons'>,
        creatorId,
        title: title.trim(),
        youtubeUrl: videoUrl.trim(),
        description: description.trim() || undefined,
        isPublished,
        hasMandatoryQuiz: questions.length >= MIN_QUIZ,
      })

      if (questions.length >= MIN_QUIZ && courseId) {
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
      setError(err instanceof Error ? err.message : 'Erro ao salvar aula.')
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
        Aula nao encontrada.{' '}
        <Link to={`/dashboard/cursos/${courseId}`} className="text-[#F2BD8A] underline underline-offset-2">Voltar</Link>
      </div>
    )
  }

  return (
    <DashboardPageShell
      eyebrow="Editor de aula"
      title={title || 'Nova aula'}
      description="Vídeo, materiais e quiz agora vivem dentro de uma hierarquia visual mais clara, com foco em leitura, ritmo e continuidade de edição."
      maxWidthClass="max-w-4xl"
      actions={
        <>
          <Link to={`/dashboard/cursos/${courseId}/modulos`} className={brandSecondaryButtonClass}>
            Voltar para módulos
          </Link>
          <button type="button" onClick={() => setIsPublished((p) => !p)}>
            <DashboardStatusPill tone={isPublished ? 'success' : 'neutral'}>
              {isPublished ? 'Publicada' : 'Rascunho'}
            </DashboardStatusPill>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !canSave}
            title={!title.trim() ? 'Adicione um titulo' : !videoUrl.trim() ? 'Adicione a URL do video' : belowMin ? `Adicione pelo menos ${MIN_QUIZ} perguntas ao quiz` : ''}
            className={brandPrimaryButtonClass}
          >
            {saving ? 'Salvando...' : saved ? 'Salvo' : 'Salvar aula'}
          </button>
        </>
      }
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        {error && (
          <motion.div variants={fadeUp} className="rounded-[1.3rem] border border-red-400/18 bg-red-400/8 px-4 py-4 text-sm text-red-200">
            {error}
          </motion.div>
        )}

        <motion.div variants={fadeUp} className={cn('p-6', brandPanelClass)}>
          <DashboardSectionLabel>Título da aula</DashboardSectionLabel>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setSaved(false)
            }}
            placeholder="Título da aula"
            className={cn(brandInputClass, 'mt-4 font-display text-2xl font-bold')}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <VideoSection url={videoUrl} setUrl={setVideoUrl} description={description} setDescription={setDescription} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <MaterialsSection materials={materials} setMaterials={setMaterials} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <QuizSection questions={questions} setQuestions={setQuestions} />
        </motion.div>
      </motion.div>
    </DashboardPageShell>
  )
}
