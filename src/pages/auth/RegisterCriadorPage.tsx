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

export function RegisterCriadorPage() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const navigate = useNavigate()

  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    canalNome: '',
    youtubeUrl: '',
  })

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
        unsafeMetadata: {
          perfil: 'criador',
          canalNome: form.canalNome,
          youtubeUrl: form.youtubeUrl || null,
        },
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
      maxWidth="max-w-2xl"
      asideEyebrow="Perfil do criador"
      asideTitle="Publique com uma presença visual à altura do seu conteúdo."
      asideDescription="O cadastro do criador agora parece continuação de uma plataforma premium. A proposta transmite mais autoridade, mais organização e menos estética de ferramenta genérica."
      highlights={[
        'Fluxo pensado para quem ensina com autoridade',
        'Tom visual mais institucional e menos promocional',
        'Base pronta para cursos, aulas, repasse e crescimento',
      ]}
      quote="“Quando a interface respeita o conteúdo, o criador também é percebido com mais estatura.”"
      quoteReference="Direção visual"
      imageSrc="/fotos/creator-recording.jpg"
    >
      <motion.div variants={fadeUp}>
        <Link to="/cadastro" className={cn('mb-6', brandGhostButtonClass)}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>

        <p className={brandEyebrowClass}>Cadastro do criador</p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white">
          {step === 'verify' ? 'Confirme seu email' : 'Criar conta de criador'}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-white/58">
          {step === 'verify'
            ? 'Seu acesso ficará pronto assim que o código de verificação for confirmado.'
            : 'O novo shell valoriza melhor seu papel dentro da plataforma e prepara a transição para o painel de cursos.'}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Email</label>
                <input type="email" placeholder="seu@email.com" required value={form.email} onChange={set('email')} className={brandInputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/72">Senha</label>
                <input type="password" placeholder="Mínimo 8 caracteres" required minLength={8} value={form.password} onChange={set('password')} className={brandInputClass} />
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-white/8 bg-black/10 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F2BD8A]">Sobre seu canal ou ministério</p>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/72">Nome do canal ou ministério</label>
                  <input
                    type="text"
                    placeholder="Ex: Resenha do Teólogo"
                    required
                    value={form.canalNome}
                    onChange={set('canalNome')}
                    className={brandInputClass}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-white/72">Link do YouTube</label>
                    <span className="text-xs text-white/32">Opcional</span>
                  </div>
                  <input
                    type="url"
                    placeholder="https://youtube.com/@seucanal"
                    value={form.youtubeUrl}
                    onChange={set('youtubeUrl')}
                    className={brandInputClass}
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-red-300">{error}</p>}

            <button type="submit" disabled={loading} className={cn('mt-2 w-full', brandPrimaryButtonClass)}>
              {loading ? 'Criando conta...' : 'Criar conta de criador'}
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
