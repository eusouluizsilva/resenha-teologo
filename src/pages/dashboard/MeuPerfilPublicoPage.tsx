import { useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useCurrentAppUser } from '@/lib/currentUser'
import { DashboardPageShell } from '@/components/dashboard/PageShell'
import { brandInputClass, brandPrimaryButtonClass, brandPanelSoftClass, cn } from '@/lib/brand'
import type { Id } from '../../../convex/_generated/dataModel'

function PendingTestimonialCard({
  id,
  text,
  authorName,
  createdAt,
  onApprove,
  onReject,
}: {
  id: Id<'testimonials'>
  text: string
  authorName: string
  createdAt: number
  onApprove: (id: Id<'testimonials'>) => void
  onReject: (id: Id<'testimonials'>) => void
}) {
  const date = new Date(createdAt).toLocaleDateString('pt-BR')
  return (
    <div className="rounded-[1.4rem] border border-white/7 bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{authorName}</p>
          <p className="text-xs text-white/36">{date}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-white/62">{text}</p>
    </div>
  )
}

export function MeuPerfilPublicoPage() {
  const { currentUser, isLoading } = useCurrentAppUser()
  const convexUser = currentUser
  const claimHandle = useMutation(api.handles.claim)
  const updateVisibility = useMutation(api.handles.updateVisibility)
  const approveTestimonial = useMutation(api.testimonials.approve)
  const rejectTestimonial = useMutation(api.testimonials.reject)

  const [handleInput, setHandleInput] = useState('')
  const [handleError, setHandleError] = useState('')
  const [handleSaving, setHandleSaving] = useState(false)

  const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public')
  const [showProgress, setShowProgress] = useState(true)
  const [visibilitySaving, setVisibilitySaving] = useState(false)
  const [visibilitySaved, setVisibilitySaved] = useState(false)

  const isAvailable = useQuery(
    api.handles.isAvailable,
    handleInput.length >= 3 ? { handle: handleInput } : 'skip'
  )

  const pendingTestimonials = useQuery(
    api.testimonials.listPending,
    convexUser?.clerkId ? { profileUserId: convexUser.clerkId } : 'skip'
  )

  useEffect(() => {
    if (convexUser) {
      setVisibility(convexUser.profileVisibility ?? 'public')
      setShowProgress(convexUser.showProgressPublicly ?? true)
    }
  }, [convexUser])

  async function handleClaimHandle(e: React.FormEvent) {
    e.preventDefault()
    setHandleSaving(true)
    setHandleError('')
    try {
      await claimHandle({ handle: handleInput })
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
      setTimeout(() => setVisibilitySaved(false), 2000)
    } catch {
      // noop
    } finally {
      setVisibilitySaving(false)
    }
  }

  async function handleApprove(id: Id<'testimonials'>) {
    try {
      await approveTestimonial({ testimonialId: id })
    } catch {
      // noop
    }
  }

  async function handleReject(id: Id<'testimonials'>) {
    try {
      await rejectTestimonial({ testimonialId: id })
    } catch {
      // noop
    }
  }

  const handle = convexUser?.handle
  const handleInputTrimmed = handleInput.trim()

  const handleStatus = (() => {
    if (handleInputTrimmed.length < 3) return null
    if (isAvailable === undefined) return 'checking'
    if (isAvailable) return 'available'
    return 'taken'
  })()

  return (
    <DashboardPageShell
      eyebrow="Perfil público"
      title="Meu perfil público"
      description="Defina seu handle e controle o que aparece para outros usuários."
      maxWidthClass="max-w-2xl"
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* Handle section */}
          <div className={cn('p-6', brandPanelSoftClass)}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
              Seu handle público
            </p>

            {handle ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">@{handle}</span>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    Ativo
                  </span>
                </div>
                <a
                  href={`/@${handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#F2BD8A] hover:underline"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Ver meu perfil público
                </a>

                <form onSubmit={handleClaimHandle} className="pt-2">
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
                      {handleSaving ? '...' : 'Salvar'}
                    </button>
                  </div>
                  {handleStatus === 'available' && (
                    <p className="mt-1.5 text-xs text-emerald-300">Disponível</p>
                  )}
                  {handleStatus === 'taken' && (
                    <p className="mt-1.5 text-xs text-red-300">Indisponível ou inválido</p>
                  )}
                  {handleError && <p className="mt-1.5 text-xs text-red-300">{handleError}</p>}
                </form>
              </div>
            ) : (
              <form onSubmit={handleClaimHandle} className="mt-4 space-y-3">
                <p className="text-sm text-white/52">
                  Escolha um handle único para seu perfil público. Ele será parte da URL: <span className="text-white/70">resenhadoteologo.com/@seuhandle</span>
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
                {handleStatus === 'available' && (
                  <p className="text-xs text-emerald-300">Disponível</p>
                )}
                {handleStatus === 'taken' && (
                  <p className="text-xs text-red-300">Indisponível ou inválido</p>
                )}
                {handleStatus === 'checking' && (
                  <p className="text-xs text-white/36">Verificando...</p>
                )}
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

          {/* Visibility settings */}
          {handle && (
            <div className={cn('p-6', brandPanelSoftClass)}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
                Privacidade
              </p>

              <div className="mt-4 space-y-4">
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/7 p-4">
                  <div>
                    <p className="text-sm font-medium text-white">Perfil listado publicamente</p>
                    <p className="mt-0.5 text-xs text-white/40">
                      {visibility === 'public' ? 'Seu perfil é acessível via URL pública.' : 'Seu perfil existe, mas não aparece publicamente.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVisibility(visibility === 'public' ? 'unlisted' : 'public')}
                    className={cn(
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                      visibility === 'public' ? 'bg-[#F37E20]' : 'bg-white/14'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200',
                        visibility === 'public' ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/7 p-4">
                  <div>
                    <p className="text-sm font-medium text-white">Mostrar progresso publicamente</p>
                    <p className="mt-0.5 text-xs text-white/40">
                      {showProgress ? 'Outros podem ver seu andamento nos cursos.' : 'Seu progresso nos cursos fica oculto.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProgress(!showProgress)}
                    className={cn(
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                      showProgress ? 'bg-[#F37E20]' : 'bg-white/14'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200',
                        showProgress ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </label>

                <button
                  onClick={handleSaveVisibility}
                  disabled={visibilitySaving}
                  className={cn(brandPrimaryButtonClass, 'w-full py-3')}
                >
                  {visibilitySaving ? 'Salvando...' : visibilitySaved ? 'Salvo.' : 'Salvar configurações'}
                </button>
              </div>
            </div>
          )}

          {/* Pending testimonials */}
          {handle && (
            <div className={cn('p-6', brandPanelSoftClass)}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
                Depoimentos pendentes
              </p>

              {pendingTestimonials === undefined ? (
                <div className="mt-4 flex justify-center">
                  <div className="h-5 w-5 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
                </div>
              ) : pendingTestimonials.length === 0 ? (
                <p className="mt-4 text-sm text-white/36">Nenhum depoimento aguardando aprovação.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {pendingTestimonials.map((t) => (
                    <PendingTestimonialCard
                      key={String(t._id)}
                      id={t._id}
                      text={t.text}
                      authorName={t.authorName}
                      createdAt={t.createdAt}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardPageShell>
  )
}
