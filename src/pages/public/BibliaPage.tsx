// /biblia público. Leitor bíblico aberto a qualquer visitante (anônimo ou
// logado). Usa PublicPageShell pra trocar entre Navbar pública e
// DashboardSidebar conforme estado de auth, e useSeo + JSON-LD pra deixar
// indexável (alta intenção de busca: "joao 3 16", "salmo 23", etc).

import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { BibliaReader } from '@/components/biblia/BibliaReader'
import { useBreadcrumbJsonLd, useJsonLd, useSeo } from '@/lib/seo'

export function BibliaPage() {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://resenhadoteologo.com'
  const url = `${origin}/biblia`

  useSeo({
    title: 'Bíblia online: leia em ARC, NVI, ACF, KJV, Tisch e mais, Resenha do Teólogo',
    description:
      'Leia a Bíblia online de graça. Múltiplas traduções em português, inglês e nos originais (grego e hebraico) para estudo teológico sério.',
    url,
    image: null,
    type: 'website',
  })

  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Bíblia online, Resenha do Teólogo',
    url,
    applicationCategory: 'EducationApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    inLanguage: ['pt-BR', 'en', 'el', 'he'],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
  })

  useBreadcrumbJsonLd([
    { name: 'Início', url: `${origin}/` },
    { name: 'Bíblia', url },
  ])

  return (
    <PublicPageShell>
      <BibliaReader />
    </PublicPageShell>
  )
}

export default BibliaPage
