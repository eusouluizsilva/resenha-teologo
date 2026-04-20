import { StrictMode, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react'
import { ConvexReactClient, useMutation } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import type { FunctionArgs } from 'convex/server'
import './index.css'
import App from './App'
import { api } from '../convex/_generated/api'

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

function AuthSyncGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const upsertCurrentUser = useMutation(api.users.upsert)
  const [ready, setReady] = useState(false)
  const lastSyncedRef = useRef<string | null>(null)
  const syncTimeoutMs = 4000

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
        setReady(true)
        return
      }

      if (lastSyncedRef.current === syncPayload.fingerprint) {
        setReady(true)
        return
      }

      setReady(false)

      try {
        await Promise.race([
          upsertCurrentUser(syncPayload.payload),
          new Promise((resolve) => setTimeout(resolve, syncTimeoutMs)),
        ])
        if (cancelled) return
        lastSyncedRef.current = syncPayload.fingerprint
      } catch {
        if (cancelled) return
      } finally {
        if (!cancelled) {
          setReady(true)
        }
      }
    }

    sync()

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, syncPayload, syncTimeoutMs, upsertCurrentUser])

  if (!isLoaded || !ready) {
    return <FullScreenLoader label="Preparando sua sessão..." />
  }

  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {hasClerk && hasConvex && convex ? (
      <ClerkProvider publishableKey={CLERK_KEY}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <AuthSyncGate>
            <App />
          </AuthSyncGate>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    ) : (
      <MissingConfigScreen />
    )}
  </StrictMode>
)
