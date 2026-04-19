import { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/motion'
import { brandInputClass, brandPanelSoftClass, brandPrimaryButtonClass, cn } from '@/lib/brand'

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
    <motion.div variants={fadeUp} className={cn('p-7 text-center sm:p-8', brandPanelSoftClass)}>
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#F37E20]/18 bg-[#F37E20]/10">
        <svg className="w-7 h-7 text-[#F37E20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      <h2 className="mb-2 font-display text-2xl font-bold text-white">Verifique seu email</h2>
      <p className="mb-6 text-sm leading-7 text-white/54">
        Enviamos um código de 6 dígitos para{' '}
        <span className="text-white/80 font-medium">{email}</span>
      </p>

      <input
        type="text"
        inputMode="numeric"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        className={cn(
          'mb-4 text-center font-display text-3xl font-bold tracking-[0.55em]',
          brandInputClass,
        )}
      />

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      <button
        onClick={() => onVerify(code)}
        disabled={code.length < 6 || loading}
        className={cn('mb-4 w-full', brandPrimaryButtonClass, code.length < 6 || loading ? 'opacity-40' : '')}
      >
        {loading ? 'Verificando...' : 'Confirmar código'}
      </button>

      <button
        type="button"
        onClick={onResend}
        className="text-xs font-medium text-white/38 transition-colors hover:text-white/62"
      >
        Não recebeu? Reenviar código
      </button>
    </motion.div>
  )
}
