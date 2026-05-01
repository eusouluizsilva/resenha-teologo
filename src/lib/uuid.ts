// crypto.randomUUID com fallback para Safari < 15.4 e contextos não-secure.
// Mantém o mesmo formato 36 caracteres hex com hífens.
export function uuid(): string {
  if (typeof crypto !== 'undefined') {
    if ('randomUUID' in crypto && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    if ('getRandomValues' in crypto) {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    }
  }
  return `id_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`
}
