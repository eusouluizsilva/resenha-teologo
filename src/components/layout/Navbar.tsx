import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0F141A]/95 backdrop-blur-md border-b border-[#2A313B]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-28 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src="/logos/LOGO RETANGULO LETRA BRANCA.png"
            alt="Resenha do Teólogo"
            className="h-24 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#como-funciona" className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-medium">
            Como funciona
          </a>
          <a href="#para-alunos" className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-medium">
            Para alunos
          </a>
          <a href="#para-criadores" className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-medium">
            Para criadores
          </a>
          <a href="#para-igrejas" className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-medium">
            Para igrejas
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/entrar"
            className="text-sm font-medium text-white/80 hover:text-white transition-colors duration-200 px-4 py-2"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="text-sm font-semibold bg-[#F37E20] hover:bg-[#e06e10] text-white px-5 py-2 rounded-lg transition-colors duration-200"
          >
            Começar grátis
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-white/80 hover:text-white"
          aria-label="Menu"
        >
          <div className="w-5 flex flex-col gap-1.5">
            <span className={`h-0.5 bg-current transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`h-0.5 bg-current transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`h-0.5 bg-current transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
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
            className="md:hidden bg-[#0F141A]/98 border-t border-[#2A313B] px-6 py-4 flex flex-col gap-4"
          >
            <a href="#como-funciona" onClick={() => setMenuOpen(false)} className="text-sm text-white/70 hover:text-white">Como funciona</a>
            <a href="#para-alunos" onClick={() => setMenuOpen(false)} className="text-sm text-white/70 hover:text-white">Para alunos</a>
            <a href="#para-criadores" onClick={() => setMenuOpen(false)} className="text-sm text-white/70 hover:text-white">Para criadores</a>
            <a href="#para-igrejas" onClick={() => setMenuOpen(false)} className="text-sm text-white/70 hover:text-white">Para igrejas</a>
            <div className="flex flex-col gap-2 pt-2 border-t border-[#2A313B]">
              <Link to="/entrar" className="text-sm text-center py-2.5 text-white/80 hover:text-white">Entrar</Link>
              <Link to="/cadastro" className="text-sm text-center bg-[#F37E20] text-white py-2.5 rounded-lg font-semibold">Começar grátis</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
