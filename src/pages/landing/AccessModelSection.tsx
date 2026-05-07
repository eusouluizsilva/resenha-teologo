import { m } from 'framer-motion'
import { fadeUp, scaleSoft, staggerContainer } from '@/lib/motion'
import { accessModel } from './data'
import { SectionIntro } from './shared'
import { useInView } from './useInView'

export function AccessModelSection() {
  const inView = useInView()

  return (
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
  )
}
