// Inicializa o Sentry no browser. No-op se VITE_SENTRY_DSN ausente, então é
// seguro deployar antes de criar a conta. Quando o DSN existir, captura
// exceções não tratadas, breadcrumbs (clicks/fetch/console) e replays só em
// sessões com erro (sem custo em sessões saudáveis).
//
// O SDK é dynamic-imported pra que builds sem DSN não paguem ~30KB gzip de
// código de monitoramento.

type SentryModule = typeof import('@sentry/react')

let sdkPromise: Promise<SentryModule> | null = null
let initialized = false

export function initSentry() {
  if (sdkPromise) return
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  const env =
    import.meta.env.VITE_SENTRY_ENVIRONMENT ??
    (import.meta.env.PROD ? 'production' : 'development')
  const release = import.meta.env.VITE_SENTRY_RELEASE

  sdkPromise = import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: env,
      release,
      // Sem tracing distribuído por enquanto: backend é Convex (não há SDK
      // oficial), então spans browser-only não fechariam o ciclo de request.
      tracesSampleRate: 0,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: false,
          maskAllInputs: true,
          blockAllMedia: false,
        }),
      ],
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      sendDefaultPii: false,
      // Ruído conhecido: extensões, ResizeObserver, abort de fetch.
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications.',
        'Non-Error promise rejection captured',
        'AbortError',
      ],
      denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i],
    })
    initialized = true
    return Sentry
  })
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!sdkPromise) {
    console.error('[sentry] (não inicializado)', error, context)
    return
  }
  void sdkPromise.then((Sentry) => {
    Sentry.captureException(error, context ? { extra: context } : undefined)
  })
}

export function setSentryUser(user: { id: string; email?: string } | null) {
  if (!sdkPromise) return
  void sdkPromise.then((Sentry) => {
    if (user) Sentry.setUser({ id: user.id, email: user.email })
    else Sentry.setUser(null)
  })
}

export function isSentryInitialized() {
  return initialized
}
