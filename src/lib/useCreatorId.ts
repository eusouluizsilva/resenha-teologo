import { useCurrentAppUser } from './currentUser'

export function useCreatorId(): string | null {
  const { clerkUser, perfil, isLoading } = useCurrentAppUser()
  if (isLoading || !clerkUser || perfil !== 'criador') return null
  return clerkUser.id
}
