import { useCallback, useRef, useState } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { useR2Upload } from '@/lib/r2Upload'
import { SectionCard } from './SectionCard'
import { ALLOWED_MIME, MAX_FILE_BYTES, fileHasAllowedKind, formatBytes } from './helpers'
import type { EditarAulaBanner } from './types'

export function MaterialsSection({
  lessonId,
  creatorId,
  setBanner,
}: {
  lessonId: Id<'lessons'>
  creatorId: string
  setBanner: (msg: EditarAulaBanner) => void
}) {
  const materials = useQuery(api.lessonMaterials.listByLesson, { lessonId })
  const createFromR2 = useMutation(api.lessonMaterials.createFromR2)
  const removeMaterial = useMutation(api.lessonMaterials.remove)
  const getDownloadUrl = useAction(api.lessonMaterials.getDownloadUrl)
  const { upload } = useR2Upload()

  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [openingId, setOpeningId] = useState<Id<'lessonMaterials'> | null>(null)

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (!files.length) return
      setUploading(true)
      setBanner(null)

      try {
        for (const file of Array.from(files)) {
          if (!fileHasAllowedKind(file)) {
            setBanner({ type: 'error', text: `Arquivo "${file.name}" ignorado: só aceitamos PDF ou TXT.` })
            continue
          }
          if (file.size > MAX_FILE_BYTES) {
            setBanner({ type: 'error', text: `Arquivo "${file.name}" excede o limite de 10MB.` })
            continue
          }

          const mimeType = ALLOWED_MIME.includes(file.type)
            ? file.type
            : file.name.toLowerCase().endsWith('.pdf')
              ? 'application/pdf'
              : 'text/plain'

          try {
            const { key } = await upload(file, 'material')
            await createFromR2({
              lessonId,
              creatorId,
              name: file.name,
              size: file.size,
              mimeType,
              r2Key: key,
            })
          } catch (err) {
            setBanner({
              type: 'error',
              text: err instanceof Error ? err.message : `Falha ao enviar "${file.name}".`,
            })
          }
        }
      } catch (err) {
        setBanner({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao enviar arquivo.' })
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [createFromR2, creatorId, lessonId, setBanner, upload]
  )

  const openMaterial = useCallback(
    async (id: Id<'lessonMaterials'>, fallbackUrl: string | null) => {
      try {
        setOpeningId(id)
        const url = fallbackUrl ?? (await getDownloadUrl({ materialId: id }))
        window.open(url, '_blank', 'noopener,noreferrer')
      } catch (err) {
        setBanner({
          type: 'error',
          text: err instanceof Error ? err.message : 'Erro ao gerar link de download.',
        })
      } finally {
        setOpeningId(null)
      }
    },
    [getDownloadUrl, setBanner],
  )

  return (
    <SectionCard
      badge="C"
      title="Materiais complementares"
      subtitle="Aceitamos apenas PDF e TXT, até 10MB por arquivo. O aluno baixa direto do player."
    >
      <div className="space-y-3">
        {materials === undefined ? (
          <div className="h-8 w-8 rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20] animate-spin" />
        ) : (
          materials.map((m) => (
            <div
              key={m._id}
              className="flex items-center gap-3 p-3 bg-[#0F141A] border border-[#2A313B] rounded-lg group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#F37E20]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[#F37E20] text-xs font-bold">
                  {m.mimeType === 'application/pdf' ? 'PDF' : 'TXT'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{m.name}</p>
                <p className="text-xs text-white/30">{formatBytes(m.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => void openMaterial(m._id, m.url)}
                disabled={openingId === m._id}
                className="text-xs text-white/50 hover:text-[#F37E20] px-2 py-1 rounded transition-colors disabled:opacity-50"
              >
                {openingId === m._id ? 'Abrindo…' : 'Abrir'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await removeMaterial({ id: m._id, creatorId })
                  } catch (err) {
                    setBanner({
                      type: 'error',
                      text: err instanceof Error ? err.message : 'Erro ao remover.',
                    })
                  }
                }}
                className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all"
                aria-label="Remover material"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            void handleFiles(e.dataTransfer.files)
          }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-8 transition-all duration-200 ${
            uploading
              ? 'border-[#F37E20]/60 bg-[#F37E20]/5 cursor-wait'
              : dragging
                ? 'border-[#F37E20] bg-[#F37E20]/5'
                : 'border-[#2A313B] hover:border-[#F37E20]/40'
          }`}
        >
          <div className="p-2.5 rounded-xl bg-[#F37E20]/10">
            <svg className="w-5 h-5 text-[#F37E20]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-sm text-white/60 font-medium">
            {uploading ? 'Enviando...' : dragging ? 'Solte os arquivos aqui' : 'Clique ou arraste arquivos'}
          </p>
          <p className="text-xs text-white/30">Apenas PDF e TXT, até 10MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,application/pdf,text/plain"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files)
          }}
        />
      </div>
    </SectionCard>
  )
}
