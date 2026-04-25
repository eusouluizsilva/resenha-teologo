import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { fadeUp, staggerContainer } from '@/lib/motion'

const pilares = [
  {
    title: 'Formação séria, acesso livre',
    description:
      'Todo conteúdo é gratuito para o aluno. A plataforma sustenta a operação por anúncios e assinaturas opcionais, sem transformar o estudo em página de venda.',
  },
  {
    title: 'Autoridade para o professor',
    description:
      'Professores publicam cursos com estrutura própria, acompanham o progresso dos alunos e constroem comunidade em um ambiente editorial, não em um marketplace.',
  },
  {
    title: 'Gestão para igrejas',
    description:
      'Instituições organizam a formação da comunidade, acompanham membros, emitem certificados internos e usam a plataforma como infraestrutura pedagógica.',
  },
  {
    title: 'Tecnologia a serviço do ensino',
    description:
      'Player com progresso real, questionários, certificado automático, caderno digital e Bíblia integrada, todos pensados para o leitor atento, não para o consumo rápido.',
  },
]

const caminhos = [
  {
    step: '01',
    title: 'Acesso livre a todos os cursos',
    description:
      'Aluno entra, estuda e avança sem bloqueio por pagamento. Certificado ao atingir a média mínima, sem atalhos.',
  },
  {
    step: '02',
    title: 'Publicação limpa para professores',
    description:
      'Espaço próprio, sem brigar por atenção com funis de venda. Receita vem do AdSense repassado e de apoio voluntário dos alunos.',
  },
  {
    step: '03',
    title: 'Estrutura institucional',
    description:
      'Igrejas, seminários e ministérios conectam membros, acompanham formação e usam a plataforma como extensão pedagógica da sua comunidade.',
  },
]

export function SobrePage() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Sobre, Resenha do Teólogo'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0F141A] text-white">
      <Navbar />

      <main className="px-6 pb-24 pt-36 md:pt-40">
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-5xl"
        >
          <motion.p
            variants={fadeUp}
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F2BD8A]"
          >
            Sobre a Resenha do Teólogo
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="mt-5 max-w-4xl font-display text-4xl font-bold leading-[1.08] text-white md:text-6xl"
          >
            Queremos ser a maior plataforma de ensino
            {' '}
            <span style={{ fontFamily: 'Source Serif 4, serif' }} className="font-normal italic text-[#F3D7BE]">
              teológico
            </span>{' '}
            do mundo.
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
            A Resenha do Teólogo nasceu de uma convicção simples: formação teológica de qualidade deve ser acessível.
            O aluno não precisa pagar para começar a estudar. O professor não precisa vender curso para ter autoridade. A igreja
            ganha uma estrutura real de formação sem depender de soluções genéricas.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/cadastro"
              className="inline-flex items-center justify-center rounded-2xl bg-[#F37E20] px-6 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(243,126,32,0.24)] transition-colors duration-200 hover:bg-[#e06e10]"
            >
              Criar conta grátis
            </Link>
            <Link
              to="/cursos"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/4 px-6 py-4 text-sm font-semibold text-white/86 transition-colors duration-200 hover:border-white/20 hover:bg-white/8"
            >
              Ver catálogo de cursos
            </Link>
          </motion.div>
        </motion.section>

        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mt-28 max-w-5xl"
        >
          <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F2BD8A]">
            Quem está por trás
          </motion.p>
          <motion.h2 variants={fadeUp} className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight text-white md:text-4xl">
            Construído por quem estuda, escreve e ensina teologia.
          </motion.h2>

          <motion.div variants={fadeUp} className="mt-10 grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-start">
            <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.03]">
              <img
                src="/fotos/luiz.jpg"
                alt="Luiz Carlos da Silva Junior, fundador da Resenha do Teólogo"
                loading="lazy"
                className="aspect-[3/4] w-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.classList.add('flex', 'items-center', 'justify-center')
                    parent.innerHTML =
                      '<div class="flex aspect-[3/4] w-full items-center justify-center bg-white/[0.02] text-white/24"><svg class="h-16 w-16" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></div>'
                  }
                }}
              />
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold text-white md:text-3xl">Luiz Carlos da Silva Junior</h3>
              <p className="mt-1 text-sm text-[#F2BD8A]">Fundador e professor</p>

              <div className="mt-6 space-y-4 text-base leading-8 text-white/72">
                <p>
                  Teólogo, estudante de línguas bíblicas e comunicador. Vive em Massachusetts, Estados Unidos, e concentra o trabalho
                  no ensino teológico em português para o Brasil e para a comunidade brasileira espalhada pelo mundo.
                </p>
                <p>
                  A Resenha do Teólogo é o desdobramento natural de um trabalho de anos em vídeo, escrita e ensino.
                  A visão é construir a maior plataforma de ensino teológico do mundo, com a mesma qualidade editorial de uma
                  revista séria e a mesma simplicidade operacional de uma boa ferramenta de estudo.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="https://www.instagram.com/eusouluizsilva/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/86 transition-colors hover:border-[#F37E20]/30 hover:bg-[#F37E20]/10 hover:text-[#F2BD8A]"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                  @eusouluizsilva
                </a>
                <a
                  href="https://www.youtube.com/@ResenhaDoTe%C3%B3logo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/86 transition-colors hover:border-[#F37E20]/30 hover:bg-[#F37E20]/10 hover:text-[#F2BD8A]"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  Resenha do Teólogo
                </a>
              </div>
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mt-28 max-w-5xl"
        >
          <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F2BD8A]">
            Pilares
          </motion.p>
          <motion.h2 variants={fadeUp} className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight text-white md:text-4xl">
            Os quatro eixos que organizam a plataforma.
          </motion.h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {pilares.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="rounded-[1.6rem] border border-white/8 bg-white/[0.02] p-6"
              >
                <h3 className="font-display text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/56">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mt-28 max-w-5xl"
        >
          <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F2BD8A]">
            Como o projeto se sustenta
          </motion.p>
          <motion.h2 variants={fadeUp} className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight text-white md:text-4xl">
            Sem venda de curso. A receita vem de anúncios respeitosos e de planos opcionais.
          </motion.h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {caminhos.map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="flex flex-col rounded-[1.6rem] border border-white/8 bg-white/[0.02] p-6"
              >
                <span className="font-display text-sm font-bold text-[#F2BD8A]">{item.step}</span>
                <h3 className="mt-3 font-display text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/56">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mt-28 max-w-3xl text-center"
        >
          <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold leading-tight text-white md:text-4xl">
            O estudo teológico merece um ambiente feito para ele.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-5 text-base leading-8 text-white/60">
            Comece a estudar agora ou publique seu primeiro curso. Tudo dentro da mesma plataforma.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/cadastro?perfil=aluno"
              className="inline-flex items-center justify-center rounded-2xl bg-[#F37E20] px-6 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(243,126,32,0.24)] transition-colors duration-200 hover:bg-[#e06e10]"
            >
              Estudar agora
            </Link>
            <Link
              to="/cadastro?perfil=criador"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/4 px-6 py-4 text-sm font-semibold text-white/86 transition-colors duration-200 hover:border-white/20 hover:bg-white/8"
            >
              Publicar meu conteúdo
            </Link>
          </motion.div>
        </motion.section>
      </main>

      <footer className="border-t border-[#2A313B] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-14 w-auto opacity-80" />
          <div className="flex items-center gap-5">
            <Link to="/" className="text-xs text-white/30 transition-colors hover:text-white/60">
              Início
            </Link>
            <Link to="/termos" className="text-xs text-white/30 transition-colors hover:text-white/60">
              Termos
            </Link>
            <Link to="/privacidade" className="text-xs text-white/30 transition-colors hover:text-white/60">
              Privacidade
            </Link>
            <a href="mailto:hello@resenhadoteologo.com" className="text-xs text-white/30 transition-colors hover:text-white/60">
              hello@resenhadoteologo.com
            </a>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-7xl text-center text-xs text-white/20">
          © {new Date().getFullYear()} Resenha do Teólogo. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}
