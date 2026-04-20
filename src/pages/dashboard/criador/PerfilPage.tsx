import { useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { brandInputClass, brandPanelClass, brandPanelSoftClass, brandPrimaryButtonClass, cn } from '@/lib/brand'
import { useCurrentAppUser } from '@/lib/currentUser'
import { perfilLabel } from '@/lib/perfil'
import { DashboardMetricCard, DashboardPageShell, DashboardSectionLabel, DashboardStatusPill } from '@/components/dashboard/PageShell'

type FormState = {
  bio: string
  youtubeChannel: string
  institution: string
  cnpj: string
  city: string
  state: string
}

export function PerfilPage() {
  const { clerkUser, currentUser, perfil, isLoading } = useCurrentAppUser()
  const updateProfile = useMutation(api.users.updateProfile)
  const [form, setForm] = useState<FormState>({
    bio: '',
    youtubeChannel: '',
    institution: '',
    cnpj: '',
    city: '',
    state: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) return
    setForm({
      bio: currentUser.bio ?? '',
      youtubeChannel: currentUser.youtubeChannel ?? '',
      institution: currentUser.institution ?? '',
      cnpj: currentUser.cnpj ?? '',
      city: currentUser.city ?? '',
      state: currentUser.state ?? '',
    })
  }, [currentUser])

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setSaved(false)
    setError('')
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!clerkUser) return

    setSaving(true)
    setSaved(false)
    setError('')

    try {
      await updateProfile({
        clerkId: clerkUser.id,
        bio: form.bio.trim() || undefined,
        youtubeChannel: form.youtubeChannel.trim() || undefined,
        institution: form.institution.trim() || undefined,
        cnpj: form.cnpj.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o perfil agora.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !clerkUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
      </div>
    )
  }

  const displayName =
    clerkUser.fullName?.trim() ||
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    'Usuário'

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    ''

  const isInstitution = perfil === 'instituicao'

  return (
    <DashboardPageShell
      eyebrow="Conta e identidade"
      title="Meu perfil"
      description="Este formulário agora salva de verdade os campos já suportados pela base atual do produto, mantendo a mesma direção editorial do restante do dashboard."
      maxWidthClass="max-w-5xl"
      actions={saved ? <DashboardStatusPill tone="success">Alterações salvas</DashboardStatusPill> : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <DashboardMetricCard
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            }
            label="Perfil ativo"
            value={perfilLabel[perfil]}
            sub="controle central do dashboard"
            accent
          />
          <DashboardMetricCard
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-.664 1.594l-7.5 7.5a2.25 2.25 0 01-3.182 0l-7.5-7.5A2.25 2.25 0 012.25 9.906V9A2.25 2.25 0 014.5 6.75h15A2.25 2.25 0 0121.75 9z" />
              </svg>
            }
            label="Conta principal"
            value={displayName}
            sub="nome vindo da autenticação"
          />
          <DashboardMetricCard
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5A2.25 2.25 0 0119.5 19.5H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0l-7.5-4.615A2.25 2.25 0 012.25 6.993V6.75" />
              </svg>
            }
            label="Email"
            value={email || 'Não disponível'}
            sub="gerenciado pelo Clerk"
          />
        </div>

        <div className={cn('grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr]', brandPanelClass)}>
          <div className="space-y-4">
            <div>
              <DashboardSectionLabel>Apresentação pública</DashboardSectionLabel>
              <p className="mt-3 text-sm leading-7 text-white/56">
                Os campos abaixo já persistem na base atual do produto e passam a servir como ponto de verdade para o dashboard.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Nome da conta</label>
              <input value={displayName} readOnly className={cn(brandInputClass, 'cursor-not-allowed opacity-70')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Email</label>
              <input value={email} readOnly className={cn(brandInputClass, 'cursor-not-allowed opacity-70')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={5}
                placeholder="Apresente sua trajetória, foco de estudo ou contexto ministerial."
                className={cn(brandInputClass, 'resize-none')}
              />
            </div>

            {perfil === 'criador' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Canal do YouTube</label>
                <input
                  name="youtubeChannel"
                  value={form.youtubeChannel}
                  onChange={handleChange}
                  placeholder="https://youtube.com/@seucanal"
                  className={brandInputClass}
                />
              </div>
            ) : null}

            {isInstitution ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/72">Nome da instituição</label>
                  <input
                    name="institution"
                    value={form.institution}
                    onChange={handleChange}
                    placeholder="Nome da igreja ou instituição"
                    className={brandInputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/72">CNPJ</label>
                  <input
                    name="cnpj"
                    value={form.cnpj}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    className={brandInputClass}
                  />
                </div>
              </>
            ) : null}
          </div>

          <div className={cn('p-5', brandPanelSoftClass)}>
            <DashboardSectionLabel>Contexto do perfil</DashboardSectionLabel>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F2BD8A]">Estado atual</p>
                <p className="mt-3 text-sm leading-7 text-white/58">
                  Os campos salvos aqui já alimentam a camada de identidade do dashboard. Social links, avatar customizado e informações mais avançadas entram na próxima etapa.
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/28">Próxima evolução</p>
                <p className="mt-3 text-sm leading-7 text-white/58">
                  A mesma estrutura será expandida para páginas públicas de criador, identidade institucional e controles de apresentação mais completos.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={cn('p-6', brandPanelClass)}>
          <DashboardSectionLabel>Localização</DashboardSectionLabel>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Cidade</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Sua cidade"
                className={brandInputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Estado</label>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="Seu estado"
                className={brandInputClass}
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-[1.3rem] border border-red-400/18 bg-red-400/8 px-4 py-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className={brandPrimaryButtonClass}>
            {saving ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </div>
      </form>
    </DashboardPageShell>
  )
}
