import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id, Doc } from '../../../../convex/_generated/dataModel'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { brandInputClass, brandPanelClass, brandPrimaryButtonClass, brandSecondaryButtonClass, cn } from '@/lib/brand'
import { useCreatorId } from '@/lib/useCreatorId'
import { LessonDrawer } from '@/components/dashboard/criador/LessonDrawer'
import { DashboardPageShell, DashboardSectionLabel, DashboardStatusPill } from '@/components/dashboard/PageShell'

function LessonRow({
  lesson,
  courseId,
  creatorId,
}: {
  lesson: Doc<'lessons'>
  courseId: string
  creatorId: string
}) {
  const deleteLesson = useMutation(api.lessons.remove)
  const updateLesson = useMutation(api.lessons.update)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Excluir esta aula?')) return
    setDeleting(true)
    await deleteLesson({ id: lesson._id, creatorId }).catch(() => setDeleting(false))
  }

  async function togglePublish() {
    await updateLesson({ id: lesson._id, creatorId, isPublished: !lesson.isPublished })
  }

  return (
    <div className="group flex flex-col gap-4 rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-4 py-4 transition-all duration-200 hover:border-white/14 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#F37E20]/18 bg-[#F37E20]/10 text-[#F37E20]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{lesson.title}</p>
          <p className="mt-1 truncate text-sm text-white/38">{lesson.youtubeUrl}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={togglePublish}>
          <DashboardStatusPill tone={lesson.isPublished ? 'success' : 'neutral'}>
            {lesson.isPublished ? 'Publicada' : 'Rascunho'}
          </DashboardStatusPill>
        </button>
        <Link to={`/dashboard/cursos/${courseId}/aula/${lesson._id}`} className={brandSecondaryButtonClass}>
          Editar
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center justify-center rounded-2xl border border-red-400/18 bg-red-400/8 px-4 py-3 text-sm font-semibold text-red-100 transition-colors duration-200 hover:bg-red-400/12 disabled:opacity-50"
        >
          Excluir
        </button>
      </div>
    </div>
  )
}

function ModuleCard({
  mod,
  courseId,
  creatorId,
  onAddLesson,
}: {
  mod: Doc<'modules'>
  courseId: string
  creatorId: string
  onAddLesson: (moduleId: Id<'modules'>, currentLessonCount: number) => void
}) {
  const lessons = useQuery(api.lessons.listByModule, { moduleId: mod._id, creatorId }) ?? []
  const deleteModule = useMutation(api.modules.remove)
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteModule() {
    if (!confirm(`Excluir o módulo "${mod.title}" e todas as suas aulas?`)) return
    setDeleting(true)
    await deleteModule({ id: mod._id, creatorId }).catch(() => setDeleting(false))
  }

  return (
    <div className={cn('p-6', brandPanelClass)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <DashboardSectionLabel>{mod.title}</DashboardSectionLabel>
          <p className="mt-2 text-sm leading-7 text-white/54">{lessons.length} aula(s) organizadas neste módulo.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => onAddLesson(mod._id, lessons.length)} className={brandPrimaryButtonClass}>
            Adicionar aula
          </button>
          <button
            onClick={handleDeleteModule}
            disabled={deleting}
            className="inline-flex items-center justify-center rounded-2xl border border-red-400/18 bg-red-400/8 px-4 py-3 text-sm font-semibold text-red-100 transition-colors duration-200 hover:bg-red-400/12 disabled:opacity-50"
          >
            Excluir módulo
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {lessons.length === 0 ? (
          <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-5 py-5 text-sm leading-7 text-white/44">
            Nenhuma aula criada ainda. Use o botão acima para começar a estruturar este módulo.
          </div>
        ) : (
          lessons.map((lesson) => (
            <LessonRow key={lesson._id} lesson={lesson} courseId={courseId} creatorId={creatorId} />
          ))
        )}
      </div>
    </div>
  )
}

export function EditarCursoPage() {
  const { id: courseId = '' } = useParams()
  const creatorId = useCreatorId()

  const course = useQuery(
    api.courses.getById,
    creatorId && courseId ? { id: courseId as Id<'courses'>, creatorId } : 'skip',
  )
  const modules = useQuery(
    api.modules.listByCourse,
    creatorId && courseId ? { courseId: courseId as Id<'courses'>, creatorId } : 'skip',
  ) ?? []

  const createModule = useMutation(api.modules.create)
  const updateCourse = useMutation(api.courses.update)

  const [drawerModuleId, setDrawerModuleId] = useState<Id<'modules'> | null>(null)
  const [drawerLessonOrder, setDrawerLessonOrder] = useState(0)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [addingModule, setAddingModule] = useState(false)
  const [addingModulePending, setAddingModulePending] = useState(false)
  const [saving, setSaving] = useState(false)

  async function addModule() {
    if (!newModuleTitle.trim() || !creatorId) return
    setAddingModulePending(true)
    try {
      await createModule({
        courseId: courseId as Id<'courses'>,
        creatorId,
        title: newModuleTitle.trim(),
        order: modules.length + 1,
      })
      setNewModuleTitle('')
      setAddingModule(false)
    } finally {
      setAddingModulePending(false)
    }
  }

  async function handlePublish() {
    if (!creatorId || !course) return
    setSaving(true)
    try {
      await updateCourse({
        id: courseId as Id<'courses'>,
        creatorId,
        isPublished: !course.isPublished,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!creatorId || course === undefined) {
    return (
      <div className="flex items-center justify-center px-6 py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
      </div>
    )
  }

  if (course === null) {
    return (
      <div className="px-6 py-20 text-center text-white/40">
        Curso não encontrado.
      </div>
    )
  }

  return (
    <>
      <DashboardPageShell
        eyebrow="Estrutura do curso"
        title={course.title}
        description={`Organize módulos e aulas com uma apresentação mais clara, mais institucional e mais alinhada ao restante da plataforma. ${modules.length} módulo(s), ${course.totalLessons} aula(s).`}
        maxWidthClass="max-w-4xl"
        actions={
          <>
            <Link to={`/dashboard/cursos/${courseId}`} className={brandSecondaryButtonClass}>
              Informações do curso
            </Link>
            <button onClick={handlePublish} disabled={saving} className={course.isPublished ? brandSecondaryButtonClass : brandPrimaryButtonClass}>
              {saving ? 'Atualizando...' : course.isPublished ? 'Curso publicado' : 'Publicar curso'}
            </button>
          </>
        }
      >
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          {modules.map((module) => (
            <motion.div key={module._id} variants={fadeUp}>
              <ModuleCard
                mod={module}
                courseId={courseId}
                creatorId={creatorId}
                onAddLesson={(moduleId, count) => {
                  setDrawerModuleId(moduleId)
                  setDrawerLessonOrder(count)
                }}
              />
            </motion.div>
          ))}

          <motion.div variants={fadeUp} className={cn('p-6', brandPanelClass)}>
            <DashboardSectionLabel>Novo módulo</DashboardSectionLabel>
            {addingModule ? (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  autoFocus
                  type="text"
                  value={newModuleTitle}
                  onChange={(event) => setNewModuleTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') addModule()
                    if (event.key === 'Escape') setAddingModule(false)
                  }}
                  placeholder="Nome do módulo"
                  className={cn(brandInputClass, 'flex-1')}
                />
                <button onClick={addModule} disabled={addingModulePending} className={brandPrimaryButtonClass}>
                  {addingModulePending ? 'Salvando...' : 'Adicionar'}
                </button>
                <button onClick={() => setAddingModule(false)} className={brandSecondaryButtonClass}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm leading-7 text-white/50">
                  Estruture o curso em módulos para manter progressão clara, leitura melhor e navegação mais organizada.
                </p>
                <button onClick={() => setAddingModule(true)} className={cn('mt-4', brandPrimaryButtonClass)}>
                  Adicionar módulo
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </DashboardPageShell>

      <LessonDrawer
        open={drawerModuleId !== null}
        onClose={() => setDrawerModuleId(null)}
        moduleId={drawerModuleId}
        courseId={courseId as Id<'courses'>}
        creatorId={creatorId}
        lessonOrder={drawerLessonOrder}
      />
    </>
  )
}
