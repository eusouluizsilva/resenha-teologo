import { useUser } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { UserFunction } from './functions'
import { normalizePerfil } from './perfil'

export function useCurrentAppUser() {
  const { user: clerkUser, isLoaded } = useUser()
  const currentUser = useQuery(api.users.current, clerkUser ? {} : 'skip')
  const userFunctions = useQuery(api.userFunctions.listByUser, clerkUser ? {} : 'skip')

  const activeFunctions: UserFunction[] = (userFunctions ?? []).map(
    (f: { function: string }) => f.function as UserFunction
  )

  const hasFunction = (fn: UserFunction) => activeFunctions.includes(fn)

  const legacyPerfil =
    currentUser?.perfil ??
    normalizePerfil(clerkUser?.unsafeMetadata?.perfil)

  return {
    clerkUser,
    currentUser: currentUser ?? null,
    functions: activeFunctions,
    hasFunction,
    perfil: legacyPerfil,
    isLoading:
      !isLoaded ||
      (Boolean(clerkUser) && (currentUser === undefined || userFunctions === undefined)),
  }
}
