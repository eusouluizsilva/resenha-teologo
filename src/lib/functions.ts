export type UserFunction = 'aluno' | 'criador' | 'instituicao'

export const DOCUMENT_VERSION = '2026-v1'

export const functionLabel: Record<UserFunction, string> = {
  aluno: 'Aluno',
  criador: 'Professor',
  instituicao: 'Igreja ou instituição',
}
