// Heurística simples de device baseada em User-Agent + viewport. Usado pelo
// RouteTracker pra alimentar o dashboard admin de analytics. Não substitui
// uma lib pesada (ua-parser-js) porque o ganho não justifica o KB extra.

export type Device = 'mobile' | 'desktop' | 'tablet'

export function detectDevice(): Device {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/iPad|Tablet|Nexus 7|Nexus 10|SM-T/i.test(ua)) return 'tablet'
  if (/Mobi|Android|iPhone|iPod|Phone/i.test(ua)) return 'mobile'
  return 'desktop'
}
