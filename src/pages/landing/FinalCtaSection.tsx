import { m } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fadeIn, fadeUp, staggerContainer } from '@/lib/motion'
import { useInView } from './useInView'

export function FinalCtaSection() {
  const inView = useInView()

  return (
    <section className="px-6 py-24">
      <m.div variants={staggerContainer} {...inView} className="mx-auto max-w-4xl text-center">
        <m.div variants={fadeIn}>
          <img src="/logos/LOGO ICONE BRANCA.png" alt="Resenha do Teólogo" loading="lazy" decoding="async" width="144" height="144" className="mx-auto mb-8 h-36 w-36" />
        </m.div>
        <m.h2 variants={fadeUp} className="font-display text-3xl font-bold leading-tight text-white md:text-4xl">
          Comece hoje sua formação teológica, gratuitamente.
        </m.h2>
        <m.p variants={fadeUp} className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/56 md:text-base">
          Formação teológica séria, gratuita e bem organizada. Crie sua conta, escolha seus cursos e comece a estudar com professores comprometidos com conteúdo sólido.
        </m.p>
        <m.div variants={fadeUp} className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
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
        </m.div>
      </m.div>
    </section>
  )
}
