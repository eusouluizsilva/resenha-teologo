import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { useCreatorId } from '@/lib/useCreatorId'

const categories = [
  'Teologia Sistemática', 'Hermenêutica', 'Antigo Testamento', 'Novo Testamento',
  'Teologia Histórica', 'Ética Cristã', 'Apologética', 'Missiologia',
  'Eclesiologia', 'Escatologia', 'Teologia Prática', 'Outro',
]

type FormData = {
  title: string
  description: string
  category: string
  level: 'iniciante' | 'intermediario' | 'avancado'
  language: string
  tags: string
}

export function NovoCursoPage() {
  const navigate = useNavigate()
  const creatorId = useCreatorId()
  const createCourse = useMutation(api.courses.create)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    level: 'iniciante',
    language: 'Português',
    tags: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return setError('O título do curso é obrigatório.')
    if (!form.description.trim()) return setError('A descrição é obrigatória.')
    if (!form.category) return setError('Selecione uma categoria.')

    if (!creatorId) return setError('Sessão expirada. Faça login novamente.')
    setLoading(true)
    try {
      const id = await createCourse({
        creatorId,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        level: form.level,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        language: form.language,
      })
      navigate(`/dashboard/cursos/${id}`)
    } catch {
      setError('Erro ao criar curso. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-2xl mx-auto"
      >
        <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
          <Link
            to="/dashboard/cursos"
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white font-display">Novo curso</h1>
            <p className="text-white/50 mt-0.5 text-sm">Preencha as informações básicas do curso</p>
          </div>
        </motion.div>

        <motion.form variants={fadeUp} onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#151B23] border border-[#2A313B] rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              Informações principais
            </h2>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Título do curso <span className="text-[#F37E20]">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ex: Introdução à Hermenêutica Bíblica"
                className="w-full bg-[#0F141A] border border-[#2A313B] rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F37E20]/50 transition-colors duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Descrição <span className="text-[#F37E20]">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Descreva o que o aluno vai aprender neste curso..."
                className="w-full bg-[#0F141A] border border-[#2A313B] rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F37E20]/50 transition-colors duration-200 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">
                  Categoria <span className="text-[#F37E20]">*</span>
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full bg-[#0F141A] border border-[#2A313B] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#F37E20]/50 transition-colors duration-200"
                >
                  <option value="">Selecione...</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Nível</label>
                <select
                  name="level"
                  value={form.level}
                  onChange={handleChange}
                  className="w-full bg-[#0F141A] border border-[#2A313B] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#F37E20]/50 transition-colors duration-200"
                >
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-[#2A313B] bg-[#0F141A] px-5 py-4">
              <p className="text-sm font-medium text-white/60">Capa do curso</p>
              <p className="mt-1 text-xs text-white/35">Definida automaticamente a partir do thumbnail do primeiro vídeo adicionado.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="Ex: Bíblia, Teologia, Interpretação"
                className="w-full bg-[#0F141A] border border-[#2A313B] rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F37E20]/50 transition-colors duration-200"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 justify-end">
            <Link
              to="/dashboard/cursos"
              className="px-5 py-2.5 rounded-lg border border-[#2A313B] text-white/60 hover:text-white text-sm font-medium transition-all duration-200"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#F37E20] hover:bg-[#e06e10] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors duration-200"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Criando...
                </>
              ) : (
                'Criar curso e adicionar aulas'
              )}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  )
}
