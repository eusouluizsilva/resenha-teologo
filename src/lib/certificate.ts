// Helpers do certificado academico. A renderizacao visual fica em
// src/components/certificate/CertificadoPreview.tsx, que usa o template
// /certificates/template-academic.png como fundo e gera o PDF via
// html2canvas-pro + jsPDF capturando o proprio DOM (paridade pixel-perfect
// entre tela e impressao).

export function formatCourseHours(seconds: number | undefined): string | null {
  if (!seconds || seconds <= 0) return null
  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} minutos`
  if (minutes === 0) return hours === 1 ? '1 hora' : `${hours} horas`
  return `${hours}h ${minutes}min`
}

export function deriveVerificationCode(enrollmentId: string): string {
  return enrollmentId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16).toUpperCase()
}
