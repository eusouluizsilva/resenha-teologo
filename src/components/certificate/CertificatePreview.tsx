// Preview HTML do certificado academico. Usa /certificates/template-academic.png
// como fundo (arte ornamental gerada por IA: bordas filigranadas, brasao com
// Biblia aberta + chama do Espirito + ramos de oliveira + fita Sola Scriptura,
// marca dagua central) e sobrepoe texto dinamico com fontes Google: Cinzel
// para titulos em capitular, EB Garamond para corpo serif, Pinyon Script para
// o nome do aluno em caligrafia. O download em PDF e gerado por html2canvas-pro
// + jsPDF capturando esse mesmo DOM, garantindo paridade pixel-perfect entre
// tela e impressao.

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { formatCourseHours } from '@/lib/certificate'

type CertificateData = {
  studentName: string
  courseTitle: string
  creatorName: string
  completedAt: number
  finalScore?: number
  verificationCode: string
  totalDurationSeconds?: number
  lessonsCount?: number
}

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Pinyon+Script&display=swap'

function ensureFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()
  if (document.querySelector(`link[data-cert-fonts="1"]`)) {
    return document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve()
  }
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = FONTS_HREF
  link.dataset.certFonts = '1'
  document.head.appendChild(link)
  if (!document.fonts) return Promise.resolve()
  return document.fonts.ready.then(() => undefined)
}

const MONTHS_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function toRoman(num: number): string {
  const table: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let n = num
  let out = ''
  for (const [v, s] of table) {
    while (n >= v) {
      out += s
      n -= v
    }
  }
  return out
}

function formatDateExtenso(ts: number): string {
  const d = new Date(ts)
  const day = d.getDate()
  const month = MONTHS_PT[d.getMonth()]
  const year = toRoman(d.getFullYear())
  return `aos ${day} dias do mês de ${month} do ano de Nosso Senhor de ${year}`
}

function GoldFlourish() {
  // Pequena vinheta horizontal dourada para separar secoes.
  return (
    <svg viewBox="0 0 200 12" width="100%" height="100%" aria-hidden>
      <g fill="#9C7A1F" stroke="#9C7A1F" strokeWidth="0.6">
        <line x1="20" y1="6" x2="85" y2="6" />
        <line x1="115" y1="6" x2="180" y2="6" />
        <path d="M 100 6 m -8 0 q 4 -5 8 0 q 4 5 8 0" fill="none" strokeWidth="0.8" />
        <circle cx="100" cy="6" r="1.4" />
        <circle cx="88" cy="6" r="0.9" />
        <circle cx="112" cy="6" r="0.9" />
      </g>
    </svg>
  )
}

export function CertificatePreview({
  data,
  onClose,
}: {
  data: CertificateData
  onClose: () => void
}) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)
  const certRef = useRef<HTMLDivElement | null>(null)

  const verifyUrl = `https://resenhadoteologo.com/verificar/${data.verificationCode}`
  const hoursLabel = formatCourseHours(data.totalDurationSeconds)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(verifyUrl, {
      margin: 0,
      width: 256,
      color: { dark: '#1E2430', light: '#F4EFE2' },
    })
      .then((url) => {
        if (!cancelled) setQrUrl(url)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [verifyUrl])

  useEffect(() => {
    let cancelled = false
    ensureFontsLoaded().then(() => {
      if (!cancelled) setFontsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function handlePrint() {
    window.print()
  }

  async function handleDownload() {
    if (!certRef.current) return
    setIsDownloading(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      })
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      doc.addImage(dataUrl, 'JPEG', 0, 0, pageW, pageH)
      const safeCourse = (data.courseTitle || 'curso')
        .replace(/[^a-zA-Z0-9À-ÿ\s]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 40)
      doc.save(`certificado-${safeCourse}.pdf`)
    } finally {
      setIsDownloading(false)
    }
  }

  // Linha composta de carga horaria + nota final.
  const detailParts: string[] = []
  if (hoursLabel) {
    const lessonsPart =
      data.lessonsCount && data.lessonsCount > 0
        ? `, distribuídas em ${data.lessonsCount} ${data.lessonsCount === 1 ? 'aula' : 'aulas'}`
        : ''
    detailParts.push(`com carga horária de ${hoursLabel}${lessonsPart}`)
  }
  if (data.finalScore !== undefined) {
    detailParts.push(`obtendo média final de ${Math.round(data.finalScore)}%`)
  }
  const detailLine = detailParts.join(', ')

  // containerType: inline-size para usar unidades cqw nos tamanhos de fonte.
  // Cast para never por causa da tipagem do React 19 ainda nao incluir essa propriedade.
  const containerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '1100px',
    aspectRatio: '1492 / 1054',
    backgroundImage: "url('/certificates/template-academic.png')",
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    fontFamily: '"EB Garamond", Times, serif',
    color: '#1B2430',
    margin: '0 auto',
    overflow: 'hidden',
    visibility: fontsReady ? 'visible' : 'hidden',
    containerType: 'inline-size' as never,
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#0A0E14]/95 backdrop-blur-md print:static print:inset-auto print:z-auto print:bg-white print:backdrop-blur-none"
      role="dialog"
      aria-modal="true"
    >
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { background: #FFFFFF !important; }
          .certificate-print-area {
            box-shadow: none !important;
            width: 100vw !important;
            max-width: 100vw !important;
          }
        }
      `}</style>

      <header className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-white/8 px-6 py-4 print:hidden">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F2BD8A]">
            Certificado
          </p>
          <h2 className="mt-0.5 truncate font-display text-base font-bold text-white">
            {data.courseTitle}
          </h2>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 transition hover:border-white/24 hover:bg-white/8 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            Imprimir
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || !fontsReady}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F37E20] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#e06e10] disabled:opacity-60"
          >
            {isDownloading ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Gerando
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Baixar PDF
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-white/62 transition hover:border-white/20 hover:text-white"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-6 print:overflow-visible print:p-0">
        <div
          ref={certRef}
          className="certificate-print-area shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
          style={containerStyle}
        >
          {/* Cabecalho institucional */}
          <div
            style={{
              position: 'absolute',
              top: '9%',
              left: 0,
              right: 0,
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 700,
                fontSize: '4.4cqw',
                letterSpacing: '0.02em',
                color: '#1B2430',
                margin: 0,
                lineHeight: 1,
              }}
            >
              RESENHA DO TEÓLOGO
            </h1>
            <p
              style={{
                fontFamily: '"EB Garamond", serif',
                fontStyle: 'italic',
                fontSize: '1.5cqw',
                color: '#7A5F2A',
                marginTop: '0.6cqw',
                letterSpacing: '0.04em',
              }}
            >
              Sola Scriptura · Soli Deo Gloria
            </p>
          </div>

          {/* Vinheta dourada e linha latina */}
          <div
            style={{
              position: 'absolute',
              top: '18%',
              left: '30%',
              right: '30%',
              height: '1.2cqw',
            }}
          >
            <GoldFlourish />
          </div>
          <p
            style={{
              position: 'absolute',
              top: '20.5%',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: '"EB Garamond", serif',
              fontStyle: 'italic',
              fontSize: '1.45cqw',
              color: '#5A4A30',
              margin: 0,
            }}
          >
            In nomine Domini, hoc certificatum confertur
          </p>

          {/* Titulo: Certificado de Conclusao */}
          <h2
            style={{
              position: 'absolute',
              top: '24%',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: '"Cinzel", serif',
              fontWeight: 700,
              fontSize: '2.6cqw',
              letterSpacing: '0.08em',
              color: '#9C7A1F',
              margin: 0,
            }}
          >
            CERTIFICADO DE CONCLUSÃO ACADÊMICO
          </h2>

          {/* Texto introdutorio */}
          <p
            style={{
              position: 'absolute',
              top: '31%',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: '"EB Garamond", serif',
              fontSize: '1.7cqw',
              color: '#3C3C3C',
              margin: 0,
            }}
          >
            Conferimos o presente certificado a
          </p>

          {/* Nome do aluno em caligrafia */}
          <p
            style={{
              position: 'absolute',
              top: '37%',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: '"Pinyon Script", cursive',
              fontSize: '6cqw',
              color: '#1B2430',
              margin: 0,
              lineHeight: 1.05,
              padding: '0 6%',
            }}
          >
            {data.studentName || 'Aluno'}
          </p>

          {/* Corpo do certificado */}
          <p
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: '"EB Garamond", serif',
              fontSize: '1.55cqw',
              color: '#3C3C3C',
              margin: 0,
              padding: '0 12%',
            }}
          >
            que, havendo cumprido com louvor todos os requisitos do curso de
          </p>

          <h3
            style={{
              position: 'absolute',
              top: '54.5%',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: '"Cinzel", serif',
              fontWeight: 700,
              fontSize: '2cqw',
              letterSpacing: '0.05em',
              color: '#1B2430',
              margin: 0,
              padding: '0 10%',
              lineHeight: 1.2,
            }}
          >
            {data.courseTitle.toUpperCase()}
          </h3>

          {/* Linha de detalhe (carga horaria + nota) */}
          {detailLine && (
            <p
              style={{
                position: 'absolute',
                top: '60.5%',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontFamily: '"EB Garamond", serif',
                fontSize: '1.45cqw',
                color: '#3C3C3C',
                margin: 0,
                padding: '0 10%',
              }}
            >
              {detailLine}
            </p>
          )}

          {/* Local e data por extenso (logo acima do brasao) */}
          <p
            style={{
              position: 'absolute',
              top: '64%',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: '"EB Garamond", serif',
              fontStyle: 'italic',
              fontSize: '1.3cqw',
              color: '#5A4A30',
              margin: 0,
              padding: '0 12%',
            }}
          >
            Massachusetts, {formatDateExtenso(data.completedAt)}
          </p>

          {/* Assinatura LEFT: Professor responsavel */}
          {data.creatorName && (
            <div
              style={{
                position: 'absolute',
                bottom: '11%',
                left: '8%',
                width: '27%',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: '"Pinyon Script", cursive',
                  fontSize: '2.2cqw',
                  color: '#1B2430',
                  margin: 0,
                  lineHeight: 1,
                  paddingBottom: '0.4cqw',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {data.creatorName}
              </p>
              <div
                style={{
                  height: '1px',
                  background: '#1B2430',
                  margin: '0 auto',
                  width: '100%',
                }}
              />
              <p
                style={{
                  fontFamily: '"EB Garamond", serif',
                  fontStyle: 'italic',
                  fontSize: '1.05cqw',
                  color: '#5A4A30',
                  margin: '0.4cqw 0 0',
                  letterSpacing: '0.02em',
                }}
              >
                Professor responsável
              </p>
            </div>
          )}

          {/* Assinatura RIGHT: Reitoria */}
          <div
            style={{
              position: 'absolute',
              bottom: '11%',
              left: '65%',
              width: '27%',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: '"Pinyon Script", cursive',
                fontSize: '2.2cqw',
                color: '#1B2430',
                margin: 0,
                lineHeight: 1,
                paddingBottom: '0.4cqw',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Luiz Carlos da Silva Junior
            </p>
            <div
              style={{
                height: '1px',
                background: '#1B2430',
                margin: '0 auto',
                width: '100%',
              }}
            />
            <p
              style={{
                fontFamily: '"EB Garamond", serif',
                fontStyle: 'italic',
                fontSize: '1.05cqw',
                color: '#5A4A30',
                margin: '0.4cqw 0 0',
                letterSpacing: '0.02em',
              }}
            >
              Reitoria · Resenha do Teólogo
            </p>
          </div>

          {/* QR Code (canto inferior direito) */}
          {qrUrl && (
            <div
              style={{
                position: 'absolute',
                bottom: '8%',
                right: '5%',
                width: '7.5cqw',
                textAlign: 'center',
              }}
            >
              <img
                src={qrUrl}
                alt=""
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  border: '0.3cqw solid #F4EFE2',
                  background: '#F4EFE2',
                }}
              />
              <p
                style={{
                  fontFamily: '"EB Garamond", serif',
                  fontSize: '0.85cqw',
                  color: '#5A4A30',
                  margin: '0.3cqw 0 0',
                  letterSpacing: '0.05em',
                }}
              >
                {data.verificationCode}
              </p>
            </div>
          )}

          {/* Rodape de verificacao */}
          <p
            style={{
              position: 'absolute',
              bottom: '2.6%',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: '"EB Garamond", serif',
              fontSize: '0.95cqw',
              color: '#5A4A30',
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            Verifique a autenticidade em resenhadoteologo.com/verificar/{data.verificationCode}
          </p>
        </div>
      </div>
    </div>
  )
}
