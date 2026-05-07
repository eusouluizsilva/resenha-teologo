import { m } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fadeUp, scaleSoft, staggerContainer } from '@/lib/motion'
import { creatorFeatures } from './data'
import { SectionIntro } from './shared'
import { useInView } from './useInView'

export function CreatorsSection() {
  const inView = useInView()

  return (
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
  )
}
