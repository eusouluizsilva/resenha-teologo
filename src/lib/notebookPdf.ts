type NotebookEntry = {
  lessonTitle: string
  courseTitle: string
  content: string
  updatedAt: number
}

type NotebookPdfData = {
  notebookTitle: string
  studentName: string
  entries: NotebookEntry[]
  // Quando definido, gera capa com nome do curso e filename "curso-{slug}.pdf"
  // ao invés de "caderno-{titulo}". Usado pelo botão "Exportar curso inteiro".
  courseTitle?: string
}

type SingleEntryPdfData = {
  studentName: string
  entry: NotebookEntry
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(ts))
}

export async function downloadNotebookPdf(data: NotebookPdfData) {
  // jsPDF é ~400KB minificado, dynamic-import evita carregar no bundle inicial.
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const marginX = 22
  const contentW = pageW - marginX * 2

  doc.setFillColor(247, 245, 242)
  doc.rect(0, 0, pageW, pageH, 'F')

  doc.setFillColor(243, 126, 32)
  doc.rect(0, 0, pageW, 4, 'F')

  doc.setTextColor(30, 36, 48)
  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  doc.text('RESENHA DO TEÓLOGO', marginX, 18)

  doc.setFont('times', 'italic')
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text('Caderno Digital', pageW - marginX, 18, { align: 'right' })

  doc.setFont('times', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(17, 24, 39)
  const headerTitle = data.courseTitle ?? data.notebookTitle
  const titleLines = doc.splitTextToSize(headerTitle, contentW)
  doc.text(titleLines, marginX, 44)
  const titleH = Array.isArray(titleLines) ? titleLines.length * 9 : 9

  doc.setFont('times', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(90, 90, 90)
  const subtitle = data.courseTitle
    ? `Caderno: ${data.notebookTitle} · Por ${data.studentName} · ${data.entries.length} ${data.entries.length === 1 ? 'anotação' : 'anotações'} · ${formatDate(Date.now())}`
    : `Por ${data.studentName} · ${data.entries.length} ${data.entries.length === 1 ? 'entrada' : 'entradas'} · Gerado em ${formatDate(Date.now())}`
  doc.text(subtitle, marginX, 44 + titleH + 4)

  doc.setDrawColor(243, 126, 32)
  doc.setLineWidth(0.5)
  doc.line(marginX, 44 + titleH + 10, marginX + 40, 44 + titleH + 10)

  let y = 44 + titleH + 22

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 20) {
      doc.addPage()
      doc.setFillColor(247, 245, 242)
      doc.rect(0, 0, pageW, pageH, 'F')
      doc.setFillColor(243, 126, 32)
      doc.rect(0, 0, pageW, 4, 'F')
      y = 22
    }
  }

  data.entries.forEach((entry, idx) => {
    ensureSpace(28)

    doc.setFont('times', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(30, 36, 48)
    const lessonLines = doc.splitTextToSize(entry.lessonTitle, contentW)
    doc.text(lessonLines, marginX, y)
    y += (Array.isArray(lessonLines) ? lessonLines.length : 1) * 6 + 1

    doc.setFont('times', 'italic')
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(`${entry.courseTitle} · ${formatDate(entry.updatedAt)}`, marginX, y)
    y += 7

    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    const contentLines = doc.splitTextToSize(entry.content || '(sem conteúdo)', contentW)
    for (const line of contentLines as string[]) {
      ensureSpace(6)
      doc.text(line, marginX, y)
      y += 5.2
    }

    y += 4
    if (idx < data.entries.length - 1) {
      ensureSpace(6)
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.2)
      doc.line(marginX, y, pageW - marginX, y)
      y += 6
    }
  })

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(140, 140, 140)
    doc.text(`resenhadoteologo.com · ${i} / ${pageCount}`, pageW / 2, pageH - 10, { align: 'center' })
  }

  const baseTitle = data.courseTitle ?? data.notebookTitle
  const safeName = baseTitle
    .replace(/[^a-zA-Z0-9À-ÿ\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40)
  const prefix = data.courseTitle ? 'curso' : 'caderno'
  doc.save(`${prefix}-${safeName || 'digital'}.pdf`)
}

export async function downloadEntryPdf(data: SingleEntryPdfData) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const marginX = 22
  const contentW = pageW - marginX * 2

  doc.setFillColor(247, 245, 242)
  doc.rect(0, 0, pageW, pageH, 'F')
  doc.setFillColor(243, 126, 32)
  doc.rect(0, 0, pageW, 4, 'F')

  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 36, 48)
  doc.text('RESENHA DO TEÓLOGO', marginX, 18)

  doc.setFont('times', 'italic')
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text('Anotação', pageW - marginX, 18, { align: 'right' })

  doc.setFont('times', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(17, 24, 39)
  const titleLines = doc.splitTextToSize(data.entry.lessonTitle, contentW)
  doc.text(titleLines, marginX, 40)
  const titleH = Array.isArray(titleLines) ? titleLines.length * 8 : 8

  doc.setFont('times', 'italic')
  doc.setFontSize(11)
  doc.setTextColor(110, 110, 110)
  doc.text(`${data.entry.courseTitle} · ${formatDate(data.entry.updatedAt)}`, marginX, 40 + titleH + 4)

  doc.setDrawColor(243, 126, 32)
  doc.setLineWidth(0.5)
  doc.line(marginX, 40 + titleH + 10, marginX + 40, 40 + titleH + 10)

  let y = 40 + titleH + 22

  doc.setFont('times', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(60, 60, 60)
  const contentLines = doc.splitTextToSize(data.entry.content || '(sem conteúdo)', contentW)
  for (const line of contentLines as string[]) {
    if (y + 6 > pageH - 20) {
      doc.addPage()
      doc.setFillColor(247, 245, 242)
      doc.rect(0, 0, pageW, pageH, 'F')
      doc.setFillColor(243, 126, 32)
      doc.rect(0, 0, pageW, 4, 'F')
      y = 22
    }
    doc.text(line, marginX, y)
    y += 5.6
  }

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(140, 140, 140)
    doc.text(`resenhadoteologo.com · ${data.studentName} · ${i} / ${pageCount}`, pageW / 2, pageH - 10, {
      align: 'center',
    })
  }

  const safe = data.entry.lessonTitle
    .replace(/[^a-zA-Z0-9À-ÿ\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40)
  doc.save(`anotacao-${safe || 'aula'}.pdf`)
}
