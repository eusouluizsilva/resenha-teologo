import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignUp } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { VerifyStep } from '@/components/auth/VerifyStep'
import { fadeUp } from '@/lib/motion'
import {
  brandEyebrowClass,
  brandGhostButtonClass,
  brandInputClass,
  brandPanelSoftClass,
  brandPrimaryButtonClass,
  cn,
} from '@/lib/brand'
import { clerkErrorMessage } from '@/lib/auth'

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
        navigate('/dashboard')
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
    } catch {
      // noop
    }
  }

  return (
    <AuthLayout
      asideEyebrow="Perfil do aluno"
      asideTitle="Entre para estudar com profundidade, conforto visual e acesso livre."
      asideDescription="O cadastro do aluno agora continua a linguagem editorial da landing. A percepção é de ambiente de estudo sério, não de funil de venda."
      highlights={[
        'Todo o conteúdo continua gratuito para quem quer aprender',
        'Experiência preparada para permanência, leitura e progresso',
        'Certificação vinculada a aproveitamento real, não só consumo',
      ]}
      quote="“A formação começa no primeiro gesto de entrada.”"
      quoteReference="Resenha do Teólogo"
      imageSrc="/fotos/bible-laptop-headphones.jpg"
    >
      <motion.div variants={fadeUp}>
        <Link to="/cadastro" className={cn('mb-6', brandGhostButtonClass)}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>

        <p className={brandEyebrowClass}>Cadastro gratuito</p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white">
          {step === 'verify' ? 'Confirme seu email' : 'Criar conta de aluno'}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-white/58">
          {step === 'verify'
            ? 'Falta só a verificação para você entrar no ambiente de estudo.'
            : 'A nova linguagem visual reforça credibilidade e acolhimento sem transformar o fluxo em algo pesado.'}
        </p>
      </motion.div>

      {step === 'verify' ? (
        <div className="mt-8">
          <VerifyStep
            email={form.email}
            onVerify={handleVerify}
            onResend={handleResend}
            loading={loading}
            error={error}
          />
        </div>
      ) : (
        <motion.div variants={fadeUp} className={cn('mt-8 space-y-5 p-6 sm:p-7', brandPanelSoftClass)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Nome</label>
                <input type="text" placeholder="Seu nome" required value={form.firstName} onChange={set('firstName')} className={brandInputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Sobrenome</label>
                <input type="text" placeholder="Seu sobrenome" required value={form.lastName} onChange={set('lastName')} className={brandInputClass} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Email</label>
              <input type="email" placeholder="seu@email.com" required value={form.email} onChange={set('email')} className={brandInputClass} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Senha</label>
              <input type="password" placeholder="Mínimo 8 caracteres" required minLength={8} value={form.password} onChange={set('password')} className={brandInputClass} />
            </div>

            {error && <p className="text-xs text-red-300">{error}</p>}

            <button type="submit" disabled={loading} className={cn('mt-2 w-full', brandPrimaryButtonClass)}>
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          <p className="text-center text-xs leading-6 text-white/36">
            Ao criar sua conta, você concorda com os{' '}
            <Link to="/termos" className="underline underline-offset-2 transition-colors hover:text-white/62">Termos de Uso</Link>
            {' '}e a{' '}
            <Link to="/privacidade" className="underline underline-offset-2 transition-colors hover:text-white/62">Política de Privacidade</Link>.
          </p>
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="mt-8 text-center">
        <p className="text-sm text-white/44">
          Já tem conta?{' '}
          <Link to="/entrar" className="font-semibold text-[#F2BD8A] transition-colors hover:text-white">
            Entrar
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  )
}
