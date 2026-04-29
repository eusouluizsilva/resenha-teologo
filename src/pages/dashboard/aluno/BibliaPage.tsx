// Wrapper interno do leitor bíblico para a área do aluno (/dashboard/biblia).
// A lógica vive em components/biblia/BibliaReader; aqui só passamos o link
// "Voltar ao painel" que faz sentido dentro do dashboard.

import { BibliaReader } from '@/components/biblia/BibliaReader'

export default function BibliaPage() {
  return <BibliaReader backHref="/dashboard" backLabel="Voltar ao painel" />
}
