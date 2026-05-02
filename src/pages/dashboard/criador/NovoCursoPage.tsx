import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { brandInputClass, brandPanelClass, brandPrimaryButtonClass, brandSecondaryButtonClass, cn } from '@/lib/brand'
import { useCreatorId } from '@/lib/useCreatorId'
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

type FormData = {
  title: string
  description: string
  category: string
  level: 'iniciante' | 'intermediario' | 'avancado'
  language: string
  tags: string
  institutionId: string
  visibility: 'public' | 'institution'
}

export function NovoCursoPage() {
  const navigate = useNavigate()
  const creatorId = useCreatorId()
  const createCourse = useMutation(api.courses.create)
  const myInstitutions = useQuery(api.institutions.listByUser, {}) ?? []
  const adminInstitutions = myInstitutions.filter(
    (i) => i.memberRole === 'dono' || i.memberRole === 'admin'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    level: 'iniciante',
    language: 'Português',
    tags: '',
    institutionId: '',
    visibility: 'public',
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
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        language: form.language,
        institutionId: form.institutionId ? (form.institutionId as Id<'institutions'>) : undefined,
        visibility: form.institutionId ? form.visibility : undefined,
      })
      navigate(`/dashboard/cursos/${id}`)
    } catch {
      setError('Erro ao criar curso. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardPageShell
      eyebrow="Criação de curso"
      title="Novo curso"
      description="A estrutura continua objetiva, mas agora com mais hierarquia, contraste e sensação de produto premium."
      maxWidthClass="max-w-3xl"
      actions={
        <Link to="/dashboard/cursos" className={brandSecondaryButtonClass}>
          Voltar para cursos
        </Link>
      }
    >
      <motion.form variants={staggerContainer} initial="hidden" animate="visible" onSubmit={handleSubmit} className="space-y-6">
        <motion.div variants={fadeUp} className={cn('space-y-6 p-6 sm:p-7', brandPanelClass)}>
          <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Título do curso</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ex: Introdução à Hermenêutica Bíblica"
                className={brandInputClass}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Categoria</label>
              <select name="category" value={form.category} onChange={handleChange} className={brandInputClass}>
                <option value="">Selecione</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[0.7fr_0.7fr_1.2fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Nível</label>
              <select name="level" value={form.level} onChange={handleChange} className={brandInputClass}>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Idioma</label>
              <select name="language" value={form.language} onChange={handleChange} className={brandInputClass}>
                {languages.map((language) => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Tags</label>
              <input
                type="text"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="Ex: Bíblia, Teologia, Interpretação"
                className={brandInputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-white/72">Descrição</label>
              <TemplatePicker
                kind="course_description"
                currentValue={form.description}
                onApply={(body) => setForm((prev) => ({ ...prev, description: body }))}
              />
            </div>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Descreva o que o aluno vai aprender e por que esse curso merece atenção."
              className={cn(brandInputClass, 'resize-none')}
            />
          </div>
        </motion.div>

        {adminInstitutions.length > 0 && (
          <motion.div variants={fadeUp} className={cn('space-y-5 p-6 sm:p-7', brandPanelClass)}>
            <DashboardSectionLabel>Vínculo institucional (opcional)</DashboardSectionLabel>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Instituição</label>
              <select name="institutionId" value={form.institutionId} onChange={handleChange} className={brandInputClass}>
                <option value="">Nenhuma, curso público</option>
                {adminInstitutions.map((inst) => (
                  <option key={inst._id} value={inst._id as unknown as string}>{inst.name}</option>
                ))}
              </select>
              <p className="text-xs text-white/54">
                Vincule o curso a uma instituição que você administra, para identificar a origem do conteúdo.
              </p>
            </div>
            {form.institutionId && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Visibilidade</label>
                <select name="visibility" value={form.visibility} onChange={handleChange} className={brandInputClass}>
                  <option value="public">Público, aparece no catálogo para todos</option>
                  <option value="institution">Privado, somente membros da instituição</option>
                </select>
              </div>
            )}
          </motion.div>
        )}

        <motion.div variants={fadeUp} className={cn('p-6', brandPanelClass)}>
          <DashboardSectionLabel>Direção visual</DashboardSectionLabel>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-5">
              <p className="font-display text-xl font-bold text-white">Capa do curso</p>
              <p className="mt-2 text-sm leading-7 text-white/54">
                Será definida quando você começar a estruturar módulos, aulas e thumbnail do conteúdo.
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-5">
              <p className="font-display text-xl font-bold text-white">Próxima etapa</p>
              <p className="mt-2 text-sm leading-7 text-white/54">
                Depois de salvar, você entra direto no fluxo de edição para construir módulos, aulas e avaliação.
              </p>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={fadeUp} role="alert" className="rounded-[1.3rem] border border-red-400/18 bg-red-400/8 px-4 py-4 text-sm text-red-200">
            {error}
          </motion.div>
        )}

        <motion.div variants={fadeUp} className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link to="/dashboard/cursos" className={brandSecondaryButtonClass}>
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className={brandPrimaryButtonClass}>
            {loading ? 'Criando...' : 'Criar curso e adicionar aulas'}
          </button>
        </motion.div>
      </motion.form>
    </DashboardPageShell>
  )
}
