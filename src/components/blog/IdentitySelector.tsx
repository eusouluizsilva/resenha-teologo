// Seletor de identidade para publicação de artigos. Apresenta as opções
// retornadas por useIdentityOptions como cards selecionáveis.

import { brandPanelSoftClass, cn } from '@/lib/brand'
import {
  useIdentityOptions,
  type AuthorIdentity,
  type IdentityValue,
  type IdentityOption,
} from './useIdentityOptions'

export type { AuthorIdentity, IdentityValue, IdentityOption }

interface IdentitySelectorProps {
  value: IdentityValue | null
  onChange: (next: IdentityValue) => void
  disabled?: boolean
}

export function IdentitySelector({ value, onChange, disabled = false }: IdentitySelectorProps) {
  const { options, isLoading } = useIdentityOptions()

  if (isLoading) {
    return (
      <div className={cn('p-4 text-sm text-white/52', brandPanelSoftClass)}>
        Carregando identidades disponíveis...
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <div className={cn('p-4 text-sm text-white/64', brandPanelSoftClass)}>
        Você precisa ativar pelo menos uma função (Aluno ou Professor) em
        Configurações antes de publicar um artigo.
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {options.map((option) => {
        const isActive =
          value !== null &&
          value.identity === option.identity &&
          (value.identity !== 'instituicao' || value.institutionId === option.institutionId)

        return (
          <button
            key={option.key}
            type="button"
            disabled={disabled}
            onClick={() =>
              onChange({
                identity: option.identity,
                institutionId: option.institutionId,
              })
            }
            className={cn(
              'flex flex-col gap-1.5 rounded-2xl border px-4 py-4 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60',
              isActive
                ? 'border-[#F37E20]/40 bg-[#F37E20]/10 text-white shadow-[0_12px_30px_rgba(243,126,32,0.08)]'
                : 'border-white/8 bg-white/[0.03] text-white/72 hover:border-white/16 hover:bg-white/[0.05] hover:text-white',
            )}
          >
            <span className="text-sm font-semibold">{option.label}</span>
            <span className="text-xs leading-5 text-white/48">{option.hint}</span>
          </button>
        )
      })}
    </div>
  )
}
