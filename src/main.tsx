/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect, useMemo, useRef, useState, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react'
import { ConvexReactClient, useMutation } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import type { FunctionArgs } from 'convex/server'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/plus-jakarta-sans/800.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/source-serif-4/400.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/source-serif-4/400-italic.css'
import './index.css'
import App from './App'
import { api } from '@convex/_generated/api'
import { initConsent, applyCurrentConsent } from './lib/consent'
import { initGA4 } from './lib/analytics'
import { initAdSense } from './lib/ads'
import { initMetaPixel } from './lib/metaPixel'
import { initSentry, captureError, setSentryUser } from './lib/sentry'

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack)
    captureError(error, { componentStack: info.componentStack ?? null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F141A] px-6 text-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[12%] top-[14%] h-56 w-56 rounded-full bg-[#F37E20]/10 blur-[120px]" />
            <div className="absolute right-[8%] top-[16%] h-72 w-72 rounded-full bg-white/4 blur-[140px]" />
          </div>
          <div className="relative z-10 max-w-lg rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(13,18,24,0.92)_0%,rgba(10,14,20,0.96)_100%)] p-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.25)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold text-white">Erro inesperado</h1>
            <p className="mt-3 text-sm leading-7 text-white/56">
              Ocorreu um erro ao carregar a plataforma. Recarregue a página para tentar novamente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-2xl bg-[#F37E20] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#E06A10]"
            >
              Recarregar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL

const hasClerk = CLERK_KEY && !CLERK_KEY.includes('COLE_SUA_CHAVE')
const hasConvex = CONVEX_URL && !CONVEX_URL.includes('SEU_URL')

const convex = hasConvex ? new ConvexReactClient(CONVEX_URL) : null

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F141A] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[12%] top-[14%] h-56 w-56 rounded-full bg-[#F37E20]/10 blur-[120px]" />
        <div className="absolute right-[8%] top-[16%] h-72 w-72 rounded-full bg-white/4 blur-[140px]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
        <p className="text-sm text-white/56">{label}</p>
      </div>
    </div>
  )
}

function MissingConfigScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F141A] px-6 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[12%] top-[14%] h-56 w-56 rounded-full bg-[#F37E20]/10 blur-[120px]" />
        <div className="absolute right-[8%] top-[16%] h-72 w-72 rounded-full bg-white/4 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-xl rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(13,18,24,0.92)_0%,rgba(10,14,20,0.96)_100%)] p-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.25)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F37E20]/18 bg-[#F37E20]/10 text-[#F37E20]">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM9.813 3.75h4.374c1.09 0 2.104.57 2.637 1.498l2.187 3.802c.535.928.535 2.07 0 2.998l-2.187 3.802a3.045 3.045 0 01-2.637 1.498H9.813a3.045 3.045 0 01-2.637-1.498L4.989 13.05a3.003 3.003 0 010-2.998l2.187-3.802A3.045 3.045 0 019.813 3.75z" />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-white">Ambiente incompleto</h1>
        <p className="mt-3 text-sm leading-7 text-white/56">
          Defina `VITE_CLERK_PUBLISHABLE_KEY` e `VITE_CONVEX_URL` para carregar autenticação, dashboard e dados em tempo real.
        </p>
      </div>
    </div>
  )
}

function SyncErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F141A] px-6 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[12%] top-[14%] h-56 w-56 rounded-full bg-[#F37E20]/10 blur-[120px]" />
        <div className="absolute right-[8%] top-[16%] h-72 w-72 rounded-full bg-white/4 blur-[140px]" />
      </div>
      <div className="relative z-10 max-w-lg rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(13,18,24,0.92)_0%,rgba(10,14,20,0.96)_100%)] p-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.25)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.732 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-white">Sem conexão com o servidor</h1>
        <p className="mt-3 text-sm leading-7 text-white/56">
          Não foi possível sincronizar sua sessão. Verifique sua internet e tente novamente.
        </p>
        <button
          onClick={onRetry}
          className="mt-6 rounded-2xl bg-[#F37E20] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#E06A10]"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}

function AuthSyncGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const upsertCurrentUser = useMutation(api.users.upsert)
  const linkReferral = useMutation(api.referrals.linkOnSignup)
  const [ready, setReady] = useState(false)
  const [syncFailed, setSyncFailed] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const lastSyncedRef = useRef<string | null>(null)

  const syncPayload = useMemo(() => {
    if (!user) return null

    const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? ''

    const payload: FunctionArgs<typeof api.users.upsert> = {
      clerkId: user.id,
      name: user.fullName?.trim() || email || 'Usuário',
      email,
      avatarUrl: user.imageUrl ?? undefined,
      country:
        typeof user.unsafeMetadata?.country === 'string'
          ? user.unsafeMetadata.country
          : undefined,
      phone:
        typeof user.unsafeMetadata?.phone === 'string'
          ? user.unsafeMetadata.phone
          : undefined,
      phoneCountry:
        typeof user.unsafeMetadata?.phoneCountry === 'string'
          ? user.unsafeMetadata.phoneCountry
          : undefined,
    }

    return {
      fingerprint: [user.id, user.fullName ?? '', email, user.imageUrl ?? ''].join('|'),
      payload,
    }
  }, [user])

  useEffect(() => {
    let cancelled = false

    async function sync() {
      if (!isLoaded) return

      if (!isSignedIn || !syncPayload) {
        lastSyncedRef.current = null
        setSyncFailed(false)
        setSentryUser(null)
        setReady(true)
        return
      }

      setSentryUser({ id: syncPayload.payload.clerkId, email: syncPayload.payload.email })

      if (lastSyncedRef.current === syncPayload.fingerprint) {
        setReady(true)
        return
      }

      setReady(false)
      setSyncFailed(false)

      // Retry com backoff: 3 tentativas (0, 350ms, 900ms). Não liberamos o app
      // com estado inconsistente, queries dependem do upsert ter rodado antes.
      // Atrasos curtos porque o cenário de falha mais comum é a propagação do
      // JWT do Clerk no Convex logo após login, que estabiliza em milissegundos.
      const delays = [0, 350, 900]
      let lastError: unknown = null
      for (let i = 0; i < delays.length; i++) {
        if (cancelled) return
        if (delays[i] > 0) {
          await new Promise((r) => setTimeout(r, delays[i]))
          if (cancelled) return
        }
        try {
          await upsertCurrentUser(syncPayload.payload)
          if (cancelled) return
          lastSyncedRef.current = syncPayload.fingerprint
          // Vincula indicacao se houver codigo capturado durante a navegacao.
          // Idempotente: se ja foi vinculado antes, retorna o ID existente.
          try {
            const refCode =
              typeof window !== 'undefined'
                ? window.localStorage.getItem('rdt_ref_code')
                : null
            if (refCode) {
              await linkReferral({ code: refCode })
              window.localStorage.removeItem('rdt_ref_code')
            }
          } catch {
            // Falha de indicacao nao deve bloquear o login. Mantemos o codigo
            // para tentar de novo na proxima sessao.
          }
          setReady(true)
          return
        } catch (err) {
          lastError = err
          console.warn(`[AuthSyncGate] upsert falhou (tentativa ${i + 1})`, err)
        }
      }

      if (!cancelled) {
        console.error('[AuthSyncGate] upsert falhou após 3 tentativas', lastError)
        setSyncFailed(true)
      }
    }

    sync()

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, syncPayload, upsertCurrentUser, linkReferral, retryToken])

  if (syncFailed) {
    return <SyncErrorScreen onRetry={() => setRetryToken((t) => t + 1)} />
  }

  if (!isLoaded || !ready) {
    return <FullScreenLoader label="Preparando sua sessão..." />
  }

  return <>{children}</>
}

// Registra service worker apenas em produção. Evita interferir com HMR do Vite
// em dev e reduz chance de cache de build quebrado durante desenvolvimento.
// Verifica updates a cada 1h enquanto a aba estiver aberta — se o servidor
// servir um sw.js diferente, o navegador instala em background e
// PWAUpdateNotification mostra o prompt de "Atualizar".
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Guarda o handle do interval pra evitar duplicação se o registro
  // disparar mais de uma vez (não deveria, mas hot-reload em prod via
  // back/forward cache pode reentrar).
  let updateIntervalId: ReturnType<typeof setInterval> | null = null
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        const checkForUpdate = () => reg.update().catch(() => undefined)
        if (updateIntervalId !== null) clearInterval(updateIntervalId)
        updateIntervalId = setInterval(checkForUpdate, 60 * 60 * 1000)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkForUpdate()
        })
      })
      .catch((err) => {
        console.warn('[sw] registro falhou', err)
      })
  })
}

// Sentry primeiro: precisa estar pronto antes de qualquer init (GA4/AdSense)
// pra capturar erros que acontecem no carregamento dos próprios scripts.
initSentry()

// Consent Mode v2: configurar default 'denied' antes de qualquer script do
// Google carregar. Em seguida, GA4 e AdSense carregam sempre (se env var
// presente) e respeitam o consent state via gtag. Meta Pixel ainda usa o gate
// antigo (carrega só após "Aceitar todos") porque ainda não migramos.
initConsent()
initGA4()
initAdSense()
initMetaPixel()
window.addEventListener('rdt:consent-change', () => {
  applyCurrentConsent()
  // Meta Pixel ainda precisa de re-init (gate antigo).
  initMetaPixel()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      {hasClerk && hasConvex && convex ? (
        <ClerkProvider publishableKey={CLERK_KEY}>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <AuthSyncGate>
              <App />
              <Analytics />
              <SpeedInsights />
            </AuthSyncGate>
          </ConvexProviderWithClerk>
        </ClerkProvider>
      ) : (
        <MissingConfigScreen />
      )}
    </AppErrorBoundary>
  </StrictMode>
)
