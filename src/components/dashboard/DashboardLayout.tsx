import { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { DashboardSidebar } from './DashboardSidebar'
import { brandIconBadgeClass, brandPanelClass, brandPrimaryButtonClass, cn } from '@/lib/brand'
import { useCurrentAppUser } from '@/lib/currentUser'
import { normalizePerfil } from '@/lib/perfil'

export function DashboardLayout() {
  const { user, isLoaded } = useUser()
  const [timedOut, setTimedOut] = useState(false)
  const { functions, isLoading } = useCurrentAppUser()
  const migrateFromPerfil = useMutation(api.userFunctions.migrateFromPerfil)

  useEffect(() => {
    if (isLoaded) return
    const t = setTimeout(() => setTimedOut(true), 10000)
    return () => clearTimeout(t)
  }, [isLoaded])

  useEffect(() => {
    if (isLoading || functions.length > 0) return

    const metadata = user?.unsafeMetadata as Record<string, unknown> | undefined
    if (metadata?.perfil) {
      const legacyPerfil = normalizePerfil(metadata.perfil)
      migrateFromPerfil({ perfil: legacyPerfil }).catch(() => {})
    }
  }, [isLoading, functions.length, user, migrateFromPerfil])

  if (!isLoaded) {
    if (timedOut) {
      return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F141A] px-6 text-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[12%] top-[14%] h-56 w-56 rounded-full bg-[#F37E20]/10 blur-[120px]" />
            <div className="absolute right-[8%] top-[16%] h-72 w-72 rounded-full bg-white/4 blur-[140px]" />
          </div>
          <div className={cn('relative z-10 max-w-lg p-8 text-center', brandPanelClass)}>
            <div className={cn('mx-auto mb-5', brandIconBadgeClass)}>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Falha ao carregar autenticação</h1>
            <p className="mt-3 text-sm leading-7 text-white/56">
              Recarregue a página para restabelecer a sessão. Se o problema persistir, faça login novamente.
            </p>
            <button onClick={() => window.location.reload()} className={cn('mt-6', brandPrimaryButtonClass)}>
              Tentar novamente
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F141A]">
        <div className="absolute left-[12%] top-[14%] h-56 w-56 rounded-full bg-[#F37E20]/10 blur-[120px]" />
        <div className="absolute right-[8%] top-[16%] h-72 w-72 rounded-full bg-white/4 blur-[140px]" />
        <div className="relative h-10 w-10 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/entrar" replace />

  return (
    <div className="min-h-screen bg-[#0B1016] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-[#F37E20]/8 blur-[140px]" />
        <div className="absolute right-[-10rem] top-20 h-[28rem] w-[28rem] rounded-full bg-[#1E2430] blur-[170px]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,19,0.28)_0%,rgba(11,16,22,0)_26%,rgba(11,16,22,0.72)_100%)]" />
      </div>

      <DashboardSidebar />

      <main className="relative min-h-screen lg:pl-72">
        <div className="relative min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="relative min-h-[calc(100vh-4rem)] rounded-[2rem] border border-white/7 bg-[linear-gradient(180deg,rgba(13,18,24,0.92)_0%,rgba(10,14,20,0.96)_100%)] shadow-[0_30px_120px_rgba(0,0,0,0.25)]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
