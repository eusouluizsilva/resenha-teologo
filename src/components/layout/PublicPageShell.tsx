import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import type { ReactNode } from 'react'
import { Navbar } from './Navbar'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { NotificationsBell } from '@/components/dashboard/NotificationsBell'
import { cn } from '@/lib/brand'

// Wrapper para rotas publicas (blog, catalogo, sobre, curso, aula preview).
// Quando o usuario esta deslogado, renderiza a Navbar publica padrao.
// Quando esta logado, troca pela DashboardSidebar para nao parecer que ele
// "saiu" da plataforma. O conteudo (children) preserva seu proprio background.

interface PublicPageShellProps {
  children: ReactNode
  // Quando true, oculta sidebar/navbar (usado em paginas que ja tem layout proprio,
  // ou para permitir override em situacoes especiais). Default false.
  bare?: boolean
}

export function PublicPageShell({ children, bare = false }: PublicPageShellProps) {
  const { isSignedIn, isLoaded } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    // Fecha o menu mobile ao mudar de rota.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [mobileOpen])

  if (bare) return <>{children}</>

  // Enquanto Clerk nao carregou, renderiza a Navbar publica para nao causar
  // flash do sidebar para visitantes.
  if (!isLoaded || !isSignedIn) {
    return (
      <>
        <Navbar />
        {children}
      </>
    )
  }

  // Usuario logado: sidebar do dashboard a esquerda, conteudo a direita.
  return (
    <div className="min-h-screen">
      {/* Top bar mobile com hamburguer + logo + sino. */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/6 bg-[rgba(10,14,20,0.92)] px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-white/72 transition-all hover:border-white/14 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
        <Link to="/" className="inline-flex items-center">
          <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-8 w-auto" />
        </Link>
        <NotificationsBell />
      </header>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <DashboardSidebar isMobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main id="main-content" className={cn('relative min-h-screen lg:pl-72')}>
        {/* Sino fixo no canto superior direito no desktop, igual DashboardLayout. */}
        <div className="pointer-events-none absolute right-6 top-6 z-30 hidden sm:right-8 sm:top-8 lg:right-12 lg:top-12 lg:block">
          <div className="pointer-events-auto">
            <NotificationsBell />
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
