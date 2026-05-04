import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { formatTimestamp, type YTPlayer } from './player-helpers'

export function TimestampNotesSection({
  lessonId,
  playerHandleRef,
}: {
  lessonId: Id<'lessons'>
  playerHandleRef: React.MutableRefObject<YTPlayer | null>
}) {
  const entries = useQuery(api.lessonTimestamps.listMyByLesson, { lessonId })
  const create = useMutation(api.lessonTimestamps.create)
  const update = useMutation(api.lessonTimestamps.update)
  const remove = useMutation(api.lessonTimestamps.remove)

  const [note, setNote] = useState('')
  const [capturedSeconds, setCapturedSeconds] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<Id<'lessonTimestamps'> | null>(null)
  const [editingText, setEditingText] = useState('')

  function handleCapture() {
    const p = playerHandleRef.current
    if (!p) return
    const current = p.getCurrentTime()
    setCapturedSeconds(Math.floor(current))
  }

  async function handleSave() {
    if (saving) return
    if (capturedSeconds === null) {
      handleCapture()
      return
    }
    if (!note.trim()) return
    setSaving(true)
    try {
      await create({ lessonId, timestampSeconds: capturedSeconds, note: note.trim() })
      setNote('')
      setCapturedSeconds(null)
    } finally {
      setSaving(false)
    }
  }

  function handleJump(seconds: number) {
    const p = playerHandleRef.current
    if (!p) return
    p.seekTo(seconds, true)
    p.playVideo()
  }

  async function handleDelete(id: Id<'lessonTimestamps'>) {
    if (!window.confirm('Remover esta anotação?')) return
    await remove({ id })
  }

  async function handleSaveEdit(id: Id<'lessonTimestamps'>) {
    if (!editingText.trim()) return
    await update({ id, note: editingText.trim() })
    setEditingId(null)
    setEditingText('')
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-gray-800">Anotações por momento</h2>
          <p className="text-xs text-gray-500">
            Marque trechos específicos do vídeo com uma observação. Clique depois para voltar àquele ponto.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCapture}
            className="flex items-center gap-1.5 rounded-full border border-[#F37E20]/40 bg-[#F37E20]/8 px-3 py-1.5 text-xs font-bold text-[#F37E20] hover:bg-[#F37E20]/12"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {capturedSeconds === null ? 'Marcar este momento' : `Capturado em ${formatTimestamp(capturedSeconds)}`}
          </button>
          {capturedSeconds !== null && (
            <button
              type="button"
              onClick={() => setCapturedSeconds(null)}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600"
            >
              Limpar
            </button>
          )}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="O que você quer anotar sobre este momento?"
          maxLength={1000}
          className="mt-3 min-h-[70px] w-full rounded-xl border border-gray-200 bg-[#F7F5F2] px-3 py-2 text-sm leading-6 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">{note.length} / 1.000</span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !note.trim() || capturedSeconds === null}
            className="rounded-xl bg-[#F37E20] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#e06e10] disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar anotação'}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {entries === undefined ? (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-4 text-xs text-gray-400">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-[#F37E20] animate-spin" />
            Carregando anotações...
          </div>
        ) : entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-5 text-center text-xs text-gray-400">
            Nenhuma anotação ainda. Marque momentos importantes do vídeo enquanto estuda.
          </p>
        ) : (
          entries.map((entry) => {
            const isEditing = editingId === entry._id
            return (
              <div key={entry._id} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleJump(entry.timestampSeconds)}
                    className="flex-shrink-0 rounded-lg bg-[#F37E20]/10 px-3 py-1.5 text-xs font-bold text-[#F37E20] hover:bg-[#F37E20]/15"
                  >
                    {formatTimestamp(entry.timestampSeconds)}
                  </button>
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <>
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          maxLength={1000}
                          className="min-h-[60px] w-full rounded-lg border border-gray-200 bg-[#F7F5F2] px-3 py-2 text-sm leading-6 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F37E20]/30"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(entry._id)}
                            className="rounded-lg bg-[#F37E20] px-3 py-1 text-xs font-bold text-white hover:bg-[#e06e10]"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null)
                              setEditingText('')
                            }}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{entry.note}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(entry._id)
                              setEditingText(entry.note)
                            }}
                            className="font-semibold hover:text-[#F37E20]"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry._id)}
                            className="font-semibold hover:text-red-500"
                          >
                            Remover
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
