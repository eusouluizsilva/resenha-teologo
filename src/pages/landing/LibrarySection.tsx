import { m } from 'framer-motion'
import { fadeUp, scaleSoft, staggerContainer } from '@/lib/motion'
import { libraryFeatures } from './data'
import { SectionIntro } from './shared'
import { useInView } from './useInView'

export function LibrarySection() {
  const inView = useInView()

  return (
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
  )
}
