import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import {
  brandInputClass,
  brandPanelClass,
  brandPanelSoftClass,
  brandPrimaryButtonClass,
  brandEyebrowClass,
  cn,
} from '@/lib/brand'
import { useCurrentAppUser } from '@/lib/currentUser'
import { DashboardPageShell, DashboardStatusPill } from '@/components/dashboard/PageShell'
import type { Id } from '../../../../convex/_generated/dataModel'

// ─── Constantes ────────────────────────────────────────────────────────────────

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

// ─── Tipos ─────────────────────────────────────────────────────────────────────

type TabId = 'visao-geral' | 'dados-pessoais' | 'perfil-publico' | 'conquistas' | 'depoimentos'

type FormState = {
  firstName: string
  lastName: string
  bio: string
  website: string
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

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  bio: '',
  website: '',
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
}

// ─── TabBar ────────────────────────────────────────────────────────────────────

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: TabId; label: string }[]
  active: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <div className="mb-8 flex gap-0.5 overflow-x-auto border-b border-white/8 pb-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative shrink-0 px-4 pb-3 pt-1 text-sm font-medium transition-all duration-200',
            active === tab.id
              ? 'text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-[#F37E20] after:content-[""]'
              : 'text-white/44 hover:text-white/70',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ─── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        value ? 'bg-[#F37E20]' : 'bg-white/14',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200',
          value ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

// ─── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/7 bg-white/[0.025] p-5 text-center">
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/48">{label}</p>
    </div>
  )
}

// ─── CourseProgressRow ─────────────────────────────────────────────────────────

function CourseProgressRow({
  courseTitle,
  percentage,
  completedLessons,
  totalLessons,
  certificateIssued,
}: {
  courseTitle: string
  percentage: number
  completedLessons: number
  totalLessons: number
  certificateIssued: boolean
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/7 bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-white leading-snug">{courseTitle}</p>
        {certificateIssued ? (
          <span className="flex-shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
            Concluído
          </span>
        ) : null}
      </div>
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-xs text-white/40">
          <span>{completedLessons} de {totalLessons} aulas</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[#F37E20] transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── PendingTestimonialCard ────────────────────────────────────────────────────

function PendingTestimonialCard({
  id,
  text,
  authorName,
  createdAt,
  onApprove,
  onReject,
  onRemove,
}: {
  id: Id<'testimonials'>
  text: string
  authorName: string
  createdAt: number
  onApprove: (id: Id<'testimonials'>) => void
  onReject: (id: Id<'testimonials'>) => void
  onRemove: (id: Id<'testimonials'>) => void
}) {
  const date = new Date(createdAt).toLocaleDateString('pt-BR')
  return (
    <div className="rounded-[1.4rem] border border-white/7 bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{authorName}</p>
          <p className="text-xs text-white/36">{date}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={() => onApprove(id)}
            className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-400/20"
          >
            Aprovar
          </button>
          <button
            onClick={() => onReject(id)}
            className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition-all hover:bg-red-400/20"
          >
            Rejeitar
          </button>
          <button
            onClick={() => onRemove(id)}
            className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/40 transition-all hover:border-red-400/20 hover:bg-red-400/8 hover:text-red-300"
          >
            Excluir
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-white/62">{text}</p>
    </div>
  )
}

// ─── ApprovedTestimonialCard ───────────────────────────────────────────────────

function ApprovedTestimonialCard({
  id,
  text,
  authorName,
  authorHandle,
  createdAt,
  onRemove,
}: {
  id: Id<'testimonials'>
  text: string
  authorName: string
  authorHandle?: string
  createdAt: number
  onRemove: (id: Id<'testimonials'>) => void
}) {
  const date = new Date(createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  const initials = authorName.slice(0, 2).toUpperCase()
  return (
    <div className="rounded-[1.4rem] border border-white/7 bg-white/[0.025] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#F37E20]/16 bg-[#F37E20]/10">
            <span className="text-xs font-semibold text-[#F2BD8A]">{initials}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{authorName}</p>
            {authorHandle && (
              <p className="text-xs text-white/36">@{authorHandle}</p>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <span className="text-xs text-white/28">{date}</span>
          <button
            onClick={() => onRemove(id)}
            className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/40 transition-all hover:border-red-400/20 hover:bg-red-400/8 hover:text-red-300"
          >
            Remover
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-white/62">{text}</p>
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────

export function PerfilPage() {
  const [activeTab, setActiveTab] = useState<TabId>('visao-geral')
  const { clerkUser, currentUser, hasFunction, functions, isLoading } = useCurrentAppUser()

  // Form state
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formError, setFormError] = useState('')

  // Handle state
  const [handleInput, setHandleInput] = useState('')
  const [handleError, setHandleError] = useState('')
  const [handleSaving, setHandleSaving] = useState(false)

  // Visibility state
  const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public')
  const [showProgress, setShowProgress] = useState(true)
  const [visibilitySaving, setVisibilitySaving] = useState(false)
  const [visibilitySaved, setVisibilitySaved] = useState(false)

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  // Queries
  const isAvailable = useQuery(
    api.handles.isAvailable,
    handleInput.length >= 3 ? { handle: handleInput } : 'skip',
  )
  const myStats = useQuery(api.publicProfiles.getMyStats, currentUser ? {} : 'skip')
  const pendingTestimonials = useQuery(
    api.testimonials.listPending,
    currentUser?.clerkId && currentUser?.handle ? { profileUserId: currentUser.clerkId } : 'skip',
  )
  const approvedTestimonials = useQuery(
    api.testimonials.listApproved,
    currentUser?.clerkId && currentUser?.handle ? { profileUserId: currentUser.clerkId } : 'skip',
  )

  // Mutations
  const updateProfile = useMutation(api.users.updateProfile)
  const claimHandle = useMutation(api.handles.claim)
  const updateVisibility = useMutation(api.handles.updateVisibility)
  const approveTestimonial = useMutation(api.testimonials.approve)
  const rejectTestimonial = useMutation(api.testimonials.reject)
  const removeTestimonial = useMutation(api.testimonials.remove)

  // Sync form from Convex user + Clerk
  useEffect(() => {
    if (!currentUser || !clerkUser) return
    setForm({
      firstName: clerkUser.firstName ?? '',
      lastName: clerkUser.lastName ?? '',
      bio: currentUser.bio ?? '',
      website: currentUser.website ?? '',
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
    setVisibility(currentUser.profileVisibility ?? 'public')
    setShowProgress(currentUser.showProgressPublicly ?? true)
  }, [currentUser, clerkUser])

  // Handlers
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSaved(false)
    setFormError('')
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !clerkUser) return
    setUploadingAvatar(true)
    setAvatarError('')
    try {
      await clerkUser.setProfileImage({ file })
    } catch {
      setAvatarError('Não foi possível atualizar a foto de perfil.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!clerkUser) return
    setSaving(true)
    setSaved(false)
    setFormError('')
    try {
      // Atualiza nome no Clerk
      const firstNameTrimmed = form.firstName.trim()
      const lastNameTrimmed = form.lastName.trim()
      if (
        firstNameTrimmed !== (clerkUser.firstName ?? '') ||
        lastNameTrimmed !== (clerkUser.lastName ?? '')
      ) {
        await clerkUser.update({
          firstName: firstNameTrimmed || undefined,
          lastName: lastNameTrimmed || undefined,
        })
      }

      const fullName = [firstNameTrimmed, lastNameTrimmed].filter(Boolean).join(' ')

      await updateProfile({
        clerkId: clerkUser.id,
        name: fullName || undefined,
        bio: form.bio.trim() || undefined,
        website: form.website.trim() || undefined,
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
      setFormError(err instanceof Error ? err.message : 'Não foi possível salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  async function handleClaimHandle(e: React.FormEvent) {
    e.preventDefault()
    setHandleSaving(true)
    setHandleError('')
    try {
      await claimHandle({ handle: handleInput })
      setHandleInput('')
    } catch (err) {
      setHandleError(err instanceof Error ? err.message : 'Erro ao salvar handle.')
    } finally {
      setHandleSaving(false)
    }
  }

  async function handleSaveVisibility() {
    setVisibilitySaving(true)
    try {
      await updateVisibility({ visibility, showProgressPublicly: showProgress })
      setVisibilitySaved(true)
      setTimeout(() => setVisibilitySaved(false), 2500)
    } catch {
      // noop
    } finally {
      setVisibilitySaving(false)
    }
  }

  async function handleApprove(id: Id<'testimonials'>) {
    try { await approveTestimonial({ testimonialId: id }) } catch { /* noop */ }
  }
  async function handleReject(id: Id<'testimonials'>) {
    try { await rejectTestimonial({ testimonialId: id }) } catch { /* noop */ }
  }
  async function handleRemove(id: Id<'testimonials'>) {
    try { await removeTestimonial({ testimonialId: id }) } catch { /* noop */ }
  }

  // Computed
  if (isLoading || !clerkUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
      </div>
    )
  }

  const handle = currentUser?.handle
  const handleInputTrimmed = handleInput.trim()
  const handleStatus = (() => {
    if (handleInputTrimmed.length < 3) return null
    if (isAvailable === undefined) return 'checking'
    if (isAvailable) return 'available'
    return 'taken'
  })()

  const displayName =
    clerkUser.fullName?.trim() ||
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    'Usuário'

  const initials =
    ((clerkUser.firstName?.[0] ?? '') + (clerkUser.lastName?.[0] ?? '')) ||
    displayName.slice(0, 2).toUpperCase()

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    ''

  const isInstitution = hasFunction('instituicao')
  const isCriador = hasFunction('criador')
  const isAluno = hasFunction('aluno')

  const addressProfile = useMemo(() => {
    switch (form.phoneCountry) {
      case '+55': return {
        address:     { label: 'Logradouro',        placeholder: 'Rua, Avenida, Travessa...' },
        number:      { label: 'Número',             placeholder: '123' },
        neighborhood:{ label: 'Bairro',             placeholder: 'Seu bairro', show: true },
        postal:      { label: 'CEP',                placeholder: '00000-000' },
        city:        { label: 'Cidade',             placeholder: 'Sua cidade' },
        state:       { label: 'Estado',             placeholder: 'SP, RJ, MG...' },
      }
      case '+1': return {
        address:     { label: 'Street Address',     placeholder: '123 Main St' },
        number:      { label: 'Apt / Suite',        placeholder: 'Apt 4B' },
        neighborhood:{ label: 'Neighborhood',       placeholder: '', show: false },
        postal:      { label: 'ZIP / Postal Code',  placeholder: '10001' },
        city:        { label: 'City',               placeholder: 'New York' },
        state:       { label: 'State / Province',   placeholder: 'NY' },
      }
      case '+351': return {
        address:     { label: 'Rua',                placeholder: 'Rua das Flores...' },
        number:      { label: 'Número',             placeholder: '12' },
        neighborhood:{ label: 'Freguesia',          placeholder: '', show: false },
        postal:      { label: 'Código Postal',      placeholder: '1000-001' },
        city:        { label: 'Localidade',         placeholder: 'Lisboa' },
        state:       { label: 'Distrito / Região',  placeholder: 'Lisboa' },
      }
      case '+44': return {
        address:     { label: 'Street',             placeholder: '10 Downing Street' },
        number:      { label: 'House No.',          placeholder: '10' },
        neighborhood:{ label: 'Area',               placeholder: '', show: false },
        postal:      { label: 'Postcode',           placeholder: 'SW1A 2AA' },
        city:        { label: 'City / Town',        placeholder: 'London' },
        state:       { label: 'County',             placeholder: 'Greater London' },
      }
      case '+49': return {
        address:     { label: 'Straße',             placeholder: 'Hauptstraße' },
        number:      { label: 'Hausnummer',         placeholder: '1' },
        neighborhood:{ label: 'Stadtteil',          placeholder: '', show: false },
        postal:      { label: 'PLZ',                placeholder: '10115' },
        city:        { label: 'Ort',                placeholder: 'Berlin' },
        state:       { label: 'Bundesland',         placeholder: 'Berlin' },
      }
      case '+33': return {
        address:     { label: 'Rue',                placeholder: 'Rue de Rivoli' },
        number:      { label: 'Numéro',             placeholder: '1' },
        neighborhood:{ label: 'Quartier',           placeholder: '', show: false },
        postal:      { label: 'Code Postal',        placeholder: '75001' },
        city:        { label: 'Ville',              placeholder: 'Paris' },
        state:       { label: 'Département',        placeholder: 'Paris' },
      }
      case '+39': return {
        address:     { label: 'Via / Piazza',       placeholder: 'Via Roma' },
        number:      { label: 'Civico',             placeholder: '1' },
        neighborhood:{ label: 'Quartiere',          placeholder: '', show: false },
        postal:      { label: 'CAP',                placeholder: '00100' },
        city:        { label: 'Comune',             placeholder: 'Roma' },
        state:       { label: 'Provincia / Regione',placeholder: 'Lazio' },
      }
      case '+61': return {
        address:     { label: 'Street Address',     placeholder: '1 George Street' },
        number:      { label: 'Unit',               placeholder: 'Unit 2' },
        neighborhood:{ label: 'Suburb',             placeholder: 'Sydney CBD', show: true },
        postal:      { label: 'Postcode',           placeholder: '2000' },
        city:        { label: 'City',               placeholder: 'Sydney' },
        state:       { label: 'State / Territory',  placeholder: 'NSW' },
      }
      case '+54': return {
        address:     { label: 'Calle',              placeholder: 'Av. Corrientes...' },
        number:      { label: 'Número',             placeholder: '1234' },
        neighborhood:{ label: 'Barrio',             placeholder: 'Palermo', show: true },
        postal:      { label: 'Código Postal',      placeholder: '1043' },
        city:        { label: 'Ciudad',             placeholder: 'Buenos Aires' },
        state:       { label: 'Provincia',          placeholder: 'Buenos Aires' },
      }
      case '+52': return {
        address:     { label: 'Calle',              placeholder: 'Av. Reforma...' },
        number:      { label: 'Número',             placeholder: '1' },
        neighborhood:{ label: 'Colonia',            placeholder: 'Polanco', show: true },
        postal:      { label: 'Código Postal',      placeholder: '11560' },
        city:        { label: 'Ciudad / Municipio', placeholder: 'Ciudad de México' },
        state:       { label: 'Estado',             placeholder: 'CDMX' },
      }
      case '+57': return {
        address:     { label: 'Calle / Carrera',    placeholder: 'Cra 7 # 32-16' },
        number:      { label: 'Número / Piso',      placeholder: '301' },
        neighborhood:{ label: 'Barrio',             placeholder: 'Chapinero', show: true },
        postal:      { label: 'Código Postal',      placeholder: '110221' },
        city:        { label: 'Ciudad',             placeholder: 'Bogotá' },
        state:       { label: 'Departamento',       placeholder: 'Cundinamarca' },
      }
      case '+56': return {
        address:     { label: 'Calle',              placeholder: 'Av. Providencia...' },
        number:      { label: 'Número',             placeholder: '1234' },
        neighborhood:{ label: 'Villa / Población',  placeholder: 'Providencia', show: true },
        postal:      { label: 'Código Postal',      placeholder: '7500000' },
        city:        { label: 'Ciudad',             placeholder: 'Santiago' },
        state:       { label: 'Región',             placeholder: 'Metropolitana' },
      }
      case '+34': return {
        address:     { label: 'Calle',              placeholder: 'C/ Gran Vía...' },
        number:      { label: 'Número / Piso',      placeholder: '1, 2º' },
        neighborhood:{ label: 'Barrio',             placeholder: '', show: false },
        postal:      { label: 'Código Postal',      placeholder: '28001' },
        city:        { label: 'Municipio',          placeholder: 'Madrid' },
        state:       { label: 'Provincia',          placeholder: 'Madrid' },
      }
      case '+598': return {
        address:     { label: 'Calle',              placeholder: 'Av. 18 de Julio...' },
        number:      { label: 'Número',             placeholder: '1234' },
        neighborhood:{ label: 'Barrio',             placeholder: 'Centro', show: true },
        postal:      { label: 'Código Postal',      placeholder: '11000' },
        city:        { label: 'Ciudad',             placeholder: 'Montevideo' },
        state:       { label: 'Departamento',       placeholder: 'Montevideo' },
      }
      case '+595': return {
        address:     { label: 'Calle',              placeholder: 'Av. Mariscal López...' },
        number:      { label: 'Número',             placeholder: '1234' },
        neighborhood:{ label: 'Barrio',             placeholder: 'Centro', show: true },
        postal:      { label: 'Código Postal',      placeholder: '1209' },
        city:        { label: 'Ciudad',             placeholder: 'Asunción' },
        state:       { label: 'Departamento',       placeholder: 'Central' },
      }
      default: return {
        address:     { label: 'Street Address',     placeholder: 'Street, Avenue...' },
        number:      { label: 'Number / Unit',      placeholder: '1' },
        neighborhood:{ label: 'Neighborhood',       placeholder: '', show: false },
        postal:      { label: 'Postal Code',        placeholder: '00000' },
        city:        { label: 'City',               placeholder: 'Your city' },
        state:       { label: 'State / Region',     placeholder: 'Region' },
      }
    }
  }, [form.phoneCountry])

  const hasStats = myStats && myStats.totalCoursesEnrolled > 0

  const FUNCTION_LABELS: Record<string, string> = {
    aluno: 'Aluno',
    criador: 'Criador',
    instituicao: 'Instituição',
  }

  const allTabs: { id: TabId; label: string; show: boolean }[] = [
    { id: 'visao-geral', label: 'Visão geral', show: true },
    { id: 'dados-pessoais', label: 'Dados pessoais', show: true },
    { id: 'perfil-publico', label: 'Perfil público', show: true },
    { id: 'conquistas', label: 'Conquistas', show: isAluno || !!hasStats },
    { id: 'depoimentos', label: 'Depoimentos', show: !!handle },
  ]
  const visibleTabs = allTabs.filter((t) => t.show) as { id: TabId; label: string }[]

  // Se a aba ativa foi removida, voltar para visão geral
  const activeTabVisible = visibleTabs.some((t) => t.id === activeTab)
  const effectiveTab = activeTabVisible ? activeTab : 'visao-geral'

  return (
    <DashboardPageShell
      eyebrow="Conta"
      title="Meu perfil"
      description="Informações pessoais, perfil público, conquistas e depoimentos."
      maxWidthClass="max-w-4xl"
      actions={
        saved && effectiveTab === 'dados-pessoais' ? (
          <DashboardStatusPill tone="success">Alterações salvas</DashboardStatusPill>
        ) : undefined
      }
    >
      <TabBar tabs={visibleTabs} active={effectiveTab} onChange={setActiveTab} />

      {/* ── Visão Geral ─────────────────────────────────────────────────────── */}
      {effectiveTab === 'visao-geral' && (
        <div className="space-y-6">

          {/* Card de identidade */}
          <div className={cn('p-6', brandPanelClass)}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {/* Avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[1.4rem] border border-white/10 transition-all hover:border-[#F37E20]/40"
              >
                {clerkUser.imageUrl ? (
                  <img src={clerkUser.imageUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#F37E20]/10">
                    <span className="text-xl font-bold text-[#F2BD8A]">{initials}</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {uploadingAvatar ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                  )}
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-display text-xl font-bold text-white leading-tight">{displayName}</p>
                {email && <p className="mt-0.5 text-sm text-white/40">{email}</p>}
                {handle ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-white/52">@{handle}</span>
                    <a
                      href={`/${handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#F2BD8A] hover:underline"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      Ver perfil público
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[#F2BD8A]/70">
                    Sem handle definido.{' '}
                    <button type="button" onClick={() => setActiveTab('perfil-publico')} className="hover:underline">
                      Criar agora
                    </button>
                  </p>
                )}
                {functions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {functions.map((fn) => (
                      <span
                        key={fn}
                        className="rounded-full border border-[#F37E20]/20 bg-[#F37E20]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#F2BD8A]"
                      >
                        {FUNCTION_LABELS[fn] ?? fn}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {avatarError && <p className="mt-3 text-xs text-red-300">{avatarError}</p>}
          </div>

          {/* Stats (se houver dados) */}
          {hasStats && (
            <div>
              <p className={cn('mb-4', brandEyebrowClass)}>Resumo de estudos</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  label="Horas assistidas"
                  value={`${Math.round((myStats?.totalWatchSeconds ?? 0) / 3600)}h`}
                />
                <StatCard
                  label="Cursos matriculados"
                  value={String(myStats?.totalCoursesEnrolled ?? 0)}
                />
                <StatCard
                  label="Cursos concluídos"
                  value={String(myStats?.totalCoursesCompleted ?? 0)}
                />
                <StatCard
                  label="Certificados"
                  value={String(myStats?.certificateCount ?? 0)}
                />
              </div>
            </div>
          )}

          {/* Atalhos */}
          <div>
            <p className={cn('mb-4', brandEyebrowClass)}>Acesso rápido</p>
            <div className="space-y-2">
              {[
                {
                  tab: 'dados-pessoais' as TabId,
                  label: 'Editar dados pessoais',
                  desc: 'Bio, website, telefone, redes sociais, endereço e vínculo ministerial',
                  icon: (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  ),
                },
                {
                  tab: 'perfil-publico' as TabId,
                  label: 'Configurar perfil público',
                  desc: 'Handle, URL pública e controles de visibilidade',
                  icon: (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                  ),
                },
                ...(isAluno || hasStats ? [{
                  tab: 'conquistas' as TabId,
                  label: 'Ver conquistas e progresso',
                  desc: 'Cursos, progresso por aula e certificados emitidos',
                  icon: (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  ),
                }] : []),
                ...(handle ? [{
                  tab: 'depoimentos' as TabId,
                  label: 'Gerenciar depoimentos',
                  desc: 'Aprovar, rejeitar ou remover depoimentos do seu perfil',
                  icon: (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  ),
                }] : []),
              ].map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => setActiveTab(item.tab)}
                  className="flex w-full items-center gap-4 rounded-[1.5rem] border border-white/7 bg-white/[0.025] p-4 text-left transition-all hover:border-[#F37E20]/18 hover:bg-[#F37E20]/6"
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-[#F37E20]/14 bg-[#F37E20]/10 text-[#F37E20]">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="mt-0.5 text-xs text-white/42">{item.desc}</p>
                  </div>
                  <svg className="h-4 w-4 flex-shrink-0 text-white/28" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Dados Pessoais ──────────────────────────────────────────────────── */}
      {effectiveTab === 'dados-pessoais' && (
        <form onSubmit={handleSubmitForm} className="space-y-6">

          {/* Avatar + Bio + Website */}
          <div className={cn('space-y-5 p-6', brandPanelClass)}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="group relative h-24 w-24 flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-white/10 transition-all hover:border-[#F37E20]/40"
                  title="Trocar foto de perfil"
                >
                  {clerkUser.imageUrl ? (
                    <img src={clerkUser.imageUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#F37E20]/10">
                      <span className="text-xl font-bold text-[#F2BD8A]">{initials}</span>
                    </div>
                  )}
                  {/* Overlay sempre visível com baixa opacidade, mais forte no hover */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 opacity-60 transition-opacity group-hover:opacity-100">
                    {uploadingAvatar ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <svg className="h-5 w-5 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                        </svg>
                        <span className="text-[10px] font-semibold text-white drop-shadow">Trocar foto</span>
                      </>
                    )}
                  </div>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              {/* Campos de identidade */}
              <div className="flex-1 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/72">Nome</label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="Seu nome"
                      className={brandInputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/72">Sobrenome</label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Seu sobrenome"
                      className={brandInputClass}
                    />
                  </div>
                </div>

                {/* @usuário — estilo Instagram */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/72">Nome de usuário</label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 select-none text-sm font-medium text-white/50">@</span>
                      <input
                        className={cn(brandInputClass, 'pl-8 pr-10')}
                        placeholder={handle ?? 'seuusuario'}
                        value={handleInput}
                        onChange={(e) => setHandleInput(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                        autoComplete="username"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {handleStatus === 'checking' && (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                        )}
                        {handleStatus === 'available' && (
                          <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                        {handleStatus === 'taken' && (
                          <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    {handleStatus === 'available' && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-emerald-400">Disponível</p>
                        <button
                          type="button"
                          onClick={handleClaimHandle}
                          disabled={handleSaving}
                          className="text-xs font-semibold text-[#F2BD8A] hover:underline disabled:opacity-50"
                        >
                          {handleSaving ? 'Salvando...' : handle ? 'Confirmar alteração' : 'Reservar este usuário'}
                        </button>
                      </div>
                    )}
                    {handleStatus === 'taken' && (
                      <p className="text-xs text-red-400">Nome de usuário indisponível</p>
                    )}
                    {handleError && <p className="text-xs text-red-400">{handleError}</p>}
                    {!handleInput && handle && (
                      <p className="text-xs text-white/36">Atual: @{handle}</p>
                    )}
                    {!handleInput && !handle && (
                      <p className="text-xs text-white/36">Digite para verificar disponibilidade</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/72">Email</label>
                  <input value={email} readOnly className={cn(brandInputClass, 'cursor-not-allowed opacity-60')} />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Bio</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Apresente sua trajetória, foco de estudo ou contexto ministerial."
                  className={cn(brandInputClass, 'resize-none')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Website</label>
                <input
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://seusite.com"
                  className={brandInputClass}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Telefone</label>
                <div className="grid grid-cols-[11rem_1fr] gap-2">
                  <select name="phoneCountry" value={form.phoneCountry} onChange={handleChange} className={brandInputClass}>
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

              {isInstitution && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/72">Nome da instituição</label>
                    <input name="institution" value={form.institution} onChange={handleChange} placeholder="Nome da igreja ou instituição" className={brandInputClass} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/72">CNPJ</label>
                    <input name="cnpj" value={form.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" className={brandInputClass} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Redes sociais */}
          <div className={cn('space-y-5 p-6', brandPanelClass)}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">Redes sociais</p>
            <div className="grid gap-4 md:grid-cols-2">
              {isCriador && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/72">YouTube</label>
                  <input name="youtubeChannel" value={form.youtubeChannel} onChange={handleChange} placeholder="https://youtube.com/@seucanal" className={brandInputClass} />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Instagram</label>
                <input name="instagram" value={form.instagram} onChange={handleChange} placeholder="https://instagram.com/seuperfil" className={brandInputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Facebook</label>
                <input name="facebook" value={form.facebook} onChange={handleChange} placeholder="https://facebook.com/seuperfil" className={brandInputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">LinkedIn</label>
                <input name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/seuperfil" className={brandInputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">X (Twitter)</label>
                <input name="twitter" value={form.twitter} onChange={handleChange} placeholder="https://x.com/seuperfil" className={brandInputClass} />
              </div>
            </div>
          </div>

          {/* Igreja e comunidade */}
          <div className={cn('space-y-5 p-6', brandPanelClass)}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">Igreja e comunidade</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Denominação</label>
                <select name="denomination" value={form.denomination} onChange={handleChange} className={brandInputClass}>
                  {DENOMINATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Cargo na Igreja</label>
                <select name="churchRole" value={form.churchRole} onChange={handleChange} className={brandInputClass}>
                  {CHURCH_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Nome da Igreja</label>
                <input name="churchName" value={form.churchName} onChange={handleChange} placeholder="Nome da sua igreja local" className={brandInputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Instagram da Igreja</label>
                <input name="churchInstagram" value={form.churchInstagram} onChange={handleChange} placeholder="https://instagram.com/suaigreja" className={brandInputClass} />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className={cn('space-y-5 p-6', brandPanelClass)}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">Endereço</p>
              <span className="rounded-full border border-[#F37E20]/20 bg-[#F37E20]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F2BD8A]">
                Necessário para certificados
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_8rem]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">{addressProfile.address.label}</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder={addressProfile.address.placeholder} className={brandInputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">{addressProfile.number.label}</label>
                <input name="addressNumber" value={form.addressNumber} onChange={handleChange} placeholder={addressProfile.number.placeholder} className={brandInputClass} />
              </div>
            </div>
            <div className={`grid gap-4 ${addressProfile.neighborhood.show ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {addressProfile.neighborhood.show && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/72">{addressProfile.neighborhood.label}</label>
                  <input name="neighborhood" value={form.neighborhood} onChange={handleChange} placeholder={addressProfile.neighborhood.placeholder} className={brandInputClass} />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">{addressProfile.postal.label}</label>
                <input name="cep" value={form.cep} onChange={handleChange} placeholder={addressProfile.postal.placeholder} className={brandInputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">{addressProfile.city.label}</label>
                <input name="city" value={form.city} onChange={handleChange} placeholder={addressProfile.city.placeholder} className={brandInputClass} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">{addressProfile.state.label}</label>
                <input name="state" value={form.state} onChange={handleChange} placeholder={addressProfile.state.placeholder} className={brandInputClass} />
              </div>
            </div>
          </div>

          {formError && (
            <div className="rounded-[1.3rem] border border-red-400/18 bg-red-400/8 px-4 py-4 text-sm text-red-200">
              {formError}
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className={brandPrimaryButtonClass}>
              {saving ? 'Salvando...' : 'Salvar dados'}
            </button>
          </div>
        </form>
      )}

      {/* ── Perfil Público ──────────────────────────────────────────────────── */}
      {effectiveTab === 'perfil-publico' && (
        <div className="space-y-6">

          {/* Handle */}
          <div className={cn('p-6', brandPanelSoftClass)}>
            <p className={brandEyebrowClass}>Seu handle público</p>
            <p className="mt-1 text-xs text-white/40">
              Defina um identificador único. A URL pública será: resenhadoteologo.com/seuhandle
            </p>

            {handle ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-white">@{handle}</span>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    Ativo
                  </span>
                  <a
                    href={`/${handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1.5 text-sm text-[#F2BD8A] hover:underline"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Abrir perfil
                  </a>
                </div>

                <form onSubmit={handleClaimHandle}>
                  <p className="mb-2 text-xs text-white/40">Alterar handle:</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/36">@</span>
                      <input
                        className={cn(brandInputClass, 'pl-8')}
                        placeholder={handle}
                        value={handleInput}
                        onChange={(e) => setHandleInput(e.target.value.toLowerCase())}
                        pattern="[a-z0-9_]{3,30}"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={handleSaving || handleStatus !== 'available'}
                      className={cn(brandPrimaryButtonClass, 'px-4 py-2.5')}
                    >
                      {handleSaving ? '...' : 'Alterar'}
                    </button>
                  </div>
                  {handleStatus === 'available' && <p className="mt-1.5 text-xs text-emerald-300">Disponível</p>}
                  {handleStatus === 'taken' && <p className="mt-1.5 text-xs text-red-300">Indisponível ou inválido</p>}
                  {handleStatus === 'checking' && <p className="mt-1.5 text-xs text-white/36">Verificando...</p>}
                  {handleError && <p className="mt-1.5 text-xs text-red-300">{handleError}</p>}
                </form>
              </div>
            ) : (
              <form onSubmit={handleClaimHandle} className="mt-5 space-y-3">
                <p className="text-sm text-white/52">
                  Você ainda não tem um handle. Escolha um identificador único para ativar seu perfil público.
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/36">@</span>
                  <input
                    className={cn(brandInputClass, 'pl-8')}
                    placeholder="seuhandle"
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value.toLowerCase())}
                    pattern="[a-z0-9_]{3,30}"
                    required
                  />
                </div>
                {handleStatus === 'available' && <p className="text-xs text-emerald-300">Disponível</p>}
                {handleStatus === 'taken' && <p className="text-xs text-red-300">Indisponível ou inválido</p>}
                {handleStatus === 'checking' && <p className="text-xs text-white/36">Verificando...</p>}
                {handleError && <p className="text-xs text-red-300">{handleError}</p>}
                <button
                  type="submit"
                  disabled={handleSaving || handleStatus !== 'available'}
                  className={cn(brandPrimaryButtonClass, 'w-full py-3')}
                >
                  {handleSaving ? 'Reservando...' : 'Reservar handle'}
                </button>
              </form>
            )}
          </div>

          {/* Visibilidade */}
          {handle && (
            <div className={cn('p-6', brandPanelSoftClass)}>
              <p className={brandEyebrowClass}>Privacidade e visibilidade</p>

              <div className="mt-5 space-y-3">
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/7 p-4">
                  <div>
                    <p className="text-sm font-medium text-white">Perfil listado publicamente</p>
                    <p className="mt-0.5 text-xs text-white/40">
                      {visibility === 'public'
                        ? 'Seu perfil é acessível pela URL pública.'
                        : 'Seu perfil existe, mas não é acessível publicamente.'}
                    </p>
                  </div>
                  <Toggle value={visibility === 'public'} onChange={(v) => setVisibility(v ? 'public' : 'unlisted')} />
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/7 p-4">
                  <div>
                    <p className="text-sm font-medium text-white">Mostrar progresso nos cursos</p>
                    <p className="mt-0.5 text-xs text-white/40">
                      {showProgress
                        ? 'Outros usuários podem ver seu andamento nos cursos.'
                        : 'Seu progresso nos cursos fica oculto no perfil público.'}
                    </p>
                  </div>
                  <Toggle value={showProgress} onChange={setShowProgress} />
                </label>

                <button
                  type="button"
                  onClick={handleSaveVisibility}
                  disabled={visibilitySaving}
                  className={cn(brandPrimaryButtonClass, 'w-full py-3')}
                >
                  {visibilitySaving ? 'Salvando...' : visibilitySaved ? 'Configurações salvas' : 'Salvar configurações'}
                </button>
              </div>
            </div>
          )}

          {/* O que aparece no perfil público */}
          <div className={cn('p-5', brandPanelSoftClass)}>
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#F37E20]/20 bg-[#F37E20]/10">
                <svg className="h-4 w-4 text-[#F37E20]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/84">O que fica visível no perfil público</p>
                <p className="mt-1.5 text-sm leading-7 text-white/50">
                  Avatar, nome, handle, bio, website, redes sociais e informações de igreja. Email, telefone e endereço nunca são expostos publicamente. Progresso e conquistas seguem sua configuração acima.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Conquistas ──────────────────────────────────────────────────────── */}
      {effectiveTab === 'conquistas' && (
        <div className="space-y-6">
          {myStats === undefined ? (
            <div className="flex justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
            </div>
          ) : myStats === null || myStats.totalCoursesEnrolled === 0 ? (
            <div className="rounded-[1.6rem] border border-white/7 bg-white/[0.025] px-8 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-white/28">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-white/62">Nenhum curso iniciado ainda</p>
              <p className="mt-2 text-xs text-white/36">Acesse o catálogo para começar sua jornada de estudos.</p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div>
                <p className={cn('mb-4', brandEyebrowClass)}>Resumo geral</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Horas assistidas" value={`${Math.round(myStats.totalWatchSeconds / 3600)}h`} />
                  <StatCard label="Cursos matriculados" value={String(myStats.totalCoursesEnrolled)} />
                  <StatCard label="Cursos concluídos" value={String(myStats.totalCoursesCompleted)} />
                  <StatCard label="Certificados" value={String(myStats.certificateCount)} />
                </div>
              </div>

              {/* Cursos */}
              <div>
                <p className={cn('mb-4', brandEyebrowClass)}>Progresso por curso</p>
                <div className="space-y-3">
                  {myStats.courses.map((course) => (
                    <CourseProgressRow
                      key={String(course.courseId)}
                      courseTitle={course.courseTitle}
                      percentage={course.percentage}
                      completedLessons={course.completedLessons}
                      totalLessons={course.totalLessons}
                      certificateIssued={course.certificateIssued}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Depoimentos ─────────────────────────────────────────────────────── */}
      {effectiveTab === 'depoimentos' && handle && (
        <div className="space-y-8">

          {/* Pendentes */}
          <div>
            <p className={cn('mb-4', brandEyebrowClass)}>
              Aguardando aprovação
              {pendingTestimonials !== undefined && pendingTestimonials.length > 0 && (
                <span className="ml-2 rounded-full border border-[#F37E20]/20 bg-[#F37E20]/10 px-2 py-0.5 text-[10px] normal-case tracking-normal text-[#F2BD8A]">
                  {pendingTestimonials.length}
                </span>
              )}
            </p>
            {pendingTestimonials === undefined ? (
              <div className="flex justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
              </div>
            ) : pendingTestimonials.length === 0 ? (
              <p className="text-sm text-white/36">Nenhum depoimento aguardando aprovação.</p>
            ) : (
              <div className="space-y-3">
                {pendingTestimonials.map((t) => (
                  <PendingTestimonialCard
                    key={String(t._id)}
                    id={t._id}
                    text={t.text}
                    authorName={t.authorName}
                    createdAt={t.createdAt}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Aprovados */}
          <div>
            <p className={cn('mb-4', brandEyebrowClass)}>Publicados no perfil</p>
            {approvedTestimonials === undefined ? (
              <div className="flex justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
              </div>
            ) : approvedTestimonials.length === 0 ? (
              <p className="text-sm text-white/36">Nenhum depoimento publicado ainda.</p>
            ) : (
              <div className="space-y-3">
                {approvedTestimonials.map((t) => (
                  <ApprovedTestimonialCard
                    key={String(t._id)}
                    id={t._id}
                    text={t.text}
                    authorName={t.authorName}
                    authorHandle={t.authorHandle}
                    createdAt={t.createdAt}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardPageShell>
  )
}
