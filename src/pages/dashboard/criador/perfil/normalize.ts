// Usuários colam URL completa, @handle, ou só o handle. Guardamos o formato
// mais compacto (handle puro para redes sociais, URL completa para website).
// Isso permite renderizar consistentemente depois.

export function normalizeSocialHandle(
  raw: string,
  platform: 'instagram' | 'twitter' | 'facebook' | 'linkedin' | 'youtube',
): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  let value = trimmed
  try {
    if (value.includes('://')) {
      const u = new URL(value)
      value = u.pathname.replace(/^\/+/, '').replace(/\/+$/, '')
      if (platform === 'youtube') {
        const segments = value.split('/').filter(Boolean)
        if (['c', 'user', 'channel'].includes(segments[0])) {
          return segments[1] ?? ''
        }
        return segments[0] ?? ''
      }
      if (platform === 'facebook' && u.search.includes('id=')) {
        const id = new URLSearchParams(u.search).get('id')
        return id ?? value.split('/')[0] ?? ''
      }
      if (platform === 'linkedin') {
        const segments = value.split('/').filter(Boolean)
        if (['in', 'company'].includes(segments[0])) return segments[1] ?? ''
        return segments[0] ?? ''
      }
      return value.split('/')[0] ?? ''
    }
  } catch {
    // URL inválida: cai na normalização básica abaixo.
  }

  return value.replace(/^@/, '').replace(/\/+$/, '')
}

export function normalizeWebsite(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/\./.test(trimmed)) return `https://${trimmed}`
  return trimmed
}
