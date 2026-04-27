import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useSignIn } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/components/auth/AuthLayout'
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

function safeRedirectTarget(value: string | null): string {
  if (!value) return '/dashboard'
  if (!value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

type Step = 'login' | 'forgot' | 'forgot-verify' | 'verify-2fa'

export function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = safeRedirectTarget(
    searchParams.get('redirect') ?? searchParams.get('redirect_url'),
  )

  const [step, setStep] = useState<Step>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')

  const aside = useMemo(() => {
    if (step === 'forgot') {
      return {
        eyebrow: 'Recuperação de acesso',
        title: 'Retome sua trilha com a mesma clareza do primeiro acesso.',
        description:
          'A recuperação de senha segue a mesma linguagem sóbria do restante da plataforma, simples o bastante para não criar fricção e segura o bastante para transmitir confiança.',
        highlights: [
          'Fluxo curto, objetivo e fácil de compreender',
          'Linguagem visual consistente com a identidade institucional',
          'Continuidade de estudo sem ruído visual desnecessário',
        ],
        imageSrc: '/fotos/bible-laptop-headphones.jpg',
      }
    }

    if (step === 'verify-2fa') {
      return {
        eyebrow: 'Verificação de acesso',
        title: 'Confirme o código enviado para o seu email.',
        description:
          'Por segurança, enviamos um código para confirmar que é você quem está acessando a partir deste dispositivo.',
        highlights: [
          'Verificação rápida em duas etapas',
          'Proteção contra acessos não reconhecidos',
          'Continuidade segura no ambiente institucional',
        ],
        imageSrc: '/fotos/library-hall.jpg',
      }
    }

    if (step === 'forgot-verify') {
      return {
        eyebrow: 'Nova senha',
        title: 'Confirme o código e volte ao ambiente de estudo.',
        description:
          'O fluxo foi desenhado para reduzir ansiedade e manter a sensação de produto confiável. Cada passo fica claro, com foco total em legibilidade e continuidade.',
        highlights: [
          'Código visual limpo para leitura rápida',
          'Tom premium, sem excesso de elementos',
          'Transição natural de volta ao dashboard',
        ],
        imageSrc: '/fotos/library-hall.jpg',
      }
    }

    return {
      eyebrow: 'Acesso institucional',
      title: 'Entre para retomar seus estudos, cursos ou gestão institucional.',
      description:
        'Alunos continuam o aprendizado. Professores administram seus cursos. Instituições acompanham sua comunidade em um só lugar.',
      highlights: [
        'Ambiente feito para estudo contínuo e leitura prolongada',
        'Identidade editorial premium sem perder clareza de uso',
        'Entrada direta para alunos, professores e instituições',
      ],
      imageSrc: '/fotos/hero-bible.jpg',
    }
  }, [step])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')

    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate(redirectTo)
        return
      }

      if (result.status === 'needs_second_factor') {
        const emailFactor = result.supportedSecondFactors?.find(
          (f) => f.strategy === 'email_code',
        )
        if (emailFactor && 'emailAddressId' in emailFactor) {
          await signIn.prepareSecondFactor({
            strategy: 'email_code',
            emailAddressId: emailFactor.emailAddressId,
          })
          setStep('verify-2fa')
          return
        }
        setError('Verificação de segundo fator necessária, mas não há método disponível.')
        return
      }

      setError('Não foi possível concluir o login. Tente novamente.')
    } catch (err) {
      setError(clerkErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyTwoFactor(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code: twoFactorCode,
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate(redirectTo)
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
        navigate(redirectTo)
      }
    } catch (err) {
      setError(clerkErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      asideEyebrow={aside.eyebrow}
      asideTitle={aside.title}
      asideDescription={aside.description}
      highlights={aside.highlights}
      imageSrc={aside.imageSrc}
    >
      <motion.div variants={fadeUp}>
        {step !== 'login' && (
          <button
            type="button"
            onClick={() => {
              setStep('login')
              setError('')
            }}
            className={cn('mb-6', brandGhostButtonClass)}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
        )}

        <p className={brandEyebrowClass}>
          {step === 'login' && 'Entrar'}
          {step === 'forgot' && 'Recuperar senha'}
          {step === 'forgot-verify' && 'Confirmar código'}
          {step === 'verify-2fa' && 'Verificação por email'}
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white">
          {step === 'login' && 'Bem-vindo de volta'}
          {step === 'forgot' && 'Receba seu código de recuperação'}
          {step === 'forgot-verify' && 'Defina sua nova senha'}
          {step === 'verify-2fa' && 'Confirme sua identidade'}
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-7 text-white/58">
          {step === 'login' && 'Acesse sua conta e volte ao seu ambiente de estudo.'}
          {step === 'forgot' && 'Digite seu email para continuar com um fluxo simples, claro e seguro.'}
          {step === 'forgot-verify' && `Digite o código enviado para ${email} e escolha a nova senha.`}
          {step === 'verify-2fa' && `Enviamos um código para ${email}. Use-o para concluir o acesso.`}
        </p>
      </motion.div>

      {step === 'login' && (
        <motion.div variants={fadeUp} className={cn('mt-8 space-y-4 p-6 sm:p-7', brandPanelSoftClass)}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Email</label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={brandInputClass}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-white/72">Senha</label>
                <button
                  type="button"
                  onClick={() => {
                    setStep('forgot')
                    setError('')
                  }}
                  className="text-xs font-medium text-[#F2BD8A] transition-colors hover:text-white"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Sua senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={brandInputClass}
              />
            </div>

            {error && <p className="text-xs text-red-300">{error}</p>}

            <button type="submit" disabled={loading} className={cn('mt-2 w-full', brandPrimaryButtonClass)}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </motion.div>
      )}

      {step === 'forgot' && (
        <motion.div variants={fadeUp} className={cn('mt-8 space-y-4 p-6 sm:p-7', brandPanelSoftClass)}>
          <form onSubmit={handleForgotSend} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Email</label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={brandInputClass}
              />
            </div>

            {error && <p className="text-xs text-red-300">{error}</p>}

            <button type="submit" disabled={loading} className={cn('mt-2 w-full', brandPrimaryButtonClass)}>
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        </motion.div>
      )}

      {step === 'forgot-verify' && (
        <motion.div variants={fadeUp} className={cn('mt-8 space-y-4 p-6 sm:p-7', brandPanelSoftClass)}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Código de verificação</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                required
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={cn('text-center font-display text-3xl font-bold tracking-[0.45em]', brandInputClass)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Nova senha</label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={brandInputClass}
              />
            </div>

            {error && <p className="text-xs text-red-300">{error}</p>}

            <button type="submit" disabled={loading} className={cn('mt-2 w-full', brandPrimaryButtonClass)}>
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>
        </motion.div>
      )}

      {step === 'verify-2fa' && (
        <motion.div variants={fadeUp} className={cn('mt-8 space-y-4 p-6 sm:p-7', brandPanelSoftClass)}>
          <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/72">Código de verificação</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                required
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={cn('text-center font-display text-3xl font-bold tracking-[0.45em]', brandInputClass)}
              />
            </div>

            {error && <p className="text-xs text-red-300">{error}</p>}

            <button type="submit" disabled={loading} className={cn('mt-2 w-full', brandPrimaryButtonClass)}>
              {loading ? 'Verificando...' : 'Confirmar e entrar'}
            </button>
          </form>
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="mt-8 text-center">
        <p className="text-sm text-white/44">
          Não tem conta?{' '}
          <Link
            to={redirectTo === '/dashboard' ? '/cadastro' : `/cadastro?redirect=${encodeURIComponent(redirectTo)}`}
            className="font-semibold text-[#F2BD8A] transition-colors hover:text-white"
          >
            Criar conta grátis
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  )
}
