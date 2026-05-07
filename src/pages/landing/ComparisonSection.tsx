import { m } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { comparisonRows } from './data'
import { CheckMark, SectionIntro, XMark } from './shared'
import { useInView } from './useInView'

export function ComparisonSection() {
  const inView = useInView()

  return (
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
  )
}
