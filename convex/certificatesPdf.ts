// Geração server-side do PDF do certificado pago. Roda em runtime Node ('use node')
// porque jsPDF depende de APIs do Node. Importado pelo http.ts via
// internal.certificatesPdf.generatePaidPdf (disparado pelo webhook Stripe).
//
// Layout: A4 paisagem, fundo bege editorial (#F7F5F2), borda decorativa orange,
// texto serif central (nome aluno em destaque), QR code apontando pra
// /verificar/{code} no canto inferior direito + url textual + código.

'use node'

import { v } from 'convex/values'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { internalAction } from './_generated/server'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'

export const generatePaidPdf = internalAction({
  args: { orderId: v.id('certificateOrders') },
  handler: async (ctx, { orderId }): Promise<Id<'_storage'> | null> => {
    const data = await ctx.runQuery(internal.certificates.getOrderDataForPdf, { orderId })
    if (!data) {
      console.error('[certificatesPdf.generatePaidPdf] order/curso ausente', orderId)
      return null
    }

    const verifyUrl = `https://resenhadoteologo.com/verificar/${data.verificationCode}`
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 360,
      color: { dark: '#0F141A', light: '#F7F5F2' },
    })

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()

    doc.setFillColor(247, 245, 242)
    doc.rect(0, 0, pageW, pageH, 'F')

    doc.setDrawColor(243, 126, 32)
    doc.setLineWidth(1.2)
    doc.rect(8, 8, pageW - 16, pageH - 16)
    doc.setLineWidth(0.4)
    doc.rect(11, 11, pageW - 22, pageH - 22)

    doc.setFont('times', 'normal')
    doc.setTextColor(243, 126, 32)
    doc.setFontSize(11)
    doc.text('RESENHA DO TEÓLOGO', pageW / 2, 28, { align: 'center' })

    doc.setFont('times', 'bold')
    doc.setTextColor(17, 24, 39)
    doc.setFontSize(34)
    doc.text('Certificado de Conclusão', pageW / 2, 50, { align: 'center' })

    doc.setFont('times', 'italic')
    doc.setFontSize(13)
    doc.setTextColor(75, 85, 99)
    doc.text('Conferimos o presente certificado a', pageW / 2, 68, { align: 'center' })

    doc.setFont('times', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(15, 20, 26)
    doc.text(data.studentName, pageW / 2, 86, { align: 'center' })

    doc.setFont('times', 'italic')
    doc.setFontSize(13)
    doc.setTextColor(75, 85, 99)
    doc.text('por concluir com aproveitamento o curso', pageW / 2, 100, { align: 'center' })

    doc.setFont('times', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(15, 20, 26)
    const courseLines = doc.splitTextToSize(data.courseTitle, pageW - 60)
    doc.text(courseLines, pageW / 2, 116, { align: 'center' })

    const completedDateStr = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(data.completedAt))

    doc.setFont('times', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(55, 65, 81)
    const finalLine = data.finalScore !== null
      ? `Concluído em ${completedDateStr} com nota final ${Math.round(data.finalScore)}%.`
      : `Concluído em ${completedDateStr}.`
    doc.text(finalLine, pageW / 2, 142, { align: 'center' })

    doc.setFont('times', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(107, 114, 128)
    doc.text(`Emitido por ${data.creatorName} via plataforma Resenha do Teólogo.`, pageW / 2, 152, {
      align: 'center',
    })

    doc.addImage(qrDataUrl, 'PNG', pageW - 50, pageH - 52, 36, 36)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(75, 85, 99)
    doc.text('Verifique a autenticidade em', pageW - 32, pageH - 13, { align: 'center' })
    doc.text(verifyUrl, pageW - 32, pageH - 9, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text(`Código: ${data.verificationCode}`, 18, pageH - 13)
    doc.text(
      `Emitido em ${new Intl.DateTimeFormat('pt-BR').format(new Date(data.paidAt))}`,
      18,
      pageH - 9,
    )

    const pdfBytes = doc.output('arraybuffer') as ArrayBuffer
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const storageId = await ctx.storage.store(blob)

    await ctx.runMutation(internal.certificates.attachPdfStorageId, {
      orderId,
      storageId,
    })

    return storageId
  },
})
