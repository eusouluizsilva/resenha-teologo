import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
    >
      <div
        className={`mx-auto max-w-7xl rounded-[1.6rem] border transition-all duration-300 ${
          scrolled
            ? 'border-white/10 bg-[#0F141A]/88 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl'
            : 'border-white/8 bg-[#0F141A]/62 backdrop-blur-md'
        }`}
      >
        <div className="flex h-20 items-center justify-between px-5 md:px-6">
          <Link to="/" className="flex items-center">
            <img
              src="/logos/LOGO RETANGULO LETRA BRANCA.png"
              alt="Resenha do Teólogo"
              className="h-12 w-auto md:h-14"
            />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="#como-funciona" className="text-sm font-medium text-white/62 transition-colors duration-200 hover:text-white">
              Como funciona
            </a>
            <a href="#para-alunos" className="text-sm font-medium text-white/62 transition-colors duration-200 hover:text-white">
              Para alunos
            </a>
            <a href="#para-criadores" className="text-sm font-medium text-white/62 transition-colors duration-200 hover:text-white">
              Para criadores
            </a>
            <a href="#para-igrejas" className="text-sm font-medium text-white/62 transition-colors duration-200 hover:text-white">
              Para igrejas
            </a>
            <a href="#planos" className="text-sm font-medium text-white/62 transition-colors duration-200 hover:text-white">
              Planos
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/entrar"
              className="rounded-full border border-transparent px-4 py-2 text-sm font-medium text-white/76 transition-colors duration-200 hover:text-white"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="rounded-full bg-[#F37E20] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#e06e10]"
            >
              Criar conta grátis
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-full p-2 text-white/80 transition-colors hover:text-white md:hidden"
            aria-label="Menu"
          >
            <div className="flex w-5 flex-col gap-1.5">
              <span className={`h-0.5 bg-current transition-all duration-200 ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`h-0.5 bg-current transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 bg-current transition-all duration-200 ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
            </div>
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24 }}
              className="overflow-hidden border-t border-white/8 px-5 py-5 md:hidden"
            >
              <div className="flex flex-col gap-4">
                <a href="#como-funciona" onClick={() => setMenuOpen(false)} className="text-sm text-white/70 transition-colors hover:text-white">
                  Como funciona
                </a>
                <a href="#para-alunos" onClick={() => setMenuOpen(false)} className="text-sm text-white/70 transition-colors hover:text-white">
                  Para alunos
                </a>
                <a href="#para-criadores" onClick={() => setMenuOpen(false)} className="text-sm text-white/70 transition-colors hover:text-white">
                  Para criadores
                </a>
                <a href="#para-igrejas" onClick={() => setMenuOpen(false)} className="text-sm text-white/70 transition-colors hover:text-white">
                  Para igrejas
                </a>
                <a href="#planos" onClick={() => setMenuOpen(false)} className="text-sm text-white/70 transition-colors hover:text-white">
                  Planos
                </a>

                <div className="mt-2 flex flex-col gap-2 border-t border-white/8 pt-4">
                  <Link
                    to="/entrar"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full border border-white/8 px-4 py-2.5 text-center text-sm font-medium text-white/80 transition-colors hover:text-white"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/cadastro"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full bg-[#F37E20] px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#e06e10]"
                  >
                    Criar conta grátis
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
