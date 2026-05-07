import { m } from 'framer-motion'
import { fadeUp, scaleSoft, staggerContainer } from '@/lib/motion'
import { learningFlow } from './data'
import { SectionIntro } from './shared'
import { useInView } from './useInView'

export function HowItWorksSection() {
  const inView = useInView()

  return (
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
  )
}
