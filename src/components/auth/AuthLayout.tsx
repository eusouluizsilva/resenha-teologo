import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { staggerContainer } from '@/lib/motion'

interface Props {
  children: React.ReactNode
  maxWidth?: string
}

export function AuthLayout({ children, maxWidth = 'max-w-md' }: Props) {
  return (
    <div className="min-h-screen bg-[#0F141A] flex items-center justify-center px-6 py-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#F37E20]/4 rounded-full blur-[100px]" />
      </div>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className={`relative z-10 w-full ${maxWidth}`}
      >
        <div className="text-center mb-8">
          <Link to="/">
            <img
              src="/logos/LOGO RETANGULO LETRA BRANCA.png"
              alt="Resenha do Teólogo"
              className="h-28 w-auto mx-auto"
            />
          </Link>
        </div>
        {children}
      </motion.div>
    </div>
  )
}
