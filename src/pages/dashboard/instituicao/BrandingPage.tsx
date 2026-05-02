import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import {
  DashboardEmptyState,
  DashboardPageShell,
} from '@/components/dashboard/PageShell'
import {
  brandPanelClass,
  brandPrimaryButtonClass,
  brandSecondaryButtonClass,
  cn,
} from '@/lib/brand'

type InstitutionRow = {
  _id: Id<'institutions'>
  name: string
  type: 'igreja' | 'ensino' | 'empresa'
  memberRole: 'dono' | 'admin' | 'membro'
  themeColor?: string
  logoUrl?: string
  description?: string
}

const PRESET_COLORS: { value: string; label: string }[] = [
  { value: '#F37E20', label: 'Laranja Resenha (padrão)' },
  { value: '#1E2430', label: 'Navy editorial' },
  { value: '#2563EB', label: 'Azul confiança' },
  { value: '#16A34A', label: 'Verde acadêmico' },
  { value: '#9333EA', label: 'Roxo' },
  { value: '#DB2777', label: 'Magenta' },
  { value: '#B45309', label: 'Mostarda' },
  { value: '#0F766E', label: 'Teal' },
]

function isValidHex(c: string) {
  return /^#[0-9a-fA-F]{6}$/.test(c.trim())
}

function isValidHttpUrl(u: string) {
  return /^https?:\/\//i.test(u.trim())
}

export function BrandingPage() {
  const formId = useId()
  const institutions = useQuery(api.institutions.listByUser) as
    | InstitutionRow[]
    | undefined
  const editable = institutions?.filter((i) => i.memberRole !== 'membro') ?? []
  const [activeId, setActiveId] = useState<Id<'institutions'> | null>(null)
  const currentId = activeId ?? editable[0]?._id ?? null

  const institution = useQuery(
    api.institutions.getById,
    currentId ? { institutionId: currentId } : 'skip',
  ) as
    | (InstitutionRow & { _id: Id<'institutions'> })
    | null
    | undefined

  const update = useMutation(api.institutions.update)
  const [themeColor, setThemeColor] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (institution) {
      // Hidrata o form quando a instituição carrega ou muda de identidade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeColor(institution.themeColor ?? '')
       
      setLogoUrl(institution.logoUrl ?? '')
       
      setDescription(institution.description ?? '')
       
      setSavedAt(null)
       
      setError(null)
    }
    // Dependências cobrem todos os campos de identidade da instituição.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institution?._id, institution?.themeColor, institution?.logoUrl, institution?.description])

  const previewColor = useMemo(() => {
    if (!themeColor) return '#F37E20'
    return isValidHex(themeColor) ? themeColor : '#F37E20'
  }, [themeColor])

  if (institutions === undefined) {
    return (
      <DashboardPageShell
        eyebrow="Branding"
        title="Carregando"
        description="Aguarde um instante."
      >
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
        </div>
      </DashboardPageShell>
    )
  }

  if (editable.length === 0) {
    return (
      <DashboardPageShell
        eyebrow="Branding"
        title="Identidade da instituição"
        description="Personalize a aparência das páginas internas da sua instituição."
      >
        <DashboardEmptyState
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
              />
            </svg>
          }
          title="Você não administra nenhuma instituição"
          description="Apenas dono e admin podem editar branding. Peça permissão ao dono ou crie sua instituição."
          action={
            <Link to="/dashboard/membros" className={brandPrimaryButtonClass}>
              Criar instituição
            </Link>
          }
        />
      </DashboardPageShell>
    )
  }

  async function handleSave() {
    if (!currentId) return
    setError(null)
    if (themeColor && !isValidHex(themeColor)) {
      setError('Cor inválida. Use o formato hex #RRGGBB.')
      return
    }
    if (logoUrl && !isValidHttpUrl(logoUrl)) {
      setError('URL de logo inválida. Comece com http:// ou https://.')
      return
    }
    if (description.length > 1000) {
      setError('Descrição muito longa (máximo 1000 caracteres).')
      return
    }
    setSaving(true)
    try {
      await update({
        institutionId: currentId,
        themeColor: themeColor.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        description: description.trim() || undefined,
      })
      setSavedAt(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPageShell
      eyebrow="Branding"
      title="Identidade da instituição"
      description="Personalize a cor de destaque, o logo e a descrição mostrada nos espaços da instituição."
      maxWidthClass="max-w-5xl"
    >
      {editable.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {editable.map((inst) => (
            <button
              key={inst._id}
              type="button"
              onClick={() => setActiveId(inst._id)}
              className={cn(
                'rounded-2xl border px-4 py-2 text-sm font-medium transition-all',
                currentId === inst._id
                  ? 'border-[#F37E20]/40 bg-[#F37E20]/10 text-[#F2BD8A]'
                  : 'border-white/10 bg-white/4 text-white/72 hover:border-white/20 hover:bg-white/8',
              )}
            >
              {inst.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className={cn('p-6', brandPanelClass)}>
            <h2 className="font-display text-lg font-bold text-white">Cor de destaque</h2>
            <p className="mt-1 text-sm text-white/52">
              Substitui o laranja Resenha nas páginas internas da instituição. Use uma
              cor com bom contraste sobre fundo escuro.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {PRESET_COLORS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setThemeColor(p.value)}
                  className={cn(
                    'h-10 w-10 rounded-full border-2 transition-all',
                    themeColor.toLowerCase() === p.value.toLowerCase()
                      ? 'border-white scale-110'
                      : 'border-white/14 hover:border-white/40',
                  )}
                  style={{ backgroundColor: p.value }}
                  title={p.label}
                  aria-label={`Selecionar cor ${p.label}`}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label htmlFor={`${formId}-themeColor`} className="text-xs font-semibold uppercase tracking-[0.16em] text-white/48">
                Hex personalizado
              </label>
              <input
                id={`${formId}-themeColor`}
                type="text"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                placeholder="#F37E20"
                maxLength={7}
                className="w-32 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-sm text-white placeholder-white/28 focus:border-[#F37E20]/40 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
              />
              {themeColor && (
                <button
                  type="button"
                  onClick={() => setThemeColor('')}
                  className="text-xs font-semibold text-white/48 hover:text-white/72"
                >
                  Limpar (voltar ao padrão)
                </button>
              )}
            </div>
          </section>

          <section className={cn('p-6', brandPanelClass)}>
            <h2 className="font-display text-lg font-bold text-white">Logo</h2>
            <p className="mt-1 text-sm text-white/52">
              URL pública de uma imagem. Recomendamos PNG transparente, no mínimo 240x80px,
              hospedado em servidor com HTTPS.
            </p>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/28 focus:border-[#F37E20]/40 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
            />
            {logoUrl && isValidHttpUrl(logoUrl) && (
              <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  Pré-visualização
                </p>
                <div className="mt-2 flex h-20 items-center justify-start">
                  <img
                    src={logoUrl}
                    alt="Logo da instituição"
                    className="max-h-16 max-w-full object-contain"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.opacity = '0.3'
                    }}
                  />
                </div>
              </div>
            )}
          </section>

          <section className={cn('p-6', brandPanelClass)}>
            <h2 className="font-display text-lg font-bold text-white">Descrição institucional</h2>
            <p className="mt-1 text-sm text-white/52">
              Texto curto que apresenta a instituição. Aparece no painel e na futura página
              pública. Máximo 1000 caracteres.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="Quem somos, no que cremos, qual é a missão da instituição."
              className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm leading-6 text-white placeholder-white/28 focus:border-[#F37E20]/40 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
            />
            <p className="mt-2 text-right text-xs text-white/40">{description.length}/1000</p>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={cn(brandPrimaryButtonClass, saving && 'opacity-60')}
            >
              {saving ? 'Salvando...' : 'Salvar branding'}
            </button>
            <Link to="/dashboard" className={brandSecondaryButtonClass}>
              Voltar ao painel
            </Link>
            {savedAt && !error && (
              <span role="status" aria-live="polite" className="text-xs font-medium text-emerald-300">Branding salvo.</span>
            )}
            {error && <span role="alert" className="text-xs font-medium text-red-300">{error}</span>}
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className={cn('p-6', brandPanelClass)} style={{ borderColor: `${previewColor}33` }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: previewColor }}>
              Pré-visualização
            </p>
            <div className="mt-4 flex items-center gap-3">
              {logoUrl && isValidHttpUrl(logoUrl) ? (
                <img
                  src={logoUrl}
                  alt={institution?.name ?? 'Instituição'}
                  className="h-12 w-12 rounded-xl object-contain"
                  style={{ backgroundColor: `${previewColor}14`, padding: '6px' }}
                />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
                  style={{ backgroundColor: previewColor }}
                  aria-hidden
                >
                  {(institution?.name ?? 'I').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  {institution?.name ?? 'Instituição'}
                </h3>
                <p className="text-xs text-white/48">Painel da instituição</p>
              </div>
            </div>
            {description && (
              <p className="mt-4 text-sm leading-6 text-white/72">{description}</p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: `${previewColor}1f`, color: previewColor }}
              >
                Membros ativos
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/64">
                Cursos vinculados
              </span>
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: previewColor }}
            >
              Convidar membro
            </button>
          </div>
        </aside>
      </div>
    </DashboardPageShell>
  )
}
