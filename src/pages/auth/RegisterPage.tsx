import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useSignUp } from '@clerk/clerk-react'
import { useMutation } from 'convex/react'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { VerifyStep } from '@/components/auth/VerifyStep'
import { fadeUp } from '@/lib/motion'
import {
  brandEyebrowClass,
  brandInputClass,
  brandPanelSoftClass,
  brandPrimaryButtonClass,
  brandGhostButtonClass,
  cn,
} from '@/lib/brand'
import { clerkErrorMessage } from '@/lib/auth'
import { DOCUMENT_VERSION, type UserFunction } from '@/lib/functions'
import { api } from '../../../convex/_generated/api'

function safeRedirectTarget(value: string | null): string {
  if (!value) return '/dashboard'
  if (!value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}

function parsePerfilHint(value: string | null): UserFunction | null {
  if (value === 'aluno' || value === 'criador' || value === 'instituicao') return value
  return null
}

const COUNTRIES = [
  { code: 'BR', label: 'Brasil', ddi: '+55' },
  { code: 'US', label: 'Estados Unidos', ddi: '+1' },
  { code: 'PT', label: 'Portugal', ddi: '+351' },
  { code: 'AO', label: 'Angola', ddi: '+244' },
  { code: 'MZ', label: 'Moçambique', ddi: '+258' },
  { code: 'CV', label: 'Cabo Verde', ddi: '+238' },
  { code: 'AR', label: 'Argentina', ddi: '+54' },
  { code: 'CA', label: 'Canadá', ddi: '+1' },
  { code: 'DE', label: 'Alemanha', ddi: '+49' },
  { code: 'ES', label: 'Espanha', ddi: '+34' },
  { code: 'FR', label: 'França', ddi: '+33' },
  { code: 'GB', label: 'Reino Unido', ddi: '+44' },
  { code: 'IT', label: 'Itália', ddi: '+39' },
  { code: 'OT', label: 'Outro', ddi: '' },
]

type FormState = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  country: string
  phone: string
  termsAccepted: boolean
}

export function RegisterPage() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = safeRedirectTarget(
    searchParams.get('redirect') ?? searchParams.get('redirect_url'),
  )
  const perfilHint = parsePerfilHint(searchParams.get('perfil'))
  const recordConsent = useMutation(api.consents.record)

  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleOAuth(strategy: 'oauth_google' | 'oauth_facebook') {
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: redirectTo,
      })
    } catch (err) {
      setError(clerkErrorMessage(err))
      setLoading(false)
    }
  }
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'BR',
    phone: '',
    termsAccepted: false,
  })

  const selectedCountry = COUNTRIES.find((c) => c.code === form.country) ?? COUNTRIES[0]

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  function setCheck(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.checked }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (!form.termsAccepted) {
      setError('É necessário aceitar os Termos e a Política de Privacidade para criar sua conta.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await signUp.create({
        firstName: form.firstName,
        lastName: form.lastName,
        emailAddress: form.email,
        password: form.password,
        unsafeMetadata: {
          country: form.country,
          phone: form.phone || null,
          phoneCountry: selectedCountry.ddi || null,
          termsVersion: DOCUMENT_VERSION,
          termsAcceptedAt: new Date().toISOString(),
          perfilHint: perfilHint ?? null,
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
        // Registra o aceite dos Termos no banco próprio (além do Clerk metadata).
        // Falha silenciosa porque a auth já está concluída: o registro pode ser
        // reconciliado depois via ação administrativa se necessário.
        try {
          await recordConsent({
            type: 'geral',
            documentVersion: DOCUMENT_VERSION,
            userAgent: navigator.userAgent,
          })
        } catch {
          // noop
        }
        navigate(redirectTo)
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

  if (step === 'verify') {
    return (
      <AuthLayout
        asideEyebrow="Verificação de email"
        asideTitle="Confirme seu endereço de email para ativar sua conta."
        asideDescription="Enviamos um código de 6 dígitos para seu email. Verifique a caixa de entrada e o spam."
        highlights={[
          'Cadastro único para todas as funções da plataforma',
          'Você define como usar a plataforma depois do primeiro acesso',
          'Aluno, criador ou instituição: tudo no mesmo ambiente',
        ]}
        imageSrc="/fotos/bible-laptop-headphones.jpg"
      >
        <VerifyStep
          email={form.email}
          onVerify={handleVerify}
          onResend={handleResend}
          loading={loading}
          error={error}
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      asideEyebrow="Criar conta"
      asideTitle="Uma conta para estudar, publicar e organizar sua comunidade."
      asideDescription="Você decide como usar a plataforma depois do primeiro acesso. Sem compromisso de perfil agora."
      highlights={[
        'Cursos gratuitos para todos os alunos',
        'Professores publicam e acompanham sua audiência',
        'Igrejas e instituições organizam a formação de membros',
      ]}
      imageSrc="/fotos/bible-laptop-headphones.jpg"
    >
      <motion.div variants={fadeUp}>
        <p className={brandEyebrowClass}>Criar conta</p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white">
          Seus dados de acesso
        </h2>
        <p className="mt-3 text-sm leading-7 text-white/58">
          Crie sua conta para acessar a plataforma. Você vai definir suas funções depois do primeiro acesso.
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className={cn('mt-8 space-y-3 p-5 sm:p-6', brandPanelSoftClass)}>
        <OAuthButtons
          onGoogle={() => handleOAuth('oauth_google')}
          onFacebook={() => handleOAuth('oauth_facebook')}
          loading={loading}
        />
        <div className="relative my-1 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/8" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">ou cadastro com email</span>
          <span className="h-px flex-1 bg-white/8" />
        </div>
      </motion.div>

      <motion.form
        variants={fadeUp}
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
        autoComplete="off"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/52">Nome</label>
            <input
              className={brandInputClass}
              placeholder="Seu nome"
              value={form.firstName}
              onChange={set('firstName')}
              required
              autoComplete="given-name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/52">Sobrenome</label>
            <input
              className={brandInputClass}
              placeholder="Seu sobrenome"
              value={form.lastName}
              onChange={set('lastName')}
              required
              autoComplete="family-name"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/52">Email</label>
          <input
            type="email"
            className={brandInputClass}
            placeholder="seu@email.com"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/52">País</label>
          <select
            className={cn(brandInputClass, 'cursor-pointer')}
            value={form.country}
            onChange={set('country')}
            required
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-[#10161E]">
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/52">
            Telefone{' '}
            <span className="font-normal text-white/30">(opcional)</span>
          </label>
          <div className="grid gap-2" style={{ gridTemplateColumns: '5rem 1fr' }}>
            <div className={cn(brandInputClass, 'flex items-center justify-center text-center text-white/50 text-xs')}>
              {selectedCountry.ddi || '+?'}
            </div>
            <input
              type="tel"
              className={brandInputClass}
              placeholder="Número de telefone"
              value={form.phone}
              onChange={set('phone')}
              autoComplete="tel"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/52">Senha</label>
          <input
            type="password"
            className={brandInputClass}
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={set('password')}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/52">Confirmar senha</label>
          <input
            type="password"
            className={brandInputClass}
            placeholder="Repita a senha"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            required
            autoComplete="new-password"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/7 bg-white/[0.025] p-4">
          <input
            type="checkbox"
            checked={form.termsAccepted}
            onChange={setCheck('termsAccepted')}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#F37E20]"
          />
          <span className="text-xs leading-5 text-white/52">
            Declaro que li e concordo com os{' '}
            <Link to="/termos" target="_blank" className="text-[#F2BD8A] hover:text-white underline-offset-2 hover:underline">
              Termos Gerais da Plataforma
            </Link>
            , a{' '}
            <Link to="/privacidade" target="_blank" className="text-[#F2BD8A] hover:text-white underline-offset-2 hover:underline">
              Política de Privacidade
            </Link>{' '}
            e a Política de Cookies.
          </span>
        </label>

        {error && (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !form.termsAccepted}
          className={cn(brandPrimaryButtonClass, 'w-full py-3.5')}
        >
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>

        <Link
          to={redirectTo === '/dashboard' ? '/entrar' : `/entrar?redirect=${encodeURIComponent(redirectTo)}`}
          className={cn(brandGhostButtonClass, 'w-full py-3')}
        >
          Já tenho conta. Entrar
        </Link>
      </motion.form>
    </AuthLayout>
  )
}
