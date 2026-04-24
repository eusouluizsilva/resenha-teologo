import { useCurrentAppUser } from './currentUser'

// Retorna o clerkId do usuário atual quando ele tem a função "criador" ativa
// (via tabela userFunctions ou legado user.perfil). Usado pelas páginas do
// criador para compor queries que filtram por creatorId.
export function useCreatorId(): string | null {
  const { clerkUser, hasFunction, isLoading } = useCurrentAppUser()
  if (isLoading || !clerkUser || !hasFunction('criador')) return null
  return clerkUser.id
}
