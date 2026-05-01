import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id, Doc } from '@convex/_generated/dataModel'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { brandInputClass, brandPanelClass, brandPrimaryButtonClass, brandSecondaryButtonClass, cn } from '@/lib/brand'
import { useCreatorId } from '@/lib/useCreatorId'
import { LessonDrawer } from '@/components/dashboard/criador/LessonDrawer'
import { DashboardPageShell, DashboardSectionLabel, DashboardStatusPill } from '@/components/dashboard/PageShell'
import { useDnDList } from '@/lib/useDnDList'

const dragHandleIcon = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
  </svg>
)

type DnDDragProps = {
  draggable: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

function LessonRow({
  lesson,
  courseId,
  creatorId,
  dndProps,
  isDragging,
  isOver,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onKey,
}: {
  lesson: Doc<'lessons'>
  courseId: string
  creatorId: string
  dndProps: DnDDragProps
  isDragging: boolean
  isOver: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
  onKey: (e: React.KeyboardEvent) => void
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
    <div
      {...dndProps}
      onKeyDown={onKey}
      tabIndex={0}
      aria-label={`Aula ${lesson.title}. Use Alt seta para cima e Alt seta para baixo para reordenar.`}
      className={cn(
        'group flex flex-col gap-3 rounded-[1.35rem] border bg-white/[0.03] px-4 py-4 transition-all duration-200 sm:flex-row sm:items-center sm:justify-between',
        isDragging
          ? 'border-[#F37E20]/50 opacity-50'
          : isOver
          ? 'border-[#F37E20]/60 bg-[#F37E20]/8'
          : 'border-white/8 hover:border-white/14',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          aria-hidden="true"
          title="Arraste para reordenar"
          className="flex h-9 w-7 flex-shrink-0 cursor-grab items-center justify-center rounded-lg text-white/30 transition-colors hover:text-white/72 active:cursor-grabbing"
        >
          {dragHandleIcon}
        </span>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-[#F37E20]/18 bg-[#F37E20]/10 text-[#F37E20]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{lesson.title}</p>
          <p className="mt-0.5 truncate text-xs text-white/38">{lesson.youtubeUrl}</p>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Mover aula para cima"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-white/56 transition-all hover:border-white/22 hover:bg-white/8 disabled:opacity-25"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Mover aula para baixo"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-white/56 transition-all hover:border-white/22 hover:bg-white/8 disabled:opacity-25"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
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

function LessonsList({
  moduleId,
  courseId,
  creatorId,
}: {
  moduleId: Id<'modules'>
  courseId: string
  creatorId: string
}) {
  const lessons = useQuery(api.lessons.listByModule, { moduleId, creatorId })
  const reorderLessons = useMutation(api.lessons.reorderInModule)

  const dnd = useDnDList(lessons ?? undefined, (orderedIds) => {
    reorderLessons({
      moduleId,
      creatorId,
      orderedIds: orderedIds as Id<'lessons'>[],
    }).catch(() => {
      /* erro silencioso, próxima query corrige */
    })
  })

  if (lessons === undefined) {
    return <div className="h-16 animate-pulse rounded-2xl bg-white/4" />
  }

  if (lessons.length === 0) {
    return (
      <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] px-5 py-5 text-sm leading-7 text-white/44">
        Nenhuma aula criada ainda. Use o botão acima para começar a estruturar este módulo.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {dnd.orderedItems.map((lesson, idx) => (
        <LessonRow
          key={lesson._id}
          lesson={lesson}
          courseId={courseId}
          creatorId={creatorId}
          dndProps={dnd.getItemProps(lesson._id)}
          isDragging={dnd.draggingId === lesson._id}
          isOver={dnd.overId === lesson._id}
          onMoveUp={() => dnd.moveUp(lesson._id)}
          onMoveDown={() => dnd.moveDown(lesson._id)}
          isFirst={idx === 0}
          isLast={idx === dnd.orderedItems.length - 1}
          onKey={dnd.getKeyHandler(lesson._id)}
        />
      ))}
    </div>
  )
}

function ModuleCard({
  mod,
  courseId,
  creatorId,
  onAddLesson,
  dndProps,
  isDragging,
  isOver,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onKey,
}: {
  mod: Doc<'modules'>
  courseId: string
  creatorId: string
  onAddLesson: (moduleId: Id<'modules'>, currentLessonCount: number) => void
  dndProps: DnDDragProps
  isDragging: boolean
  isOver: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
  onKey: (e: React.KeyboardEvent) => void
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
    <div
      {...dndProps}
      onKeyDown={onKey}
      tabIndex={0}
      aria-label={`Módulo ${mod.title}. Use Alt seta para cima e Alt seta para baixo para reordenar.`}
      className={cn(
        'p-6 transition-all',
        brandPanelClass,
        isDragging && 'opacity-50',
        isOver && 'ring-2 ring-[#F37E20]/50',
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            aria-hidden="true"
            title="Arraste para reordenar"
            className="mt-1 flex h-9 w-7 flex-shrink-0 cursor-grab items-center justify-center rounded-lg text-white/30 transition-colors hover:text-white/72 active:cursor-grabbing"
          >
            {dragHandleIcon}
          </span>
          <div className="min-w-0 flex-1">
            <DashboardSectionLabel>{mod.title}</DashboardSectionLabel>
            <p className="mt-2 text-sm leading-7 text-white/54">{lessons.length} aula(s) organizadas neste módulo.</p>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label="Mover módulo para cima"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-white/56 transition-all hover:border-white/22 hover:bg-white/8 disabled:opacity-25"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label="Mover módulo para baixo"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-white/56 transition-all hover:border-white/22 hover:bg-white/8 disabled:opacity-25"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
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

      {lessons.some((l) => !l.isPublished) && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-yellow-400/18 bg-yellow-400/8 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-xs leading-5 text-yellow-200">
            Aulas em <strong>Rascunho</strong> ficam ocultas para os alunos. Clique em <strong>Rascunho</strong> ao lado de cada aula para publicá-la.
          </p>
        </div>
      )}

      <div className="mt-5">
        <LessonsList moduleId={mod._id} courseId={courseId} creatorId={creatorId} />
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
  const publishWithLessons = useMutation(api.courses.publishWithLessons)
  const reorderModules = useMutation(api.modules.reorder)

  const moduleDnd = useDnDList(modules, (orderedIds) => {
    if (!creatorId || !courseId) return
    reorderModules({
      courseId: courseId as Id<'courses'>,
      creatorId,
      orderedIds: orderedIds as Id<'modules'>[],
    }).catch(() => {
      /* erro silencioso, próxima query corrige */
    })
  })

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
      if (!course.isPublished) {
        // Ao publicar: publica o curso e todas as aulas de uma vez
        await publishWithLessons({ id: courseId as Id<'courses'>, creatorId })
      } else {
        // Ao despublicar: só atualiza o curso
        await updateCourse({ id: courseId as Id<'courses'>, creatorId, isPublished: false })
      }
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
          {moduleDnd.orderedItems.map((module, idx) => (
            <motion.div key={module._id} variants={fadeUp}>
              <ModuleCard
                mod={module}
                courseId={courseId}
                creatorId={creatorId}
                onAddLesson={(moduleId, count) => {
                  setDrawerModuleId(moduleId)
                  setDrawerLessonOrder(count)
                }}
                dndProps={moduleDnd.getItemProps(module._id)}
                isDragging={moduleDnd.draggingId === module._id}
                isOver={moduleDnd.overId === module._id}
                onMoveUp={() => moduleDnd.moveUp(module._id)}
                onMoveDown={() => moduleDnd.moveDown(module._id)}
                isFirst={idx === 0}
                isLast={idx === moduleDnd.orderedItems.length - 1}
                onKey={moduleDnd.getKeyHandler(module._id)}
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
