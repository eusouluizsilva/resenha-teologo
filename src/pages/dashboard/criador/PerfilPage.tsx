import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { useCurrentAppUser } from '@/lib/currentUser'
import { DashboardPageShell, DashboardStatusPill } from '@/components/dashboard/PageShell'
import { TabBar } from './perfil/components/TabBar'
import type { TabId } from './perfil/types'
import { VisaoGeralTab } from './perfil/tabs/VisaoGeralTab'
import { DadosPessoaisTab } from './perfil/tabs/DadosPessoaisTab'
import { PerfilPublicoTab } from './perfil/tabs/PerfilPublicoTab'
import { ConquistasTab } from './perfil/tabs/ConquistasTab'
import { DepoimentosTab } from './perfil/tabs/DepoimentosTab'
import { PrivacidadeTab } from './perfil/tabs/PrivacidadeTab'

export function PerfilPage() {
  const formId = useId()
  const [activeTab, setActiveTab] = useState<TabId>('visao-geral')
  const { clerkUser, currentUser, hasFunction, functions, isLoading } = useCurrentAppUser()

  // Cross-tab state ─────────────────────────────────────────────────────────
  const [saved, setSaved] = useState(false)

  const [handleInput, setHandleInput] = useState('')
  const [handleError, setHandleError] = useState('')
  const [handleSaving, setHandleSaving] = useState(false)

  const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public')
  const [showProgress, setShowProgress] = useState(true)
  const [visibilitySaving, setVisibilitySaving] = useState(false)
  const [visibilitySaved, setVisibilitySaved] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  // Sincroniza visibility/showProgress quando o currentUser chega do Convex.
  useEffect(() => {
    if (!currentUser) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibility(currentUser.profileVisibility ?? 'public')
    setShowProgress(currentUser.showProgressPublicly ?? true)
  }, [currentUser])

  // Queries ─────────────────────────────────────────────────────────────────
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
  const exportData = useQuery(
    api.account.exportMyData,
    activeTab === 'privacidade' && currentUser ? {} : 'skip',
  )

  // Mutations ───────────────────────────────────────────────────────────────
  const claimHandle = useMutation(api.handles.claim)
  const updateVisibility = useMutation(api.handles.updateVisibility)
  const approveTestimonial = useMutation(api.testimonials.approve)
  const rejectTestimonial = useMutation(api.testimonials.reject)
  const removeTestimonial = useMutation(api.testimonials.remove)

  // Avatar handler ──────────────────────────────────────────────────────────
  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [clerkUser],
  )

  const handlePickAvatar = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Handle (username) handlers ──────────────────────────────────────────────
  const handleClaimHandle = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [claimHandle, handleInput],
  )

  const handleSaveVisibility = useCallback(async () => {
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
  }, [updateVisibility, visibility, showProgress])

  const handleVisibilityToggleVisaoGeral = useCallback(
    (next: 'public' | 'unlisted') => {
      setVisibility(next)
      void updateVisibility({ visibility: next, showProgressPublicly: showProgress })
    },
    [updateVisibility, showProgress],
  )

  // Testimonial handlers ────────────────────────────────────────────────────
  const handleApprove = useCallback(
    async (id: Id<'testimonials'>) => {
      try { await approveTestimonial({ testimonialId: id }) } catch { /* noop */ }
    },
    [approveTestimonial],
  )
  const handleReject = useCallback(
    async (id: Id<'testimonials'>) => {
      try { await rejectTestimonial({ testimonialId: id }) } catch { /* noop */ }
    },
    [rejectTestimonial],
  )
  const handleRemoveTestimonial = useCallback(
    async (id: Id<'testimonials'>) => {
      try { await removeTestimonial({ testimonialId: id }) } catch { /* noop */ }
    },
    [removeTestimonial],
  )

  // Derived values ──────────────────────────────────────────────────────────
  const handle = currentUser?.handle
  const handleInputTrimmed = handleInput.trim()
  const handleStatus = useMemo(() => {
    if (handleInputTrimmed.length < 3) return null
    if (isAvailable === undefined) return 'checking'
    if (isAvailable) return 'available'
    return 'taken'
  }, [handleInputTrimmed, isAvailable])

  const displayName = useMemo(
    () =>
      clerkUser?.fullName?.trim() ||
      clerkUser?.primaryEmailAddress?.emailAddress ||
      clerkUser?.emailAddresses[0]?.emailAddress ||
      'Usuário',
    [clerkUser?.fullName, clerkUser?.primaryEmailAddress?.emailAddress, clerkUser?.emailAddresses],
  )

  const initials = useMemo(
    () =>
      ((clerkUser?.firstName?.[0] ?? '') + (clerkUser?.lastName?.[0] ?? '')) ||
      displayName.slice(0, 2).toUpperCase(),
    [clerkUser?.firstName, clerkUser?.lastName, displayName],
  )

  const email = useMemo(
    () =>
      clerkUser?.primaryEmailAddress?.emailAddress ||
      clerkUser?.emailAddresses[0]?.emailAddress ||
      '',
    [clerkUser?.primaryEmailAddress?.emailAddress, clerkUser?.emailAddresses],
  )

  const isInstitution = hasFunction('instituicao')
  const isCriador = hasFunction('criador')
  const isAluno = hasFunction('aluno')

  const hasStats = !!myStats && myStats.totalCoursesEnrolled > 0

  const visibleTabs = useMemo(() => {
    const allTabs: { id: TabId; label: string; show: boolean }[] = [
      { id: 'visao-geral', label: 'Visão geral', show: true },
      { id: 'dados-pessoais', label: 'Dados pessoais', show: true },
      { id: 'perfil-publico', label: 'Perfil público', show: true },
      { id: 'conquistas', label: 'Conquistas', show: isAluno || hasStats },
      { id: 'depoimentos', label: 'Depoimentos', show: !!handle },
      { id: 'privacidade', label: 'Privacidade', show: true },
    ]
    return allTabs.filter((t) => t.show) as { id: TabId; label: string }[]
  }, [isAluno, hasStats, handle])

  // Loading guard: tem que vir DEPOIS de todos os hooks (Rules of Hooks)
  if (isLoading || !clerkUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
      </div>
    )
  }

  const activeTabVisible = visibleTabs.some((t) => t.id === activeTab)
  const effectiveTab = activeTabVisible ? activeTab : 'visao-geral'

  return (
    <DashboardPageShell
      eyebrow="Conta"
      title="Meu perfil"
      description="Informações pessoais, perfil público, conquistas e depoimentos."
      maxWidthClass="max-w-4xl"
      actions={
        <div className="flex items-center gap-3">
          {saved && effectiveTab === 'dados-pessoais' && (
            <DashboardStatusPill tone="success" liveRegion>Alterações salvas</DashboardStatusPill>
          )}
          {handle && (
            <a
              href={`/${handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#F37E20]/24 bg-[#F37E20]/10 px-4 py-2 text-xs font-semibold text-[#F2BD8A] transition-all hover:border-[#F37E20]/40 hover:bg-[#F37E20]/16 hover:text-white"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Ver perfil público
            </a>
          )}
        </div>
      }
    >
      <TabBar tabs={visibleTabs} active={effectiveTab} onChange={setActiveTab} />

      {effectiveTab === 'visao-geral' && (
        <VisaoGeralTab
          imageUrl={clerkUser.imageUrl}
          displayName={displayName}
          initials={initials}
          email={email}
          handle={handle}
          functions={functions}
          isAluno={isAluno}
          hasStats={hasStats}
          myStats={myStats}
          visibility={visibility}
          onChangeVisibility={handleVisibilityToggleVisaoGeral}
          uploadingAvatar={uploadingAvatar}
          avatarError={avatarError}
          fileInputRef={fileInputRef}
          onAvatarChange={handleAvatarChange}
          onPickAvatar={handlePickAvatar}
          setActiveTab={setActiveTab}
        />
      )}

      {effectiveTab === 'dados-pessoais' && (
        <DadosPessoaisTab
          clerkUser={clerkUser}
          currentUser={currentUser}
          displayName={displayName}
          initials={initials}
          email={email}
          handle={handle}
          isInstitution={isInstitution}
          isCriador={isCriador}
          uploadingAvatar={uploadingAvatar}
          fileInputRef={fileInputRef}
          onAvatarChange={handleAvatarChange}
          onPickAvatar={handlePickAvatar}
          handleInput={handleInput}
          setHandleInput={setHandleInput}
          handleStatus={handleStatus}
          handleSaving={handleSaving}
          handleError={handleError}
          onClaimHandle={handleClaimHandle}
          onSavedChange={setSaved}
        />
      )}

      {effectiveTab === 'perfil-publico' && (
        <PerfilPublicoTab
          handle={handle}
          handleInput={handleInput}
          setHandleInput={setHandleInput}
          handleStatus={handleStatus}
          handleSaving={handleSaving}
          handleError={handleError}
          onClaimHandle={handleClaimHandle}
          visibility={visibility}
          setVisibility={setVisibility}
          showProgress={showProgress}
          setShowProgress={setShowProgress}
          visibilitySaving={visibilitySaving}
          visibilitySaved={visibilitySaved}
          onSaveVisibility={handleSaveVisibility}
        />
      )}

      {effectiveTab === 'conquistas' && <ConquistasTab myStats={myStats} />}

      {effectiveTab === 'depoimentos' && handle && (
        <DepoimentosTab
          pendingTestimonials={pendingTestimonials}
          approvedTestimonials={approvedTestimonials}
          onApprove={handleApprove}
          onReject={handleReject}
          onRemove={handleRemoveTestimonial}
        />
      )}

      {effectiveTab === 'privacidade' && (
        <PrivacidadeTab
          exportData={exportData}
          formId={formId}
          isCriador={isCriador}
        />
      )}
    </DashboardPageShell>
  )
}
