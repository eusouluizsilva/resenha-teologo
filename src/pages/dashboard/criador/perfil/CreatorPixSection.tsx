import { useEffect, useId, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { brandInputClass, brandPanelClass, brandPrimaryButtonClass, cn } from '@/lib/brand'

export function CreatorPixSection() {
  const profile = useQuery(api.creatorProfile.getMine, {})
  const setPixKey = useMutation(api.creatorProfile.setPixKey)
  const pixId = useId()

  const [value, setValue] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    // Reflete a chave PIX salva no campo de edição.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (profile?.pixKey) setValue(profile.pixKey)
  }, [profile?.pixKey])

  const currentKey = profile?.pixKey ?? null
  const loading = profile === undefined

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    if (!value.trim()) {
      setError('Informe sua chave PIX.')
      return
    }
    setSaving(true)
    try {
      await setPixKey({ pixKey: value.trim() })
      setEditing(false)
      setSuccess('Chave PIX salva com sucesso.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a chave PIX.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      await setPixKey({ pixKey: null })
      setValue('')
      setEditing(false)
      setSuccess('Chave PIX removida.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover a chave PIX.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setError(null)
    setSuccess(null)
    setValue(currentKey ?? '')
    setEditing(false)
  }

  return (
    <div className={cn('space-y-5 p-6', brandPanelClass)}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38">Recebimento (PIX)</p>
        <span className="rounded-full border border-[#F37E20]/20 bg-[#F37E20]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F2BD8A]">
          Repasse de receita
        </span>
      </div>
      <p className="text-sm text-white/60">
        Cadastre sua chave PIX para receber repasses do AdSense, certificados pagos e demais receitas geradas pelos seus cursos.
        Aceitamos CPF, CNPJ, email, celular ou chave aleatória.
      </p>

      {loading ? (
        <p className="text-sm text-white/50">Carregando...</p>
      ) : currentKey && !editing ? (
        <div className="space-y-4">
          <div className="rounded-[1.1rem] border border-white/8 bg-white/4 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/38">Chave cadastrada</p>
            <p className="mt-1 font-mono text-sm text-white/86 break-all">{currentKey}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => { setEditing(true); setSuccess(null); setError(null) }}
              className={brandPrimaryButtonClass}
            >
              Trocar chave
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={saving}
              className="rounded-[1.1rem] border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition-all duration-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Removendo...' : 'Remover chave'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor={`${pixId}-pixKey`} className="text-sm font-medium text-white/72">Chave PIX</label>
            <input
              id={`${pixId}-pixKey`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="CPF, CNPJ, email, celular ou chave aleatória"
              className={brandInputClass}
              disabled={saving}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={brandPrimaryButtonClass}
            >
              {saving ? 'Salvando...' : 'Salvar chave'}
            </button>
            {currentKey && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-[1.1rem] border border-white/14 bg-white/4 px-5 py-2.5 text-sm font-semibold text-white/72 transition-all duration-200 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-[0.9rem] border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}
      {success && (
        <p role="status" aria-live="polite" className="rounded-[0.9rem] border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          {success}
        </p>
      )}
    </div>
  )
}
