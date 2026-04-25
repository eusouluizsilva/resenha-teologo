// Gerador de certificado em PDF. Usa jsPDF client-side para que o aluno possa
// baixar imediatamente sem depender de action do servidor. Layout A4 paisagem
// com borda editorial, título em centro, nome do aluno em destaque, curso,
// criador, data e um código de verificação derivado do enrollmentId (primeiros
// 16 hex chars em maiúsculo) para quem quiser conferir autenticidade no futuro.

import jsPDF from 'jspdf'
import QRCode from 'qrcode'

type CertificateData = {
  studentName: string
  courseTitle: string
  creatorName: string
  completedAt: number
  finalScore?: number
  verificationCode: string
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(ts))
}

export async function downloadCertificatePdf(data: CertificateData) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // Fundo bege editorial
  doc.setFillColor(247, 245, 242) // #F7F5F2
  doc.rect(0, 0, pageW, pageH, 'F')

  // Borda externa dupla
  doc.setDrawColor(30, 36, 48) // #1E2430
  doc.setLineWidth(1.2)
  doc.rect(8, 8, pageW - 16, pageH - 16)
  doc.setLineWidth(0.3)
  doc.rect(11, 11, pageW - 22, pageH - 22)

  // Barra laranja superior fina
  doc.setFillColor(243, 126, 32) // #F37E20
  doc.rect(11, 11, pageW - 22, 2.5, 'F')

  // Marca
  doc.setTextColor(30, 36, 48)
  doc.setFont('times', 'bold')
  doc.setFontSize(14)
  doc.text('RESENHA DO TEÓLOGO', pageW / 2, 30, { align: 'center' })

  // Separador pontilhado (ponto simulado)
  doc.setFillColor(243, 126, 32)
  doc.circle(pageW / 2, 38, 0.8, 'F')

  // Título principal
  doc.setFont('times', 'italic')
  doc.setFontSize(12)
  doc.setTextColor(90, 90, 90)
  doc.text('Certificado de Conclusão', pageW / 2, 52, { align: 'center' })

  // Texto introdutório
  doc.setFont('times', 'normal')
  doc.setFontSize(13)
  doc.setTextColor(60, 60, 60)
  doc.text('Certificamos que', pageW / 2, 72, { align: 'center' })

  // Nome do aluno
  doc.setFont('times', 'bold')
  doc.setFontSize(32)
  doc.setTextColor(17, 24, 39)
  doc.text(data.studentName || 'Aluno', pageW / 2, 92, { align: 'center' })

  // Linha sob o nome
  doc.setDrawColor(243, 126, 32)
  doc.setLineWidth(0.6)
  const nameWidth = Math.min(pageW - 80, 180)
  doc.line((pageW - nameWidth) / 2, 96, (pageW + nameWidth) / 2, 96)

  // Texto do curso
  doc.setFont('times', 'normal')
  doc.setFontSize(13)
  doc.setTextColor(60, 60, 60)
  doc.text(
    'concluiu com aproveitamento o curso',
    pageW / 2,
    110,
    { align: 'center' },
  )

  // Nome do curso
  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(30, 36, 48)
  const wrappedTitle = doc.splitTextToSize(data.courseTitle, pageW - 60)
  doc.text(wrappedTitle, pageW / 2, 125, { align: 'center' })

  const titleLineCount = Array.isArray(wrappedTitle) ? wrappedTitle.length : 1
  const afterTitleY = 125 + titleLineCount * 9

  // Criador
  if (data.creatorName) {
    doc.setFont('times', 'italic')
    doc.setFontSize(12)
    doc.setTextColor(90, 90, 90)
    doc.text(`ministrado por ${data.creatorName}`, pageW / 2, afterTitleY + 5, { align: 'center' })
  }

  // Nota final
  if (data.finalScore !== undefined) {
    doc.setFont('times', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)
    doc.text(
      `Média final: ${Math.round(data.finalScore)}%`,
      pageW / 2,
      afterTitleY + 14,
      { align: 'center' },
    )
  }

  // QR Code apontando para a URL de verificação (ancorado à direita do rodapé)
  const verifyUrl = `https://resenhadoteologo.com/verificar/${data.verificationCode}`
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 256,
    color: { dark: '#1E2430', light: '#F7F5F2' },
  })
  const qrSize = 26
  const qrX = pageW - 20 - qrSize
  const qrY = pageH - 20 - qrSize
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

  // Rodapé: data + código de verificação
  const footerY = pageH - 28

  doc.setFont('times', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  doc.text(`Emitido em ${formatDate(data.completedAt)}`, 20, footerY)

  doc.setFontSize(9)
  doc.setTextColor(130, 130, 130)
  doc.text(
    `Código: ${data.verificationCode}`,
    20,
    footerY + 6,
  )

  // URL de verificação (à esquerda do QR)
  doc.setFontSize(8.5)
  doc.setTextColor(120, 120, 120)
  doc.text(
    `Verifique em resenhadoteologo.com/verificar/${data.verificationCode}`,
    20,
    footerY + 12,
  )

  const safeCourse = (data.courseTitle || 'curso')
    .replace(/[^a-zA-Z0-9À-ÿ\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40)
  doc.save(`certificado-${safeCourse}.pdf`)
}

export function deriveVerificationCode(enrollmentId: string): string {
  return enrollmentId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16).toUpperCase()
}
