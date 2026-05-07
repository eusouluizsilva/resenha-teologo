import type { BibleTestament } from '@/lib/bible/books'

export type QuizOption = { id: string; text: string }

export type QuizQuestion = {
  id: string
  text: string
  options: QuizOption[]
  correctId: string
  explanation: string
}

export type VerseRef = {
  id: string
  bookSlug: string
  chapter: number
  verseStart: number
  verseEnd: number
  testament: BibleTestament
}

export type VideoPlatform =
  | 'youtube'
  | 'vimeo'
  | 'loom'
  | 'panda'
  | 'drive'
  | 'bunny'
  | 'unknown'

export type VideoInfo = {
  platform: VideoPlatform
  embedUrl: string | null
  label: string
  color: string
}

export type EditarAulaBanner = { type: 'error' | 'info'; text: string } | null
