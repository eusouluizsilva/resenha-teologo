declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string
          playerVars: Record<string, number | string>
          events: {
            onReady?: (e: { target: YTPlayer }) => void
            onStateChange?: (e: { data: number; target: YTPlayer }) => void
            onPlaybackQualityChange?: (e: { data: string; target: YTPlayer }) => void
          }
        }
      ) => YTPlayer
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

export interface YTPlayer {
  getCurrentTime: () => number
  getDuration: () => number
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  destroy: () => void
  setPlaybackRate: (rate: number) => void
  getPlaybackRate: () => number
  getAvailableQualityLevels?: () => string[]
  getPlaybackQuality?: () => string
  setPlaybackQuality?: (level: string) => void
  addEventListener?: (event: string, handler: (e: unknown) => void) => void
}

const QUALITY_LABELS: Record<string, string> = {
  auto: 'Auto',
  tiny: '144p',
  small: '240p',
  medium: '360p',
  large: '480p',
  hd720: '720p',
  hd1080: '1080p',
  hd1440: '1440p',
  hd2160: '2160p',
  highres: 'Alta',
}

export function qualityLabel(level: string): string {
  return QUALITY_LABELS[level] ?? level
}

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const
export const PLAYBACK_RATE_STORAGE_KEY = 'rdt_player_rate'

export function readSavedPlaybackRate(): number {
  if (typeof window === 'undefined') return 1
  const raw = window.localStorage.getItem(PLAYBACK_RATE_STORAGE_KEY)
  const n = raw ? Number(raw) : NaN
  return PLAYBACK_RATES.includes(n as (typeof PLAYBACK_RATES)[number]) ? n : 1
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// Limiar de conclusão alinhado ao backend (COMPLETION_RATIO em convex/student.ts).
export const COMPLETION_RATIO = 0.95

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}
