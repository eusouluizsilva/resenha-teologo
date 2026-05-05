import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useCurrentAppUser } from '@/lib/currentUser'
import { cn } from '@/lib/brand'

// Bottom navigation para mobile (<lg). Substitui o sidebar slide-out como
// modo principal de navegação por toque. Mostra atalhos contextualizados
// pelo perfil ativo: aluno vê Início/Cursos/Caderno/Bíblia/Perfil (5);
// criador vê Painel/Cursos/Alunos/Perfil (4).

type Item = {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

const ALUNO_ITEMS: Item[] = [
  {
    to: '/dashboard',
    label: 'Início',
    end: true,
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    to: '/dashboard/meus-cursos',
    label: 'Cursos',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    to: '/dashboard/caderno',
    label: 'Caderno',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    to: '/biblia',
    label: 'Bíblia',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h13.5c.621 0 1.125.504 1.125 1.125v15.5a.625.625 0 01-.875.575l-7.625-3.375L3.75 21V4.875z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/perfil',
    label: 'Perfil',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
]

const CRIADOR_ITEMS: Item[] = [
  {
    to: '/dashboard',
    label: 'Painel',
    end: true,
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/cursos',
    label: 'Cursos',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    to: '/dashboard/alunos',
    label: 'Alunos',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/perfil',
    label: 'Perfil',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
]

export function MobileBottomNav() {
  const { functions } = useCurrentAppUser()
  const { pathname } = useLocation()

  // Esconde em interfaces de leitura/foco onde a barra atrapalha:
  // - leitor bíblico (capítulo)
  // - aula (interna ou preview)
  // - leitura de artigo individual
  // - editores do criador
  if (
    pathname.startsWith('/biblia/') ||
    pathname.includes('/aula/') ||
    /^\/blog\/[^/]+\/[^/]+/.test(pathname) ||
    pathname.startsWith('/dashboard/cursos/novo') ||
    pathname.startsWith('/dashboard/cursos/editar') ||
    pathname.startsWith('/dashboard/blog/') ||
    pathname.startsWith('/dashboard/admin')
  ) {
    return null
  }

  const isCriador = functions.includes('criador')
  const isInstituicao = functions.includes('instituicao')
  const items = isCriador || isInstituicao ? CRIADOR_ITEMS : ALUNO_ITEMS
  // grid-cols-* dinâmico: aluno tem 5, criador/instituição 4. Tailwind 4 não
  // resolve a partir de string template, então mapeamos explicitamente.
  const colsClass = items.length === 5 ? 'grid-cols-5' : 'grid-cols-4'

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[rgba(10,14,20,0.95)] backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className={cn('grid', colsClass)}>
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center gap-1 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors',
                  isActive ? 'text-[#F2BD8A]' : 'text-white/52 hover:text-white/76',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 top-0 h-[2px] rounded-b-full bg-[#F37E20]"
                    />
                  )}
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-2xl transition-all',
                      isActive
                        ? 'bg-[#F37E20]/10 text-[#F2BD8A]'
                        : 'text-white/52',
                    )}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
