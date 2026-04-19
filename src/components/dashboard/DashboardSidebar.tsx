import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'

type NavItem = { label: string; href: string; exact?: boolean; icon: React.ReactNode }
type Perfil = 'aluno' | 'criador' | 'instituicao'

const iconUser = (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

const iconGrid = (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
)

const iconBook = (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
)

const iconMoney = (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const iconCert = (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
)

const iconMembers = (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
)

const iconChart = (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
)

const navByPerfil: Record<Perfil, NavItem[]> = {
  criador: [
    { label: 'Perfil', href: '/dashboard/perfil', icon: iconUser },
    { label: 'Visão geral', href: '/dashboard', exact: true, icon: iconGrid },
    { label: 'Meus cursos', href: '/dashboard/cursos', icon: iconBook },
    { label: 'Financeiro', href: '/dashboard/financeiro', icon: iconMoney },
  ],
  aluno: [
    { label: 'Perfil', href: '/dashboard/perfil', icon: iconUser },
    { label: 'Visão geral', href: '/dashboard', exact: true, icon: iconGrid },
    { label: 'Meus cursos', href: '/dashboard/meus-cursos', icon: iconBook },
    { label: 'Certificados', href: '/dashboard/certificados', icon: iconCert },
  ],
  instituicao: [
    { label: 'Perfil', href: '/dashboard/perfil', icon: iconUser },
    { label: 'Visão geral', href: '/dashboard', exact: true, icon: iconGrid },
    { label: 'Membros', href: '/dashboard/membros', icon: iconMembers },
    { label: 'Cursos', href: '/dashboard/cursos', icon: iconBook },
    { label: 'Relatórios', href: '/dashboard/relatorios', icon: iconChart },
  ],
}

const perfilOptions: { id: Perfil; label: string; desc: string }[] = [
  { id: 'aluno', label: 'Aluno', desc: 'Acesse cursos e acompanhe seu progresso' },
  { id: 'criador', label: 'Criador de conteúdo', desc: 'Gerencie cursos, aulas e financeiro' },
  { id: 'instituicao', label: 'Igreja ou Instituição', desc: 'Administre membros e relatórios' },
]

export function DashboardSidebar() {
  const { pathname } = useLocation()
  const { user } = useUser()
  const { signOut } = useClerk()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const perfil = ((user?.unsafeMetadata?.perfil as string) ?? 'aluno') as Perfil
  const nav = navByPerfil[perfil] ?? navByPerfil.aluno
  const currentOption = perfilOptions.find((p) => p.id === perfil)

  const displayName = user?.firstName
    ? user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName
    : user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? 'Usuário'

  const initials = (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? user?.firstName?.[1] ?? '')

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSwitchPerfil(newPerfil: Perfil) {
    if (newPerfil === perfil || !user) return
    setSwitching(true)
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, perfil: newPerfil } })
    } finally {
      setSwitching(false)
      setSwitcherOpen(false)
    }
  }

  async function handleSignOut() {
    await signOut({ redirectUrl: '/' })
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#111821] border-r border-white/[0.06] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link to="/">
          <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-7 w-auto opacity-90" />
        </Link>
      </div>

      {/* Profile + Switcher */}
      <div className="px-4 py-4 border-b border-white/[0.06]" ref={dropdownRef}>
        <button
          onClick={() => setSwitcherOpen((v) => !v)}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.04] transition-colors duration-200 group text-left"
        >
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#F37E20]/15 flex items-center justify-center flex-shrink-0">
              <span className="text-[#F37E20] text-sm font-semibold tracking-wide">{initials.toUpperCase() || 'U'}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white/90 truncate leading-tight">{displayName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <p className="text-[11px] text-white/38 truncate leading-tight">{currentOption?.label ?? 'Usuário'}</p>
              <svg className={`w-3 h-3 text-white/30 flex-shrink-0 transition-transform duration-200 ${switcherOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {switcherOpen && (
          <div className="mt-2 rounded-xl border border-white/[0.08] bg-[#151C26] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <p className="px-4 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">Trocar perfil</p>
            {perfilOptions.map((option) => {
              const isActive = option.id === perfil
              return (
                <button
                  key={option.id}
                  onClick={() => handleSwitchPerfil(option.id)}
                  disabled={switching}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors duration-150 ${
                    isActive ? 'bg-[#F37E20]/8' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${isActive ? 'bg-[#F37E20]' : 'bg-white/15'}`} />
                  <div>
                    <p className={`text-[13px] font-medium leading-tight ${isActive ? 'text-[#F37E20]' : 'text-white/70'}`}>
                      {option.label}
                    </p>
                    <p className="text-[11px] text-white/30 mt-0.5 leading-tight">{option.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                active
                  ? 'bg-[#F37E20]/10 text-[#F37E20]'
                  : 'text-white/50 hover:text-white/85 hover:bg-white/[0.04]'
              }`}
            >
              <span className={active ? 'text-[#F37E20]' : 'text-white/35'}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-white/35 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200"
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Sair
        </button>
      </div>
    </aside>
  )
}
