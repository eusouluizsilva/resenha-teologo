import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignIn } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { clerkErrorMessage } from '@/lib/auth'

const inputClass =
  'w-full bg-[#0F141A] border border-[#2A313B] focus:border-[#F37E20] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors duration-200'

type Step = 'login' | 'forgot' | 'forgot-verify'

export function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        const perfil = (result.userData as any)?.unsafeMetadata?.perfil ?? 'aluno'
        navigate(`/dashboard/${perfil}`)
      }
    } catch (err) {
      setError(clerkErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotSend(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email })
      setStep('forgot-verify')
    } catch (err) {
      setError(clerkErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password: newPassword,
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate('/dashboard/aluno')
      }
    } catch (err) {
      setError(clerkErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(strategy: 'oauth_google' | 'oauth_facebook') {
    if (!isLoaded) return
    await signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: `${window.location.origin}/sso-callback`,
      redirectUrlComplete: '/dashboard/aluno',
    })
  }

  return (
    <div className="min-h-screen bg-[#0F141A] flex items-center justify-center px-6 py-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#F37E20]/4 rounded-full blur-[100px]" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <motion.div variants={fadeUp} className="text-center mb-10">
          <Link to="/">
            <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-28 w-auto mx-auto mb-8" />
          </Link>

          {step === 'login' && (
            <>
              <h1 className="font-display font-bold text-2xl mb-2">Bem-vindo de volta</h1>
              <p className="text-white/50 text-sm">Entre na sua conta para continuar</p>
            </>
          )}
          {step === 'forgot' && (
            <>
              <button onClick={() => { setStep('login'); setError('') }} className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </button>
              <h1 className="font-display font-bold text-2xl mb-2">Recuperar senha</h1>
              <p className="text-white/50 text-sm">Digite seu email para receber o código de recuperação</p>
            </>
          )}
          {step === 'forgot-verify' && (
            <>
              <h1 className="font-display font-bold text-2xl mb-2">Nova senha</h1>
              <p className="text-white/50 text-sm">Digite o código enviado para <span className="text-white/80">{email}</span></p>
            </>
          )}
        </motion.div>

        {step === 'login' && (
          <motion.div variants={fadeUp} className="bg-[#151B23] border border-[#2A313B] rounded-2xl p-8 space-y-4">
            <OAuthButtons
              onGoogle={() => handleOAuth('oauth_google')}
              onFacebook={() => handleOAuth('oauth_facebook')}
              loading={loading}
            />

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#2A313B]" />
              <span className="text-white/30 text-xs">ou</span>
              <div className="flex-1 h-px bg-[#2A313B]" />
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#F37E20] hover:bg-[#e06e10] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors duration-200 text-sm"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <button
              onClick={() => { setStep('forgot'); setError('') }}
              className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Esqueceu a senha?
            </button>
          </motion.div>
        )}

        {step === 'forgot' && (
          <motion.div variants={fadeUp} className="bg-[#151B23] border border-[#2A313B] rounded-2xl p-8 space-y-4">
            <form onSubmit={handleForgotSend} className="space-y-3">
              <input
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#F37E20] hover:bg-[#e06e10] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors duration-200 text-sm"
              >
                {loading ? 'Enviando...' : 'Enviar código de recuperação'}
              </button>
            </form>
          </motion.div>
        )}

        {step === 'forgot-verify' && (
          <motion.div variants={fadeUp} className="bg-[#151B23] border border-[#2A313B] rounded-2xl p-8 space-y-4">
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Código de 6 dígitos"
                required
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`${inputClass} text-center tracking-[0.4em] font-display`}
              />
              <input
                type="password"
                placeholder="Nova senha (mínimo 8 caracteres)"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#F37E20] hover:bg-[#e06e10] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors duration-200 text-sm"
              >
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          </motion.div>
        )}

        <motion.div variants={fadeUp} className="text-center mt-6">
          <p className="text-white/40 text-sm">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-[#F37E20] hover:text-[#e06e10] font-medium transition-colors">
              Criar conta grátis
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
