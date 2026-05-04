import { useState } from 'react'
import { useQuery, useAction } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

export function MaterialsSection({ lessonId }: { lessonId: Id<'lessons'> }) {
  const materials = useQuery(api.lessonMaterials.listByLesson, { lessonId })
  const getDownloadUrl = useAction(api.lessonMaterials.getDownloadUrl)
  const [openingId, setOpeningId] = useState<Id<'lessonMaterials'> | null>(null)

  if (materials === undefined) return null
  if (materials.length === 0) return null

  const openMaterial = async (id: Id<'lessonMaterials'>, fallbackUrl: string | null) => {
    if (fallbackUrl) {
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
      return
    }
    try {
      setOpeningId(id)
      const url = await getDownloadUrl({ materialId: id })
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      // sem-op: botão volta a estar habilitado
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F37E20]/10 text-[#F37E20]">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-gray-800">
            Materiais
          </h2>
          <p className="text-xs text-gray-500">
            {materials.length} arquivo{materials.length !== 1 ? 's' : ''} de apoio
            para esta aula.
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {materials.map((m) => {
          const hasStorageUrl = typeof m.url === 'string' && m.url.length > 0
          const hasR2Key = typeof m.r2Key === 'string' && m.r2Key.length > 0
          const canOpen = hasStorageUrl || hasR2Key
          const isOpening = openingId === m._id
          const inner = (
            <>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {m.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(m.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <svg
                className="h-4 w-4 flex-shrink-0 text-gray-300"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M7.5 16.5L21 3m0 0h-4.875M21 3v4.875"
                />
              </svg>
            </>
          )
          return canOpen ? (
            <button
              key={m._id}
              type="button"
              onClick={() => void openMaterial(m._id, m.url ?? null)}
              disabled={isOpening}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-all hover:border-[#F37E20]/40 hover:shadow-sm disabled:opacity-60"
            >
              {inner}
            </button>
          ) : (
            <div
              key={m._id}
              aria-disabled="true"
              title="Arquivo indisponível"
              className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 opacity-60"
            >
              {inner}
            </div>
          )
        })}
      </div>
    </section>
  )
}
