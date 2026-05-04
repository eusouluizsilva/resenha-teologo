// Versão inline (sem modal) do certificado oficial, usada na página de
// checkout pra mostrar ao aluno como o documento ficará com o nome dele
// antes de pagar R$ 29,90. Reaproveita /certificates/template-academic.png e
// as mesmas fontes de exibição (Cinzel/EB Garamond/Pinyon Script) do
// CertificatePreview, com marca d'água "Pré-visualização" sobreposta.

import { useEffect, useState } from 'react'
import { formatCourseHours } from '@/lib/certificate'
import '@fontsource/cinzel/500.css'
import '@fontsource/cinzel/700.css'
import '@fontsource/eb-garamond/400.css'
import '@fontsource/eb-garamond/600.css'
import '@fontsource/eb-garamond/400-italic.css'
import '@fontsource/pinyon-script/400.css'

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
  return `aos ${d.getDate()} dias do mês de ${MONTHS_PT[d.getMonth()]} do ano de Nosso Senhor de ${toRoman(d.getFullYear())}`
}

export function EmbeddedCertificatePreview({
  studentName,
  courseTitle,
  completedAt,
  finalScore,
  totalDurationSeconds,
  lessonsCount,
}: {
  studentName: string
  courseTitle: string
  completedAt: number
  finalScore?: number
  totalDurationSeconds?: number
  lessonsCount?: number
}) {
  const [fontsReady, setFontsReady] = useState(false)
  const hoursLabel = formatCourseHours(totalDurationSeconds)

  // Aguarda fontes do @fontsource carregarem antes de revelar — evita FOUT
  // visível com fontes-fallback quando o aluno abre o checkout.
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFontsReady(true)
      return
    }
    let cancelled = false
    document.fonts.ready.then(() => {
      if (!cancelled) setFontsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const detailParts: string[] = []
  if (hoursLabel) {
    const lessonsPart =
      lessonsCount && lessonsCount > 0
        ? `, distribuídas em ${lessonsCount} ${lessonsCount === 1 ? 'aula' : 'aulas'}`
        : ''
    detailParts.push(`com carga horária de ${hoursLabel}${lessonsPart}`)
  }
  if (finalScore !== undefined) {
    detailParts.push(`obtendo média final de ${Math.round(finalScore)}%`)
  }
  const detailLine = detailParts.join(', ')

  const containerStyle: React.CSSProperties = {
    width: '100%',
    aspectRatio: '1492 / 1054',
    backgroundImage: "url('/certificates/template-academic.png')",
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    fontFamily: '"EB Garamond", Times, serif',
    color: '#1B2430',
    overflow: 'hidden',
    visibility: fontsReady ? 'visible' : 'hidden',
    containerType: 'inline-size' as never,
    borderRadius: '0.9rem',
  }

  return (
    <div className="relative">
      {!fontsReady && (
        <div
          aria-hidden="true"
          className="absolute inset-2 animate-pulse rounded-[0.9rem] bg-[#F4EFE2]/8"
          style={{ aspectRatio: '1492 / 1054' }}
        />
      )}

      <div style={containerStyle} spellCheck={false} translate="no">
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
          {studentName || 'Seu nome'}
        </p>

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
          {courseTitle.toUpperCase()}
        </h3>

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
          Massachusetts, {formatDateExtenso(completedAt)}
        </p>

        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotate(-18deg)',
            fontFamily: '"Cinzel", serif',
            fontSize: '7cqw',
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: 'rgba(243, 126, 32, 0.18)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          PRÉ-VISUALIZAÇÃO
        </span>
      </div>
    </div>
  )
}
