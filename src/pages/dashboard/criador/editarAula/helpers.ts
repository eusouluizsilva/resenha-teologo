import { uuid } from '@/lib/uuid'
import type { QuizQuestion, VerseRef, VideoInfo } from './types'

export const MIN_QUIZ = 5
export const MAX_QUIZ = 20
export const LETTERS = ['A', 'B', 'C', 'D']

export const ALLOWED_EXTENSIONS = ['.pdf', '.txt']
export const ALLOWED_MIME = ['application/pdf', 'text/plain']
export const MAX_FILE_BYTES = 10 * 1024 * 1024

export const PLATFORMS = [
  { name: 'YouTube', example: 'youtube.com/watch?v=...' },
  { name: 'Vimeo', example: 'vimeo.com/123456789' },
  { name: 'Loom', example: 'loom.com/share/...' },
  { name: 'Panda Video', example: 'pandavideo.com/...' },
  { name: 'Google Drive', example: 'drive.google.com/file/d/...' },
  { name: 'Bunny.net', example: 'iframe.mediadelivery.net/...' },
]

export function uid() {
  return uuid()
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export function detectVideo(url: string): VideoInfo {
  if (!url) return { platform: 'unknown', embedUrl: null, label: '', color: '' }

  const yt = url.match(/(?:youtu\.be\/|[?&]v=|embed\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { platform: 'youtube', embedUrl: `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`, label: 'YouTube', color: '#FF0000' }

  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vi) return { platform: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vi[1]}`, label: 'Vimeo', color: '#1AB7EA' }

  const lo = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/)
  if (lo) return { platform: 'loom', embedUrl: `https://www.loom.com/embed/${lo[1]}`, label: 'Loom', color: '#625DF5' }

  if (url.includes('pandavideo.com') || url.includes('player-vz')) return { platform: 'panda', embedUrl: url.includes('embed') ? url : null, label: 'Panda Video', color: '#F37E20' }

  const gd = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (gd) return { platform: 'drive', embedUrl: `https://drive.google.com/file/d/${gd[1]}/preview`, label: 'Google Drive', color: '#4285F4' }

  if (url.includes('iframe.mediadelivery.net') || url.includes('bunnycdn.com')) return { platform: 'bunny', embedUrl: url, label: 'Bunny.net', color: '#FF6633' }

  return { platform: 'unknown', embedUrl: null, label: '', color: '' }
}

export function emptyQuestion(): QuizQuestion {
  return {
    id: uid(),
    text: '',
    options: [
      { id: uid(), text: '' },
      { id: uid(), text: '' },
      { id: uid(), text: '' },
      { id: uid(), text: '' },
    ],
    correctId: '',
    explanation: '',
  }
}

export function emptyVerseRef(): VerseRef {
  return {
    id: uid(),
    bookSlug: 'genesis',
    chapter: 1,
    verseStart: 1,
    verseEnd: 1,
    testament: 'old',
  }
}

export function fileHasAllowedKind(file: File) {
  if (ALLOWED_MIME.includes(file.type)) return true
  const lower = file.name.toLowerCase()
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}
