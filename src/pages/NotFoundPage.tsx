import { Link } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'

export function NotFoundPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#0F141A] text-white">
      <Navbar />

      <section className="relative px-6 pb-24 pt-40">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">
            Erro 404
          </p>
          <h1 className="mt-4 font-display text-5xl font-extrabold leading-[1.05] tracking-[-0.03em] md:text-6xl">
            Página não encontrada
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/56 md:text-base">
            O endereço que você tentou acessar não existe ou foi movido. Você pode voltar para o início ou navegar pelo catálogo de cursos.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/"
              className="rounded-2xl bg-[#F37E20] px-7 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#e06e10]"
            >
              Voltar para o início
            </Link>
            <Link
              to="/cursos"
              className="rounded-2xl border border-white/10 bg-white/4 px-7 py-3 text-sm font-semibold text-white/86 transition-colors duration-200 hover:border-white/20 hover:bg-white/8"
            >
              Ver catálogo de cursos
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
