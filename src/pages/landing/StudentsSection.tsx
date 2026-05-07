import { m } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fadeUp, scaleSoft, staggerContainer } from '@/lib/motion'
import { studentFeatures } from './data'
import { SectionIntro } from './shared'
import { useInView } from './useInView'

export function StudentsSection() {
  const inView = useInView()

  return (
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
  )
}
