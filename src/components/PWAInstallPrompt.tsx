import { useEffect, useState } from 'react'

// Tipo do evento beforeinstallprompt (não está em lib.dom). O navegador só
// dispara em contexto seguro (HTTPS) e quando o app passa nos critérios PWA
// (manifest válido, service worker ativo, ícone 192/512). iOS Safari não
// dispara, então temos um fallback de instruções para iOS.
type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[]
  prompt: () => Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const STORAGE_KEY = 'rdt_pwa_install_dismissed_v1'
const DISMISS_DAYS = 30

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // matchMedia é o caminho oficial; navigator.standalone só existe no Safari iOS
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window)
}

function wasRecentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const at = Number(raw)
    if (!Number.isFinite(at)) return false
    const days = (Date.now() - at) / (1000 * 60 * 60 * 24)
    return days < DISMISS_DAYS
  } catch {
    return false
  }
}

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIos, setShowIos] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      // Atrasa exibição: usuário precisa interagir antes de ver o convite.
      setTimeout(() => setOpen(true), 12000)
    }

    const onInstalled = () => {
      setOpen(false)
      setDeferred(null)
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* ignore */ }
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    // Fallback iOS: não dispara beforeinstallprompt, mostra instrução manual.
    if (isIOS() && !isStandalone()) {
      const t = setTimeout(() => {
        setShowIos(true)
        setOpen(true)
      }, 15000)
      return () => {
        clearTimeout(t)
        window.removeEventListener('beforeinstallprompt', onBeforeInstall)
        window.removeEventListener('appinstalled', onInstalled)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function dismiss() {
    setOpen(false)
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* ignore */ }
  }

  async function install() {
    if (!deferred) return
    try {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted' || choice.outcome === 'dismissed') {
        setDeferred(null)
        setOpen(false)
        try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* ignore */ }
      }
    } catch {
      setOpen(false)
    }
  }

  if (!open) return null
  if (!deferred && !showIos) return null

  return (
    <div
      role="dialog"
      aria-label="Instalar aplicativo"
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm sm:px-0 sm:pb-0"
    >
      <div className="rounded-2xl border border-white/8 bg-[#151B23] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.4)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v12m0 0l-4.5-4.5M12 16.5l4.5-4.5M5.25 19.5h13.5" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">Instalar Resenha</p>
            {showIos && !deferred ? (
              <p className="mt-1 text-xs leading-5 text-white/60">
                Toque em <span className="font-semibold">Compartilhar</span> e depois em{' '}
                <span className="font-semibold">Adicionar à Tela de Início</span> para abrir o app
                direto sem o navegador.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-5 text-white/60">
                Instale o app na sua tela inicial para acessar mais rápido, com atalhos para Bíblia,
                Caderno e Cursos.
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              {deferred && (
                <button
                  type="button"
                  onClick={install}
                  className="rounded-lg bg-[#F37E20] px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-[#E06A10]"
                >
                  Instalar agora
                </button>
              )}
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs font-medium text-white/70 transition-all hover:bg-white/5 hover:text-white"
              >
                Agora não
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Fechar"
            className="text-white/40 transition-colors hover:text-white/70"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
