import { useState, useRef, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { useCreatorId } from '@/lib/useCreatorId'

const categories = [
  'Teologia Sistemática', 'Hermenêutica', 'Antigo Testamento', 'Novo Testamento',
  'Teologia Histórica', 'Ética Cristã', 'Apologética', 'Missiologia',
  'Eclesiologia', 'Escatologia', 'Teologia Prática', 'Outro',
]

function ThumbnailUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => onChange(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [onChange])

  return (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-1.5">Thumbnail do curso</label>
      {value ? (
        <div className="relative rounded-xl overflow-hidden aspect-video bg-[#0F141A] border border-[#2A313B]">
          <img src={value} alt="Thumbnail" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
            <button type="button" onClick={() => inputRef.current?.click()} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
              Trocar
            </button>
            <button type="button" onClick={() => onChange('')} className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/40 backdrop-blur text-red-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all duration-200 ${dragging ? 'border-[#F37E20] bg-[#F37E20]/5' : 'border-[#2A313B] bg-[#0F141A] hover:border-[#F37E20]/40'}`}
        >
          <div className="p-3 rounded-xl bg-[#F37E20]/10">
            <svg className="w-6 h-6 text-[#F37E20]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white/70">{dragging ? 'Solte a imagem aqui' : 'Clique ou arraste uma imagem'}</p>
            <p className="text-xs text-white/30 mt-0.5">PNG, JPG ou WEBP. Proporção 16:9 recomendada.</p>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}

const inputCls = 'w-full bg-[#0F141A] border border-[#2A313B] rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F37E20]/50 transition-colors duration-200'

export function EditarInfoCursoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const creatorId = useCreatorId()

  const course = useQuery(
    api.courses.getById,
    id ? { id: id as Id<'courses'>, creatorId } : 'skip'
  )
  const updateCourse = useMutation(api.courses.update)

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [form, setForm] = useState<{
    title: string
    description: string
    category: string
    level: 'iniciante' | 'intermediario' | 'avancado'
    language: string
    tags: string
  } | null>(null)

  // Initialize form once course loads
  if (course && form === null) {
    setForm({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      language: course.language ?? 'Português',
      tags: course.tags?.join(', ') ?? '',
    })
    setThumbnail(course.thumbnail ?? '')
  }

  if (course === undefined) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#F37E20] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (course === null || !form) {
    return (
      <div className="p-8 text-center text-white/40">
        Curso não encontrado.{' '}
        <Link to="/dashboard/criador/cursos" className="text-[#F37E20] underline">Voltar</Link>
      </div>
    )
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((p) => p ? { ...p, [e.target.name]: e.target.value } : p)
    setSaved(false)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    if (!form.title.trim()) return setError('O título do curso é obrigatório.')
    if (!form.description.trim()) return setError('A descrição é obrigatória.')
    if (!form.category) return setError('Selecione uma categoria.')

    setLoading(true)
    try {
      await updateCourse({
        id: id as Id<'courses'>,
        creatorId,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        level: form.level,
        thumbnail: thumbnail || undefined,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        language: form.language,
      })
      navigate('/dashboard/criador/cursos')
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-2xl mx-auto">

        <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
          <Link to="/dashboard/criador/cursos" className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white font-display">Editar curso</h1>
            <p className="text-white/50 mt-0.5 text-sm">Altere as informações do curso</p>
          </div>
          <Link
            to={`/dashboard/criador/cursos/${id}/modulos`}
            className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white border border-[#2A313B] hover:border-[#F37E20]/30 px-4 py-2 rounded-lg transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
            Módulos e aulas
          </Link>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div variants={fadeUp} className="bg-[#151B23] border border-[#2A313B] rounded-xl p-6 space-y-5">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Informações principais</h2>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Título do curso <span className="text-[#F37E20]">*</span></label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="Ex: Introdução à Hermenêutica Bíblica" className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Descrição <span className="text-[#F37E20]">*</span></label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Descreva o que o aluno vai aprender..." className={`${inputCls} resize-none`} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Categoria <span className="text-[#F37E20]">*</span></label>
                <select name="category" value={form.category} onChange={handleChange} className={inputCls}>
                  <option value="">Selecione...</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Nível</label>
                <select name="level" value={form.level} onChange={handleChange} className={inputCls}>
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>
            </div>

            <ThumbnailUpload value={thumbnail ?? ''} onChange={setThumbnail} />

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Tags (separadas por vírgula)</label>
              <input name="tags" value={form.tags} onChange={handleChange} placeholder="Ex: Bíblia, Teologia, Interpretação" className={inputCls} />
            </div>
          </motion.div>

          {error && (
            <motion.div variants={fadeUp} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              {error}
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="flex items-center justify-between">
            <Link to={`/dashboard/criador/cursos/${id}/modulos`} className="flex items-center gap-2 text-sm text-[#F37E20] hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
              Ir para módulos e aulas
            </Link>
            <div className="flex items-center gap-3">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Salvo
                </span>
              )}
              <Link to="/dashboard/criador/cursos" className="px-5 py-2.5 rounded-lg border border-[#2A313B] text-white/60 hover:text-white text-sm font-medium transition-all duration-200">
                Cancelar
              </Link>
              <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#F37E20] hover:bg-[#e06e10] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors duration-200">
                {loading
                  ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                }
                {loading ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}
