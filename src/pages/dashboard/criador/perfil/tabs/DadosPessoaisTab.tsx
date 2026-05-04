import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import type { RefObject } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { brandInputClass, brandPanelClass, brandPrimaryButtonClass, cn } from '@/lib/brand'
import { CHURCH_ROLES, DENOMINATIONS, PHONE_COUNTRIES } from '../constants'
import { EMPTY_FORM, type FormState } from '../types'
import { normalizeSocialHandle, normalizeWebsite } from '../normalize'
import { getAddressProfile } from '../addressProfile'
import { CreatorPixSection } from '../CreatorPixSection'

type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>

type ConvexUserShape = {
  bio?: string | null
  website?: string | null
  youtubeChannel?: string | null
  instagram?: string | null
  facebook?: string | null
  linkedin?: string | null
  twitter?: string | null
  phone?: string | null
  phoneCountry?: string | null
  address?: string | null
  addressNumber?: string | null
  neighborhood?: string | null
  cep?: string | null
  city?: string | null
  state?: string | null
  institution?: string | null
  cnpj?: string | null
  denomination?: string | null
  churchRole?: string | null
  churchName?: string | null
  churchInstagram?: string | null
}

type HandleStatus = 'checking' | 'available' | 'taken' | null

export function DadosPessoaisTab({
  clerkUser,
  currentUser,
  displayName,
  initials,
  email,
  handle,
  isInstitution,
  isCriador,
  uploadingAvatar,
  fileInputRef,
  onAvatarChange,
  onPickAvatar,
  handleInput,
  setHandleInput,
  handleStatus,
  handleSaving,
  handleError,
  onClaimHandle,
  onSavedChange,
}: {
  clerkUser: ClerkUser
  currentUser: ConvexUserShape | null
  displayName: string
  initials: string
  email: string
  handle: string | undefined
  isInstitution: boolean
  isCriador: boolean
  uploadingAvatar: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPickAvatar: () => void
  handleInput: string
  setHandleInput: (v: string) => void
  handleStatus: HandleStatus
  handleSaving: boolean
  handleError: string
  onClaimHandle: (e: React.FormEvent) => void
  onSavedChange: (saved: boolean) => void
}) {
  const formId = useId()
  const updateProfile = useMutation(api.users.updateProfile)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Hidrata o form com dados do Convex + Clerk quando ambos chegam.
  useEffect(() => {
    if (!currentUser || !clerkUser) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [currentUser, clerkUser])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setForm((prev) => ({ ...prev, [name]: value }))
      onSavedChange(false)
      setFormError('')
    },
    [onSavedChange],
  )

  const addressProfile = useMemo(() => getAddressProfile(form.phoneCountry), [form.phoneCountry])

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!clerkUser) return
    setSaving(true)
    onSavedChange(false)
    setFormError('')
    try {
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
        website: normalizeWebsite(form.website) || undefined,
        youtubeChannel: normalizeSocialHandle(form.youtubeChannel, 'youtube') || undefined,
        instagram: normalizeSocialHandle(form.instagram, 'instagram') || undefined,
        facebook: normalizeSocialHandle(form.facebook, 'facebook') || undefined,
        linkedin: normalizeSocialHandle(form.linkedin, 'linkedin') || undefined,
        twitter: normalizeSocialHandle(form.twitter, 'twitter') || undefined,
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
        churchInstagram: normalizeSocialHandle(form.churchInstagram, 'instagram') || undefined,
      })
      onSavedChange(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmitForm} className="space-y-6">
      <div className={cn('space-y-5 p-6', brandPanelClass)}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onPickAvatar}
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
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor={`${formId}-firstName`} className="text-sm font-medium text-white/72">Nome</label>
                <input
                  id={`${formId}-firstName`}
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  className={brandInputClass}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor={`${formId}-lastName`} className="text-sm font-medium text-white/72">Sobrenome</label>
                <input
                  id={`${formId}-lastName`}
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Seu sobrenome"
                  className={brandInputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor={`${formId}-handle`} className="text-sm font-medium text-white/72">Nome de usuário</label>
              <div className="space-y-1.5">
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 select-none text-sm font-medium text-white/50">@</span>
                  <input
                    id={`${formId}-handle`}
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
                      onClick={onClaimHandle}
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
                {handleError && <p role="alert" className="text-xs text-red-400">{handleError}</p>}
                {!handleInput && handle && (
                  <p className="text-xs text-white/36">Atual: @{handle}</p>
                )}
                {!handleInput && !handle && (
                  <p className="text-xs text-white/36">Digite para verificar disponibilidade</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor={`${formId}-email`} className="text-sm font-medium text-white/72">Email</label>
              <input id={`${formId}-email`} value={email} readOnly className={cn(brandInputClass, 'cursor-not-allowed opacity-60')} />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor={`${formId}-bio`} className="text-sm font-medium text-white/72">Bio</label>
            <textarea
              id={`${formId}-bio`}
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Apresente sua trajetória, foco de estudo ou contexto ministerial."
              className={cn(brandInputClass, 'resize-none')}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={`${formId}-website`} className="text-sm font-medium text-white/72">Website</label>
            <input
              id={`${formId}-website`}
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://seusite.com"
              className={brandInputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={`${formId}-phone`} className="text-sm font-medium text-white/72">Telefone</label>
            <div className="grid grid-cols-[7rem_1fr] gap-2 sm:grid-cols-[11rem_1fr]">
              <select id={`${formId}-phoneCountry`} aria-label="Código do país" name="phoneCountry" value={form.phoneCountry} onChange={handleChange} className={brandInputClass}>
                {PHONE_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <input
                id={`${formId}-phone`}
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
                <label htmlFor={`${formId}-institution`} className="text-sm font-medium text-white/72">Nome da instituição</label>
                <input id={`${formId}-institution`} name="institution" value={form.institution} onChange={handleChange} placeholder="Nome da igreja ou instituição" className={brandInputClass} />
              </div>
              <div className="space-y-2">
                <label htmlFor={`${formId}-cnpj`} className="text-sm font-medium text-white/72">CNPJ</label>
                <input id={`${formId}-cnpj`} name="cnpj" value={form.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" className={brandInputClass} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={cn('space-y-5 p-6', brandPanelClass)}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">Redes sociais</p>
        <div className="grid gap-4 md:grid-cols-2">
          {isCriador && (
            <div className="space-y-2">
              <label htmlFor={`${formId}-youtubeChannel`} className="text-sm font-medium text-white/72">YouTube</label>
              <input id={`${formId}-youtubeChannel`} name="youtubeChannel" value={form.youtubeChannel} onChange={handleChange} placeholder="https://youtube.com/@seucanal" className={brandInputClass} />
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor={`${formId}-instagram`} className="text-sm font-medium text-white/72">Instagram</label>
            <input id={`${formId}-instagram`} name="instagram" value={form.instagram} onChange={handleChange} placeholder="https://instagram.com/seuperfil" className={brandInputClass} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${formId}-facebook`} className="text-sm font-medium text-white/72">Facebook</label>
            <input id={`${formId}-facebook`} name="facebook" value={form.facebook} onChange={handleChange} placeholder="https://facebook.com/seuperfil" className={brandInputClass} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${formId}-linkedin`} className="text-sm font-medium text-white/72">LinkedIn</label>
            <input id={`${formId}-linkedin`} name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/seuperfil" className={brandInputClass} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${formId}-twitter`} className="text-sm font-medium text-white/72">X (Twitter)</label>
            <input id={`${formId}-twitter`} name="twitter" value={form.twitter} onChange={handleChange} placeholder="https://x.com/seuperfil" className={brandInputClass} />
          </div>
        </div>
      </div>

      <div className={cn('space-y-5 p-6', brandPanelClass)}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">Igreja e comunidade</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={`${formId}-denomination`} className="text-sm font-medium text-white/72">Denominação</label>
            <select id={`${formId}-denomination`} name="denomination" value={form.denomination} onChange={handleChange} className={brandInputClass}>
              {DENOMINATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor={`${formId}-churchRole`} className="text-sm font-medium text-white/72">Cargo na Igreja</label>
            <select id={`${formId}-churchRole`} name="churchRole" value={form.churchRole} onChange={handleChange} className={brandInputClass}>
              {CHURCH_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor={`${formId}-churchName`} className="text-sm font-medium text-white/72">Nome da Igreja</label>
            <input id={`${formId}-churchName`} name="churchName" value={form.churchName} onChange={handleChange} placeholder="Nome da sua igreja local" className={brandInputClass} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${formId}-churchInstagram`} className="text-sm font-medium text-white/72">Instagram da Igreja</label>
            <input id={`${formId}-churchInstagram`} name="churchInstagram" value={form.churchInstagram} onChange={handleChange} placeholder="https://instagram.com/suaigreja" className={brandInputClass} />
          </div>
        </div>
      </div>

      {isCriador && <CreatorPixSection />}

      <div className={cn('space-y-5 p-6', brandPanelClass)}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">Endereço</p>
          <span className="rounded-full border border-[#F37E20]/20 bg-[#F37E20]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F2BD8A]">
            Necessário para certificados
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_8rem]">
          <div className="space-y-2">
            <label htmlFor={`${formId}-address`} className="text-sm font-medium text-white/72">{addressProfile.address.label}</label>
            <input id={`${formId}-address`} name="address" value={form.address} onChange={handleChange} placeholder={addressProfile.address.placeholder} className={brandInputClass} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${formId}-addressNumber`} className="text-sm font-medium text-white/72">{addressProfile.number.label}</label>
            <input id={`${formId}-addressNumber`} name="addressNumber" value={form.addressNumber} onChange={handleChange} placeholder={addressProfile.number.placeholder} className={brandInputClass} />
          </div>
        </div>
        <div className={`grid gap-4 ${addressProfile.neighborhood.show ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {addressProfile.neighborhood.show && (
            <div className="space-y-2">
              <label htmlFor={`${formId}-neighborhood`} className="text-sm font-medium text-white/72">{addressProfile.neighborhood.label}</label>
              <input id={`${formId}-neighborhood`} name="neighborhood" value={form.neighborhood} onChange={handleChange} placeholder={addressProfile.neighborhood.placeholder} className={brandInputClass} />
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor={`${formId}-cep`} className="text-sm font-medium text-white/72">{addressProfile.postal.label}</label>
            <input id={`${formId}-cep`} name="cep" value={form.cep} onChange={handleChange} placeholder={addressProfile.postal.placeholder} className={brandInputClass} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${formId}-city`} className="text-sm font-medium text-white/72">{addressProfile.city.label}</label>
            <input id={`${formId}-city`} name="city" value={form.city} onChange={handleChange} placeholder={addressProfile.city.placeholder} className={brandInputClass} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={`${formId}-state`} className="text-sm font-medium text-white/72">{addressProfile.state.label}</label>
            <input id={`${formId}-state`} name="state" value={form.state} onChange={handleChange} placeholder={addressProfile.state.placeholder} className={brandInputClass} />
          </div>
        </div>
      </div>

      {formError && (
        <div role="alert" className="rounded-[1.3rem] border border-red-400/18 bg-red-400/8 px-4 py-4 text-sm text-red-200">
          {formError}
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className={brandPrimaryButtonClass}>
          {saving ? 'Salvando...' : 'Salvar dados'}
        </button>
      </div>
    </form>
  )
}
