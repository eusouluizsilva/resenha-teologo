// Handle do perfil oficial. Espelha convex/lib/autoEnroll.ts no frontend para
// que o selo de verificacao apareca em qualquer lugar onde o nome do autor
// for renderizado. Se mudar o handle oficial, mudar tambem na constante
// OFFICIAL_HANDLE do backend.
export const OFFICIAL_HANDLE = 'resenhadoteologo'

export function isOfficialHandle(handle?: string | null): boolean {
  if (!handle) return false
  return handle.toLowerCase() === OFFICIAL_HANDLE
}
