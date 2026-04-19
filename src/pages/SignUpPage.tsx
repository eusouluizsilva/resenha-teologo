import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { fadeUp } from '@/lib/motion'
import {
  brandEyebrowClass,
  brandIconBadgeClass,
  brandPanelSoftClass,
  cn,
} from '@/lib/brand'

const profiles = [
  {
    id: 'aluno',
    eyebrow: 'Para estudar',
    title: 'Aluno',
    desc: 'Acesse cursos, materiais e formação teológica gratuitamente.',
    detail: 'Ideal para quem deseja profundidade de estudo, permanência e clareza.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'criador',
    eyebrow: 'Para publicar',
    title: 'Criador de conteúdo',
    desc: 'Organize cursos, módulos e aulas com uma apresentação mais premium.',
    detail: 'Pensado para quem quer ensinar com autoridade e monetizar sem parecer página de infoproduto.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.258a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    ),
  },
  {
    id: 'instituicao',
    eyebrow: 'Para formar comunidades',
    title: 'Igreja ou instituição',
    desc: 'Centralize formação, acompanhamento e organização do aprendizado coletivo.',
    detail: 'Melhor para igrejas, ministérios e estruturas que precisam de visão mais institucional.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
]

export function SignUpPage() {
  const [params] = useSearchParams()
  const perfilParam = params.get('perfil')

  return (
    <AuthLayout
      maxWidth="max-w-2xl"
      asideEyebrow="Escolha de perfil"
      asideTitle="A entrada também precisa refletir a estatura da marca."
      asideDescription="Em vez de um seletor genérico, o cadastro agora apresenta cada perfil com mais clareza de intenção. A decisão fica mais editorial, mais institucional e mais confiável."
      highlights={[
        'Perfis com propósito claro desde o primeiro clique',
        'Menos aparência de fluxo SaaS padrão, mais linguagem de produto premium',
        'Tom visual consistente com landing, dashboard e áreas futuras',
      ]}
      quote="“Toda escolha inicial comunica o lugar que o usuário vai ocupar dentro do ecossistema.”"
      quoteReference="Arquitetura de produto"
      imageSrc="/fotos/creator-recording.jpg"
    >
      <motion.div variants={fadeUp}>
        <p className={brandEyebrowClass}>Criar conta</p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white">Selecione seu perfil</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
          Cada entrada foi desenhada para preservar a linguagem editorial da plataforma sem perder clareza de produto.
        </p>
      </motion.div>

      <div className="mt-8 space-y-4">
        {profiles.map((profile) => {
          const active = perfilParam === profile.id

          return (
            <motion.div key={profile.id} variants={fadeUp}>
              <Link
                to={`/cadastro/${profile.id}`}
                className={cn(
                  'group block p-5 transition-all duration-200 sm:p-6',
                  active ? 'border-[#F37E20]/26 bg-[#F37E20]/8' : '',
                  brandPanelSoftClass,
                )}
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className={brandIconBadgeClass}>{profile.icon}</div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F2BD8A]/86">
                        {profile.eyebrow}
                      </p>
                      <h3 className="mt-2 font-display text-2xl font-bold text-white">{profile.title}</h3>
                      <p className="mt-2 max-w-xl text-sm leading-7 text-white/62">{profile.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:mt-1">
                    {active && (
                      <span className="inline-flex items-center rounded-full border border-[#F37E20]/22 bg-[#F37E20]/10 px-3 py-1 text-xs font-semibold text-[#F2BD8A]">
                        Selecionado
                      </span>
                    )}
                    <svg className="h-5 w-5 text-white/26 transition-colors duration-200 group-hover:text-[#F2BD8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.25rem] border border-white/6 bg-black/10 px-4 py-4 text-sm leading-7 text-white/52">
                  {profile.detail}
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      <motion.div variants={fadeUp} className="mt-8 text-center">
        <p className="text-sm text-white/44">
          Já tem conta?{' '}
          <Link to="/entrar" className="font-semibold text-[#F2BD8A] transition-colors hover:text-white">
            Entrar
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  )
}
