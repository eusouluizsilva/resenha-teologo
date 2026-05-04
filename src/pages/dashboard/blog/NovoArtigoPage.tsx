import { Link } from 'react-router-dom'
import { brandSecondaryButtonClass } from '@/lib/brand'
import { DashboardPageShell } from '@/components/dashboard/PageShell'
import { EditorArtigo } from './EditorArtigo'

export function NovoArtigoPage() {
  return (
    <DashboardPageShell
      eyebrow="Novo artigo"
      title="Escrever artigo"
      description="Markdown padrão. Imagens, citações e versículos podem ser inseridos diretamente. O preview mostra como o artigo aparece no /blog."
      maxWidthClass="max-w-4xl"
      actions={
        <Link to="/dashboard/blog" className={brandSecondaryButtonClass}>
          Voltar para meus artigos
        </Link>
      }
    >
      <EditorArtigo mode={{ kind: 'create' }} />
    </DashboardPageShell>
  )
}
