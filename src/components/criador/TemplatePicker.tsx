import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { brandPanelClass, brandPrimaryButtonClass, cn } from '@/lib/brand'

type Kind = 'course_description' | 'lesson_description'

type Template = {
  _id: string
  kind: Kind
  title: string
  body: string
  isSystem: boolean
}

interface Props {
  kind: Kind
  currentValue: string
  onApply: (body: string) => void
}

export function TemplatePicker({ kind, currentValue, onApply }: Props) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState<Template | null>(null)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const templates = useQuery(
    api.courseTemplates.list,
    open ? { kind } : 'skip',
  ) as Template[] | undefined

  const createTemplate = useMutation(api.courseTemplates.create)
  const removeTemplate = useMutation(api.courseTemplates.remove)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function applyTemplate(tpl: Template) {
    if (currentValue.trim().length > 0) {
      setConfirming(tpl)
      return
    }
    onApply(tpl.body)
    setOpen(false)
  }

  async function saveCurrentAsTemplate() {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    if (!currentValue.trim()) return
    await createTemplate({ kind, title: trimmed, body: currentValue })
    setNewTitle('')
    setShowSaveForm(false)
  }

  async function handleRemove(id: string) {
    if (!confirm('Apagar este template?')) return
    await removeTemplate({ id: id as Id<'courseTemplates'> })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[#F37E20]/22 bg-[#F37E20]/8 px-3 py-1.5 text-xs font-semibold text-[#F2BD8A] transition-all hover:border-[#F37E20]/40 hover:bg-[#F37E20]/14"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        Usar template
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
        >
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div
            className={cn(
              'relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden p-6 sm:p-8',
              brandPanelClass,
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  Templates de descrição
                </h2>
                <p className="mt-1 text-xs text-white/52">
                  Escolha um template pré-pronto para começar mais rápido. Você pode editar tudo depois.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/4 text-white/72 transition-all hover:border-white/14 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5 flex-1 overflow-y-auto pr-1">
              {templates === undefined ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-2xl border border-white/6 bg-white/4"
                    />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <p className="rounded-2xl border border-white/6 bg-white/3 p-4 text-sm text-white/52">
                  Nenhum template disponível.
                </p>
              ) : (
                <div className="space-y-3">
                  {templates.map((tpl) => (
                    <div
                      key={tpl._id}
                      className="group rounded-2xl border border-white/8 bg-white/3 p-4 transition-all hover:border-[#F37E20]/22 hover:bg-white/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-sm font-semibold text-white">
                              {tpl.title}
                            </h3>
                            {tpl.isSystem ? (
                              <span className="rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/52">
                                Padrão
                              </span>
                            ) : (
                              <span className="rounded-full border border-[#F37E20]/22 bg-[#F37E20]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#F2BD8A]">
                                Meu template
                              </span>
                            )}
                          </div>
                          <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs leading-5 text-white/52">
                            {tpl.body}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => applyTemplate(tpl)}
                            className="rounded-xl border border-[#F37E20]/30 bg-[#F37E20]/10 px-3 py-1.5 text-xs font-semibold text-[#F2BD8A] transition-all hover:border-[#F37E20]/50 hover:bg-[#F37E20]/16"
                          >
                            Usar
                          </button>
                          {!tpl.isSystem ? (
                            <button
                              type="button"
                              onClick={() => handleRemove(tpl._id)}
                              className="rounded-xl border border-white/8 px-3 py-1.5 text-xs text-white/40 transition-all hover:border-red-500/30 hover:text-red-300"
                            >
                              Apagar
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-white/6 pt-5">
              {showSaveForm ? (
                <div className="space-y-3">
                  <p className="text-xs text-white/52">
                    Salvar a descrição atual como template pessoal:
                  </p>
                  <input
                    autoFocus
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Nome do template"
                    maxLength={80}
                    className="w-full rounded-2xl border border-white/10 bg-[#10161E] px-4 py-3 text-sm text-white placeholder-white/28 transition-all focus:border-[#F37E20]/55 focus:outline-none focus:ring-4 focus:ring-[#F37E20]/10"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={saveCurrentAsTemplate}
                      disabled={!newTitle.trim() || !currentValue.trim()}
                      className={cn(brandPrimaryButtonClass, 'text-xs')}
                    >
                      Salvar template
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSaveForm(false)
                        setNewTitle('')
                      }}
                      className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 transition-all hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSaveForm(true)}
                  disabled={!currentValue.trim()}
                  className="text-xs font-semibold text-[#F2BD8A] transition-all hover:text-[#F37E20] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Salvar descrição atual como meu template
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
        >
          <div
            onClick={() => setConfirming(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className={cn('relative z-10 max-w-md p-6 text-center', brandPanelClass)}>
            <h3 className="font-display text-lg font-bold text-white">Substituir descrição?</h3>
            <p className="mt-2 text-sm leading-6 text-white/56">
              Você já tem texto na descrição. Aplicar o template "{confirming.title}" vai substituir tudo. Não tem como desfazer.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="rounded-2xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white/72 transition-all hover:bg-white/8"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(confirming.body)
                  setConfirming(null)
                  setOpen(false)
                }}
                className={brandPrimaryButtonClass}
              >
                Substituir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
