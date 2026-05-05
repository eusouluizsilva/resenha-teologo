// Token HMAC-SHA256 estável (não expira) usado pelos links de unsubscribe.
// Mesmo token serve para email diário, semanal e nova aula: o tipo de
// opt-out vai como query string no http.route. Único por clerkId; quem
// possuir o link pode desinscrever apenas si próprio.

export async function buildUnsubscribeToken(clerkId: string): Promise<string> {
  const secret =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).process?.env?.UNSUBSCRIBE_HMAC_SECRET ??
    'rdt-fallback-unsubscribe-secret'
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(clerkId))
  const bytes = new Uint8Array(sig)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function verifyUnsubscribeToken(
  clerkId: string,
  token: string,
): Promise<boolean> {
  const expected = await buildUnsubscribeToken(clerkId)
  if (expected.length !== token.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i)
  }
  return diff === 0
}

// Convex injeta CONVEX_SITE_URL no runtime das functions. Apontando pra ele
// resolvemos o /api/unsubscribe sem hardcodar o nome do deployment.
export function convexSiteUrl(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (globalThis as any).process?.env ?? {}
  return env.CONVEX_SITE_URL ?? 'https://blessed-platypus-993.convex.site'
}
