import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useSignUp } from '@clerk/clerk-react'
import { useMutation } from 'convex/react'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { VerifyStep } from '@/components/auth/VerifyStep'
import { fadeUp } from '@/lib/motion'
import {
  brandEyebrowClass,
  brandInputClass,
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

const FUNCTION_OPTIONS: {
  id: UserFunction
  title: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    id: 'aluno',
    title: 'Aluno',
    description: 'Acesse cursos, acompanhe progresso e receba certificados.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'criador',
    title: 'Professor',
    description: 'Publique cursos, organize módulos e acompanhe sua audiência.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    id: 'instituicao',
    title: 'Igreja ou instituição',
    description: 'Gerencie membros e acompanhe a formação coletiva.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
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
  const enableFunction = useMutation(api.userFunctions.enable)

  // Captura codigo de indicacao do link (?ref=CODIGO) e armazena em
  // localStorage. Sera consumido pelo AuthSyncGate logo apos o usuario
  // ser criado no Convex (mutation referrals.linkOnSignup). Persiste entre
  // navegacoes do fluxo de cadastro/SSO.
  useEffect(() => {
    const ref = searchParams.get('ref')?.trim().toUpperCase()
    if (ref && ref.length >= 4 && ref.length <= 12) {
      try {
        window.localStorage.setItem('rdt_ref_code', ref)
      } catch {
        /* localStorage indisponivel */
      }
    }
  }, [searchParams])

  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLParagraphElement | null>(null)

  useEffect(() => {
    if (!error || step !== 'form') return
    errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    errorRef.current?.focus()
  }, [error, step])
  const [selectedFunction, setSelectedFunction] = useState<UserFunction>(
    perfilHint ?? 'aluno',
  )

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

    // Validação client-side antes de enviar ao Clerk: feedback imediato e
    // economiza um round-trip que retornaria a mesma mensagem.
    const trimmedFirst = form.firstName.trim()
    const trimmedLast = form.lastName.trim()
    if (!trimmedFirst || !trimmedLast) {
      setError('Informe nome e sobrenome.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      setError('Email inválido.')
      return
    }
    if (form.password.length < 8) {
      setError('Senha deve ter ao menos 8 caracteres.')
      return
    }
    if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      setError('Senha deve conter letras e números.')
      return
    }
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
          perfilHint: selectedFunction,
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
        // Registra aceite dos Termos e ativa a função escolhida no cadastro.
        // Falhas aqui são silenciosas: a auth já está concluída e a função
        // pode ser ativada depois em /dashboard/funcoes.
        try {
          await recordConsent({
            type: 'geral',
            documentVersion: DOCUMENT_VERSION,
            userAgent: navigator.userAgent,
          })
        } catch {
          // noop
        }
        try {
          await enableFunction({ function: selectedFunction })
          await recordConsent({
            type: selectedFunction,
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
          'Você pode alterar sua função depois em Configurações',
          'Aluno, professor ou instituição: tudo no mesmo ambiente',
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
      asideDescription="Escolha como vai usar a plataforma. Você pode alterar isso depois em Configurações."
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
          Crie sua conta para acessar a plataforma. Escolha como vai usar a partir do primeiro acesso.
        </p>
      </motion.div>

      <motion.form
        variants={fadeUp}
        onSubmit={handleSubmit}
        className="mt-8 space-y-4"
        autoComplete="off"
      >
        <div>
          <label className="mb-2 block text-xs font-medium text-white/52">
            Como você vai usar a plataforma
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            {FUNCTION_OPTIONS.map((opt) => {
              const active = selectedFunction === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedFunction(opt.id)}
                  className={cn(
                    'flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-all duration-200',
                    active
                      ? 'border-[#F37E20]/28 bg-[#F37E20]/8'
                      : 'border-white/8 bg-white/[0.02] hover:border-white/14 hover:bg-white/[0.04]',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl border transition-all',
                      active
                        ? 'border-[#F37E20]/22 bg-[#F37E20]/10 text-[#F2BD8A]'
                        : 'border-white/8 bg-white/[0.03] text-white/40',
                    )}
                  >
                    {opt.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{opt.title}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-white/44">{opt.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] leading-5 text-white/36">
            Você pode alterar ou ativar funções adicionais depois em Configurações.
          </p>
        </div>

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
          <p
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            aria-live="polite"
            className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300 outline-none"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !form.termsAccepted}
          className={cn(brandPrimaryButtonClass, 'flex w-full items-center justify-center gap-2 py-3.5')}
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Criando conta...
            </>
          ) : (
            'Criar conta'
          )}
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
