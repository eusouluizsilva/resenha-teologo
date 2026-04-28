// Cliente da API Bolls.life. API gratuita, sem chave, retorna versículos em
// múltiplas traduções (PT/EN/originais).
//
// Endpoint principal:
//   GET https://bolls.life/get-text/<translation>/<book>/<chapter>/
// onde <translation> é o código (NVI-PT, ARA, ACF, NAA, NVT, SBLGNT, WLC, KJV
// etc.), <book> é 1-66 e <chapter> é 1-N.
//
// Cache em memória com TTL de 1h reduz hits ao servidor durante a sessão.

import { getBibleSource } from './translations'
import { getCanonicalBookNumber } from './books'

export type BibleVerse = {
  pk: number
  verse: number
  text: string
  comment?: string | null
}

const TTL_MS = 60 * 60 * 1000
const cache = new Map<string, { data: BibleVerse[]; expires: number }>()

function cleanText(raw: string): string {
  // Bolls retorna alguns marcadores HTML internos (<S>, <i>, etc.). Limpa para
  // exibição em texto plano. Mantemos quebras de linha como espaços.
  return raw
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function fetchChapter(params: {
  sourceId: string
  bookSlug: string
  chapter: number
}): Promise<BibleVerse[]> {
  const source = getBibleSource(params.sourceId)
  if (!source || !source.bollsCode) {
    throw new Error(`Tradução "${params.sourceId}" não disponível na API Bolls`)
  }
  const bookNum = getCanonicalBookNumber(params.bookSlug)
  if (!bookNum) {
    throw new Error(`Livro inválido: ${params.bookSlug}`)
  }

  const cacheKey = `${source.bollsCode}:${bookNum}:${params.chapter}`
  const cached = cache.get(cacheKey)
  const now = Date.now()
  if (cached && cached.expires > now) return cached.data

  const url = `https://bolls.life/get-text/${encodeURIComponent(source.bollsCode)}/${bookNum}/${params.chapter}/`
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) {
    throw new Error(`Bolls retornou ${res.status} para ${url}`)
  }
  const raw = (await res.json()) as Array<{
    pk: number
    verse: number
    text: string
    comment?: string | null
  }>
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(
      `A tradução "${source.label}" não cobre este capítulo. Tente outra tradução ou volte para a lista de livros.`,
    )
  }
  const verses: BibleVerse[] = raw.map((v) => ({
    pk: v.pk,
    verse: v.verse,
    text: cleanText(v.text),
    comment: v.comment ?? null,
  }))

  cache.set(cacheKey, { data: verses, expires: now + TTL_MS })
  return verses
}
