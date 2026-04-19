import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { LessonDrawer, type LessonData } from '@/components/dashboard/criador/LessonDrawer'

type Lesson = LessonData & { id: string; order: number }

type Module = {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

function LessonRow({ lesson, courseId, onDelete }: {
  lesson: Lesson
  courseId: string
  onEdit?: (l: Lesson) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#0F141A] rounded-lg border border-[#2A313B]/60 group">
      <div className="p-1.5 rounded bg-[#F37E20]/10 text-[#F37E20]">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{lesson.title || 'Sem título'}</p>
        <p className="text-xs text-white/30 truncate mt-0.5">{lesson.videoUrl || 'Sem URL'}</p>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {lesson.questions.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {lesson.questions.length} perguntas
          </span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          lesson.isPublished
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-white/5 text-white/30 border border-white/10'
        }`}>
          {lesson.isPublished ? 'Publicado' : 'Rascunho'}
        </span>
        <Link
          to={`/dashboard/criador/cursos/${courseId}/aula/${lesson.id}`}
          className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
        </Link>
        <button
          onClick={() => onDelete(lesson.id)}
          className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  )
}


export function EditarCursoPage() {
  const { id: courseId = '' } = useParams()
  const [modules, setModules] = useState<Module[]>([])
  const [drawer, setDrawer] = useState<{ open: boolean; moduleId: string }>({ open: false, moduleId: '' })
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [addingModule, setAddingModule] = useState(false)
  const [courseTitle] = useState('Meu curso')
  const [isPublished, setIsPublished] = useState(false)
  const [saving, setSaving] = useState(false)

  function addModule() {
    if (!newModuleTitle.trim()) return
    const mod: Module = {
      id: crypto.randomUUID(),
      title: newModuleTitle.trim(),
      order: modules.length + 1,
      lessons: [],
    }
    setModules((p) => [...p, mod])
    setNewModuleTitle('')
    setAddingModule(false)
  }

  function deleteModule(moduleId: string) {
    setModules((p) => p.filter((m) => m.id !== moduleId))
  }

  function addLesson(moduleId: string, data: LessonData) {
    setModules((p) =>
      p.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: [...m.lessons, { ...data, id: crypto.randomUUID(), order: m.lessons.length + 1 }] }
          : m
      )
    )
  }

  function deleteLesson(moduleId: string, lessonId: string) {
    setModules((p) =>
      p.map((m) =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
      )
    )
  }

  async function handlePublish() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setIsPublished((p) => !p)
    setSaving(false)
  }

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0)

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
              to={`/dashboard/criador/cursos/${courseId}`}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white font-display line-clamp-1">{courseTitle}</h1>
              <p className="text-white/40 text-sm mt-0.5">
                {modules.length} módulos, {totalLessons} aulas
              </p>
            </div>
          </div>
          <button
            onClick={handlePublish}
            disabled={saving}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
              isPublished
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-[#F37E20] hover:bg-[#e06e10] text-white'
            }`}
          >
            {saving ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : isPublished ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            )}
            {isPublished ? 'Publicado' : 'Publicar curso'}
          </button>
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-4">
          {modules.map((mod) => (
            <div key={mod.id} className="bg-[#151B23] border border-[#2A313B] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A313B]">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded bg-[#F37E20]/10 text-[#F37E20]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{mod.title}</h3>
                    <p className="text-xs text-white/30">{mod.lessons.length} aulas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDrawer({ open: true, moduleId: mod.id })}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#F37E20] hover:text-white px-3 py-1.5 rounded-lg border border-[#F37E20]/30 hover:bg-[#F37E20] transition-all duration-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Aula
                  </button>
                  <button
                    onClick={() => deleteModule(mod.id)}
                    className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2">
                {mod.lessons.length === 0 ? (
                  <p className="text-center text-xs text-white/25 py-4">
                    Nenhuma aula. Clique em &quot;Aula&quot; para adicionar.
                  </p>
                ) : (
                  mod.lessons.map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      courseId={courseId}
                      onEdit={() => setDrawer({ open: true, moduleId: mod.id })}
                      onDelete={(lessonId) => deleteLesson(mod.id, lessonId)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}

          {addingModule ? (
            <div className="bg-[#151B23] border border-[#F37E20]/30 rounded-xl p-4 flex items-center gap-3">
              <input
                autoFocus
                type="text"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addModule(); if (e.key === 'Escape') setAddingModule(false) }}
                placeholder="Nome do módulo..."
                className="flex-1 bg-[#0F141A] border border-[#2A313B] rounded-lg px-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F37E20]/50 transition-colors"
              />
              <button
                onClick={addModule}
                className="px-4 py-2 bg-[#F37E20] hover:bg-[#e06e10] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Adicionar
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
        open={drawer.open}
        onClose={() => setDrawer({ open: false, moduleId: '' })}
        onSave={(data) => addLesson(drawer.moduleId, data)}
      />
    </div>
  )
}
