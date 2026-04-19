import { useUser } from '@clerk/clerk-react'

export function useCreatorId(): string | null {
  const { user, isLoaded } = useUser()
  if (!isLoaded || !user) return null
  return user.id
}
