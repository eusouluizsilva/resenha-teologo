// Compõe as seções da landing. Cada seção mora em src/pages/landing/, com seus
// próprios dados e markup. Aqui ficam só: SEO/JSON-LD, redirect quando logado,
// scroll pra hash e a ordem visual.

import { useEffect } from 'react'
import { LazyMotion, domAnimation } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { AdSlot } from '@/components/AdSlot'
import { useFaqJsonLd, useJsonLd, useSeo } from '@/lib/seo'
import { HeroSection } from '@/pages/landing/HeroSection'
import { FeaturedCoursesSection } from '@/pages/landing/FeaturedCoursesSection'
import { FeaturedArticlesSection } from '@/pages/landing/FeaturedArticlesSection'
import { AccessModelSection } from '@/pages/landing/AccessModelSection'
import { LibrarySection } from '@/pages/landing/LibrarySection'
import { HowItWorksSection } from '@/pages/landing/HowItWorksSection'
import { StudentsSection } from '@/pages/landing/StudentsSection'
import { CreatorsSection } from '@/pages/landing/CreatorsSection'
import { InstitutionsSection } from '@/pages/landing/InstitutionsSection'
import { ComparisonSection } from '@/pages/landing/ComparisonSection'
import { PlansSection } from '@/pages/landing/PlansSection'
import { FinalCtaSection } from '@/pages/landing/FinalCtaSection'
import { LandingFooter } from '@/pages/landing/LandingFooter'

export function LandingPage() {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoaded || !user) return
    navigate('/dashboard', { replace: true })
  }, [isLoaded, user, navigate])

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://resenhadoteologo.com'

  useSeo({
    title: 'Resenha do Teólogo, formação teológica gratuita e séria',
    description:
      'Plataforma gratuita de teologia: cursos, blog, leitor bíblico e caderno digital. Estude no seu ritmo, com certificado e professores convidados.',
    url: `${origin}/`,
    type: 'website',
  })

  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Resenha do Teólogo',
    url: 'https://resenhadoteologo.com',
    logo: 'https://resenhadoteologo.com/logos/LOGO%20QUADRADA%20LETRA%20BRANCA.png',
    description:
      'Plataforma gratuita de formação teológica com cursos, blog, leitor bíblico e caderno digital.',
    sameAs: [
      'https://www.youtube.com/@ResenhaDoTe%C3%B3logo',
      'https://www.instagram.com/eusouluizsilva/',
      'https://www.facebook.com/profile.php?id=61574237807743',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'hello@resenhadoteologo.com',
      availableLanguage: ['Portuguese'],
    },
  })

  useFaqJsonLd([
    {
      question: 'Os cursos da Resenha do Teólogo são realmente gratuitos?',
      answer:
        'Sim. Todo o conteúdo, cursos, aulas, certificados, Bíblia integrada e caderno digital, é gratuito para o aluno. A operação é sustentada por anúncios respeitosos e por planos opcionais para professores e instituições.',
    },
    {
      question: 'Preciso pagar para receber o certificado?',
      answer:
        'Não. O certificado é emitido automaticamente quando o aluno conclui todas as aulas e atinge nota mínima de 70% nos questionários. O certificado tem código único de verificação pública.',
    },
    {
      question: 'Quem pode criar cursos na plataforma?',
      answer:
        'Professores, teólogos, pastores, seminários e instituições religiosas podem se cadastrar e publicar gratuitamente. O conteúdo é organizado em um espaço editorial próprio, sem competição em marketplace.',
    },
    {
      question: 'Como funciona o leitor de Bíblia integrado?',
      answer:
        'O leitor traz o texto bíblico em português, em interface limpa, com integração ao caderno digital para anotações, marcação de versículos e ligação com aulas que comentam cada passagem.',
    },
    {
      question: 'A plataforma funciona no celular?',
      answer:
        'Sim. É um Progressive Web App (PWA), funciona em qualquer celular, tablet ou computador via navegador, sem necessidade de baixar aplicativo da loja, e pode ser instalado na tela inicial.',
    },
    {
      question: 'Posso usar a Resenha do Teólogo na minha igreja ou seminário?',
      answer:
        'Sim. Existe a opção de cadastro institucional para igrejas, ministérios e seminários. Permite organizar a formação dos membros, acompanhar progresso e emitir certificados internos.',
    },
  ])

  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.slice(1)
    const target = document.getElementById(id)
    if (!target) return
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [location.hash])

  return (
    <PublicPageShell>
      <LazyMotion features={domAnimation} strict>
        <div className="min-h-screen overflow-x-hidden bg-[#0F141A] text-white">
          <HeroSection />
          <FeaturedCoursesSection />
          <FeaturedArticlesSection />
          <AccessModelSection />
          <LibrarySection />
          <HowItWorksSection />
          <StudentsSection />
          <CreatorsSection />
          <InstitutionsSection />
          <ComparisonSection />
          <PlansSection />
          <FinalCtaSection />

          <div className="mx-auto my-8 max-w-3xl px-6">
            <AdSlot slotId="landing-footer" responsive />
          </div>

          <LandingFooter />
        </div>
      </LazyMotion>
    </PublicPageShell>
  )
}
