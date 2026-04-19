import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthenticateWithRedirectCallback, useUser } from '@clerk/clerk-react'

function PostAuthRedirect() {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoaded || !user) return
    const perfil = user.unsafeMetadata?.perfil as string | undefined
    if (perfil === 'criador' || perfil === 'aluno' || perfil === 'instituicao') {
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/cadastro', { replace: true })
    }
  }, [isLoaded, user, navigate])

  return null
}

export function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-[#0F141A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-white/40">
        <div className="w-8 h-8 border-2 border-[#F37E20]/30 border-t-[#F37E20] rounded-full animate-spin" />
        <p className="text-sm">Autenticando...</p>
      </div>
      <AuthenticateWithRedirectCallback />
      <PostAuthRedirect />
    </div>
  )
}
