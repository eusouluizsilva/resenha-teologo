import { useEffect, useState } from 'react'

// Notifica o usuário quando uma nova versão do service worker fica em waiting
// e oferece "Atualizar" para forçar skipWaiting + reload. Sem isso o usuário
// preso ao SW antigo só vê a versão nova quando fechar todas as abas.

export function PWAUpdateNotification() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let registration: ServiceWorkerRegistration | null = null
    let cancelled = false

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (cancelled || !reg) return
      registration = reg

      if (reg.waiting) setWaiting(reg.waiting)

      reg.addEventListener('updatefound', () => {
        const installing = reg.installing
        if (!installing) return
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            setWaiting(installing)
          }
        })
      })
    })

    const onControllerChange = () => {
      // Quando o novo SW assume, recarrega para garantir que a app pegue
      // os assets novos.
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      void registration
    }
  }, [])

  if (!waiting) return null

  function update() {
    if (!waiting) return
    waiting.postMessage('SKIP_WAITING')
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm sm:px-0 sm:pb-0"
    >
      <div className="rounded-2xl border border-white/8 bg-[#151B23] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.4)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M2.985 14.652h4.992v4.992M3.04 9.348a8.967 8.967 0 0114.116-3.4M20.96 14.652a8.967 8.967 0 01-14.116 3.4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">Versão nova disponível</p>
            <p className="mt-1 text-xs leading-5 text-white/60">
              Atualize agora para receber as correções e funcionalidades mais recentes.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={update}
                className="rounded-lg bg-[#F37E20] px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-[#E06A10]"
              >
                Atualizar
              </button>
              <button
                type="button"
                onClick={() => setWaiting(null)}
                className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs font-medium text-white/70 transition-all hover:bg-white/5 hover:text-white"
              >
                Depois
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
