import { m } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fadeUp, scaleSoft, staggerContainer } from '@/lib/motion'
import { institutionFeatures } from './data'
import { SectionIntro } from './shared'
import { useInView } from './useInView'

export function InstitutionsSection() {
  const inView = useInView()

  return (
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
  )
}
