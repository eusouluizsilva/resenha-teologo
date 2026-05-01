// Hook compartilhado para upload de arquivos para o Cloudflare R2.
//
// Padrão: cliente chama action `r2.generateUploadUrl` (Convex), recebe URL
// pré-assinada (PUT) válida por 5 min, faz `fetch(uploadUrl, {method:'PUT'})`
// direto pro R2 sem passar pelo Convex. Volta `{ key, publicUrl }` que o
// caller salva no banco.
//
// `key` é o caminho dentro do bucket (`covers/<owner>/<ts>-<file>`); use
// `publicUrl` pra exibir. Se R2_PUBLIC_BASE_URL estiver setado em prod, é URL
// estável via custom domain; senão é presigned GET de 7 dias (renovar antes).

import { useCallback, useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'

export type R2Purpose = 'cover' | 'material' | 'avatar' | 'ebook' | 'post-image'

export type R2UploadResult = {
  key: string
  publicUrl: string
}

export function useR2Upload() {
  const generate = useAction(api.r2.generateUploadUrl)
  const [uploading, setUploading] = useState(false)

  const upload = useCallback(
    async (file: File, purpose: R2Purpose): Promise<R2UploadResult> => {
      const contentType = file.type || 'application/octet-stream'
      setUploading(true)
      try {
        const { uploadUrl, key, publicUrl } = await generate({
          purpose,
          filename: file.name,
          contentType,
          size: file.size,
        })
        const resp = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: file,
        })
        if (!resp.ok) {
          const text = await resp.text().catch(() => '')
          throw new Error(
            `Falha ao enviar para R2 (HTTP ${resp.status}). ${text.slice(0, 160)}`,
          )
        }
        return { key, publicUrl }
      } finally {
        setUploading(false)
      }
    },
    [generate],
  )

  return { upload, uploading }
}
