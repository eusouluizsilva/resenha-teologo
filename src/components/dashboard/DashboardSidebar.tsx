import { Link, useLocation } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { brandEyebrowClass, brandPanelSoftClass, cn } from '@/lib/brand'
import { useCurrentAppUser } from '@/lib/currentUser'
import type { UserFunction } from '@/lib/functions'

type NavItem = { label: string; href: string; exact?: boolean; icon: React.ReactNode }

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

const iconFunctions = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
)

const iconShield = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)

const iconPencilSquare = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
)

const iconStack = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
  </svg>
)

const iconChat = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </svg>
)

const iconNewspaper = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
  </svg>
)

const iconSearch = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
)

// Flag para reexibir rotas de Instituição quando elas saírem de placeholder.
// Hoje esconde Membros/Cursos institucionais/Relatórios da sidebar, mas as
// rotas continuam registradas em App.tsx para quem tem a função ativa.
const SHOW_INSTITUTION_NAV = false

type NavItemMaybeAdmin = NavItem & { adminOnly?: boolean }
type NavGroupExt = { label: string; fn: UserFunction; items: NavItemMaybeAdmin[] }

const NAV_GROUPS: NavGroupExt[] = [
  {
    label: 'Aluno',
    fn: 'aluno',
    items: [
      { label: 'Meus estudos', href: '/dashboard/meus-cursos', icon: iconBook },
      { label: 'Caderno', href: '/dashboard/caderno', icon: iconPencilSquare },
      { label: 'Flashcards', href: '/dashboard/flashcards', icon: iconStack },
      { label: 'Certificados', href: '/dashboard/certificados', icon: iconCert },
      { label: 'Catálogo de cursos', href: '/cursos', icon: iconSearch },
      { label: 'Catálogo de artigos', href: '/blog', icon: iconSearch },
    ],
  },
  {
    label: 'Professor',
    fn: 'criador',
    items: [
      { label: 'Meus cursos', href: '/dashboard/cursos', icon: iconBook },
      { label: 'Alunos', href: '/dashboard/alunos', icon: iconMembers },
      { label: 'Perguntas', href: '/dashboard/perguntas', icon: iconChat },
      // Financeiro fica oculto para criadores comuns enquanto Stripe e AdSense
      // ainda nao estao em producao. Reabrir quando o ciclo de pagamento estiver
      // completo (ver feedback_visibilidade_admin na memoria).
      { label: 'Financeiro', href: '/dashboard/financeiro', icon: iconMoney, adminOnly: true },
    ],
  },
  ...(SHOW_INSTITUTION_NAV
    ? [
        {
          label: 'Instituição',
          fn: 'instituicao' as UserFunction,
          items: [
            { label: 'Membros', href: '/dashboard/membros', icon: iconMembers },
            { label: 'Cursos', href: '/dashboard/cursos-instituicao', icon: iconBook },
            { label: 'Relatórios', href: '/dashboard/relatorios', icon: iconChart },
          ],
        },
      ]
    : []),
]

const ALWAYS_NAV: NavItemMaybeAdmin[] = [
  { label: 'Bíblia', href: '/dashboard/biblia', icon: iconBook },
  { label: 'Meu blog', href: '/dashboard/blog', icon: iconNewspaper },
  { label: 'Meu perfil', href: '/dashboard/perfil', icon: iconUser },
  { label: 'Configurações', href: '/dashboard/funcoes', icon: iconFunctions },
  // Planos fica oculto para usuarios comuns enquanto Stripe nao esta ativo.
  // Reabrir quando os pagamentos estiverem em producao.
  { label: 'Planos', href: '/dashboard/planos', icon: iconPlans, adminOnly: true },
]

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  onNavigate?: () => void
}) {
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
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
}

interface DashboardSidebarProps {
  isMobileOpen?: boolean
  onClose?: () => void
}

export function DashboardSidebar({ isMobileOpen = false, onClose }: DashboardSidebarProps = {}) {
  const { pathname } = useLocation()
  const { clerkUser, currentUser, functions, isLoading } = useCurrentAppUser()
  const { signOut } = useClerk()
  const isAdmin = useQuery(api.admin.amIAdmin, {})

  const displayName =
    clerkUser?.firstName ??
    clerkUser?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ??
    'Usuário'
  const initials =
    ((clerkUser?.firstName?.[0] ?? '') + (clerkUser?.lastName?.[0] ?? '')) ||
    displayName.slice(0, 2).toUpperCase()

  const hasFunctions = functions.length > 0
  const activeGroups = NAV_GROUPS.filter((g) => functions.includes(g.fn)).map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.adminOnly || isAdmin),
  }))
  const alwaysItems = ALWAYS_NAV.filter((i) => !i.adminOnly || isAdmin)

  async function handleSignOut() {
    await signOut({ redirectUrl: '/' })
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-[20rem] flex-col overflow-y-auto border-r border-white/6 bg-[linear-gradient(180deg,rgba(14,19,26,0.98)_0%,rgba(10,14,20,0.98)_100%)] px-5 py-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out lg:top-0 lg:h-screen lg:w-72 lg:translate-x-0 lg:shadow-none',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      <div className="mb-2 flex items-center justify-between lg:hidden">
        <Link to="/" onClick={onClose} className="inline-flex items-center gap-3">
          <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-9 w-auto" />
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar menu"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-white/56 transition-all hover:border-white/14 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="hidden lg:block">
        <Link to="/" className="inline-flex items-center gap-3">
          <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-10 w-auto" />
        </Link>
        <p className={cn('mt-5', brandEyebrowClass)}>Painel da plataforma</p>
        <p className="mt-2 text-sm leading-6 text-white/48">
          Gestão, estudo e formação dentro da mesma identidade visual.
        </p>
      </div>

      <Link
        to={currentUser?.handle ? `/${currentUser.handle}` : '/dashboard/perfil'}
        target={currentUser?.handle ? '_blank' : undefined}
        rel={currentUser?.handle ? 'noopener noreferrer' : undefined}
        onClick={onClose}
        className={cn('mt-6 flex items-center gap-3 p-4 transition-all hover:brightness-110', brandPanelSoftClass)}
      >
        {clerkUser?.imageUrl ? (
          <img
            src={clerkUser.imageUrl}
            alt={displayName}
            className="h-12 w-12 rounded-2xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#F37E20]/16 bg-[#F37E20]/10">
            <span className="text-sm font-semibold text-[#F2BD8A]">{initials}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white">{displayName}</p>
          {isLoading ? (
            <p className="mt-1 text-xs text-white/30">Carregando...</p>
          ) : hasFunctions ? (
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/36">
              {functions.length === 1
                ? functions[0] === 'aluno'
                  ? 'Aluno'
                  : functions[0] === 'criador'
                  ? 'Professor'
                  : 'Instituição'
                : `${functions.length} funções ativas`}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[#F2BD8A]/70">Configurar perfil</p>
          )}
        </div>
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto lg:pr-1">
        {activeGroups.length > 1 ? (
          activeGroups.map((group) => (
            <div key={group.fn} className="mb-2">
              <p className="mb-1.5 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/28">
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onClose} />
              ))}
            </div>
          ))
        ) : activeGroups.length === 1 ? (
          activeGroups[0].items.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onClose} />
          ))
        ) : null}

        {activeGroups.length > 0 && (
          <div className="my-2 border-t border-white/6" />
        )}

        {alwaysItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onClose} />
        ))}

        {isAdmin && (
          <>
            <div className="my-2 border-t border-white/6" />
            <NavLink
              item={{ label: 'Admin', href: '/dashboard/admin', icon: iconShield }}
              pathname={pathname}
              onNavigate={onClose}
            />
          </>
        )}
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
