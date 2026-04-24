import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { api } from '../../../convex/_generated/api'

// Aceita convites institucionais via /convite/:token. Se o usuário não estiver
// logado, oferece entrar/cadastrar antes de aceitar; se estiver, aceita direto
// e redireciona para o dashboard.

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const invite = useQuery(api.institutions.getInviteByToken, { token: token ?? '' })
  const acceptInvite = useMutation(api.institutions.acceptInvite)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')

  async function handleAccept() {
    if (!token) return
    setAccepting(true)
    setError('')
    try {
      await acceptInvite({ token })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível aceitar o convite.')
    } finally {
      setAccepting(false)
    }
  }

  const isLoading = invite === undefined

  return (
    <div className="min-h-screen bg-[#0F141A] text-white">
      <header className="border-b border-white/6">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/">
            <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-9 w-auto" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">Convite</p>
        <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">Você recebeu um convite</h1>

        {isLoading && (
          <div className="mt-10 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
          </div>
        )}

        {!isLoading && invite === null && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm leading-7 text-red-200">
            Convite inválido, expirado ou já utilizado. Peça ao responsável pela instituição que envie um novo.
          </div>
        )}

        {!isLoading && invite && (
          <div className="mt-8 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/4 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-white/48">Instituição</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-white">{invite.institution.name}</h2>
              <p className="mt-3 text-sm text-white/62">
                Convite enviado para <strong className="text-white/82">{invite.invite.email}</strong>
              </p>
            </div>

            <SignedOut>
              <div className="rounded-2xl border border-white/10 bg-white/4 p-6">
                <p className="text-sm leading-7 text-white/72">
                  Para aceitar este convite, entre na sua conta ou cadastre-se gratuitamente. Em seguida
                  você será vinculado automaticamente à instituição.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to={`/entrar?redirect_url=${encodeURIComponent(`/convite/${token}`)}`}
                    className="rounded-2xl bg-[#F37E20] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#e06e10]"
                  >
                    Entrar
                  </Link>
                  <Link
                    to={`/cadastro?redirect_url=${encodeURIComponent(`/convite/${token}`)}`}
                    className="rounded-2xl border border-white/14 bg-white/4 px-5 py-2.5 text-sm font-semibold text-white/86 transition-all hover:border-white/24 hover:bg-white/8"
                  >
                    Criar conta
                  </Link>
                </div>
              </div>
            </SignedOut>

            <SignedIn>
              <button
                type="button"
                onClick={handleAccept}
                disabled={accepting}
                className="w-full rounded-2xl bg-[#F37E20] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#e06e10] disabled:opacity-50"
              >
                {accepting ? 'Aceitando...' : 'Aceitar convite e entrar na instituição'}
              </button>
              {error && (
                <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                  {error}
                </p>
              )}
            </SignedIn>
          </div>
        )}
      </main>
    </div>
  )
}
