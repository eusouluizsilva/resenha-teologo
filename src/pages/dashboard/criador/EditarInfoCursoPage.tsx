import { useState, useRef, useCallback, useEffect, useId } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { brandInputClass, brandPanelClass, brandPrimaryButtonClass, brandSecondaryButtonClass, cn } from '@/lib/brand'
import { useCreatorId } from '@/lib/useCreatorId'
import { useR2Upload } from '@/lib/r2Upload'
import { DashboardPageShell, DashboardSectionLabel } from '@/components/dashboard/PageShell'
import { TemplatePicker } from '@/components/criador/TemplatePicker'

const categories = [
  'Teologia Sistemática', 'Hermenêutica', 'Antigo Testamento', 'Novo Testamento',
  'Teologia Histórica', 'Ética Cristã', 'Apologética', 'Missiologia',
  'Eclesiologia', 'Escatologia', 'Teologia Prática', 'Outro',
]

const languages = [
  'Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Italiano',
  'Grego', 'Hebraico', 'Latim', 'Outro',
]

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024

function ThumbnailUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const { upload, uploading } = useR2Upload()

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Selecione um arquivo de imagem.')
      return
    }
    if (file.size > MAX_THUMBNAIL_BYTES) {
      setUploadError('Arquivo muito grande. Máximo 5 MB.')
      return
    }

    setUploadError('')

    try {
      const { publicUrl } = await upload(file, 'cover')
      onChange(publicUrl)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Erro ao enviar imagem.')
    }
  }, [onChange, upload])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className={cn('p-5', brandPanelClass)}>
      <DashboardSectionLabel>Thumbnail do curso</DashboardSectionLabel>
      <div className="mt-5">
        {value ? (
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#10161E]">
            <div className="aspect-video">
              <img src={value} alt="Thumbnail" className="h-full w-full object-cover" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/45 opacity-0 transition-opacity duration-200 hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/16"
              >
                Trocar
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="rounded-2xl border border-red-400/18 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100 transition-colors duration-200 hover:bg-red-400/16"
              >
                Remover
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={cn(
              'flex aspect-video cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.5rem] border-2 border-dashed transition-all duration-200',
              dragging
                ? 'border-[#F37E20]/45 bg-[#F37E20]/10'
                : 'border-white/10 bg-[#10161E] hover:border-[#F37E20]/24',
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F37E20]/18 bg-[#F37E20]/10 text-[#F37E20]">
              {uploading ? (
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white/72">
                {uploading ? 'Enviando...' : dragging ? 'Solte a imagem aqui' : 'Clique ou arraste uma imagem'}
              </p>
              <p className="mt-1 text-xs leading-6 text-white/32">PNG, JPG ou WEBP. Máximo 5 MB. Proporção 16:9 recomendada.</p>
            </div>
          </div>
        )}

        {uploadError ? <p className="mt-3 text-xs text-red-300">{uploadError}</p> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}

export function EditarInfoCursoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const creatorId = useCreatorId()
  const formId = useId()

  const course = useQuery(
    api.courses.getById,
    id && creatorId ? { id: id as Id<'courses'>, creatorId } : 'skip',
  )
  const updateCourse = useMutation(api.courses.update)
  const markComplete = useMutation(api.courses.markComplete)
  const markInProgress = useMutation(api.courses.markInProgress)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [form, setForm] = useState<{
    title: string
    description: string
    category: string
    level: 'iniciante' | 'intermediario' | 'avancado'
    language: string
    tags: string
    passingScore: number
    hasLiveStream: boolean
    liveStreamUrl: string
    institutionId: string
    visibility: 'public' | 'institution'
    isInProgress: boolean
    expectedTotalLessons: string
    nextLessonScheduleText: string
    faq: Array<{ question: string; answer: string }>
  } | null>(null)

  const myInstitutions = useQuery(api.institutions.listByUser, {})
  const adminInstitutions = (myInstitutions ?? []).filter(
    (i) => i.memberRole === 'dono' || i.memberRole === 'admin'
  )

  useEffect(() => {
    if (course && form === null) {
      // Hidrata o form da edição uma única vez quando o curso carrega.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        language: course.language ?? 'Português',
        tags: course.tags?.join(', ') ?? '',
        passingScore: Math.max(70, course.passingScore ?? 70),
        hasLiveStream: course.hasLiveStream ?? false,
        liveStreamUrl: course.liveStreamUrl ?? '',
        institutionId: (course.institutionId as string | undefined) ?? '',
        visibility: course.visibility ?? 'public',
        isInProgress: course.releaseStatus === 'in_progress',
        expectedTotalLessons:
          typeof course.expectedTotalLessons === 'number'
            ? String(course.expectedTotalLessons)
            : '',
        nextLessonScheduleText: course.nextLessonScheduleText ?? '',
        faq:
          (course as { faq?: Array<{ question: string; answer: string }> }).faq ?? [],
      })
      setThumbnail(course.thumbnail ?? '')
    }
  }, [course, form])

  if (course === undefined) {
    return (
      <div className="flex items-center justify-center px-6 py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
      </div>
    )
  }

  if (course === null || !form) {
    return (
      <div className="px-6 py-20 text-center text-white/40">
        Curso não encontrado.{' '}
        <Link to="/dashboard/cursos" className="text-[#F2BD8A] underline underline-offset-2">Voltar</Link>
      </div>
    )
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const target = event.target
    const name = target.name
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      const checked = target.checked
      setForm((current) => (current ? { ...current, [name]: checked } : current))
    } else if (name === 'passingScore') {
      const parsed = parseInt(target.value, 10)
      setForm((current) => (current ? { ...current, passingScore: Number.isFinite(parsed) ? parsed : 70 } : current))
    } else {
      const value = target.value
      setForm((current) => (current ? { ...current, [name]: value } : current))
    }
    setError('')
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form) return
    if (!form.title.trim()) return setError('O título do curso é obrigatório.')
    if (!form.description.trim()) return setError('A descrição é obrigatória.')
    if (!form.category) return setError('Selecione uma categoria.')
    if (form.passingScore < 70 || form.passingScore > 100) {
      return setError('A nota mínima deve estar entre 70 e 100.')
    }
    if (form.hasLiveStream && form.liveStreamUrl.trim()) {
      try {
        const url = new URL(form.liveStreamUrl.trim())
        if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('')
      } catch {
        return setError('Informe uma URL válida de transmissão ao vivo.')
      }
    }

    setLoading(true)

    try {
      if (!creatorId) return setError('Sessão expirada. Faça login novamente.')

      const expectedTotalParsed = form.expectedTotalLessons.trim()
        ? parseInt(form.expectedTotalLessons.trim(), 10)
        : undefined
      if (expectedTotalParsed !== undefined && (!Number.isFinite(expectedTotalParsed) || expectedTotalParsed < 1)) {
        return setError('Total previsto de aulas precisa ser um número maior que zero.')
      }

      const scheduleTextTrim = form.nextLessonScheduleText.trim()
      if (scheduleTextTrim.length > 200) {
        return setError('Texto do cronograma não pode passar de 200 caracteres.')
      }

      await updateCourse({
        id: id as Id<'courses'>,
        creatorId,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        level: form.level,
        thumbnail: thumbnail || undefined,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        language: form.language,
        passingScore: form.passingScore,
        hasLiveStream: form.hasLiveStream,
        liveStreamUrl: form.hasLiveStream ? form.liveStreamUrl.trim() || undefined : undefined,
        institutionId: form.institutionId ? (form.institutionId as Id<'institutions'>) : null,
        visibility: form.institutionId ? form.visibility : 'public',
        expectedTotalLessons: expectedTotalParsed,
        nextLessonScheduleText: scheduleTextTrim || undefined,
        faq: form.faq
          .map((entry) => ({
            question: entry.question.trim(),
            answer: entry.answer.trim(),
          }))
          .filter((entry) => entry.question && entry.answer),
      })

      const previousInProgress = course?.releaseStatus === 'in_progress'
      if (form.isInProgress !== previousInProgress) {
        if (form.isInProgress) {
          await markInProgress({
            id: id as Id<'courses'>,
            creatorId,
            expectedTotalLessons: expectedTotalParsed,
            nextLessonScheduleText: scheduleTextTrim || undefined,
          })
        } else {
          await markComplete({ id: id as Id<'courses'>, creatorId })
        }
      }

      navigate('/dashboard/cursos')
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardPageShell
      eyebrow="Configuração do curso"
      title="Editar curso"
      description="Ajuste identidade, contexto e apresentação do curso com uma camada visual mais consistente com a nova direção da plataforma."
      maxWidthClass="max-w-3xl"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/dashboard/cursos/${id}/coautores`} className={brandSecondaryButtonClass}>
            Co-autores
          </Link>
          <Link to={`/dashboard/cursos/${id}/modulos`} className={brandSecondaryButtonClass}>
            Módulos e aulas
          </Link>
        </div>
      }
    >
      <motion.form variants={staggerContainer} initial="hidden" animate="visible" onSubmit={handleSubmit} className="space-y-6">
        <motion.div variants={fadeUp} className={cn('space-y-6 p-6 sm:p-7', brandPanelClass)}>
          <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-2">
              <label htmlFor={`${formId}-title`} className="text-sm font-medium text-white/72">Título do curso</label>
              <input id={`${formId}-title`} name="title" value={form.title} onChange={handleChange} placeholder="Ex: Introdução à Hermenêutica Bíblica" className={brandInputClass} />
            </div>
            <div className="space-y-2">
              <label htmlFor={`${formId}-category`} className="text-sm font-medium text-white/72">Categoria</label>
              <select id={`${formId}-category`} name="category" value={form.category} onChange={handleChange} className={brandInputClass}>
                <option value="">Selecione</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[0.7fr_0.7fr_1.2fr]">
            <div className="space-y-2">
              <label htmlFor={`${formId}-level`} className="text-sm font-medium text-white/72">Nível</label>
              <select id={`${formId}-level`} name="level" value={form.level} onChange={handleChange} className={brandInputClass}>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor={`${formId}-language`} className="text-sm font-medium text-white/72">Idioma</label>
              <select id={`${formId}-language`} name="language" value={form.language} onChange={handleChange} className={brandInputClass}>
                {languages.map((language) => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor={`${formId}-tags`} className="text-sm font-medium text-white/72">Tags</label>
              <input id={`${formId}-tags`} name="tags" value={form.tags} onChange={handleChange} placeholder="Ex: Bíblia, Teologia, Interpretação" className={brandInputClass} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`${formId}-description`} className="text-sm font-medium text-white/72">Descrição</label>
              <TemplatePicker
                kind="course_description"
                currentValue={form.description}
                onApply={(body) => setForm((prev) => (prev ? { ...prev, description: body } : prev))}
              />
            </div>
            <textarea
              id={`${formId}-description`}
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Descreva o que o aluno vai aprender e o contexto do curso."
              className={cn(brandInputClass, 'resize-none')}
            />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className={cn('space-y-5 p-6 sm:p-7', brandPanelClass)}>
          <DashboardSectionLabel>Estado de produção</DashboardSectionLabel>
          <label className="flex items-start gap-3 text-sm text-white/72">
            <input
              type="checkbox"
              name="isInProgress"
              checked={form.isInProgress}
              onChange={handleChange}
              className="mt-1 h-4 w-4 accent-[#F37E20]"
            />
            <span>
              Curso em produção. Marque enquanto você ainda está publicando aulas. O certificado fica bloqueado mesmo que o aluno conclua todas as aulas já publicadas. Desmarque quando o curso estiver finalizado.
            </span>
          </label>
          <div className="space-y-2">
            <label htmlFor={`${formId}-expectedTotalLessons`} className="text-sm font-medium text-white/72">Total previsto de aulas (opcional)</label>
            <input
              id={`${formId}-expectedTotalLessons`}
              type="number"
              name="expectedTotalLessons"
              min={1}
              step={1}
              value={form.expectedTotalLessons}
              onChange={handleChange}
              placeholder="Ex: 24"
              className={brandInputClass}
            />
            <p className="text-xs leading-6 text-white/40">
              Quando preenchido, os alunos veem "X de Y aulas" no card do curso.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor={`${formId}-nextLessonScheduleText`} className="text-sm font-medium text-white/72">Cronograma das próximas aulas (opcional)</label>
            <textarea
              id={`${formId}-nextLessonScheduleText`}
              name="nextLessonScheduleText"
              value={form.nextLessonScheduleText}
              onChange={handleChange}
              maxLength={200}
              rows={2}
              placeholder="Ex: Toda quarta e sábado. Ou: Lançamentos quinzenais."
              className={cn(brandInputClass, 'resize-none')}
            />
            <p className="text-xs leading-6 text-white/40">
              Mostrado quando o aluno termina todas as aulas publicadas. Se vazio, exibimos a frase padrão "Você será notificado quando uma nova aula sair".
            </p>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className={cn('space-y-5 p-6 sm:p-7', brandPanelClass)}>
          <DashboardSectionLabel>Avaliação e certificado</DashboardSectionLabel>
          <div className="space-y-2">
            <label htmlFor={`${formId}-passingScore`} className="text-sm font-medium text-white/72">
              Nota mínima para emitir certificado (%)
            </label>
            <input
              id={`${formId}-passingScore`}
              type="number"
              name="passingScore"
              min={70}
              max={100}
              step={1}
              value={form.passingScore}
              onChange={handleChange}
              className={brandInputClass}
            />
            <p className="text-xs leading-6 text-white/40">
              A nota mínima nunca pode ser inferior a 70%. Aumente apenas se você quiser um curso mais rigoroso.
            </p>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className={cn('space-y-5 p-6 sm:p-7', brandPanelClass)}>
          <DashboardSectionLabel>Perguntas frequentes (opcional)</DashboardSectionLabel>
          <p className="text-xs leading-6 text-white/40">
            Adicione até 12 perguntas. Aparece como acordeon na página pública do curso e gera marcação FAQPage no Google.
          </p>
          {form.faq.map((entry, index) => (
            <div key={index} className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/52">
                  Pergunta {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) =>
                      f ? { ...f, faq: f.faq.filter((_, i) => i !== index) } : f,
                    )
                  }
                  className="text-xs font-semibold text-red-300 hover:text-red-200"
                >
                  Remover
                </button>
              </div>
              <input
                type="text"
                value={entry.question}
                maxLength={200}
                onChange={(e) =>
                  setForm((f) =>
                    f
                      ? {
                          ...f,
                          faq: f.faq.map((it, i) =>
                            i === index ? { ...it, question: e.target.value } : it,
                          ),
                        }
                      : f,
                  )
                }
                placeholder="Ex: Quanto tempo dura o curso?"
                className={brandInputClass}
              />
              <textarea
                value={entry.answer}
                maxLength={800}
                rows={3}
                onChange={(e) =>
                  setForm((f) =>
                    f
                      ? {
                          ...f,
                          faq: f.faq.map((it, i) =>
                            i === index ? { ...it, answer: e.target.value } : it,
                          ),
                        }
                      : f,
                  )
                }
                placeholder="Resposta clara, sem promessas exageradas."
                className={cn(brandInputClass, 'resize-none')}
              />
            </div>
          ))}
          {form.faq.length < 12 ? (
            <button
              type="button"
              onClick={() =>
                setForm((f) =>
                  f
                    ? { ...f, faq: [...f.faq, { question: '', answer: '' }] }
                    : f,
                )
              }
              className="rounded-2xl border border-white/10 bg-white/4 px-4 py-2 text-xs font-semibold text-white/72 transition-all hover:border-white/20 hover:bg-white/8"
            >
              {form.faq.length === 0 ? 'Adicionar primeira pergunta' : 'Adicionar pergunta'}
            </button>
          ) : null}
        </motion.div>

        {adminInstitutions.length > 0 && (
          <motion.div variants={fadeUp} className={cn('space-y-5 p-6 sm:p-7', brandPanelClass)}>
            <DashboardSectionLabel>Vínculo institucional (opcional)</DashboardSectionLabel>
            <div className="space-y-2">
              <label htmlFor={`${formId}-institutionId`} className="text-sm font-medium text-white/72">Instituição</label>
              <select
                id={`${formId}-institutionId`}
                name="institutionId"
                value={form.institutionId}
                onChange={handleChange}
                className={brandInputClass}
              >
                <option value="">Nenhuma, curso público</option>
                {adminInstitutions.map((inst) => (
                  <option key={inst._id} value={inst._id as unknown as string}>
                    {inst.name}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-6 text-white/40">
                Vincule este curso a uma instituição que você administra. Necessário apenas se quiser restringir o acesso aos membros.
              </p>
            </div>
            {form.institutionId && (
              <div className="space-y-2">
                <label htmlFor={`${formId}-visibility`} className="text-sm font-medium text-white/72">Visibilidade</label>
                <select
                  id={`${formId}-visibility`}
                  name="visibility"
                  value={form.visibility}
                  onChange={handleChange}
                  className={brandInputClass}
                >
                  <option value="public">Público, aparece no catálogo para todos</option>
                  <option value="institution">Privado, somente membros da instituição</option>
                </select>
                <p className="text-xs leading-6 text-white/40">
                  Em modo privado, o curso some do catálogo público e só pode ser matriculado por membros ativos da instituição.
                </p>
              </div>
            )}
          </motion.div>
        )}

        <motion.div variants={fadeUp} className={cn('space-y-5 p-6 sm:p-7', brandPanelClass)}>
          <DashboardSectionLabel>Transmissão ao vivo (opcional)</DashboardSectionLabel>
          <label className="flex items-start gap-3 text-sm text-white/72">
            <input
              type="checkbox"
              name="hasLiveStream"
              checked={form.hasLiveStream}
              onChange={handleChange}
              className="mt-1 h-4 w-4 accent-[#F37E20]"
            />
            <span>
              Este curso inclui transmissão ao vivo. Quando marcado, o aluno verá um aviso com o link da live.
            </span>
          </label>
          {form.hasLiveStream ? (
            <div className="space-y-2">
              <label htmlFor={`${formId}-liveStreamUrl`} className="text-sm font-medium text-white/72">URL da transmissão</label>
              <input
                id={`${formId}-liveStreamUrl`}
                name="liveStreamUrl"
                value={form.liveStreamUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/live/..."
                className={brandInputClass}
              />
              <p className="text-xs leading-6 text-white/40">
                Informe o link público da live (YouTube Live, Vimeo Live etc.).
              </p>
            </div>
          ) : null}
        </motion.div>

        <motion.div variants={fadeUp}>
          <ThumbnailUpload value={thumbnail ?? ''} onChange={setThumbnail} />
        </motion.div>

        {error ? (
          <motion.div variants={fadeUp} className="rounded-[1.3rem] border border-red-400/18 bg-red-400/8 px-4 py-4 text-sm text-red-200">
            {error}
          </motion.div>
        ) : null}

        <motion.div variants={fadeUp} className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Link to={`/dashboard/cursos/${id}/modulos`} className={brandSecondaryButtonClass}>
            Ir para módulos e aulas
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/dashboard/cursos" className={brandSecondaryButtonClass}>
              Cancelar
            </Link>
            <button type="submit" disabled={loading} className={brandPrimaryButtonClass}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </motion.div>
      </motion.form>
    </DashboardPageShell>
  )
}
