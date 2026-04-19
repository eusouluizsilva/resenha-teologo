import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { fadeUp, fadeIn, staggerContainer, scaleSoft } from '@/lib/motion'

function useInView(threshold = 0.15) {
  return { initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: threshold } }
}

export function LandingPage() {
  const inView = useInView()

  return (
    <div className="min-h-screen bg-[#0F141A] text-white overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/fotos/hero-bible.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F141A]/60 via-[#0F141A]/40 to-[#0F141A]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#F37E20]/5 rounded-full blur-[120px]" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-5xl mx-auto text-center"
        >
          <motion.div variants={fadeIn} className="mb-6 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F37E20]/30 bg-[#F37E20]/10 text-[#F37E20] text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F37E20] animate-pulse" />
              100% gratuito para todos
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-sm font-medium">
              Monetize desde o primeiro dia
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display font-extrabold leading-tight mb-6"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
          >
            O maior ecossistema de{' '}
            <span className="text-[#F37E20]">ensino teológico</span>{' '}
            do mundo
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg text-white/65 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Acesso gratuito para alunos, criadores, igrejas e instituições. Publique seu conteúdo,
            construa sua comunidade e comece a monetizar no mesmo dia em que entrar na plataforma.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/cadastro?perfil=aluno"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-[#F37E20] hover:bg-[#e06e10] text-white font-semibold rounded-xl transition-all duration-200 text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Quero aprender
            </Link>
            <Link
              to="/cadastro?perfil=criador"
              className="flex items-center justify-center gap-2 px-8 py-4 border border-[#2A313B] hover:border-white/30 bg-[#151B23] hover:bg-[#1B2430] text-white font-semibold rounded-xl transition-all duration-200 text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.258a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
              Quero publicar / ensinar
            </Link>
          </motion.div>

          <motion.p variants={fadeIn} className="mt-6 text-sm text-white/40">
            Sem cartão de crédito. Acesso imediato. Planos pagos disponíveis para quem preferir sem anúncios.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-white/30">
            <span className="text-xs">Explore</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="py-16 px-6 border-y border-[#2A313B]">
        <motion.div
          variants={staggerContainer}
          {...inView}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: '100%', label: 'Gratuito para todos' },
            { value: '2.500+', label: 'Traduções da Bíblia' },
            { value: 'Dia 1', label: 'Monetize imediatamente' },
            { value: '3', label: 'Idiomas disponíveis' },
          ].map((stat) => (
            <motion.div key={stat.label} variants={fadeUp} className="text-center">
              <div className="font-display font-extrabold text-3xl text-[#F37E20] mb-1">{stat.value}</div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* PLANOS */}
      <section className="py-20 px-6 bg-[#0A0E13]">
        <motion.div variants={staggerContainer} {...inView} className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="text-[#F37E20] text-sm font-semibold uppercase tracking-widest">Acesso livre para todos</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl mt-3 mb-4">
              Comece gratuitamente. Evolua quando quiser.
            </h2>
            <p className="text-white/55 max-w-xl mx-auto">
              Alunos, criadores, igrejas e instituições entram sem pagar nada. Os planos pagos existem
              apenas para quem prefere uma experiência sem anúncios.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                titulo: 'Gratuito',
                preco: 'R$ 0',
                para: 'Para todos',
                desc: 'Acesso completo à plataforma com anúncios do Google.',
                itens: [
                  'Todos os cursos e conteúdos',
                  'Bíblia integrada com 2.500 traduções',
                  'Caderno digital e anotações',
                  'Certificados por conclusão',
                  'Fórum e comunidade',
                  'Monetização desde o primeiro dia',
                ],
                destaque: false,
              },
              {
                titulo: 'Premium',
                preco: 'R$ 29',
                para: 'Por aluno / mês',
                desc: 'Tudo do plano gratuito, sem nenhum anúncio.',
                itens: [
                  'Tudo do plano gratuito',
                  'Sem propagandas',
                  'Experiência de leitura limpa',
                  'Prioridade no suporte',
                ],
                destaque: true,
              },
              {
                titulo: 'Criador sem anúncios',
                preco: 'R$ 99',
                para: 'Por criador / mês',
                desc: 'Remove os anúncios do seu espaço na plataforma.',
                itens: [
                  'Tudo do plano gratuito',
                  'Sem propagandas no seu espaço',
                  'Experiência premium para seus alunos',
                  'Prioridade no suporte',
                ],
                destaque: false,
              },
            ].map((plano) => (
              <motion.div
                key={plano.titulo}
                variants={scaleSoft}
                className={`relative rounded-2xl p-7 flex flex-col ${
                  plano.destaque
                    ? 'bg-[#F37E20]/10 border-2 border-[#F37E20]/50'
                    : 'bg-[#151B23] border border-[#2A313B]'
                }`}
              >
                {plano.destaque && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F37E20] text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Mais popular
                  </span>
                )}
                <div className="mb-5">
                  <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-2">{plano.para}</p>
                  <h3 className="font-display font-bold text-xl mb-1">{plano.titulo}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="font-display font-extrabold text-3xl text-white">{plano.preco}</span>
                    {plano.preco !== 'R$ 0' && <span className="text-white/40 text-sm">/mês</span>}
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">{plano.desc}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plano.itens.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
                      <svg className="w-4 h-4 text-[#F37E20] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/cadastro"
                  className={`text-center py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    plano.destaque
                      ? 'bg-[#F37E20] hover:bg-[#e06e10] text-white'
                      : 'border border-[#2A313B] hover:border-white/20 text-white/80 hover:text-white'
                  }`}
                >
                  {plano.preco === 'R$ 0' ? 'Criar conta grátis' : 'Assinar agora'}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-24 px-6">
        <motion.div variants={staggerContainer} {...inView} className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-[#F37E20] text-sm font-semibold uppercase tracking-widest">Como funciona</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl mt-3 mb-4">
              Uma experiência completa de estudo
            </h2>
            <p className="text-white/55 max-w-xl mx-auto">
              Do vídeo ao certificado, com Bíblia integrada e caderno digital no mesmo lugar.
            </p>
          </motion.div>

          <motion.div variants={scaleSoft} className="mb-12 rounded-2xl overflow-hidden">
            <img
              src="/fotos/bible-laptop-headphones.jpg"
              alt="Bíblia e laptop sobre a mesa de estudo"
              className="w-full h-64 object-cover object-center"
            />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Assista às aulas',
                desc: 'Cursos gratuitos de criadores e instituições renomadas. Player com acompanhamento de progresso real.',
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                title: 'Estude com profundidade',
                desc: 'Bíblia em mais de 2.500 traduções integrada durante a aula. Caderno digital vinculado aos timestamps.',
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
                title: 'Conquiste seu certificado',
                desc: 'Responda os questionários de cada aula e emita seu certificado com média mínima de 70%.',
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={scaleSoft}
                className="bg-[#151B23] border border-[#2A313B] rounded-2xl p-7 hover:border-[#F37E20]/30 transition-colors duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-[#F37E20]/10 flex items-center justify-center mb-5">
                  {item.icon}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* PARA ALUNOS */}
      <section id="para-alunos" className="py-24 px-6 bg-[#0A0E13]">
        <motion.div variants={staggerContainer} {...inView} className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-[#F37E20] text-sm font-semibold uppercase tracking-widest">Para alunos</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl mt-3 mb-4">
              Uma jornada completa de aprendizado
            </h2>
            <p className="text-white/55 max-w-xl mx-auto">
              Metodologia estruturada do primeiro vídeo ao certificado, com acervo teológico, eBooks gratuitos e acompanhamento do seu progresso.
            </p>
          </motion.div>

          {/* Metodologia em etapas */}
          <div className="grid md:grid-cols-4 gap-4 mb-16">
            {[
              {
                step: '01',
                title: 'Assista às aulas',
                desc: 'Cursos organizados em módulos, com player que registra exatamente o quanto você assistiu.',
                icon: (
                  <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Anote e consulte',
                desc: 'Caderno digital vinculado ao segundo exato do vídeo. Bíblia integrada sem sair da aula.',
                icon: (
                  <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Responda o questionário',
                desc: 'Cada aula tem perguntas para fixar o conteúdo. Você avança só quando realmente aprendeu.',
                icon: (
                  <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                ),
              },
              {
                step: '04',
                title: 'Receba seu certificado',
                desc: 'Com média mínima de 70%, o certificado é emitido automaticamente e pode ser compartilhado.',
                icon: (
                  <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="relative bg-[#151B23] border border-[#2A313B] rounded-2xl p-6 hover:border-[#F37E20]/30 transition-colors duration-300"
              >
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 -right-2 z-10 text-[#2A313B]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
                <span className="text-xs font-bold text-[#F37E20]/40 font-display mb-3 block">{item.step}</span>
                <div className="w-10 h-10 rounded-xl bg-[#F37E20]/10 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-display font-semibold text-base mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Acervo e recursos */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <motion.div
              variants={scaleSoft}
              className="bg-[#151B23] border border-[#2A313B] rounded-2xl p-7 flex gap-5"
            >
              <div className="w-12 h-12 rounded-xl bg-[#F37E20]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg mb-2">eBooks gratuitos por curso</h3>
                <p className="text-white/55 text-sm leading-relaxed">
                  Cada curso pode incluir materiais de apoio, apostilas e eBooks disponíveis para download sem custo. Seu estudo não termina com o vídeo.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={scaleSoft}
              className="bg-[#151B23] border border-[#2A313B] rounded-2xl p-7 flex gap-5"
            >
              <div className="w-12 h-12 rounded-xl bg-[#F37E20]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg mb-2">Acervo teológico integrado</h3>
                <p className="text-white/55 text-sm leading-relaxed">
                  Bíblia em português, inglês e espanhol, textos originais em Grego e Hebraico e modo interlinear. Tudo disponível durante a aula, sem sair da plataforma.
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="text-center">
            <Link
              to="/cadastro?perfil=aluno"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#F37E20] hover:bg-[#e06e10] text-white font-semibold rounded-xl transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Criar minha conta de aluno
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* PARA CRIADORES */}
      <section id="para-criadores" className="py-24 px-6 bg-[#0A0E13]">
        <motion.div variants={staggerContainer} {...inView} className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp}>
              <span className="text-[#F37E20] text-sm font-semibold uppercase tracking-widest">Para criadores</span>
              <h2 className="font-display font-bold text-3xl md:text-4xl mt-3 mb-5 leading-tight">
                Publique, cresça e{' '}
                <span className="text-[#F37E20]">monetize sua audiência</span>
              </h2>
              <p className="text-white/60 leading-relaxed mb-8">
                Cadastre seus cursos gratuitamente, traga sua audiência e comece a ganhar.
                Você monetiza pelo repasse do AdSense gerado no seu espaço e pela sua loja própria.
                Zero custo para começar.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Dashboard completo de criação e gestão',
                  'Repasse proporcional do AdSense',
                  'Loja própria com produtos digitais e físicos',
                  'Página de doações e contribuições voluntárias',
                  'Questionários e sistema de certificação',
                  'Fórum e comunidade por curso',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/70 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#F37E20]/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-[#F37E20]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/cadastro?perfil=criador"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#F37E20] hover:bg-[#e06e10] text-white font-semibold rounded-xl transition-colors duration-200"
              >
                Criar minha conta de criador
              </Link>
            </motion.div>

            <motion.div variants={scaleSoft} className="space-y-4">
              <div className="rounded-2xl overflow-hidden mb-2">
                <img
                  src="/fotos/creator-recording.jpg"
                  alt="Criador gravando aula"
                  className="w-full h-52 object-cover object-top"
                />
              </div>
              {[
                { label: 'Alunos matriculados', value: '0', sub: 'Acompanhe em tempo real' },
                { label: 'Repasse do mês', value: 'R$ 0', sub: 'Calculado automaticamente' },
                { label: 'Vendas na loja', value: '0', sub: 'Comissão descontada automaticamente' },
              ].map((card) => (
                <div key={card.label} className="bg-[#151B23] border border-[#2A313B] rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40 mb-1">{card.label}</p>
                    <p className="font-display font-bold text-xl text-white">{card.value}</p>
                    <p className="text-xs text-white/40 mt-0.5">{card.sub}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#F37E20]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              ))}
              <div className="bg-[#F37E20]/8 border border-[#F37E20]/25 rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F37E20]/15 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-display font-semibold text-white text-sm">Doações e contribuições voluntárias</p>
                  <p className="text-xs text-white/45 mt-0.5">Sua audiência pode apoiar seu ministério diretamente pela plataforma, sem intermediários.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* PARA IGREJAS */}
      <section id="para-igrejas" className="py-24 px-6">
        <motion.div variants={staggerContainer} {...inView} className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-[#F37E20] text-sm font-semibold uppercase tracking-widest">Para igrejas e instituições</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl mt-3 mb-4">
              Gerencie o aprendizado da sua comunidade
            </h2>
            <p className="text-white/55 max-w-xl mx-auto">
              Matricule membros em lote, acompanhe o progresso de todos e ofereça formação teológica estruturada.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Matrícula em lote', desc: 'Cadastre dezenas de membros de uma vez com um único acesso institucional.' },
              { title: 'Acompanhamento coletivo', desc: 'Dashboard para pastores e coordenadores verem o progresso de cada membro.' },
              { title: 'Sem propaganda', desc: 'Plano institucional sem anúncios. Experiência limpa para toda sua comunidade.' },
              { title: 'Cursos personalizados', desc: 'Crie trilhas de formação exclusivas para sua denominação ou ministério.' },
              { title: 'Certificados institucionais', desc: 'Emita certificados com a identidade visual da sua igreja ou instituição.' },
              { title: 'Suporte prioritário', desc: 'Atendimento dedicado para instituições com plano ativo.' },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="bg-[#151B23] border border-[#2A313B] rounded-2xl p-6 hover:border-[#F37E20]/30 transition-colors duration-300"
              >
                <h3 className="font-display font-semibold text-base mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} className="text-center mt-10">
            <Link
              to="/cadastro?perfil=instituicao"
              className="inline-flex items-center gap-2 px-8 py-4 border border-[#2A313B] hover:border-[#F37E20]/50 bg-[#151B23] hover:bg-[#1B2430] text-white font-semibold rounded-xl transition-all duration-200"
            >
              Falar sobre plano institucional
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="py-24 px-6">
        <motion.div variants={staggerContainer} {...inView} className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-[#F37E20] text-sm font-semibold uppercase tracking-widest">Por que a Resenha do Teólogo</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl mt-3 mb-4">
              O que nenhuma outra plataforma oferece
            </h2>
            <p className="text-white/55 max-w-xl mx-auto">
              Construída especificamente para o ensino teológico. Cada funcionalidade foi pensada para quem estuda, ensina e lidera.
            </p>
          </motion.div>

          {/* Tabela comparativa */}
          <motion.div variants={fadeUp} className="mb-16 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A313B]">
                  <th className="text-left py-4 pr-6 text-white/40 font-medium text-xs uppercase tracking-widest w-1/3">Funcionalidade</th>
                  <th className="py-4 px-4 text-center">
                    <span className="text-[#F37E20] font-display font-bold text-sm">Resenha do Teólogo</span>
                  </th>
                  <th className="py-4 px-4 text-center text-white/30 font-medium text-xs">Hotmart</th>
                  <th className="py-4 px-4 text-center text-white/30 font-medium text-xs">YouTube</th>
                  <th className="py-4 px-4 text-center text-white/30 font-medium text-xs">EAD genérico</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { item: 'Todo conteúdo gratuito para alunos', nos: true, hotmart: false, yt: true, ead: false },
                  { item: 'Bíblia integrada com 2.500 traduções', nos: true, hotmart: false, yt: false, ead: false },
                  { item: 'Textos originais em Grego e Hebraico', nos: true, hotmart: false, yt: false, ead: false },
                  { item: 'Caderno digital vinculado ao vídeo', nos: true, hotmart: false, yt: false, ead: false },
                  { item: 'Monetização desde o primeiro dia', nos: true, hotmart: true, yt: true, ead: false },
                  { item: 'Certificados com avaliação de aprendizado', nos: true, hotmart: true, yt: false, ead: true },
                  { item: 'Fórum e comunidade por aula', nos: true, hotmart: false, yt: false, ead: false },
                  { item: 'Foco exclusivo em teologia', nos: true, hotmart: false, yt: false, ead: false },
                  { item: 'White label para criadores e igrejas', nos: true, hotmart: false, yt: false, ead: true },
                  { item: 'Zero custo para publicar', nos: true, hotmart: false, yt: true, ead: false },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-[#2A313B]/50 ${i % 2 === 0 ? 'bg-[#151B23]/30' : ''}`}>
                    <td className="py-3.5 pr-6 text-white/70">{row.item}</td>
                    <td className="py-3.5 px-4 text-center">
                      {row.nos
                        ? <svg className="w-5 h-5 text-[#F37E20] mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        : <svg className="w-4 h-4 text-white/15 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      }
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.hotmart
                        ? <svg className="w-4 h-4 text-white/30 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        : <svg className="w-4 h-4 text-white/15 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      }
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.yt
                        ? <svg className="w-4 h-4 text-white/30 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        : <svg className="w-4 h-4 text-white/15 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      }
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.ead
                        ? <svg className="w-4 h-4 text-white/30 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        : <svg className="w-4 h-4 text-white/15 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Cards de diferenciais */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                titulo: 'Especialização total em teologia',
                desc: 'Não somos uma plataforma genérica. Cada recurso foi construído para quem estuda, ensina e lidera dentro do contexto teológico.',
                icon: (
                  <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
              },
              {
                titulo: 'Caderno que prende o aluno',
                desc: 'Anotações vinculadas ao segundo exato do vídeo criam dependência positiva. O aluno não sai da plataforma porque seu estudo vive aqui.',
                icon: (
                  <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ),
              },
              {
                titulo: 'Receita desde o primeiro acesso',
                desc: 'Criadores começam a monetizar pelo AdSense assim que publicam seu primeiro conteúdo. Sem espera, sem meta mínima de inscritos.',
                icon: (
                  <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
              },
              {
                titulo: 'Bíblia que nenhuma plataforma tem',
                desc: 'Mais de 2.500 traduções, textos originais em Grego e Hebraico e modo interlinear. Tudo acessível sem sair da aula.',
                icon: (
                  <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                ),
              },
              {
                titulo: 'Conteúdo gratuito gera mais alcance',
                desc: 'Sem paywall, o conteúdo chega a muito mais pessoas. Mais acesso gera mais receita de AdSense para o criador.',
                icon: (
                  <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                titulo: 'Infraestrutura que você não precisa construir',
                desc: 'Certificados, fórum, questionários, caderno digital e loja prontos. O criador foca no conteúdo. A plataforma cuida do resto.',
                icon: (
                  <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                ),
              },
            ].map((item) => (
              <motion.div
                key={item.titulo}
                variants={fadeUp}
                className="bg-[#151B23] border border-[#2A313B] rounded-2xl p-6 hover:border-[#F37E20]/30 transition-colors duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F37E20]/10 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-display font-semibold text-base mb-2">{item.titulo}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* BIBLIOTECA */}
      <section className="py-24 px-6 bg-[#0A0E13]">
        <motion.div variants={staggerContainer} {...inView} className="max-w-6xl mx-auto">
          <motion.div variants={scaleSoft} className="mb-14 rounded-2xl overflow-hidden">
            <img
              src="/fotos/library-hall.jpg"
              alt="Biblioteca teológica"
              className="w-full h-64 object-cover object-center"
            />
          </motion.div>
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div variants={scaleSoft} className="order-2 md:order-1">
              <div className="bg-[#151B23] border border-[#2A313B] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/40 font-medium uppercase tracking-widest">Bíblia integrada</p>
                  <span className="text-xs bg-[#F37E20]/15 text-[#F37E20] px-2 py-0.5 rounded-full">NVI</span>
                </div>
                {[
                  { ref: 'João 1:1', text: 'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.' },
                  { ref: 'João 1:14', text: 'E o Verbo se fez carne e habitou entre nós, e vimos a sua glória...' },
                ].map((v) => (
                  <div key={v.ref} className="border-l-2 border-[#F37E20]/40 pl-4">
                    <p className="text-xs text-[#F37E20] mb-1 font-medium">{v.ref}</p>
                    <p className="text-white/80 text-sm leading-relaxed" style={{ fontFamily: 'Source Serif 4, serif' }}>
                      {v.text}
                    </p>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#2A313B]">
                  <p className="text-xs text-white/30 italic">Sua anotação aqui...</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="order-1 md:order-2">
              <span className="text-[#F37E20] text-sm font-semibold uppercase tracking-widest">Biblioteca teológica</span>
              <h2 className="font-display font-bold text-3xl md:text-4xl mt-3 mb-5 leading-tight">
                Tudo que você precisa{' '}
                <span className="text-[#F37E20]">em um só lugar</span>
              </h2>
              <p className="text-white/60 leading-relaxed mb-6">
                Acesse mais de 2.500 traduções da Bíblia, incluindo textos originais em Grego e Hebraico,
                diretamente durante a aula, sem sair da plataforma.
              </p>
              <ul className="space-y-3">
                {[
                  'ACF, NVI, ARA, KJV, NIV, ESV e muito mais',
                  'Textos originais: Hebraico e Grego',
                  'Modo interlinear (original + tradução)',
                  'Caderno digital com anotações por timestamp',
                  'eBooks e materiais de apoio por aula',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/70 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#F37E20]/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-[#F37E20]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6">
        <motion.div
          variants={staggerContainer}
          {...inView}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.div variants={fadeIn} className="mb-4">
            <img src="/logos/LOGO ICONE BRANCA.png" alt="" className="w-44 h-44 mx-auto mb-6" />
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl md:text-4xl mb-5">
            Comece a estudar hoje.{' '}
            <span className="text-[#F37E20]">Gratuitamente.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/55 mb-10">
            Crie sua conta, acesse os cursos e comece sua jornada teológica agora mesmo.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/cadastro?perfil=aluno"
              className="px-8 py-4 bg-[#F37E20] hover:bg-[#e06e10] text-white font-semibold rounded-xl transition-colors duration-200 text-base"
            >
              Criar conta de aluno
            </Link>
            <Link
              to="/cadastro?perfil=criador"
              className="px-8 py-4 border border-[#2A313B] hover:border-white/30 bg-[#151B23] hover:bg-[#1B2430] text-white font-semibold rounded-xl transition-colors duration-200 text-base"
            >
              Publicar meu conteúdo
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#2A313B] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-20 w-auto opacity-70" />

          <div className="flex items-center gap-4">
            {/* YouTube */}
            <a
              href="https://www.youtube.com/@ResenhaDoTe%C3%B3logo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-9 h-9 rounded-lg bg-[#151B23] border border-[#2A313B] hover:border-[#F37E20]/50 hover:bg-[#1B2430] flex items-center justify-center text-white/40 hover:text-[#FF0000] transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="https://www.instagram.com/eusouluizsilva/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 rounded-lg bg-[#151B23] border border-[#2A313B] hover:border-[#F37E20]/50 hover:bg-[#1B2430] flex items-center justify-center text-white/40 hover:text-[#E1306C] transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            {/* Facebook */}
            <a
              href="https://www.facebook.com/profile.php?id=61574237807743"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-9 h-9 rounded-lg bg-[#151B23] border border-[#2A313B] hover:border-[#F37E20]/50 hover:bg-[#1B2430] flex items-center justify-center text-white/40 hover:text-[#1877F2] transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>

          <div className="flex items-center gap-5">
            <Link to="/termos" className="text-white/30 hover:text-white/60 text-xs transition-colors">Termos</Link>
            <Link to="/privacidade" className="text-white/30 hover:text-white/60 text-xs transition-colors">Privacidade</Link>
            <a href="mailto:hello@resenhadoteologo.com" className="text-white/30 hover:text-white/60 text-xs transition-colors">hello@resenhadoteologo.com</a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-[#2A313B] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} Resenha do Teólogo. Todos os direitos reservados.</p>
          <p className="text-white/20 text-xs">
            Desenvolvido por{' '}
            <a
              href="https://silvagrowth.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors underline underline-offset-2"
            >
              Silva Growth
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
