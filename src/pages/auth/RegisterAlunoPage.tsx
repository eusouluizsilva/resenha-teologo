import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignUp } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/motion'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { VerifyStep } from '@/components/auth/VerifyStep'
import { clerkErrorMessage } from '@/lib/auth'

const inputClass =
  'w-full bg-[#0F141A] border border-[#2A313B] focus:border-[#F37E20] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors duration-200'

export function RegisterAlunoPage() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const navigate = useNavigate()

  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      await signUp.create({
        firstName: form.firstName,
        lastName: form.lastName,
        emailAddress: form.email,
        password: form.password,
        unsafeMetadata: { perfil: 'aluno' },
      })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStep('verify')
    } catch (err) {
      setError(clerkErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(code: string) {
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
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

  async function handleResend() {
    if (!isLoaded) return
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
    } catch {}
  }

  async function handleOAuth(strategy: 'oauth_google' | 'oauth_facebook') {
    if (!isLoaded) return
    sessionStorage.setItem('signup_perfil', 'aluno')
    await signUp.authenticateWithRedirect({
      strategy,
      redirectUrl: `${window.location.origin}/sso-callback`,
      redirectUrlComplete: '/dashboard/aluno',
    })
  }

  return (
    <AuthLayout>
      <motion.div variants={fadeUp} className="mb-8">
        <Link
          to="/cadastro"
          className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>
        <h1 className="font-display font-bold text-2xl mb-1">Criar conta de aluno</h1>
        <p className="text-white/50 text-sm">Acesso gratuito a todos os cursos e materiais</p>
      </motion.div>

      {step === 'verify' ? (
        <VerifyStep
          email={form.email}
          onVerify={handleVerify}
          onResend={handleResend}
          loading={loading}
          error={error}
        />
      ) : (
        <motion.div variants={fadeUp} className="bg-[#151B23] border border-[#2A313B] rounded-2xl p-8 space-y-4">
          <OAuthButtons
            onGoogle={() => handleOAuth('oauth_google')}
            onFacebook={() => handleOAuth('oauth_facebook')}
            loading={loading}
          />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#2A313B]" />
            <span className="text-white/30 text-xs">ou cadastre com email</span>
            <div className="flex-1 h-px bg-[#2A313B]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nome" required value={form.firstName} onChange={set('firstName')} className={inputClass} />
              <input type="text" placeholder="Sobrenome" required value={form.lastName} onChange={set('lastName')} className={inputClass} />
            </div>
            <input type="email" placeholder="seu@email.com" required value={form.email} onChange={set('email')} className={inputClass} />
            <input type="password" placeholder="Senha (mínimo 8 caracteres)" required minLength={8} value={form.password} onChange={set('password')} className={inputClass} />

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#F37E20] hover:bg-[#e06e10] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors duration-200 text-sm"
            >
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          <p className="text-center text-xs text-white/30">
            Ao criar sua conta, você concorda com os{' '}
            <Link to="/termos" className="underline hover:text-white/60">Termos de Uso</Link>
            {' '}e{' '}
            <Link to="/privacidade" className="underline hover:text-white/60">Política de Privacidade</Link>.
          </p>
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="text-center mt-6">
        <p className="text-white/40 text-sm">
          Já tem conta?{' '}
          <Link to="/entrar" className="text-[#F37E20] hover:text-[#e06e10] font-medium transition-colors">
            Entrar
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  )
}
