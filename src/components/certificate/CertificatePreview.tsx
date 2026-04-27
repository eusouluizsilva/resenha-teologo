// Preview HTML do certificado, espelhando o layout do PDF gerado em
// src/lib/certificate.ts (estilo diploma academico de seminario teologico).
// Permite ao aluno visualizar o diploma em tela antes de baixar e imprimir.
// Em @media print, esconde toda a UI ao redor (header, botoes) e imprime
// apenas a area do certificado.

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { downloadCertificatePdf, formatCourseHours } from '@/lib/certificate'

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

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(ts))
}

const SERIF = '"Times New Roman", Times, serif'

function CornerDiamond({
  position,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br'
}) {
  const style: React.CSSProperties = { position: 'absolute' }
  if (position === 'tl') {
    style.top = '2.5%'
    style.left = '1.7%'
  } else if (position === 'tr') {
    style.top = '2.5%'
    style.right = '1.7%'
  } else if (position === 'bl') {
    style.bottom = '3.5%'
    style.left = '1.7%'
  } else {
    style.bottom = '3.5%'
    style.right = '1.7%'
  }
  return (
    <svg
      viewBox="0 0 12 12"
      width="12"
      height="12"
      style={style}
      aria-hidden
    >
      <polygon points="6,1 11,6 6,11 1,6" fill="#B8902B" />
    </svg>
  )
}

function GoldSeal() {
  // Selo dourado concentrico com monograma RDT, espelha drawGoldSeal do PDF.
  return (
    <svg viewBox="0 0 100 100" width="84" height="84" aria-hidden>
      <defs>
        <radialGradient id="seal-fill" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#F4D77A" />
          <stop offset="55%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#9C7A1F" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="#B8902B" strokeWidth="1.6" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#B8902B" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="38" fill="url(#seal-fill)" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#8B6914" strokeWidth="0.7" />
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2
        const px = 50 + Math.cos(angle) * 46.2
        const py = 50 + Math.sin(angle) * 46.2
        return <circle key={i} cx={px} cy={py} r="0.9" fill="#B8902B" />
      })}
      <text
        x="50"
        y="55"
        textAnchor="middle"
        fontFamily={SERIF}
        fontWeight="700"
        fontSize="20"
        fill="#4B370F"
      >
        RDT
      </text>
      <text
        x="50"
        y="68"
        textAnchor="middle"
        fontFamily={SERIF}
        fontStyle="italic"
        fontSize="7"
        fill="#5F4614"
      >
        {new Date().getFullYear()}
      </text>
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
  const verifyUrl = `https://resenhadoteologo.com/verificar/${data.verificationCode}`
  const hoursLabel = formatCourseHours(data.totalDurationSeconds)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 256,
      color: { dark: '#1E2430', light: '#FAF7F0' },
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
    setIsDownloading(true)
    try {
      await downloadCertificatePdf(data)
    } finally {
      setIsDownloading(false)
    }
  }

  // Linha composta de carga horaria + nota final, igual ao PDF.
  const detailParts: string[] = []
  if (hoursLabel) {
    const lessonsPart =
      data.lessonsCount && data.lessonsCount > 0
        ? `, distribuídas em ${data.lessonsCount} ${data.lessonsCount === 1 ? 'aula' : 'aulas'}`
        : ''
    detailParts.push(`com carga horária de ${hoursLabel}${lessonsPart}`)
  }
  if (data.finalScore !== undefined) {
    detailParts.push(`e média final de ${Math.round(data.finalScore)}%`)
  }
  const detailLine = detailParts.join(' ')

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
            height: 100vh !important;
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
            disabled={isDownloading}
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
          className="certificate-print-area mx-auto w-full max-w-[1100px] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
          style={{ aspectRatio: '297 / 210' }}
        >
          <div
            className="relative h-full w-full overflow-hidden bg-[#FAF7F0] text-[#111827]"
            style={{ fontFamily: SERIF }}
          >
            {/* Marca dagua: logo centralizada com baixa opacidade */}
            <img
              src="/logos/LOGO ICONE PRETA.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
              style={{ width: '46%', opacity: 0.05 }}
            />

            {/* Borda decorativa tripla (escura grossa, escura fina, dourada fina) */}
            <div className="pointer-events-none absolute inset-[2.7%] border-[1.6px] border-[#1E2430]" />
            <div className="pointer-events-none absolute inset-[3.6%] border border-[#1E2430]" />
            <div
              className="pointer-events-none absolute inset-[4.3%] border"
              style={{ borderColor: '#B8902B', borderWidth: '0.6px' }}
            />

            <CornerDiamond position="tl" />
            <CornerDiamond position="tr" />
            <CornerDiamond position="bl" />
            <CornerDiamond position="br" />

            {/* Conteudo */}
            <div className="relative flex h-full w-full flex-col items-center px-[8%] pt-[5%] pb-[5%]">
              <p className="text-center text-[22px] font-bold tracking-[0.04em] text-[#1E2430]">
                RESENHA DO TEÓLOGO
              </p>
              <p className="mt-1.5 text-center text-[12px] italic text-[#7A6432]">
                Sola Scriptura · Soli Deo Gloria
              </p>

              {/* Linha decorativa dourada com bullet central */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="block h-[1px] w-[120px] bg-[#B8902B]" />
                <span className="block h-[6px] w-[6px] rounded-full bg-[#B8902B]" />
                <span className="block h-[1px] w-[120px] bg-[#B8902B]" />
              </div>

              <p className="mt-5 text-center text-[15px] italic uppercase tracking-[0.18em] text-[#5A5040]">
                Certificado de Conclusão
              </p>

              <p className="mt-7 text-[14px] text-[#3C3C3C]">
                Conferimos o presente certificado a
              </p>

              <p className="mt-4 text-center text-[44px] font-bold leading-tight text-[#111827]">
                {data.studentName || 'Aluno'}
              </p>

              <span
                className="mt-2 block h-[1.5px]"
                style={{ width: '60%', backgroundColor: '#B8902B' }}
              />

              <p className="mt-5 text-[14px] text-[#3C3C3C]">
                pelo aproveitamento e dedicação demonstrados no curso de
              </p>

              <p className="mt-3 max-w-[88%] text-center text-[26px] font-bold leading-snug text-[#1E2430]">
                {data.courseTitle}
              </p>

              {detailLine && (
                <p className="mt-3 max-w-[80%] text-center text-[13px] italic text-[#5A5040]">
                  {detailLine}
                </p>
              )}

              {/* Selo dourado centralizado embaixo */}
              <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: '14%' }}>
                <GoldSeal />
              </div>

              {/* Assinatura do professor (esquerda) */}
              {data.creatorName && (
                <div className="absolute" style={{ left: '10%', bottom: '11%' }}>
                  <div className="h-[1px] w-[200px] bg-[#1E2430]" />
                  <p className="mt-1.5 w-[200px] text-center text-[13px] italic text-[#1E2430]">
                    {data.creatorName}
                  </p>
                  <p className="w-[200px] text-center text-[10px] text-[#7A7A7A]">
                    Professor responsável
                  </p>
                </div>
              )}

              {/* QR Code (direita) */}
              {qrUrl && (
                <div className="absolute" style={{ right: '8%', bottom: '9%' }}>
                  <p className="text-center text-[8.5px] uppercase tracking-[0.16em] text-[#7A6432]">
                    Verificar
                  </p>
                  <img
                    src={qrUrl}
                    alt=""
                    className="mt-1 h-[88px] w-[88px]"
                  />
                </div>
              )}

              {/* Rodape: data + codigo (centralizado bem embaixo) */}
              <div
                className="absolute left-1/2 -translate-x-1/2 text-center"
                style={{ bottom: '3%', width: '60%' }}
              >
                <p className="text-[11.5px] italic text-[#5A5040]">
                  Emitido em {formatDate(data.completedAt)}
                </p>
                <p className="mt-0.5 text-[8.5px] text-[#8C826E]">
                  Código de autenticidade: {data.verificationCode} · resenhadoteologo.com/verificar/{data.verificationCode}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
