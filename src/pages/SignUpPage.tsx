import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { fadeUp, staggerContainer } from '@/lib/motion'

const profiles = [
  {
    id: 'aluno',
    icon: (
      <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: 'Aluno',
    desc: 'Quero acessar cursos e estudar teologia gratuitamente',
  },
  {
    id: 'criador',
    icon: (
      <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.258a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    ),
    title: 'Criador de Conteúdo',
    desc: 'Tenho cursos para publicar e quero monetizar minha audiência',
  },
  {
    id: 'instituicao',
    icon: (
      <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: 'Igreja ou Instituição',
    desc: 'Quero gerenciar o aprendizado da minha comunidade ou equipe',
  },
]

export function SignUpPage() {
  const [params] = useSearchParams()
  const perfilParam = params.get('perfil')

  return (
    <div className="min-h-screen bg-[#0F141A] flex items-center justify-center px-6 py-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#F37E20]/4 rounded-full blur-[100px]" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-lg"
      >
        <motion.div variants={fadeUp} className="text-center mb-10">
          <Link to="/">
            <img
              src="/logos/LOGO RETANGULO LETRA BRANCA.png"
              alt="Resenha do Teólogo"
              className="h-28 w-auto mx-auto mb-8"
            />
          </Link>
          <h1 className="font-display font-bold text-2xl mb-2">Criar sua conta</h1>
          <p className="text-white/50 text-sm">Selecione seu perfil para continuar</p>
        </motion.div>

        <div className="space-y-3 mb-8">
          {profiles.map((profile) => (
            <motion.div key={profile.id} variants={fadeUp}>
              <Link
                to={`/cadastro/${profile.id}`}
                className={`flex items-center gap-4 p-5 rounded-xl border transition-all duration-200 group ${
                  perfilParam === profile.id
                    ? 'border-[#F37E20] bg-[#F37E20]/10'
                    : 'border-[#2A313B] bg-[#151B23] hover:border-[#F37E20]/50 hover:bg-[#1B2430]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#F37E20]/10 flex items-center justify-center flex-shrink-0">
                  {profile.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-display font-semibold text-white text-sm">{profile.title}</p>
                  <p className="text-white/45 text-xs mt-0.5">{profile.desc}</p>
                </div>
                <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div variants={fadeUp} className="text-center">
          <p className="text-white/40 text-sm">
            Já tem conta?{' '}
            <Link to="/entrar" className="text-[#F37E20] hover:text-[#e06e10] font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
