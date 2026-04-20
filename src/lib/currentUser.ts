import { useUser } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { normalizePerfil } from './perfil'

export function useCurrentAppUser() {
  const { user: clerkUser, isLoaded } = useUser()
  const currentUser = useQuery(api.users.current, clerkUser ? {} : 'skip')

  return {
    clerkUser,
    currentUser: currentUser ?? null,
    perfil: currentUser?.perfil ?? normalizePerfil(clerkUser?.unsafeMetadata?.perfil),
    isLoading: !isLoaded || (Boolean(clerkUser) && currentUser === undefined),
  }
}
