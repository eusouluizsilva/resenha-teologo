import { m } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fadeIn, fadeUp, scaleSoft, staggerContainer } from '@/lib/motion'
import { heroStats } from './data'
import { useInView } from './useInView'

export function HeroSection() {
  const inView = useInView()

  return (
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
  )
}
