import { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { DashboardSidebar } from './DashboardSidebar'

export function DashboardLayout() {
  const { user, isLoaded } = useUser()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (isLoaded) return
    const t = setTimeout(() => setTimedOut(true), 10000)
    return () => clearTimeout(t)
  }, [isLoaded])

  if (!isLoaded) {
    if (timedOut) {
      return (
        <div className="min-h-screen bg-[#0F141A] flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-white font-semibold">Falha ao carregar autenticacao</p>
          <p className="text-white/50 text-sm max-w-sm">
            Tente recarregar a pagina. Se o problema persistir, faca login novamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-5 py-2.5 bg-[#F37E20] hover:bg-[#e06e10] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-[#0F141A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F37E20]/30 border-t-[#F37E20] rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/entrar" replace />

  return (
    <div className="min-h-screen bg-[#0F141A] text-white flex">
      <DashboardSidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
