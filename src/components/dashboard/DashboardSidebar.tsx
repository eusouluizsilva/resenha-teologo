import { Link, useLocation } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'
import { brandEyebrowClass, brandPanelSoftClass, cn } from '@/lib/brand'
import { useCurrentAppUser } from '@/lib/currentUser'
import { perfilLabel, type Perfil } from '@/lib/perfil'

type NavItem = { label: string; href: string; exact?: boolean; icon: React.ReactNode }

const iconGrid = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
)

const iconBook = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
)

const iconMoney = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const iconUser = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

const iconCert = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
)

const iconMembers = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
)

const iconChart = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
)

const iconPlans = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
)

const navByPerfil: Record<Perfil, NavItem[]> = {
  criador: [
    { label: 'Visão geral', href: '/dashboard', exact: true, icon: iconGrid },
    { label: 'Meus cursos', href: '/dashboard/cursos', icon: iconBook },
    { label: 'Financeiro', href: '/dashboard/financeiro', icon: iconMoney },
    { label: 'Perfil', href: '/dashboard/perfil', icon: iconUser },
    { label: 'Planos', href: '/dashboard/planos', icon: iconPlans },
  ],
  aluno: [
    { label: 'Visão geral', href: '/dashboard', exact: true, icon: iconGrid },
    { label: 'Meus cursos', href: '/dashboard/meus-cursos', icon: iconBook },
    { label: 'Certificados', href: '/dashboard/certificados', icon: iconCert },
    { label: 'Perfil', href: '/dashboard/perfil', icon: iconUser },
    { label: 'Planos', href: '/dashboard/planos', icon: iconPlans },
  ],
  instituicao: [
    { label: 'Visão geral', href: '/dashboard', exact: true, icon: iconGrid },
    { label: 'Membros', href: '/dashboard/membros', icon: iconMembers },
    { label: 'Cursos', href: '/dashboard/cursos', icon: iconBook },
    { label: 'Relatórios', href: '/dashboard/relatorios', icon: iconChart },
    { label: 'Perfil', href: '/dashboard/perfil', icon: iconUser },
    { label: 'Planos', href: '/dashboard/planos', icon: iconPlans },
  ],
}

export function DashboardSidebar() {
  const { pathname } = useLocation()
  const { clerkUser, perfil } = useCurrentAppUser()
  const { signOut } = useClerk()

  const nav = navByPerfil[perfil]

  const displayName = clerkUser?.firstName ?? clerkUser?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? 'Usuário'
  const initials = displayName.slice(0, 2).toUpperCase()

  async function handleSignOut() {
    await signOut({ redirectUrl: '/' })
  }

  return (
    <aside className="z-40 flex w-full flex-col border-b border-white/6 bg-[linear-gradient(180deg,rgba(14,19,26,0.98)_0%,rgba(10,14,20,0.98)_100%)] px-4 py-4 lg:fixed lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r lg:px-5 lg:py-5">
      <div>
        <Link to="/" className="inline-flex items-center gap-3">
          <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-10 w-auto" />
        </Link>
        <p className={cn('mt-5', brandEyebrowClass)}>Painel da plataforma</p>
        <p className="mt-2 text-sm leading-6 text-white/48">
          Gestão, estudo e formação dentro da mesma identidade visual.
        </p>
      </div>

        <div className={cn('mt-6 p-4', brandPanelSoftClass)}>
        <div className="flex items-center gap-3">
          {clerkUser?.imageUrl ? (
            <img src={clerkUser.imageUrl} alt={displayName} className="h-12 w-12 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F37E20]/16 bg-[#F37E20]/10">
              <span className="text-sm font-semibold text-[#F2BD8A]">{initials}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{displayName}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/28">{perfilLabel[perfil]}</p>
          </div>
        </div>
      </div>

      <nav className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-1 lg:flex-col lg:overflow-y-auto lg:pr-1">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-[1.2rem] border px-4 py-3 text-sm font-medium transition-all duration-200',
                active
                  ? 'border-[#F37E20]/18 bg-[#F37E20]/10 text-white shadow-[0_12px_30px_rgba(243,126,32,0.08)]'
                  : 'border-transparent text-white/56 hover:border-white/8 hover:bg-white/[0.03] hover:text-white',
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl border text-current transition-all duration-200',
                  active
                    ? 'border-[#F37E20]/14 bg-[#F37E20]/10 text-[#F2BD8A]'
                    : 'border-white/8 bg-white/[0.03] text-white/42 group-hover:text-[#F2BD8A]',
                )}
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className={cn('mt-6 p-4', brandPanelSoftClass)}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/28">Sessão</p>
        <button
          onClick={handleSignOut}
          className="mt-3 flex w-full items-center justify-between rounded-[1.1rem] border border-white/8 px-4 py-3 text-sm font-medium text-white/62 transition-all duration-200 hover:border-[#F37E20]/18 hover:bg-[#F37E20]/8 hover:text-white"
        >
          <span>Sair</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
