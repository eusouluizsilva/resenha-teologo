// Gerador de certificado em PDF, estilo diploma academico de seminario
// teologico (referencias: Princeton Theological Seminary, Westminster
// Seminary, Reformed Theological Seminary). Layout A4 paisagem com:
// - Borda decorativa dupla
// - Marca dagua do livro aberto centralizada (opacidade baixa)
// - Selo dourado circular com livro no centro
// - Tipografia serif classica (Times)
// - Linha de assinatura do professor + carga horaria total
// - QR + codigo de verificacao

import QRCode from 'qrcode'

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

export function formatCourseHours(seconds: number | undefined): string | null {
  if (!seconds || seconds <= 0) return null
  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} minutos`
  if (minutes === 0) return hours === 1 ? '1 hora' : `${hours} horas`
  return `${hours}h ${minutes}min`
}

let logoDataUrlPromise: Promise<string | null> | null = null
async function loadLogoDataUrl(): Promise<string | null> {
  if (logoDataUrlPromise) return logoDataUrlPromise
  logoDataUrlPromise = (async () => {
    try {
      const res = await fetch('/logos/LOGO ICONE PRETA.png')
      if (!res.ok) return null
      const blob = await res.blob()
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  })()
  return logoDataUrlPromise
}

export async function downloadCertificatePdf(data: CertificateData) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // Fundo pergaminho creme
  doc.setFillColor(250, 247, 240) // #FAF7F0
  doc.rect(0, 0, pageW, pageH, 'F')

  // Marca dagua: livro aberto centralizado, opacidade baixa
  const logoDataUrl = await loadLogoDataUrl()
  if (logoDataUrl) {
    // jsPDF v2/v4 GState para opacidade. Compativel via cast em runtime.
    type GStateCtor = new (opts: { opacity: number }) => unknown
    const docAny = doc as unknown as {
      GState?: GStateCtor
      setGState?: (g: unknown) => void
    }
    if (docAny.GState && docAny.setGState) {
      docAny.setGState(new docAny.GState({ opacity: 0.05 }))
      const wmSize = 130
      doc.addImage(
        logoDataUrl,
        'PNG',
        (pageW - wmSize) / 2,
        (pageH - wmSize) / 2,
        wmSize,
        wmSize,
      )
      docAny.setGState(new docAny.GState({ opacity: 1 }))
    }
  }

  // Borda decorativa: tripla com cantos ornamentados
  doc.setDrawColor(30, 36, 48) // #1E2430
  doc.setLineWidth(1.4)
  doc.rect(8, 8, pageW - 16, pageH - 16)
  doc.setLineWidth(0.4)
  doc.rect(11, 11, pageW - 22, pageH - 22)
  doc.setDrawColor(184, 144, 43) // ouro #B8902B
  doc.setLineWidth(0.25)
  doc.rect(13, 13, pageW - 26, pageH - 26)

  // Cantos: ornamentos pequenos
  drawCornerOrnament(doc, 13, 13, 1)
  drawCornerOrnament(doc, pageW - 13, 13, 2)
  drawCornerOrnament(doc, 13, pageH - 13, 3)
  drawCornerOrnament(doc, pageW - 13, pageH - 13, 4)

  // Marca textual no topo (em cima do selo, centralizada)
  doc.setTextColor(30, 36, 48)
  doc.setFont('times', 'bold')
  doc.setFontSize(18)
  doc.text('RESENHA DO TEÓLOGO', pageW / 2, 26, { align: 'center' })

  doc.setFont('times', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(120, 100, 60)
  doc.text(
    'Sola Scriptura · Soli Deo Gloria',
    pageW / 2,
    32,
    { align: 'center' },
  )

  // Linha decorativa abaixo do nome da instituicao
  doc.setDrawColor(184, 144, 43)
  doc.setLineWidth(0.6)
  doc.line(pageW / 2 - 50, 36, pageW / 2 + 50, 36)
  doc.setFillColor(184, 144, 43)
  doc.circle(pageW / 2, 36, 0.9, 'F')

  // Titulo
  doc.setFont('times', 'italic')
  doc.setFontSize(13)
  doc.setTextColor(90, 80, 60)
  doc.text('CERTIFICADO DE CONCLUSÃO', pageW / 2, 46, { align: 'center' })

  // Texto introdutorio
  doc.setFont('times', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(60, 60, 60)
  doc.text(
    'Conferimos o presente certificado a',
    pageW / 2,
    62,
    { align: 'center' },
  )

  // Nome do aluno em destaque
  doc.setFont('times', 'bold')
  doc.setFontSize(34)
  doc.setTextColor(17, 24, 39)
  doc.text(data.studentName || 'Aluno', pageW / 2, 80, { align: 'center' })

  // Linha sob o nome
  doc.setDrawColor(184, 144, 43)
  doc.setLineWidth(0.5)
  const nameWidth = Math.min(pageW - 100, 200)
  doc.line((pageW - nameWidth) / 2, 84, (pageW + nameWidth) / 2, 84)

  // Texto do curso
  doc.setFont('times', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(60, 60, 60)
  doc.text(
    'pelo aproveitamento e dedicação demonstrados no curso de',
    pageW / 2,
    96,
    { align: 'center' },
  )

  // Nome do curso
  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(30, 36, 48)
  const wrappedTitle = doc.splitTextToSize(data.courseTitle, pageW - 80)
  doc.text(wrappedTitle, pageW / 2, 110, { align: 'center' })

  const titleLineCount = Array.isArray(wrappedTitle) ? wrappedTitle.length : 1
  const afterTitleY = 110 + titleLineCount * 8

  // Carga horaria + nota
  const hoursLabel = formatCourseHours(data.totalDurationSeconds)
  const lines: string[] = []
  if (hoursLabel) {
    const lessonsPart = data.lessonsCount && data.lessonsCount > 0
      ? `, distribuídas em ${data.lessonsCount} ${data.lessonsCount === 1 ? 'aula' : 'aulas'}`
      : ''
    lines.push(`com carga horária de ${hoursLabel}${lessonsPart}`)
  }
  if (data.finalScore !== undefined) {
    lines.push(`e média final de ${Math.round(data.finalScore)}%`)
  }
  if (lines.length > 0) {
    doc.setFont('times', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(80, 70, 50)
    doc.text(lines.join(' '), pageW / 2, afterTitleY + 6, { align: 'center' })
  }

  // Selo dourado embaixo no centro
  drawGoldSeal(doc, pageW / 2, pageH - 50, 18)

  // Linha de assinatura do professor (esquerda)
  if (data.creatorName) {
    const sigCenterX = 70
    const sigY = pageH - 38
    const sigWidth = 75
    doc.setDrawColor(30, 36, 48)
    doc.setLineWidth(0.4)
    doc.line(sigCenterX - sigWidth / 2, sigY, sigCenterX + sigWidth / 2, sigY)

    doc.setFont('times', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(30, 36, 48)
    doc.text(data.creatorName, sigCenterX, sigY + 5, { align: 'center' })

    doc.setFont('times', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(120, 110, 90)
    doc.text('Professor responsável', sigCenterX, sigY + 9, { align: 'center' })
  }

  // QR Code (direita do rodape)
  const verifyUrl = `https://resenhadoteologo.com/verificar/${data.verificationCode}`
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 256,
    color: { dark: '#1E2430', light: '#FAF7F0' },
  })
  const qrSize = 22
  const qrX = pageW - 22 - qrSize
  const qrY = pageH - 22 - qrSize
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

  doc.setFont('times', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(120, 110, 90)
  doc.text('Verificar', qrX + qrSize / 2, qrY - 2, { align: 'center' })

  // Rodape: data + codigo (centro)
  doc.setFont('times', 'italic')
  doc.setFontSize(10)
  doc.setTextColor(80, 70, 50)
  doc.text(
    `Emitido em ${formatDate(data.completedAt)}`,
    pageW / 2,
    pageH - 22,
    { align: 'center' },
  )
  doc.setFont('times', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(140, 130, 110)
  doc.text(
    `Código de autenticidade: ${data.verificationCode} · resenhadoteologo.com/verificar/${data.verificationCode}`,
    pageW / 2,
    pageH - 17,
    { align: 'center' },
  )

  const safeCourse = (data.courseTitle || 'curso')
    .replace(/[^a-zA-Z0-9À-ÿ\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40)
  doc.save(`certificado-${safeCourse}.pdf`)
}

function drawCornerOrnament(
  doc: import('jspdf').jsPDF,
  x: number,
  y: number,
  corner: 1 | 2 | 3 | 4,
) {
  // Pequeno losango dourado em cada canto interno da borda
  doc.setFillColor(184, 144, 43)
  doc.setDrawColor(184, 144, 43)
  const dx = corner === 2 || corner === 4 ? -3 : 3
  const dy = corner === 3 || corner === 4 ? -3 : 3
  // Diamante: 4 triangulos formando rombo
  const cx = x + dx
  const cy = y + dy
  doc.triangle(cx - 1.4, cy, cx, cy - 1.4, cx + 1.4, cy, 'F')
  doc.triangle(cx - 1.4, cy, cx, cy + 1.4, cx + 1.4, cy, 'F')
}

function drawGoldSeal(
  doc: import('jspdf').jsPDF,
  cx: number,
  cy: number,
  radius: number,
) {
  // Aneis externos
  doc.setDrawColor(184, 144, 43)
  doc.setLineWidth(0.8)
  doc.circle(cx, cy, radius)
  doc.setLineWidth(0.25)
  doc.circle(cx, cy, radius - 1.4)

  // Disco interno em ouro mais escuro (efeito relevo)
  doc.setFillColor(212, 175, 55) // #D4AF37 ouro brilhante
  doc.circle(cx, cy, radius - 2.6, 'F')

  // Anel interno fino mais escuro
  doc.setDrawColor(139, 105, 20) // #8B6914
  doc.setLineWidth(0.4)
  doc.circle(cx, cy, radius - 2.6)

  // Ponteado decorativo no anel externo
  const dots = 16
  doc.setFillColor(184, 144, 43)
  for (let i = 0; i < dots; i += 1) {
    const angle = (i / dots) * Math.PI * 2
    const px = cx + Math.cos(angle) * (radius - 0.7)
    const py = cy + Math.sin(angle) * (radius - 0.7)
    doc.circle(px, py, 0.35, 'F')
  }

  // Texto central: monograma RDT
  doc.setFont('times', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(75, 55, 15)
  doc.text('RDT', cx, cy + 1.5, { align: 'center' })

  // Texto pequeno embaixo: ano
  doc.setFont('times', 'italic')
  doc.setFontSize(6)
  doc.setTextColor(95, 70, 20)
  doc.text(
    String(new Date().getFullYear()),
    cx,
    cy + 5.5,
    { align: 'center' },
  )
}

export function deriveVerificationCode(enrollmentId: string): string {
  return enrollmentId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16).toUpperCase()
}
