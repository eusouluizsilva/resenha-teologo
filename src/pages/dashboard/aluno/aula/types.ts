import type { Id } from '@convex/_generated/dataModel'
import type { BibleTestament } from '@/lib/bible/books'

export type VerseRef = {
  bookSlug: string
  chapter: number
  verseStart: number
  verseEnd: number
  testament: BibleTestament
}

export type CommentItem = {
  _id: Id<'lessonComments'>
  authorId: string
  authorName: string
  authorAvatarUrl?: string
  authorRole: 'aluno' | 'criador'
  text: string
  isOfficial?: boolean
  parentId?: Id<'lessonComments'>
  helpfulCount: number
  isHelpfulByMe: boolean
  createdAt: number
  editedAt?: number
  deletedAt?: number
}

export type QuizQuestion = {
  id: string
  text: string
  options: { id: string; text: string }[]
  correctOptionId: string
  explanation?: string
}

export type QuizData = {
  _id: string
  questions: QuizQuestion[]
}

export type QuizProgressState = {
  quizScore?: number
  quizPassed?: boolean
  quizRetryPending?: boolean
  completed?: boolean
}
