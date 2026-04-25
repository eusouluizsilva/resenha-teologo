import { useUser } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

// Retorna true apenas quando confirmamos que o usuário tem isPremium === true
// no Convex. Para visitantes anônimos ou enquanto a query carrega, retorna
// false (comportamento conservador: ad aparece até confirmar premium, evitando
// flicker reverso quando o usuário recarrega).
export function useIsPremium(): boolean {
  const { user: clerkUser } = useUser()
  const me = useQuery(api.users.current, clerkUser ? {} : 'skip')
  return Boolean(me?.isPremium)
}
