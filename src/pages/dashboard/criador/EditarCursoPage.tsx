import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id, Doc } from '../../../../convex/_generated/dataModel'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { useCreatorId } from '@/lib/useCreatorId'
import { LessonDrawer } from '@/components/dashboard/criador/LessonDrawer'

// ─── LessonRow ────────────────────────────────────────────────────────────────

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
    <div className="flex items-center gap-3 px-4 py-3 bg-[#0F141A] rounded-lg border border-[#2A313B]/60 group">
      <div className="p-1.5 rounded bg-[#F37E20]/10 text-[#F37E20]">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{lesson.title}</p>
        <p className="text-xs text-white/30 truncate mt-0.5">{lesson.youtubeUrl}</p>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={togglePublish}
          className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
            lesson.isPublished
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-white/5 text-white/30 border-white/10 hover:border-emerald-500/20 hover:text-emerald-400'
          }`}
        >
          {lesson.isPublished ? 'Publicada' : 'Rascunho'}
        </button>
        <Link
          to={`/dashboard/cursos/${courseId}/aula/${lesson._id}`}
          className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── ModuleCard ───────────────────────────────────────────────────────────────

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
    <div className="bg-[#151B23] border border-[#2A313B] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A313B]">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-[#F37E20]/10 text-[#F37E20]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{mod.title}</h3>
            <p className="text-xs text-white/30">{lessons.length} aulas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddLesson(mod._id, lessons.length)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#F37E20] hover:text-white px-3 py-1.5 rounded-lg border border-[#F37E20]/30 hover:bg-[#F37E20] transition-all duration-200"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Aula
          </button>
          <button
            onClick={handleDeleteModule}
            disabled={deleting}
            className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {lessons.length === 0 ? (
          <p className="text-center text-xs text-white/25 py-4">
            Nenhuma aula. Clique em "Aula" para adicionar.
          </p>
        ) : (
          lessons.map((lesson) => (
            <LessonRow key={lesson._id} lesson={lesson} courseId={courseId} creatorId={creatorId} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── EditarCursoPage ──────────────────────────────────────────────────────────

export function EditarCursoPage() {
  const { id: courseId = '' } = useParams()
  const creatorId = useCreatorId()

  const course = useQuery(
    api.courses.getById,
    creatorId && courseId ? { id: courseId as Id<'courses'>, creatorId } : 'skip'
  )
  const modules = useQuery(
    api.modules.listByCourse,
    creatorId && courseId ? { courseId: courseId as Id<'courses'>, creatorId } : 'skip'
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

  if (!creatorId) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#F37E20]/30 border-t-[#F37E20] rounded-full animate-spin" />
      </div>
    )
  }

  if (course === undefined) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#F37E20]/30 border-t-[#F37E20] rounded-full animate-spin" />
      </div>
    )
  }

  if (course === null) {
    return (
      <div className="p-8 text-center text-white/40 mt-20">
        Curso não encontrado.
      </div>
    )
  }

  return (
    <div className="p-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto"
      >
        <motion.div variants={fadeUp} className="flex items-start justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={`/dashboard/cursos/${courseId}`}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white font-display line-clamp-1">{course.title}</h1>
              <p className="text-white/40 text-sm mt-0.5">
                {modules.length} módulos, {course.totalLessons} aulas
              </p>
            </div>
          </div>
          <button
            onClick={handlePublish}
            disabled={saving}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
              course.isPublished
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-[#F37E20] hover:bg-[#e06e10] text-white'
            }`}
          >
            {saving ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : course.isPublished ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            )}
            {course.isPublished ? 'Publicado' : 'Publicar curso'}
          </button>
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-4">
          {modules.map((mod) => (
            <ModuleCard
              key={mod._id}
              mod={mod}
              courseId={courseId}
              creatorId={creatorId}
              onAddLesson={(moduleId, count) => { setDrawerModuleId(moduleId); setDrawerLessonOrder(count) }}
            />
          ))}

          {addingModule ? (
            <div className="bg-[#151B23] border border-[#F37E20]/30 rounded-xl p-4 flex items-center gap-3">
              <input
                autoFocus
                type="text"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addModule()
                  if (e.key === 'Escape') setAddingModule(false)
                }}
                placeholder="Nome do módulo..."
                className="flex-1 bg-[#0F141A] border border-[#2A313B] rounded-lg px-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F37E20]/50 transition-colors"
              />
              <button
                onClick={addModule}
                disabled={addingModulePending}
                className="px-4 py-2 bg-[#F37E20] hover:bg-[#e06e10] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {addingModulePending ? 'Salvando...' : 'Adicionar'}
              </button>
              <button
                onClick={() => setAddingModule(false)}
                className="px-3 py-2 border border-[#2A313B] text-white/50 hover:text-white text-sm rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingModule(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-[#2A313B] text-white/40 hover:border-[#F37E20]/40 hover:text-[#F37E20] text-sm font-medium transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Adicionar módulo
            </button>
          )}
        </motion.div>
      </motion.div>

      <LessonDrawer
        open={drawerModuleId !== null}
        onClose={() => setDrawerModuleId(null)}
        moduleId={drawerModuleId}
        courseId={courseId as Id<'courses'>}
        creatorId={creatorId}
        lessonOrder={drawerLessonOrder}
      />
    </div>
  )
}
