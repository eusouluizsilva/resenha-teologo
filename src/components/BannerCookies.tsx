import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { readConsentState, writeConsentState } from '@/lib/consent'

// Banner LGPD com 3 caminhos: Aceitar todos, Apenas essenciais, Personalizar.
// "Personalizar" abre painel granular com toggles para Análise (GA4) e
// Anúncios (AdSense + Meta Pixel). Cookies essenciais (sessão Clerk, consent
// salvo) sempre on, sem opção de desativar — a plataforma não funciona sem.

export function BannerCookies() {
  const [visible, setVisible] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [adChecked, setAdChecked] = useState(false)
  const [analyticsChecked, setAnalyticsChecked] = useState(true)

  useEffect(() => {
    const existing = readConsentState()
    if (!existing) {
      const t = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  if (!visible) return null

  const persist = (next: { ad: boolean; analytics: boolean }) => {
    writeConsentState(next)
    setVisible(false)
    setShowCustom(false)
  }

  const handleAcceptAll = () => persist({ ad: true, analytics: true })
  const handleEssentialOnly = () => persist({ ad: false, analytics: false })
  const handleSaveCustom = () => persist({ ad: adChecked, analytics: analyticsChecked })

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Preferências de cookies"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-white/8 bg-[#151B23]/95 p-5 text-sm text-white/80 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:inset-x-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-6">
          Usamos cookies essenciais para manter sua sessão e preferências. Com sua
          autorização, também usamos cookies para análise e anúncios personalizados.{' '}
          <Link
            to="/privacidade"
            className="font-semibold text-[#F2BD8A] underline-offset-4 hover:underline"
          >
            Saber mais
          </Link>
          .
        </p>
        <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setShowCustom((v) => !v)}
            className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/80 transition-all hover:border-white/20 hover:text-white"
          >
            {showCustom ? 'Fechar' : 'Personalizar'}
          </button>
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

      {showCustom && (
        <div className="flex flex-col gap-3 rounded-xl border border-white/8 bg-black/30 p-4">
          <div className="flex items-start gap-3">
            <input
              id="consent-essential"
              type="checkbox"
              checked
              disabled
              className="mt-1 h-4 w-4 cursor-not-allowed accent-[#F37E20] opacity-60"
            />
            <label htmlFor="consent-essential" className="cursor-not-allowed text-xs leading-5 text-white/60">
              <span className="font-semibold text-white/80">Cookies essenciais</span> (sempre ativos):
              autenticação, preferências de UI e suas escolhas de consentimento. Sem eles a plataforma não funciona.
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="consent-analytics"
              type="checkbox"
              checked={analyticsChecked}
              onChange={(e) => setAnalyticsChecked(e.target.checked)}
              className="mt-1 h-4 w-4 cursor-pointer accent-[#F37E20]"
            />
            <label htmlFor="consent-analytics" className="cursor-pointer text-xs leading-5 text-white/72">
              <span className="font-semibold text-white">Análise de uso</span> (Google Analytics):
              dados anônimos sobre páginas visitadas, tempo de leitura, dispositivos. Ajuda a melhorar conteúdo e desempenho.
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="consent-ads"
              type="checkbox"
              checked={adChecked}
              onChange={(e) => setAdChecked(e.target.checked)}
              className="mt-1 h-4 w-4 cursor-pointer accent-[#F37E20]"
            />
            <label htmlFor="consent-ads" className="cursor-pointer text-xs leading-5 text-white/72">
              <span className="font-semibold text-white">Anúncios personalizados</span> (Google AdSense, Meta Pixel):
              cookies de publicidade que ajudam o Google e o Facebook a mostrar anúncios mais relevantes. Sem isso, exibimos apenas anúncios genéricos.
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveCustom}
              className="rounded-2xl bg-[#F37E20] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#E06A10]"
            >
              Salvar preferências
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
