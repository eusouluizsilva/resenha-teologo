import { useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { brandInputClass, brandPanelClass, brandPanelSoftClass, brandPrimaryButtonClass, cn } from '@/lib/brand'
import { useCurrentAppUser } from '@/lib/currentUser'
import { DashboardPageShell, DashboardSectionLabel, DashboardStatusPill } from '@/components/dashboard/PageShell'

const DENOMINATIONS = [
  { value: '', label: 'Selecione a denominação' },
  { value: 'assembleia-de-deus', label: 'Assembleia de Deus' },
  { value: 'batista', label: 'Batista' },
  { value: 'presbiteriana', label: 'Presbiteriana' },
  { value: 'metodista', label: 'Metodista' },
  { value: 'adventista', label: 'Adventista' },
  { value: 'luterana', label: 'Luterana' },
  { value: 'anglicana', label: 'Anglicana' },
  { value: 'quadrangular', label: 'Quadrangular' },
  { value: 'sara-nossa-terra', label: 'Sara Nossa Terra' },
  { value: 'renovada', label: 'Igreja Renascer / Renovada' },
  { value: 'catolica', label: 'Católica' },
  { value: 'sem-denominacao', label: 'Sem denominação' },
  { value: 'outra', label: 'Outra' },
]

const CHURCH_ROLES = [
  { value: '', label: 'Selecione o cargo' },
  { value: 'membro', label: 'Membro' },
  { value: 'lider-celula', label: 'Líder de Célula' },
  { value: 'diacono', label: 'Diácono' },
  { value: 'presbitero', label: 'Presbítero' },
  { value: 'pastor', label: 'Pastor' },
  { value: 'bispo', label: 'Bispo' },
  { value: 'missionario', label: 'Missionário' },
  { value: 'seminarista', label: 'Seminarista' },
  { value: 'professor', label: 'Professor de Teologia' },
  { value: 'outro', label: 'Outro' },
]

const PHONE_COUNTRIES = [
  { code: '+55', label: '+55 Brasil' },
  { code: '+1', label: '+1 EUA / Canadá' },
  { code: '+351', label: '+351 Portugal' },
  { code: '+34', label: '+34 Espanha' },
  { code: '+54', label: '+54 Argentina' },
  { code: '+52', label: '+52 México' },
  { code: '+57', label: '+57 Colômbia' },
  { code: '+56', label: '+56 Chile' },
  { code: '+598', label: '+598 Uruguai' },
  { code: '+595', label: '+595 Paraguai' },
  { code: '+44', label: '+44 Reino Unido' },
  { code: '+49', label: '+49 Alemanha' },
  { code: '+33', label: '+33 França' },
  { code: '+39', label: '+39 Itália' },
  { code: '+61', label: '+61 Austrália' },
]

type FormState = {
  bio: string
  youtubeChannel: string
  instagram: string
  facebook: string
  linkedin: string
  twitter: string
  phone: string
  phoneCountry: string
  address: string
  addressNumber: string
  neighborhood: string
  cep: string
  city: string
  state: string
  institution: string
  cnpj: string
  denomination: string
  churchRole: string
  churchName: string
  churchInstagram: string
}

export function PerfilPage() {
  const { clerkUser, currentUser, perfil, isLoading } = useCurrentAppUser()
  const updateProfile = useMutation(api.users.updateProfile)
  const [form, setForm] = useState<FormState>({
    bio: '',
    youtubeChannel: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    twitter: '',
    phone: '',
    phoneCountry: '+55',
    address: '',
    addressNumber: '',
    neighborhood: '',
    cep: '',
    city: '',
    state: '',
    institution: '',
    cnpj: '',
    denomination: '',
    churchRole: '',
    churchName: '',
    churchInstagram: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) return
    setForm({
      bio: currentUser.bio ?? '',
      youtubeChannel: currentUser.youtubeChannel ?? '',
      instagram: currentUser.instagram ?? '',
      facebook: currentUser.facebook ?? '',
      linkedin: currentUser.linkedin ?? '',
      twitter: currentUser.twitter ?? '',
      phone: currentUser.phone ?? '',
      phoneCountry: currentUser.phoneCountry ?? '+55',
      address: currentUser.address ?? '',
      addressNumber: currentUser.addressNumber ?? '',
      neighborhood: currentUser.neighborhood ?? '',
      cep: currentUser.cep ?? '',
      city: currentUser.city ?? '',
      state: currentUser.state ?? '',
      institution: currentUser.institution ?? '',
      cnpj: currentUser.cnpj ?? '',
      denomination: currentUser.denomination ?? '',
      churchRole: currentUser.churchRole ?? '',
      churchName: currentUser.churchName ?? '',
      churchInstagram: currentUser.churchInstagram ?? '',
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
        instagram: form.instagram.trim() || undefined,
        facebook: form.facebook.trim() || undefined,
        linkedin: form.linkedin.trim() || undefined,
        twitter: form.twitter.trim() || undefined,
        phone: form.phone.trim() || undefined,
        phoneCountry: form.phone.trim() ? form.phoneCountry : undefined,
        address: form.address.trim() || undefined,
        addressNumber: form.addressNumber.trim() || undefined,
        neighborhood: form.neighborhood.trim() || undefined,
        cep: form.cep.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        institution: form.institution.trim() || undefined,
        cnpj: form.cnpj.trim() || undefined,
        denomination: form.denomination || undefined,
        churchRole: form.churchRole || undefined,
        churchName: form.churchName.trim() || undefined,
        churchInstagram: form.churchInstagram.trim() || undefined,
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
  const isCriador = perfil === 'criador'

  return (
    <DashboardPageShell
      eyebrow="Conta e identidade"
      title="Meu perfil"
      description="Mantenha seus dados atualizados. Endereço e telefone são necessários para emissão e envio de certificados físicos."
      maxWidthClass="max-w-5xl"
      actions={saved ? <DashboardStatusPill tone="success">Alterações salvas</DashboardStatusPill> : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Identidade */}
        <div className={cn('space-y-5 p-6', brandPanelClass)}>
          <DashboardSectionLabel>Identidade</DashboardSectionLabel>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Nome da conta</label>
              <input value={displayName} readOnly className={cn(brandInputClass, 'cursor-not-allowed opacity-60')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Email</label>
              <input value={email} readOnly className={cn(brandInputClass, 'cursor-not-allowed opacity-60')} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/72">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Apresente sua trajetória, foco de estudo ou contexto ministerial."
              className={cn(brandInputClass, 'resize-none')}
            />
          </div>

          {isInstitution ? (
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>
          ) : null}
        </div>

        {/* Contato */}
        <div className={cn('space-y-5 p-6', brandPanelClass)}>
          <div className="flex items-start justify-between gap-4">
            <DashboardSectionLabel>Contato</DashboardSectionLabel>
            <span className="rounded-full border border-[#F37E20]/20 bg-[#F37E20]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F2BD8A]">
              Necessário para certificados
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/72">Telefone</label>
            <div className="grid grid-cols-[11rem_1fr] gap-2">
              <select
                name="phoneCountry"
                value={form.phoneCountry}
                onChange={handleChange}
                className={brandInputClass}
              >
                {PHONE_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                className={brandInputClass}
              />
            </div>
          </div>
        </div>

        {/* Igreja e comunidade */}
        <div className={cn('space-y-5 p-6', brandPanelClass)}>
          <DashboardSectionLabel>Igreja e comunidade</DashboardSectionLabel>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Denominação</label>
              <select
                name="denomination"
                value={form.denomination}
                onChange={handleChange}
                className={brandInputClass}
              >
                {DENOMINATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Cargo na Igreja</label>
              <select
                name="churchRole"
                value={form.churchRole}
                onChange={handleChange}
                className={brandInputClass}
              >
                {CHURCH_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Nome da Igreja</label>
              <input
                name="churchName"
                value={form.churchName}
                onChange={handleChange}
                placeholder="Nome da sua igreja local"
                className={brandInputClass}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Instagram da Igreja</label>
              <input
                name="churchInstagram"
                value={form.churchInstagram}
                onChange={handleChange}
                placeholder="https://instagram.com/suaigreja"
                className={brandInputClass}
              />
            </div>
          </div>
        </div>

        {/* Redes sociais */}
        <div className={cn('space-y-5 p-6', brandPanelClass)}>
          <DashboardSectionLabel>Redes sociais</DashboardSectionLabel>

          <div className="grid gap-4 md:grid-cols-2">
            {isCriador ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">YouTube</label>
                <input
                  name="youtubeChannel"
                  value={form.youtubeChannel}
                  onChange={handleChange}
                  placeholder="https://youtube.com/@seucanal"
                  className={brandInputClass}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Instagram</label>
              <input
                name="instagram"
                value={form.instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/seuperfil"
                className={brandInputClass}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Facebook</label>
              <input
                name="facebook"
                value={form.facebook}
                onChange={handleChange}
                placeholder="https://facebook.com/seuperfil"
                className={brandInputClass}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">LinkedIn</label>
              <input
                name="linkedin"
                value={form.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/seuperfil"
                className={brandInputClass}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">X (Twitter)</label>
              <input
                name="twitter"
                value={form.twitter}
                onChange={handleChange}
                placeholder="https://x.com/seuperfil"
                className={brandInputClass}
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className={cn('space-y-5 p-6', brandPanelClass)}>
          <div className="flex items-start justify-between gap-4">
            <DashboardSectionLabel>Endereço</DashboardSectionLabel>
            <span className="rounded-full border border-[#F37E20]/20 bg-[#F37E20]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F2BD8A]">
              Necessário para certificados
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Logradouro</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Rua, Avenida, Travessa..."
                className={brandInputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Número</label>
              <input
                name="addressNumber"
                value={form.addressNumber}
                onChange={handleChange}
                placeholder="123"
                className={cn(brandInputClass, 'w-28')}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Bairro</label>
              <input
                name="neighborhood"
                value={form.neighborhood}
                onChange={handleChange}
                placeholder="Seu bairro"
                className={brandInputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">CEP</label>
              <input
                name="cep"
                value={form.cep}
                onChange={handleChange}
                placeholder="00000-000"
                className={brandInputClass}
              />
            </div>
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Estado</label>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="SP, RJ, MG..."
                className={brandInputClass}
              />
            </div>
          </div>
        </div>

        {/* Aviso sobre certificados */}
        <div className={cn('p-5', brandPanelSoftClass)}>
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#F37E20]/20 bg-[#F37E20]/10">
              <svg className="h-5 w-5 text-[#F37E20]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white/84">Por que preencher endereço e telefone?</p>
              <p className="mt-1.5 text-sm leading-7 text-white/50">
                Esses dados são utilizados exclusivamente para emissão e envio de certificados físicos ao concluir cursos com aprovação. Nunca são compartilhados com terceiros.
              </p>
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

        {/* Seguir o projeto */}
        <div className={cn('p-6', brandPanelClass)}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F2BD8A]">Apoie o projeto</p>
          <p className="mt-3 text-sm leading-7 text-white/56">
            A Resenha do Teólogo é um projeto independente. Siga nas redes, compartilhe com sua comunidade e ajude a levar formação teológica séria e gratuita para mais pessoas.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {/* YouTube */}
            <a
              href="https://www.youtube.com/@Resenha Do Te%C3%B3logo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/64 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/8 hover:text-white"
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              YouTube
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/eusouluizsilva/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/64 transition-all duration-200 hover:border-pink-500/30 hover:bg-pink-500/8 hover:text-white"
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              Instagram
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/profile.php?id=61574237807743"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/64 transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/8 hover:text-white"
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </a>

            {/* Email */}
            <a
              href="mailto:hello@resenhadoteologo.com"
              className="flex items-center gap-2.5 rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/64 transition-all duration-200 hover:border-[#F37E20]/30 hover:bg-[#F37E20]/8 hover:text-white"
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Contato
            </a>
          </div>
        </div>

      </form>
    </DashboardPageShell>
  )
}
