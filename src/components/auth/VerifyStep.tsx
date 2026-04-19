import { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/motion'

interface Props {
  email: string
  onVerify: (code: string) => Promise<void>
  onResend: () => Promise<void>
  loading: boolean
  error: string
}

export function VerifyStep({ email, onVerify, onResend, loading, error }: Props) {
  const [code, setCode] = useState('')

  return (
    <motion.div variants={fadeUp} className="bg-[#151B23] border border-[#2A313B] rounded-2xl p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#F37E20]/10 flex items-center justify-center mx-auto mb-5">
        <svg className="w-7 h-7 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      <h2 className="font-display font-bold text-xl mb-2">Verifique seu email</h2>
      <p className="text-white/50 text-sm mb-6">
        Enviamos um código de 6 dígitos para{' '}
        <span className="text-white/80 font-medium">{email}</span>
      </p>

      <input
        type="text"
        inputMode="numeric"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        className="w-full text-center text-3xl tracking-[0.6em] font-display font-bold bg-[#0F141A] border border-[#2A313B] focus:border-[#F37E20] rounded-xl px-4 py-4 text-white placeholder-white/20 outline-none transition-colors duration-200 mb-4"
      />

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      <button
        onClick={() => onVerify(code)}
        disabled={code.length < 6 || loading}
        className="w-full py-3 bg-[#F37E20] hover:bg-[#e06e10] disabled:opacity-40 text-white font-semibold rounded-xl transition-colors duration-200 text-sm mb-4"
      >
        {loading ? 'Verificando...' : 'Confirmar código'}
      </button>

      <button
        type="button"
        onClick={onResend}
        className="text-xs text-white/35 hover:text-white/60 transition-colors"
      >
        Não recebeu? Reenviar código
      </button>
    </motion.div>
  )
}
