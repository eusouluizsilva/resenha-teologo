import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// Banner LGPD. Salva a escolha em localStorage para não reaparecer. Duas ações:
// aceitar (cookies essenciais + analytics futuros) ou apenas essenciais. Como
// ainda não temos integração analítica ativa, as duas escolhas hoje fazem a
// mesma coisa, mas registramos a preferência para respeitar quando integrarmos
// GA4/Clarity no futuro.

const STORAGE_KEY = 'rdt_cookie_consent_v1'

type Consent = { choice: 'all' | 'essential'; at: number }

function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Consent
    if (parsed && (parsed.choice === 'all' || parsed.choice === 'essential')) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

function writeConsent(choice: Consent['choice']) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, at: Date.now() }))
  } catch { /* silencioso */ }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const existing = readConsent()
    if (!existing) {
      const t = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  if (!visible) return null

  const handleAcceptAll = () => {
    writeConsent('all')
    setVisible(false)
  }

  const handleEssentialOnly = () => {
    writeConsent('essential')
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Preferências de cookies"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-white/8 bg-[#151B23]/95 p-5 text-sm text-white/80 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:inset-x-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="leading-6">
        Usamos cookies essenciais para manter sua sessão e preferências. Com sua
        autorização, também coletamos dados anônimos para entender como a plataforma é usada.{' '}
        <Link to="/privacidade" className="font-semibold text-[#F2BD8A] underline-offset-4 hover:underline">
          Saber mais
        </Link>
        .
      </p>
      <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleEssentialOnly}
          className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/80 transition-all hover:border-white/20 hover:text-white"
        >
          Apenas essenciais
        </button>
        <button
          type="button"
          onClick={handleAcceptAll}
          className="rounded-2xl bg-[#F37E20] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#E06A10]"
        >
          Aceitar todos
        </button>
      </div>
    </div>
  )
}
