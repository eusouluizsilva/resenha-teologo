import { brandEyebrowClass, brandInputClass, brandPanelSoftClass, brandPrimaryButtonClass, cn } from '@/lib/brand'
import { Toggle } from '../components/Toggle'

type HandleStatus = 'checking' | 'available' | 'taken' | null

export function PerfilPublicoTab({
  handle,
  handleInput,
  setHandleInput,
  handleStatus,
  handleSaving,
  handleError,
  onClaimHandle,
  visibility,
  setVisibility,
  showProgress,
  setShowProgress,
  visibilitySaving,
  visibilitySaved,
  onSaveVisibility,
}: {
  handle: string | undefined
  handleInput: string
  setHandleInput: (v: string) => void
  handleStatus: HandleStatus
  handleSaving: boolean
  handleError: string
  onClaimHandle: (e: React.FormEvent) => void
  visibility: 'public' | 'unlisted'
  setVisibility: (v: 'public' | 'unlisted') => void
  showProgress: boolean
  setShowProgress: (v: boolean) => void
  visibilitySaving: boolean
  visibilitySaved: boolean
  onSaveVisibility: () => void
}) {
  return (
    <div className="space-y-6">
      <div className={cn('p-6', brandPanelSoftClass)}>
        <p className={brandEyebrowClass}>Seu handle público</p>
        <p className="mt-1 text-xs text-white/40">
          Defina um identificador único. A URL pública será: resenhadoteologo.com/seuhandle
        </p>

        {handle ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white">@{handle}</span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                Ativo
              </span>
              <a
                href={`/${handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1.5 text-sm text-[#F2BD8A] hover:underline"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Abrir perfil
              </a>
            </div>

            <form onSubmit={onClaimHandle}>
              <p className="mb-2 text-xs text-white/40">Alterar handle:</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/36">@</span>
                  <input
                    className={cn(brandInputClass, 'pl-8')}
                    placeholder={handle}
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value.toLowerCase())}
                    pattern="[a-z0-9_]{3,30}"
                  />
                </div>
                <button
                  type="submit"
                  disabled={handleSaving || handleStatus !== 'available'}
                  className={cn(brandPrimaryButtonClass, 'px-4 py-2.5')}
                >
                  {handleSaving ? '...' : 'Alterar'}
                </button>
              </div>
              {handleStatus === 'available' && <p className="mt-1.5 text-xs text-emerald-300">Disponível</p>}
              {handleStatus === 'taken' && <p className="mt-1.5 text-xs text-red-300">Indisponível ou inválido</p>}
              {handleStatus === 'checking' && <p className="mt-1.5 text-xs text-white/36">Verificando...</p>}
              {handleError && <p role="alert" className="mt-1.5 text-xs text-red-300">{handleError}</p>}
            </form>
          </div>
        ) : (
          <form onSubmit={onClaimHandle} className="mt-5 space-y-3">
            <p className="text-sm text-white/52">
              Você ainda não tem um handle. Escolha um identificador único para ativar seu perfil público.
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/36">@</span>
              <input
                className={cn(brandInputClass, 'pl-8')}
                placeholder="seuhandle"
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value.toLowerCase())}
                pattern="[a-z0-9_]{3,30}"
                required
              />
            </div>
            {handleStatus === 'available' && <p className="text-xs text-emerald-300">Disponível</p>}
            {handleStatus === 'taken' && <p className="text-xs text-red-300">Indisponível ou inválido</p>}
            {handleStatus === 'checking' && <p className="text-xs text-white/36">Verificando...</p>}
            {handleError && <p role="alert" className="text-xs text-red-300">{handleError}</p>}
            <button
              type="submit"
              disabled={handleSaving || handleStatus !== 'available'}
              className={cn(brandPrimaryButtonClass, 'w-full py-3')}
            >
              {handleSaving ? 'Reservando...' : 'Reservar handle'}
            </button>
          </form>
        )}
      </div>

      {/* Visibilidade. Sempre visivel; sem handle a escolha e gravada
          mas so passa a ter efeito quando o usuario reservar um @handle. */}
      <div className={cn('p-6', brandPanelSoftClass)}>
        <p className={brandEyebrowClass}>Privacidade e visibilidade</p>

        <div className="mt-5 space-y-3">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/7 p-4">
            <div>
              <p className="text-sm font-medium text-white">Perfil listado publicamente</p>
              <p className="mt-0.5 text-xs text-white/40">
                {handle
                  ? visibility === 'public'
                    ? 'Seu perfil é acessível pela URL pública.'
                    : 'Seu perfil existe, mas não é acessível publicamente.'
                  : visibility === 'public'
                    ? 'Padrão público. Reserve um @handle para ter URL pública.'
                    : 'Mesmo com @handle reservado, seu perfil ficará oculto enquanto este toggle estiver desligado.'}
              </p>
            </div>
            <Toggle value={visibility === 'public'} onChange={(v) => setVisibility(v ? 'public' : 'unlisted')} />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/7 p-4">
            <div>
              <p className="text-sm font-medium text-white">Mostrar progresso nos cursos</p>
              <p className="mt-0.5 text-xs text-white/40">
                {showProgress
                  ? 'Outros usuários podem ver seu andamento nos cursos.'
                  : 'Seu progresso nos cursos fica oculto no perfil público.'}
              </p>
            </div>
            <Toggle value={showProgress} onChange={setShowProgress} />
          </label>

          <button
            type="button"
            onClick={onSaveVisibility}
            disabled={visibilitySaving}
            className={cn(brandPrimaryButtonClass, 'w-full py-3')}
          >
            {visibilitySaving ? 'Salvando...' : visibilitySaved ? 'Configurações salvas' : 'Salvar configurações'}
          </button>
        </div>
      </div>

      <div className={cn('p-5', brandPanelSoftClass)}>
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#F37E20]/20 bg-[#F37E20]/10">
            <svg className="h-4 w-4 text-[#F37E20]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white/84">O que fica visível no perfil público</p>
            <p className="mt-1.5 text-sm leading-7 text-white/50">
              Avatar, nome, handle, bio, website, redes sociais e informações de igreja. Email, telefone e endereço nunca são expostos publicamente. Progresso e conquistas seguem sua configuração acima.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
