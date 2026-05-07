import { m } from 'framer-motion'
import { Link } from 'react-router-dom'
import { scaleSoft, staggerContainer } from '@/lib/motion'
import { plans } from './data'
import { SectionIntro } from './shared'
import { useInView } from './useInView'

export function PlansSection() {
  const inView = useInView()

  return (
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
          {plans.map((plan) => (
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
  )
}
