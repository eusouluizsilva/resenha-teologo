import type { RefObject } from 'react'
import type { FunctionReturnType } from 'convex/server'
import type { api } from '@convex/_generated/api'
import { brandEyebrowClass, brandPanelClass, cn } from '@/lib/brand'
import { FUNCTION_LABELS } from '../constants'
import type { TabId } from '../types'
import { Toggle } from '../components/Toggle'
import { StatCard } from '../components/StatCard'

type Stats = FunctionReturnType<typeof api.publicProfiles.getMyStats>

export function VisaoGeralTab({
  imageUrl,
  displayName,
  initials,
  email,
  handle,
  functions,
  isAluno,
  hasStats,
  myStats,
  visibility,
  onChangeVisibility,
  uploadingAvatar,
  avatarError,
  fileInputRef,
  onAvatarChange,
  onPickAvatar,
  setActiveTab,
}: {
  imageUrl: string | null | undefined
  displayName: string
  initials: string
  email: string
  handle: string | undefined
  functions: string[]
  isAluno: boolean
  hasStats: boolean
  myStats: Stats | undefined
  visibility: 'public' | 'unlisted'
  onChangeVisibility: (next: 'public' | 'unlisted') => void
  uploadingAvatar: boolean
  avatarError: string
  fileInputRef: RefObject<HTMLInputElement | null>
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPickAvatar: () => void
  setActiveTab: (tab: TabId) => void
}) {
  return (
    <div className="space-y-6">
      <div className={cn('p-6', brandPanelClass)}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onPickAvatar}
            disabled={uploadingAvatar}
            className="group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[1.4rem] border border-white/10 transition-all hover:border-[#F37E20]/40"
          >
            {imageUrl ? (
              <img src={imageUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#F37E20]/10">
                <span className="text-xl font-bold text-[#F2BD8A]">{initials}</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              {uploadingAvatar ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              )}
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />

          <div className="flex-1 min-w-0">
            <p className="font-display text-xl font-bold text-white leading-tight">{displayName}</p>
            {email && <p className="mt-0.5 text-sm text-white/40">{email}</p>}
            {handle ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-sm text-white/52">@{handle}</span>
                <a
                  href={`/${handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#F37E20]/24 bg-[#F37E20]/10 px-3.5 py-1.5 text-xs font-semibold text-[#F2BD8A] transition-all hover:border-[#F37E20]/40 hover:bg-[#F37E20]/16 hover:text-white"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Ver meu perfil público
                </a>
              </div>
            ) : (
              <p className="mt-2 text-xs text-[#F2BD8A]/70">
                Sem handle definido.{' '}
                <button type="button" onClick={() => setActiveTab('perfil-publico')} className="hover:underline">
                  Criar agora
                </button>
              </p>
            )}
            {functions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {functions.map((fn) => (
                  <span
                    key={fn}
                    className="rounded-full border border-[#F37E20]/20 bg-[#F37E20]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#F2BD8A]"
                  >
                    {FUNCTION_LABELS[fn] ?? fn}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {avatarError && <p role="alert" className="mt-3 text-xs text-red-300">{avatarError}</p>}
      </div>

      <div className={cn('p-5', brandPanelClass)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border',
                visibility === 'public'
                  ? 'border-emerald-400/24 bg-emerald-400/10 text-emerald-300'
                  : 'border-white/10 bg-white/[0.04] text-white/56',
              )}
            >
              {visibility === 'public' ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/36">
                Perfil público
              </p>
              <p className="mt-1 text-base font-semibold text-white">
                {visibility === 'public' ? 'Visível publicamente' : 'Privado'}
              </p>
              <p className="mt-1 text-xs text-white/48">
                {handle
                  ? visibility === 'public'
                    ? `Qualquer pessoa pode acessar resenhadoteologo.com/${handle}.`
                    : 'Seu perfil existe mas não aparece em buscas nem em listagens públicas.'
                  : visibility === 'public'
                    ? 'Sua escolha está salva. Reserve um @handle na aba Perfil público para ativar a URL pública.'
                    : 'Sua escolha está salva. Mesmo se reservar um @handle, o perfil ficará oculto enquanto este toggle estiver desligado.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:flex-shrink-0">
            <Toggle
              value={visibility === 'public'}
              onChange={(v) => onChangeVisibility(v ? 'public' : 'unlisted')}
            />
            <span className="text-sm font-medium text-white/68">
              {visibility === 'public' ? 'Público' : 'Privado'}
            </span>
          </div>
        </div>
      </div>

      {hasStats && (
        <div>
          <p className={cn('mb-4', brandEyebrowClass)}>Resumo de estudos</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Horas assistidas"
              value={`${Math.round((myStats?.totalWatchSeconds ?? 0) / 3600)}h`}
            />
            <StatCard
              label="Cursos matriculados"
              value={String(myStats?.totalCoursesEnrolled ?? 0)}
            />
            <StatCard
              label="Cursos concluídos"
              value={String(myStats?.totalCoursesCompleted ?? 0)}
            />
            <StatCard
              label="Certificados"
              value={String(myStats?.certificateCount ?? 0)}
            />
          </div>
        </div>
      )}

      <div>
        <p className={cn('mb-4', brandEyebrowClass)}>Acesso rápido</p>
        <div className="space-y-2">
          {[
            {
              tab: 'dados-pessoais' as TabId,
              label: 'Editar dados pessoais',
              desc: 'Bio, website, telefone, redes sociais, endereço e vínculo ministerial',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              ),
            },
            {
              tab: 'perfil-publico' as TabId,
              label: 'Configurar perfil público',
              desc: 'Handle, URL pública e controles de visibilidade',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              ),
            },
            ...(isAluno || hasStats ? [{
              tab: 'conquistas' as TabId,
              label: 'Ver conquistas e progresso',
              desc: 'Cursos, progresso por aula e certificados emitidos',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              ),
            }] : []),
            ...(handle ? [{
              tab: 'depoimentos' as TabId,
              label: 'Gerenciar depoimentos',
              desc: 'Aprovar, rejeitar ou remover depoimentos do seu perfil',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              ),
            }] : []),
          ].map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => setActiveTab(item.tab)}
              className="flex w-full items-center gap-4 rounded-[1.5rem] border border-white/7 bg-white/[0.025] p-4 text-left transition-all hover:border-[#F37E20]/18 hover:bg-[#F37E20]/6"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-[#F37E20]/14 bg-[#F37E20]/10 text-[#F37E20]">
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-0.5 text-xs text-white/42">{item.desc}</p>
              </div>
              <svg className="h-4 w-4 flex-shrink-0 text-white/28" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
