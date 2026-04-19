import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Navbar } from '@/components/layout/Navbar'
import { fadeUp, fadeIn, staggerContainer, scaleSoft } from '@/lib/motion'

function useInView(threshold = 0.15) {
  return {
    initial: 'hidden',
    whileInView: 'visible',
    viewport: { once: true, amount: threshold },
  }
}

const heroStats = [
  { value: '100%', label: 'gratuito para alunos' },
  { value: '2.500+', label: 'traduções da Bíblia' },
  { value: 'Dia 1', label: 'criadores monetizam' },
  { value: 'PT primeiro', label: 'base pensada para o Brasil' },
]

const accessModel = [
  {
    eyebrow: 'Acesso livre',
    title: 'Todo conteúdo nasce gratuito para quem quer aprender.',
    description:
      'A plataforma foi desenhada para remover barreiras de entrada. O aluno entra, estuda e cresce sem precisar comprar curso para começar.',
    dark: true,
    items: ['Sem venda de cursos', 'Certificação com média mínima', 'Experiência pensada para permanência'],
  },
  {
    eyebrow: 'Criadores',
    title: 'Ensine com autoridade, sem parecer página de infoproduto.',
    description:
      'Criadores encontram uma estrutura que valoriza o conteúdo, organiza a comunidade e permite monetização sem sacrificar a credibilidade.',
    dark: false,
    items: ['Dashboard de cursos e aulas', 'Repasse por AdSense e doações', 'Espaço próprio dentro da plataforma'],
  },
  {
    eyebrow: 'Premium opcional',
    title: 'Receita vem da experiência, não do bloqueio de acesso.',
    description:
      'Planos sem anúncios existem para quem deseja um ambiente ainda mais limpo, mas o coração da proposta continua sendo acesso amplo e gratuito.',
    dark: false,
    items: ['Aluno sem anúncios', 'Criador sem anúncios no seu espaço', 'Camada premium sem travar o estudo'],
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
      'Bíblia integrada, materiais de apoio e caderno digital vivem ao lado da aula, não escondidos em outra tela.',
  },
  {
    step: '03',
    title: 'Consolide o aprendizado',
    description:
      'Questionários por aula e média final transformam o curso em formação real, não só consumo de conteúdo.',
  },
]

const studentFeatures = [
  {
    title: 'Bíblia e aula no mesmo ambiente',
    description:
      'Mais de 2.500 traduções, com horizonte futuro para grego, hebraico e interlinear, sem quebrar a concentração do aluno.',
  },
  {
    title: 'Caderno digital vinculado ao estudo',
    description:
      'Notas por aula, por tema e por contexto. O estudo deixa de ser disperso e passa a morar dentro da plataforma.',
  },
  {
    title: 'Certificação baseada em aproveitamento',
    description:
      'O certificado existe como consequência da aprendizagem. A régua de 70% protege seriedade e valor percebido.',
  },
]

const creatorFeatures = [
  'Criação de cursos, módulos e aulas em um fluxo simples',
  'Questionários por aula com estrutura já integrada ao produto',
  'Repasse proporcional de AdSense para o espaço do criador',
  'Doações e apoio voluntário da audiência dentro da plataforma',
  'Estrutura pronta para loja e expansão futura sem retrabalho',
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
  { item: 'Bíblia integrada ao estudo', platform: true, hotmart: false, youtube: false, generic: false },
  { item: 'Caderno digital vinculado à aula', platform: true, hotmart: false, youtube: false, generic: false },
  { item: 'Monetização desde o primeiro momento', platform: true, hotmart: true, youtube: true, generic: false },
  { item: 'Avaliação com certificado', platform: true, hotmart: true, youtube: false, generic: true },
  { item: 'Foco nativo em formação teológica', platform: true, hotmart: false, youtube: false, generic: false },
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

export function LandingPage() {
  const inView = useInView()
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoaded || !user) return
    navigate('/dashboard', { replace: true })
  }, [isLoaded, user, navigate])

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0F141A] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 pb-16 pt-32 md:pt-36">
        <div className="absolute inset-0 pointer-events-none">
          <img src="/fotos/hero-bible.jpg" alt="" className="h-full w-full object-cover opacity-[0.12]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,18,0.48)_0%,rgba(15,20,26,0.88)_48%,#0F141A_100%)]" />
          <div className="absolute left-[8%] top-[10%] h-56 w-56 rounded-full bg-[#F37E20]/10 blur-[110px]" />
          <div className="absolute right-[10%] top-[18%] h-72 w-72 rounded-full bg-white/5 blur-[130px]" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto max-w-7xl"
        >
          <div className="grid items-end gap-12 lg:grid-cols-2">
            <div className="max-w-2xl">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-3 rounded-full border border-[#F37E20]/25 bg-[#F37E20]/8 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-[#F37E20] shadow-[0_0_0_6px_rgba(243,126,32,0.12)]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F8D4B5]">
                  Formação teológica com profundidade, clareza e escala
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="mt-8 font-display text-[clamp(3rem,7vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.05em] text-white"
              >
                A plataforma de
                {' '}
                <span style={{ fontFamily: 'Source Serif 4, serif' }} className="font-normal italic text-[#F3D7BE]">
                  estudo teológico
                </span>
                {' '}
                que parece biblioteca, não template.
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-6 max-w-xl text-base leading-8 text-white/68 md:text-lg">
                Alunos encontram um ambiente de estudo mais sério e mais confortável. Criadores publicam com autoridade,
                constroem comunidade e monetizam sem transformar o conteúdo em página de venda.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
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
              </motion.div>

              <motion.p variants={fadeIn} className="mt-6 text-sm leading-6 text-white/42">
                Sem venda de cursos, com acesso livre para estudar e camadas opcionais para experiência sem anúncios.
              </motion.p>
            </div>

            <motion.div variants={scaleSoft} className="relative h-[34rem] lg:h-[38rem]">
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
                      className="h-56 w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,20,26,0.12)_0%,rgba(15,20,26,0.70)_100%)]" />
                    <div className="absolute bottom-4 left-4 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/76">
                      Bíblia, caderno e progresso no mesmo fluxo
                    </div>
                  </div>

                  <div className="mt-5 px-1 pb-6">
                    <h3 className="font-display text-2xl font-bold text-white">Uma experiência de estudo que sustenta permanência.</h3>
                    <p className="mt-3 text-sm leading-7 text-white/58">
                      O aluno não entra só para assistir. Ele lê, consulta, anota, responde e volta. O produto começa a parecer ambiente de formação.
                    </p>
                    <div className="mt-5 grid grid-cols-3 gap-3">
                      {[
                        { value: '92%', label: 'progresso visível' },
                        { value: '2.500+', label: 'traduções' },
                        { value: '70%', label: 'média mínima' },
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
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/36">Criador</p>
                <p className="mt-3 font-display text-3xl font-bold text-[#FFF1E4]">R$ 4,8k</p>
                <p className="mt-2 text-sm leading-6 text-white/56">
                  Painel financeiro mais sóbrio, sem perder clareza de resultado.
                </p>
              </div>

              <div className="absolute bottom-20 left-0 max-w-sm rounded-[1.7rem] border border-[#D7C5B2] bg-[#F4EEE6] px-6 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B6D56]">Tom editorial</p>
                <p className="mt-3 text-lg leading-8 text-[#1E232B]" style={{ fontFamily: 'Source Serif 4, serif' }}>
                  “Uma marca que comunica reverência intelectual, estrutura digital e permanência de estudo.”
                </p>
              </div>

              <div className="absolute bottom-0 right-10 w-48 rounded-[1.6rem] border border-white/10 bg-[#111721]/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Nota de aula</p>
                <p className="mt-3 text-sm leading-6 text-white/68">
                  Versículos, materiais e anotações vivem ao lado do vídeo. O estudo deixa de ser disperso.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          {...inView}
          className="relative z-10 mx-auto mt-16 grid max-w-7xl gap-6 border-t border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {heroStats.map((stat) => (
            <motion.div key={stat.label} variants={fadeUp}>
              <p className="font-display text-3xl font-extrabold text-white">{stat.value}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/38">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="bg-[#F7F5F2] px-6 py-24 text-[#111827]">
        <motion.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <motion.div variants={fadeUp}>
              <SectionIntro
                eyebrow="Modelo da plataforma"
                title="Acesso amplo, credibilidade alta e monetização sem sacrificar a mensagem."
                description="A homepage deixa de vender blocos e passa a vender uma visão de ecossistema. O produto parece mais autoridade contemporânea e menos ferramenta genérica."
                light
              />
            </motion.div>
            <motion.p variants={fadeUp} className="max-w-xl text-sm leading-7 text-[#5A6472] md:text-base">
              Visualmente, essa camada ajuda a explicar o modelo de negócio sem cair em grade de pricing padrão. Em vez de parecer oferta comercial no centro da página, a proposta surge como arquitetura de acesso.
            </motion.p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {accessModel.map((item) => (
              <motion.div
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
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section id="como-funciona" className="bg-[#0D1218] px-6 py-24">
        <motion.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Como funciona"
            title="Do vídeo ao certificado, com uma jornada visualmente mais coerente."
            description="A landing passa a mostrar o processo como experiência de estudo, não só como lista de funcionalidades. Isso ajuda o usuário a entender permanência, rigor e profundidade."
            centered
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div variants={scaleSoft} className="overflow-hidden rounded-[2rem] border border-white/8">
              <img
                src="/fotos/bible-laptop-headphones.jpg"
                alt="Bíblia e laptop sobre mesa de estudo"
                className="h-full min-h-[28rem] w-full object-cover object-center"
              />
            </motion.div>

            <div className="grid gap-5">
              {learningFlow.map((item) => (
                <motion.div key={item.step} variants={fadeUp} className="rounded-[1.7rem] border border-white/8 bg-white/3 p-7">
                  <span className="font-display text-sm font-bold tracking-[0.2em] text-[#F37E20]/55">{item.step}</span>
                  <h3 className="mt-4 font-display text-2xl font-bold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/58">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section id="para-alunos" className="bg-[#F7F5F2] px-6 py-24 text-[#111827]">
        <motion.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <motion.div variants={scaleSoft} className="order-2 rounded-[2rem] border border-[#E4DCD2] bg-white p-7 shadow-[0_18px_50px_rgba(17,24,39,0.06)] lg:order-1">
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
                    “E o Verbo se fez carne e habitou entre nós, e vimos a sua glória.”
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
            </motion.div>

            <motion.div variants={fadeUp} className="order-1 lg:order-2">
              <SectionIntro
                eyebrow="Para alunos"
                title="A área de estudo começa a parecer lugar de permanência, não só uma tela de consumo."
                description="A aplicação precisa preparar desde a landing o contraste entre o dark institucional e o light de estudo. Essa mudança aumenta valor percebido e ajuda a contar o diferencial do produto."
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
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section id="para-criadores" className="bg-[#0A0E13] px-6 py-24">
        <motion.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <motion.div variants={fadeUp}>
              <SectionIntro
                eyebrow="Para criadores"
                title="Publique com mais autoridade visual e mais confiança de produto."
                description="O redesign não deixa o criador com cara de afiliado ou com cara de plataforma fria. A proposta é unir gestão, sobriedade e possibilidade real de crescimento."
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
            </motion.div>

            <motion.div variants={scaleSoft} className="space-y-4">
              <div className="overflow-hidden rounded-[2rem] border border-white/8">
                <img
                  src="/fotos/creator-recording.jpg"
                  alt="Criador gravando aula"
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
                  O criador parece inserido em uma plataforma de conhecimento séria, com linguagem visual que protege autoridade e transmite maturidade.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section id="para-igrejas" className="bg-[#EEE7DE] px-6 py-24 text-[#111827]">
        <motion.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Para igrejas e instituições"
            title="Uma linguagem visual que também conversa com liderança, formação e estrutura coletiva."
            description="Quando a homepage deixa de parecer genérica, o plano institucional passa a parecer mais plausível. A marca ganha estatura para falar com igrejas, seminários e comunidades de formação."
            light
            centered
          />

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {institutionFeatures.map((item) => (
              <motion.div key={item.title} variants={scaleSoft} className="rounded-[1.7rem] border border-[#DED3C6] bg-white px-6 py-6">
                <h3 className="font-display text-xl font-bold text-[#111827]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5A6472]">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} className="mt-10 text-center">
            <Link
              to="/cadastro?perfil=instituicao"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#CDBEAF] bg-white px-6 py-4 text-sm font-semibold text-[#111827] transition-colors duration-200 hover:border-[#BBA48E] hover:bg-[#F7F2EC]"
            >
              Falar sobre plano institucional
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section className="bg-[#0D1218] px-6 py-24">
        <motion.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Diferença real"
            title="O produto ganha mais força quando a estética confirma o posicionamento."
            description="Essa comparação continua comercial, mas agora vive dentro de uma página com mais autoridade visual. O argumento deixa de depender só da copy."
            centered
          />

          <motion.div variants={fadeUp} className="mt-14 overflow-hidden rounded-[2rem] border border-white/8 bg-[#131A23]">
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
          </motion.div>
        </motion.div>
      </section>

      <section className="bg-[#0A0E13] px-6 py-24">
        <motion.div variants={staggerContainer} {...inView} className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <motion.div variants={scaleSoft} className="overflow-hidden rounded-[2rem] border border-white/8">
              <img
                src="/fotos/library-hall.jpg"
                alt="Biblioteca teológica"
                className="h-full min-h-[30rem] w-full object-cover object-center"
              />
            </motion.div>

            <motion.div variants={fadeUp}>
              <SectionIntro
                eyebrow="Biblioteca teológica"
                title="Uma estética de biblioteca contemporânea ajuda a vender o ecossistema inteiro."
                description="A landing precisa antecipar o que a plataforma quer ser na Fase 2 e além. Quando a marca já comunica estudo sério, recursos como Bíblia integrada, eBooks e caderno digital passam a parecer consequência natural."
              />

              <div className="mt-8 rounded-[1.8rem] border border-white/8 bg-[#151B23] p-6">
                <div className="border-l-2 border-[#F37E20]/45 pl-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#F2BD8A]">Versículo em destaque</p>
                  <p className="mt-3 text-lg leading-8 text-white/84" style={{ fontFamily: 'Source Serif 4, serif' }}>
                    “No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.”
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
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="px-6 py-24">
        <motion.div variants={staggerContainer} {...inView} className="mx-auto max-w-4xl text-center">
          <motion.div variants={fadeIn}>
            <img src="/logos/LOGO ICONE BRANCA.png" alt="" className="mx-auto mb-8 h-36 w-36" />
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold leading-tight text-white md:text-4xl">
            Comece a estudar hoje, gratuitamente.
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/56 md:text-base">
            A nova direção visual prepara o produto para ser percebido como referência. O próximo passo é transformar essa promessa em experiência real, do primeiro acesso ao ambiente de estudo.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
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
          </motion.div>
        </motion.div>
      </section>

      <footer className="border-t border-[#2A313B] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-16 w-auto opacity-80" />

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
            <Link to="/termos" className="text-xs text-white/30 transition-colors hover:text-white/60">
              Termos
            </Link>
            <Link to="/privacidade" className="text-xs text-white/30 transition-colors hover:text-white/60">
              Privacidade
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
  )
}
