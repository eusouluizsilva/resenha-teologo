import { useEffect } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { AdSlot } from '@/components/AdSlot'
import { fadeUp, fadeIn, staggerContainer, scaleSoft } from '@/lib/motion'
import { useFaqJsonLd, useJsonLd, useSeo } from '@/lib/seo'

function useInView(threshold = 0.15) {
  return {
    initial: 'hidden',
    whileInView: 'visible',
    viewport: { once: true, amount: threshold },
  }
}

const heroStats = [
  { value: '100%', label: 'gratuito para alunos' },
  { value: '70%', label: 'média mínima para certificar' },
  { value: 'PT', label: 'base pensada para o Brasil' },
  { value: 'Multi', label: 'perfis: aluno, professor e instituição' },
]

const accessModel = [
  {
    eyebrow: 'Acesso livre',
    title: 'Todo conteúdo é gratuito para quem quer aprender.',
    description:
      'A plataforma remove a barreira da compra. O aluno entra, estuda e avança sem precisar pagar para começar.',
    dark: true,
    items: ['Sem venda de cursos', 'Certificação com média mínima', 'Experiência pensada para permanência'],
  },
  {
    eyebrow: 'Professores',
    title: 'Ensine com autoridade, sem transformar seu conteúdo em página de vendas.',
    description:
      'Professores publicam cursos em um ambiente sério, acompanham o progresso dos alunos e recebem apoio da comunidade sem depender de funis de venda.',
    dark: false,
    items: ['Dashboard de cursos e aulas', 'Doações e apoio da audiência', 'Espaço próprio dentro da plataforma'],
  },
  {
    eyebrow: 'Premium opcional',
    title: 'A receita não depende de bloquear o estudo.',
    description:
      'Os planos sem anúncios melhoram a experiência, mas o centro da proposta continua sendo acesso livre para estudar.',
    dark: false,
    items: ['Aluno sem anúncios', 'Professor sem anúncios no seu espaço', 'Camada premium sem travar o estudo'],
  },
]

const learningFlow = [
  {
    step: '01',
    title: 'Assista com progresso real',
    description:
      'Vídeo, acompanhamento de tempo assistido e estrutura por módulos deixam o estudo mais sério e mais claro.',
  },
  {
    step: '02',
    title: 'Leia, anote e consulte',
    description:
      'Bíblia integrada, materiais de apoio e caderno digital ficam ao lado da aula, não escondidos em outra tela.',
  },
  {
    step: '03',
    title: 'Consolide o aprendizado',
    description:
      'Questionários por aula e média final transformam a aula em formação real, não só consumo de conteúdo.',
  },
]

const studentFeatures = [
  {
    title: 'Bíblia e aula no mesmo ambiente',
    description:
      'Múltiplas traduções em um só lugar, com expansão prevista para grego, hebraico e interlinear, sem interromper o estudo.',
  },
  {
    title: 'Caderno digital vinculado ao estudo',
    description:
      'Notas por aula, por tema e por contexto. O estudo deixa de ser disperso e passa a morar dentro da plataforma.',
  },
  {
    title: 'Certificação baseada em aproveitamento',
    description:
      'O certificado é consequência da aprendizagem. A média mínima de 70% preserva sua credibilidade.',
  },
]

const creatorFeatures = [
  'Criação de cursos, módulos e aulas em um fluxo simples',
  'Questionários por aula com estrutura já integrada ao produto',
  'Doações e apoio voluntário da audiência dentro da plataforma',
  'Visibilidade para quem ainda não tem audiência consolidada',
  'Estrutura preparada para crescer sem retrabalho técnico',
]

const institutionFeatures = [
  {
    title: 'Matrícula em lote',
    description: 'Pastores, igrejas e instituições podem organizar o estudo coletivo com menos fricção operacional.',
  },
  {
    title: 'Acompanhamento centralizado',
    description: 'A visão institucional acompanha progresso, participação e evolução da comunidade em um só lugar.',
  },
  {
    title: 'Trilha própria de formação',
    description: 'A plataforma evolui com espaço para programas personalizados, identidade própria e governança mais madura.',
  },
]

const comparisonRows = [
  { item: 'Todo conteúdo gratuito para alunos', platform: true, hotmart: false, youtube: true, generic: false },
  { item: 'Foco nativo em formação teológica', platform: true, hotmart: false, youtube: false, generic: false },
  { item: 'Avaliação com certificado por aproveitamento', platform: true, hotmart: true, youtube: false, generic: true },
  { item: 'Caderno digital vinculado à aula', platform: true, hotmart: false, youtube: false, generic: false },
  { item: 'Doações diretas para o criador', platform: true, hotmart: false, youtube: true, generic: false },
  { item: 'Sem venda obrigatória de cursos', platform: true, hotmart: false, youtube: true, generic: false },
]

const libraryFeatures = [
  'Traduções em português, inglês e camadas futuras multilíngues',
  'Textos originais, interlinear e consulta durante a aula',
  'Materiais de apoio por curso, aula e trilha de estudo',
  'Ambiente mais próximo de biblioteca contemporânea do que de portal genérico',
]

function CheckMark({ muted = false }: { muted?: boolean }) {
  return muted ? (
    <svg className="mx-auto h-4 w-4 text-white/25" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg className="mx-auto h-5 w-5 text-[#F37E20]" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function XMark() {
  return (
    <svg className="mx-auto h-4 w-4 text-white/15" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
}

type SectionIntroProps = {
  eyebrow: string
  title: string
  description: string
  light?: boolean
  centered?: boolean
}

function SectionIntro({ eyebrow, title, description, light = false, centered = false }: SectionIntroProps) {
  const titleColor = light ? 'text-[#111827]' : 'text-white'
  const textColor = light ? 'text-[#5A6472]' : 'text-white/55'

  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : ''}>
      <span className={`text-xs font-semibold uppercase tracking-[0.28em] ${light ? 'text-[#A05F26]' : 'text-[#F37E20]'}`}>
        {eyebrow}
      </span>
      <h2 className={`mt-4 font-display text-3xl font-bold leading-tight md:text-4xl ${titleColor}`}>{title}</h2>
      <p className={`mt-4 max-w-2xl text-sm leading-7 md:text-base ${textColor} ${centered ? 'mx-auto' : ''}`}>{description}</p>
    </div>
  )
}

function CoursePlaceholderCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-dashed border-[#CFC2B2] bg-white/55">
      <div className="relative flex aspect-[16/9] w-full items-center justify-center bg-[#F37E20]/6">
        <svg className="h-12 w-12 text-[#F37E20]/35" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
        <span className="absolute left-3 top-3 rounded-full border border-[#CFC2B2] bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9D7B5E]">
          Em breve
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A05F26]/70">
          Novos cursos
        </p>
        <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-[#5A6472]">
          Mais cursos chegando em breve
        </h3>
        <p className="mt-2 line-clamp-3 font-serif text-sm leading-6 text-[#7A8390]">
          Estamos preparando novos cursos teológicos para você. Volte em breve para conferir.
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-[#9CA3AF]">
          <div className="h-6 w-6 rounded-full border border-dashed border-[#CFC2B2]" />
          <span>Resenha do Teólogo</span>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  const inView = useInView()
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const featuredArticles = useQuery(api.landingHighlights.getArticleTrio, {})
  const featuredCourses = useQuery(api.landingHighlights.getCourseTrio, {})

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

  type CourseTrioItem = NonNullable<typeof featuredCourses>[number]
  const courseSlots: Array<CourseTrioItem | null> = [
    (featuredCourses ?? [])[0] ?? null,
    (featuredCourses ?? [])[1] ?? null,
    (featuredCourses ?? [])[2] ?? null,
  ]

  return (
    <PublicPageShell>
    <LazyMotion features={domAnimation} strict>
    <div className="min-h-screen overflow-x-hidden bg-[#0F141A] text-white">
      <section className="relative overflow-hidden px-6 pb-16 pt-32 md:pt-36">
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/fotos/hero-bible.jpg"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover opacity-[0.12]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,18,0.48)_0%,rgba(15,20,26,0.88)_48%,#0F141A_100%)]" />
          <div className="absolute left-[8%] top-[10%] h-56 w-56 rounded-full bg-[#F37E20]/10 blur-[110px]" />
          <div className="absolute right-[10%] top-[18%] h-72 w-72 rounded-full bg-white/5 blur-[130px]" />
        </div>

        <m.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto max-w-7xl"
        >
          <div className="grid items-end gap-12 lg:grid-cols-2">
            <div className="max-w-2xl">
              <m.div variants={fadeIn} className="inline-flex items-center gap-3 rounded-full border border-[#F37E20]/25 bg-[#F37E20]/8 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-[#F37E20] shadow-[0_0_0_6px_rgba(243,126,32,0.12)]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F8D4B5]">
                  Formação teológica séria, gratuita e bem estruturada
                </span>
              </m.div>

              <m.h1
                variants={fadeUp}
                className="mt-8 font-display text-[clamp(2.6rem,6vw,4.5rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-white"
              >
                A plataforma de estudo{' '}
                <span style={{ fontFamily: 'Source Serif 4, serif' }} className="font-normal italic text-[#F3D7BE]">
                  teológico
                </span>{' '}
                para quem leva formação a sério.
              </m.h1>

              <m.p variants={fadeUp} className="mt-6 max-w-xl text-base leading-8 text-white/68 md:text-lg">
                Alunos estudam com mais clareza e continuidade. Professores publicam com autoridade, formam comunidade e monetizam
                sem transformar o ensino em página de venda.
              </m.p>

              <m.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/cadastro?perfil=aluno"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F37E20] px-6 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(243,126,32,0.24)] transition-all duration-200 hover:bg-[#e06e10]"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  Quero aprender gratuitamente
                </Link>
                <Link
                  to="/cadastro?perfil=criador"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/4 px-6 py-4 text-sm font-semibold text-white/86 transition-all duration-200 hover:border-white/20 hover:bg-white/8"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.258a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                    />
                  </svg>
                  Quero publicar meu conteúdo
                </Link>
              </m.div>

              <m.p variants={fadeIn} className="mt-6 text-sm leading-6 text-white/42">
                Sem venda de cursos. O estudo é livre para todos, com opção de experiência sem anúncios.
              </m.p>
            </div>

            <m.div variants={scaleSoft} className="relative hidden h-[34rem] lg:block lg:h-[38rem]">
              <div className="absolute inset-x-10 top-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#1A2230_0%,#141B24_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.32)]">
                <div className="flex items-center justify-between px-6 pt-5 text-[11px] uppercase tracking-[0.18em] text-white/38">
                  <span>Curso em destaque</span>
                  <span>Hermenêutica Bíblica</span>
                </div>

                <div className="p-5">
                  <div className="relative overflow-hidden rounded-[1.4rem]">
                    <img
                      src="/fotos/bible-laptop-headphones.jpg"
                      alt="Ambiente de estudo com Bíblia e laptop"
                      loading="lazy"
                      decoding="async"
                      className="h-56 w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,20,26,0.12)_0%,rgba(15,20,26,0.70)_100%)]" />
                    <div className="absolute bottom-4 left-4 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/76">
                      Bíblia, caderno e progresso no mesmo fluxo
                    </div>
                  </div>

                  <div className="mt-5 px-1 pb-6">
                    <h3 className="font-display text-2xl font-bold text-white">Uma experiência de estudo pensada para permanência.</h3>
                    <p className="mt-3 text-sm leading-7 text-white/58">
                      O aluno não entra só para assistir. Ele lê, consulta, anota, responde e continua a jornada. A plataforma funciona como ambiente de formação, não como vitrine de vídeos.
                    </p>
                    <div className="mt-5 grid grid-cols-3 gap-3">
                      {[
                        { value: '100%', label: 'gratuito para alunos' },
                        { value: '70%', label: 'média mínima certificada' },
                        { value: 'Multi', label: 'perfis de acesso' },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/6 bg-white/4 px-4 py-3">
                          <strong className="block font-display text-lg font-bold text-white">{item.value}</strong>
                          <span className="mt-1 block text-[11px] uppercase tracking-[0.14em] text-white/34">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute right-0 top-10 w-48 rounded-[1.6rem] border border-[#F37E20]/20 bg-[#171D26]/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">Para professores</p>
                <p className="mt-3 font-display text-3xl font-bold text-[#FFF1E4]">R$ 0</p>
                <p className="mt-2 text-sm leading-6 text-white/56">
                  Publique seus cursos gratuitamente e construa sua comunidade.
                </p>
              </div>

              <div className="absolute bottom-20 left-0 w-52 rounded-[1.6rem] border border-white/10 bg-[#111721]/92 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Em andamento</p>
                <p className="mt-2 text-sm font-semibold leading-5 text-white">Hermenêutica Bíblica</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-white/30">Progresso</span>
                    <span className="text-[10px] font-semibold text-[#F2BD8A]">68%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/8">
                    <div className="h-1.5 w-[68%] rounded-full bg-[#F37E20]" />
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-white/36">Próxima: Aula 7</p>
              </div>

              <div className="absolute bottom-0 right-10 w-48 rounded-[1.6rem] border border-white/10 bg-[#111721]/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Nota de aula</p>
                <p className="mt-3 text-sm leading-6 text-white/68">
                  Versículos, materiais e anotações ficam ao lado do vídeo. Tudo permanece dentro do mesmo fluxo de estudo.
                </p>
              </div>
            </m.div>
          </div>
        </m.div>

        <m.div
          variants={staggerContainer}
          {...inView}
          className="relative z-10 mx-auto mt-16 grid max-w-7xl gap-6 border-t border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {heroStats.map((stat) => (
            <m.div key={stat.label} variants={fadeUp}>
              <p className="font-display text-3xl font-extrabold text-white">{stat.value}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/38">{stat.label}</p>
            </m.div>
          ))}
        </m.div>
      </section>

      <section className="bg-[#EFE9E1] px-6 py-24 text-[#111827]">
        <m.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <m.div variants={fadeUp} className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F37E20]">
                Cursos em destaque
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
                Três caminhos para começar agora.
              </h2>
              <p className="mt-3 max-w-xl font-serif text-base leading-7 text-[#4B5563]">
                O curso com mais alunos matriculados, o lançamento mais recente e um curso do perfil oficial @resenhadoteologo, atualizado todos os dias.
              </p>
            </div>
            <Link
              to="/cursos"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#111827]/10 bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:border-[#F37E20]/40 hover:text-[#7A4A14]"
            >
              Ver todos os cursos
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5l7.5 7.5-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </m.div>

          <m.div variants={staggerContainer} className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {courseSlots.map((course, index) => {
              if (!course) {
                return (
                  <m.div key={`placeholder-${index}`} variants={fadeUp}>
                    <CoursePlaceholderCard />
                  </m.div>
                )
              }
              const slotLabel =
                course.slot === 'top'
                  ? 'Mais procurado'
                  : course.slot === 'recent'
                    ? 'Mais recente'
                    : 'Do @resenhadoteologo'
              const href = course.slug ? `/cursos/${course.slug}` : `/cursos`
              return (
                <m.div key={String(course._id)} variants={fadeUp}>
                  <Link
                    to={href}
                    className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-[#D9CFC2] bg-white transition-all hover:border-[#F37E20]/40 hover:shadow-[0_24px_60px_rgba(17,24,39,0.08)]"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#E8DFD4]">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#F37E20]/8 text-[#F37E20]">
                          <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                          </svg>
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-[#111827]/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                        {slotLabel}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F37E20]">
                        {course.category}
                      </p>
                      <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-[#111827] group-hover:text-[#7A4A14]">
                        {course.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 font-serif text-sm leading-6 text-[#4B5563]">
                        {course.shortDescription}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-[#6B7280]">
                        <div className="flex items-center gap-2">
                          {course.creator.avatarUrl ? (
                            <img
                              src={course.creator.avatarUrl}
                              alt={course.creator.name}
                              loading="lazy"
                              decoding="async"
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F37E20]/10 text-[10px] font-semibold text-[#F37E20]">
                              {course.creator.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span>{course.creator.name}</span>
                        </div>
                        <span className="text-[11px] text-[#9CA3AF]">
                          {course.totalLessons} aulas
                        </span>
                      </div>
                    </div>
                  </Link>
                </m.div>
              )
            })}
          </m.div>
        </m.div>
      </section>

      {featuredArticles && featuredArticles.length > 0 && (
        <section className="bg-[#F7F5F2] px-6 py-24 text-[#111827]">
          <m.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
            <m.div variants={fadeUp} className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F37E20]">
                  Em destaque no blog
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
                  Três leituras escolhidas para hoje.
                </h2>
                <p className="mt-3 max-w-xl font-serif text-base leading-7 text-[#4B5563]">
                  O artigo com mais interações, o mais recente publicado e um destaque do perfil oficial @resenhadoteologo, atualizado todos os dias.
                </p>
              </div>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#111827]/10 bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:border-[#F37E20]/40 hover:text-[#7A4A14]"
              >
                Ver todos os artigos
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5l7.5 7.5-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </m.div>

            <m.div variants={staggerContainer} className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {featuredArticles.map((article) => {
                const slotLabel =
                  article.slot === 'top'
                    ? 'Mais lido'
                    : article.slot === 'recent'
                      ? 'Mais recente'
                      : 'Do @resenhadoteologo'
                return (
                  <m.div key={String(article._id)} variants={fadeUp}>
                    <Link
                      to={
                        article.author.handle
                          ? `/blog/${article.author.handle}/${article.slug}`
                          : '/blog'
                      }
                      className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-[#E6DBCF] bg-white transition-all hover:border-[#F37E20]/40 hover:shadow-[0_24px_60px_rgba(17,24,39,0.08)]"
                    >
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#F2EAE1]">
                        {article.coverImageUrl ? (
                          <img
                            src={article.coverImageUrl}
                            alt={article.title}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#F37E20]/8 text-[#F37E20]">
                            <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                          </div>
                        )}
                        <span className="absolute left-3 top-3 rounded-full bg-[#111827]/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                          {slotLabel}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F37E20]">
                          {article.categorySlug.replace(/-/g, ' ')}
                        </p>
                        <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-[#111827] group-hover:text-[#7A4A14]">
                          {article.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 font-serif text-sm leading-6 text-[#4B5563]">
                          {article.excerpt}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-[#6B7280]">
                          {article.author.avatarUrl ? (
                            <img
                              src={article.author.avatarUrl}
                              alt={article.author.name}
                              loading="lazy"
                              decoding="async"
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F37E20]/10 text-[10px] font-semibold text-[#F37E20]">
                              {article.author.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span>{article.author.name}</span>
                        </div>
                      </div>
                    </Link>
                  </m.div>
                )
              })}
            </m.div>
          </m.div>
        </section>
      )}

      <section className="bg-[#F7F5F2] px-6 py-24 text-[#111827]">
        <m.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <m.div variants={fadeUp}>
              <SectionIntro
                eyebrow="Modelo da plataforma"
                title="Acesso livre para o aluno, autoridade para o professor e sustentabilidade para a plataforma."
                description="O aluno não precisa pagar para começar a estudar. O professor não precisa vender curso para gerar receita. A plataforma organiza os dois lados dentro da mesma lógica."
                light
              />
            </m.div>
            <m.p variants={fadeUp} className="max-w-xl text-sm leading-7 text-[#5A6472] md:text-base">
              A Resenha do Teólogo parte de uma convicção simples: formação teológica de qualidade deve ser acessível. Professores ganham estrutura e apoio. Alunos ganham estudo sério, sem que o acesso dependa da venda do conteúdo.
            </m.p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {accessModel.map((item) => (
              <m.div
                key={item.title}
                variants={scaleSoft}
                className={`rounded-[1.8rem] border px-7 py-7 ${
                  item.dark
                    ? 'border-[#202A38] bg-[#1B2430] text-white'
                    : 'border-[#E5DDD4] bg-white text-[#111827]'
                }`}
              >
                <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${item.dark ? 'text-[#F1B783]' : 'text-[#A05F26]'}`}>
                  {item.eyebrow}
                </p>
                <h3 className={`mt-4 font-display text-2xl font-bold leading-tight ${item.dark ? 'text-white' : 'text-[#111827]'}`}>
                  {item.title}
                </h3>
                <p className={`mt-4 text-sm leading-7 ${item.dark ? 'text-white/62' : 'text-[#5A6472]'}`}>{item.description}</p>
                <div className="mt-6 space-y-3">
                  {item.items.map((detail) => (
                    <div key={detail} className={`flex items-start gap-3 text-sm leading-6 ${item.dark ? 'text-white/76' : 'text-[#495363]'}`}>
                      <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#F37E20]" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </m.div>
            ))}
          </div>
        </m.div>
      </section>

      <section className="bg-[#0A0E13] px-6 py-24">
        <m.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <m.div variants={scaleSoft} className="overflow-hidden rounded-[2rem] border border-white/8">
              <img
                src="/fotos/library-hall.jpg"
                alt="Biblioteca teológica"
                loading="lazy"
                decoding="async"
                className="h-full min-h-[30rem] w-full object-cover object-center"
              />
            </m.div>

            <m.div variants={fadeUp}>
              <SectionIntro
                eyebrow="Biblioteca teológica"
                title="Uma biblioteca teológica integrada ao ambiente de estudo."
                description="Bíblia, eBooks e materiais de apoio ficam dentro da plataforma, ao lado da aula. Quando tudo está no mesmo lugar, o estudo ganha continuidade."
              />

              <div className="mt-8 rounded-[1.8rem] border border-white/8 bg-[#151B23] p-6">
                <div className="border-l-2 border-[#F37E20]/45 pl-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#F2BD8A]">Versículo em destaque</p>
                  <p className="mt-3 text-lg leading-8 text-white/84" style={{ fontFamily: 'Source Serif 4, serif' }}>
                    "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus."
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/30">João 1:1</p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {libraryFeatures.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[1.3rem] border border-white/8 bg-white/3 px-5 py-4 text-sm leading-7 text-white/72">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#F37E20]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </m.div>
          </div>
        </m.div>
      </section>

      <section id="como-funciona" className="bg-[#0D1218] px-6 py-24">
        <m.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Como funciona"
            title="Do vídeo ao certificado, com uma jornada que transforma aula em formação."
            description="Cada etapa foi pensada para transformar aula em formação. Você assiste, consulta, anota, responde e conclui com um certificado baseado em aproveitamento real."
            centered
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <m.div variants={scaleSoft} className="overflow-hidden rounded-[2rem] border border-white/8">
              <img
                src="/fotos/bible-laptop-headphones.jpg"
                alt="Bíblia e laptop sobre mesa de estudo"
                loading="lazy"
                decoding="async"
                className="h-full min-h-[28rem] w-full object-cover object-center"
              />
            </m.div>

            <div className="grid gap-5">
              {learningFlow.map((item) => (
                <m.div key={item.step} variants={fadeUp} className="rounded-[1.7rem] border border-white/8 bg-white/3 p-7">
                  <span className="font-display text-sm font-bold tracking-[0.2em] text-[#F37E20]/55">{item.step}</span>
                  <h3 className="mt-4 font-display text-2xl font-bold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/58">{item.description}</p>
                </m.div>
              ))}
            </div>
          </div>
        </m.div>
      </section>

      <section id="para-alunos" className="bg-[#F7F5F2] px-6 py-24 text-[#111827]">
        <m.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <m.div variants={scaleSoft} className="order-2 rounded-[2rem] border border-[#E4DCD2] bg-white p-7 shadow-[0_18px_50px_rgba(17,24,39,0.06)] lg:order-1">
              <div className="flex items-center justify-between border-b border-[#ECE5DD] pb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#9D7B5E]">Modo de estudo</p>
                  <h3 className="mt-2 font-display text-2xl font-bold text-[#111827]">Conforto visual para leitura longa</h3>
                </div>
                <span className="rounded-full bg-[#F37E20]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B1621D]">
                  Light editorial
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-[1.4rem] border border-[#ECE5DD] bg-[#F8F4EE] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#9D7B5E]">Versículo em foco</p>
                  <p className="mt-3 text-lg leading-8 text-[#1C2430]" style={{ fontFamily: 'Source Serif 4, serif' }}>
                    "E o Verbo se fez carne e habitou entre nós, e vimos a sua glória."
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#7A8390]">João 1:14</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.3rem] border border-[#ECE5DD] bg-white p-5">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#9D7B5E]">Caderno</p>
                    <p className="mt-2 text-sm leading-7 text-[#556071]">
                      Notas por aula, insights e referências organizados no mesmo fluxo do estudo.
                    </p>
                  </div>
                  <div className="rounded-[1.3rem] border border-[#ECE5DD] bg-white p-5">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#9D7B5E]">Progresso</p>
                    <p className="mt-2 text-sm leading-7 text-[#556071]">
                      Visual limpo, progresso claro e sensação de continuidade em vez de ruído.
                    </p>
                  </div>
                </div>
              </div>
            </m.div>

            <m.div variants={fadeUp} className="order-1 lg:order-2">
              <SectionIntro
                eyebrow="Para alunos"
                title="Um lugar para estudar de verdade, não só para assistir vídeos."
                description="Bíblia, caderno, progresso e certificado vivem no mesmo ambiente. Você não precisa sair da plataforma para consultar, anotar ou revisar o que aprendeu."
                light
              />

              <div className="mt-8 space-y-5">
                {studentFeatures.map((item) => (
                  <div key={item.title} className="rounded-[1.5rem] border border-[#E4DCD2] bg-white px-6 py-5">
                    <h3 className="font-display text-xl font-bold text-[#111827]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#556071]">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  to="/cadastro?perfil=aluno"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#F37E20] px-6 py-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#e06e10]"
                >
                  Criar minha conta de aluno
                </Link>
              </div>
            </m.div>
          </div>
        </m.div>
      </section>

      <section id="para-professores" className="bg-[#0A0E13] px-6 py-24">
        <m.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <m.div variants={fadeUp}>
              <SectionIntro
                eyebrow="Para professores"
                title="Publique cursos com a seriedade que seu conteúdo exige."
                description="Você publica cursos, organiza módulos e acompanha o progresso dos alunos. A plataforma cuida da experiência, da certificação e da base para o crescimento da sua comunidade."
              />

              <div className="mt-8 space-y-3">
                {creatorFeatures.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[1.3rem] border border-white/8 bg-white/3 px-5 py-4 text-sm leading-7 text-white/74">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#F37E20]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  to="/cadastro?perfil=criador"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#F37E20] px-6 py-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#e06e10]"
                >
                  Criar minha conta de criador
                </Link>
              </div>
            </m.div>

            <m.div variants={scaleSoft} className="space-y-4">
              <div className="overflow-hidden rounded-[2rem] border border-white/8">
                <img
                  src="/fotos/creator-recording.jpg"
                  alt="Professor gravando aula"
                  loading="lazy"
                  decoding="async"
                  className="h-64 w-full object-cover object-top"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.6rem] border border-white/8 bg-[#151B23] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Painel</p>
                  <p className="mt-3 font-display text-3xl font-bold text-white">12 cursos</p>
                  <p className="mt-2 text-sm leading-6 text-white/52">Estrutura clara para organizar conteúdo sem poluição visual.</p>
                </div>
                <div className="rounded-[1.6rem] border border-[#F37E20]/20 bg-[#F37E20]/8 p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#F4C59B]">Repasse</p>
                  <p className="mt-3 font-display text-3xl font-bold text-[#FFF1E3]">70%</p>
                  <p className="mt-2 text-sm leading-6 text-[#F7D9BC]/72">Participação da receita gerada por anúncios no espaço do criador.</p>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/8 bg-[#151B23] p-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Percepção de marca</p>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  Seu conteúdo passa a ser percebido dentro de uma plataforma séria, com linguagem visual que reforça autoridade e maturidade.
                </p>
              </div>
            </m.div>
          </div>
        </m.div>
      </section>

      <section id="para-igrejas" className="bg-[#EEE7DE] px-6 py-24 text-[#111827]">
        <m.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Para igrejas e instituições"
            title="Formação coletiva com a seriedade que sua comunidade exige."
            description="Igrejas, seminários e grupos de estudo encontram na plataforma uma estrutura para organizar o ensino, acompanhar o progresso e certificar os membros com credibilidade."
            light
            centered
          />

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {institutionFeatures.map((item) => (
              <m.div key={item.title} variants={scaleSoft} className="rounded-[1.7rem] border border-[#DED3C6] bg-white px-6 py-6">
                <h3 className="font-display text-xl font-bold text-[#111827]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5A6472]">{item.description}</p>
              </m.div>
            ))}
          </div>

          <m.div variants={fadeUp} className="mt-10 text-center">
            <Link
              to="/cadastro?perfil=instituicao"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#CDBEAF] bg-white px-6 py-4 text-sm font-semibold text-[#111827] transition-colors duration-200 hover:border-[#BBA48E] hover:bg-[#F7F2EC]"
            >
              Solicitar plano institucional
            </Link>
          </m.div>
        </m.div>
      </section>

      <section className="bg-[#0D1218] px-6 py-24">
        <m.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Diferença real"
            title="O que separa a Resenha do Teólogo de qualquer outra plataforma."
            description="Não é só uma questão de design. É uma decisão sobre o que a formação teológica deve ser: gratuita, séria e pensada para estudo contínuo."
            centered
          />

          <m.div variants={fadeUp} className="mt-14 overflow-hidden rounded-[2rem] border border-white/8 bg-[#131A23]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="px-6 py-5 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-white/34">
                      Funcionalidade
                    </th>
                    <th className="px-4 py-5 text-center text-xs font-semibold text-[#F37E20]">Resenha do Teólogo</th>
                    <th className="px-4 py-5 text-center text-xs text-white/26">Hotmart</th>
                    <th className="px-4 py-5 text-center text-xs text-white/26">YouTube</th>
                    <th className="px-4 py-5 text-center text-xs text-white/26">EAD genérico</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, index) => (
                    <tr key={row.item} className={index % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                      <td className="border-b border-white/6 px-6 py-4 text-white/72">{row.item}</td>
                      <td className="border-b border-white/6 px-4 py-4 text-center">{row.platform ? <CheckMark /> : <XMark />}</td>
                      <td className="border-b border-white/6 px-4 py-4 text-center">{row.hotmart ? <CheckMark muted /> : <XMark />}</td>
                      <td className="border-b border-white/6 px-4 py-4 text-center">{row.youtube ? <CheckMark muted /> : <XMark />}</td>
                      <td className="border-b border-white/6 px-4 py-4 text-center">{row.generic ? <CheckMark muted /> : <XMark />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </m.div>
        </m.div>
      </section>

      <section id="planos" className="bg-[#F7F5F2] px-6 py-24 text-[#111827]">
        <m.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Planos"
            title="Todo o conteúdo é livre. O plano premium apenas melhora a experiência."
            description="Todo conteúdo permanece gratuito. Os planos sem anúncios existem para quem deseja estudar com menos distração."
            light
            centered
          />

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {[
              {
                name: 'Gratuito',
                price: 'R$ 0',
                period: '',
                description: 'Acesso completo a todos os cursos, com anúncios.',
                features: ['Todos os cursos disponíveis', 'Quizzes e avaliações', 'Certificados de conclusão', 'Bíblia integrada'],
                cta: 'Criar conta grátis',
                href: '/cadastro?perfil=aluno',
                highlight: false,
              },
              {
                name: 'Premium',
                price: 'R$ 9,99',
                period: '/mês',
                description: 'A mesma formação, sem anúncios e com experiência mais limpa.',
                features: ['Tudo do plano Gratuito', 'Sem anúncios em toda a plataforma', 'Acesso prioritário a novidades', 'Suporte por email'],
                cta: 'Assinar Premium',
                href: '/dashboard/planos',
                highlight: true,
              },
              {
                name: 'Criador / Professor / Igreja / Instituição de Ensino',
                price: 'R$ 39,99',
                period: '/mês',
                description: 'Para criadores, professores, igrejas e instituições que querem publicar cursos e organizar a formação de muitos alunos, sem anúncios.',
                features: ['Publicação ilimitada de cursos e artigos', 'Matrícula e painel de progresso coletivo', 'Membros e alunos ilimitados', 'Sem anúncios para o seu público'],
                cta: 'Solicitar plano institucional',
                href: 'mailto:hello@resenhadoteologo.com',
                highlight: false,
              },
            ].map((plan) => (
              <m.div
                key={plan.name}
                variants={scaleSoft}
                className={`flex flex-col rounded-[1.8rem] border px-7 py-7 ${
                  plan.highlight
                    ? 'border-[#F37E20]/30 bg-[#1B2430] text-white'
                    : 'border-[#E5DDD4] bg-white text-[#111827]'
                }`}
              >
                <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${plan.highlight ? 'text-[#F1B783]' : 'text-[#A05F26]'}`}>
                  {plan.name}
                </p>
                <div className="mt-4 flex items-end gap-1">
                  <span className={`font-display text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-[#111827]'}`}>{plan.price}</span>
                  {plan.period && <span className={`mb-1 text-sm ${plan.highlight ? 'text-white/48' : 'text-[#7A8390]'}`}>{plan.period}</span>}
                </div>
                <p className={`mt-3 text-sm leading-7 ${plan.highlight ? 'text-white/58' : 'text-[#5A6472]'}`}>{plan.description}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-3 text-sm ${plan.highlight ? 'text-white/74' : 'text-[#495363]'}`}>
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#F37E20]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.href}
                  className={`mt-8 rounded-[1.1rem] border px-5 py-3 text-center text-sm font-semibold transition-all duration-200 ${
                    plan.highlight
                      ? 'border-[#F37E20]/30 bg-[#F37E20]/14 text-[#F2BD8A] hover:bg-[#F37E20]/24'
                      : 'border-[#CDBEAF] bg-[#F7F2EC] text-[#111827] hover:border-[#BBA48E] hover:bg-[#EEE7DC]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </m.div>
            ))}
          </div>
        </m.div>
      </section>

      <section className="px-6 py-24">
        <m.div variants={staggerContainer} {...inView} className="mx-auto max-w-4xl text-center">
          <m.div variants={fadeIn}>
            <img src="/logos/LOGO ICONE BRANCA.png" alt="Resenha do Teólogo" loading="lazy" decoding="async" width="144" height="144" className="mx-auto mb-8 h-36 w-36" />
          </m.div>
          <m.h2 variants={fadeUp} className="font-display text-3xl font-bold leading-tight text-white md:text-4xl">
            Comece hoje sua formação teológica, gratuitamente.
          </m.h2>
          <m.p variants={fadeUp} className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/56 md:text-base">
            Formação teológica séria, gratuita e bem organizada. Crie sua conta, escolha seus cursos e comece a estudar com professores comprometidos com conteúdo sólido.
          </m.p>
          <m.div variants={fadeUp} className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/cadastro?perfil=aluno"
              className="rounded-2xl bg-[#F37E20] px-8 py-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#e06e10]"
            >
              Criar conta de aluno
            </Link>
            <Link
              to="/cadastro?perfil=criador"
              className="rounded-2xl border border-white/10 bg-white/4 px-8 py-4 text-sm font-semibold text-white/86 transition-colors duration-200 hover:border-white/20 hover:bg-white/8"
            >
              Publicar meu conteúdo
            </Link>
          </m.div>
        </m.div>
      </section>

      <div className="mx-auto my-8 max-w-3xl px-6">
        <AdSlot slotId="landing-footer" responsive />
      </div>

      <footer className="border-t border-[#2A313B] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" loading="lazy" decoding="async" width="160" height="64" className="h-16 w-auto opacity-80" />

          <div className="flex items-center gap-4">
            <a
              href="https://www.youtube.com/@ResenhaDoTe%C3%B3logo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A313B] bg-[#151B23] text-white/40 transition-all duration-200 hover:border-[#F37E20]/40 hover:bg-[#1B2430] hover:text-[#FF0000]"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/eusouluizsilva/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A313B] bg-[#151B23] text-white/40 transition-all duration-200 hover:border-[#F37E20]/40 hover:bg-[#1B2430] hover:text-[#E1306C]"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61574237807743"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A313B] bg-[#151B23] text-white/40 transition-all duration-200 hover:border-[#F37E20]/40 hover:bg-[#1B2430] hover:text-[#1877F2]"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>

          <div className="flex items-center gap-5">
            <Link to="/sobre" className="text-xs text-white/30 transition-colors hover:text-white/60">
              Sobre
            </Link>
            <Link to="/contato" className="text-xs text-white/30 transition-colors hover:text-white/60">
              Contato
            </Link>
            <Link to="/termos" className="text-xs text-white/30 transition-colors hover:text-white/60">
              Termos
            </Link>
            <Link to="/privacidade" className="text-xs text-white/30 transition-colors hover:text-white/60">
              Privacidade
            </Link>
            <Link to="/status" className="text-xs text-white/30 transition-colors hover:text-white/60">
              Status
            </Link>
            <a href="mailto:hello@resenhadoteologo.com" className="text-xs text-white/30 transition-colors hover:text-white/60">
              hello@resenhadoteologo.com
            </a>
          </div>
        </div>

        <div className="mx-auto mt-6 flex max-w-7xl flex-col items-center justify-between gap-2 border-t border-[#2A313B] pt-6 sm:flex-row">
          <p className="text-xs text-white/20">© {new Date().getFullYear()} Resenha do Teólogo. Todos os direitos reservados.</p>
          <p className="text-xs text-white/20">
            Desenvolvido por
            {' '}
            <a
              href="https://silvagrowth.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-white/50"
            >
              Silva Growth
            </a>
          </p>
        </div>
      </footer>
    </div>
    </LazyMotion>
    </PublicPageShell>
  )
}
