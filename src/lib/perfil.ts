export type Perfil = 'aluno' | 'criador' | 'instituicao'

export function normalizePerfil(value: unknown): Perfil {
  if (value === 'criador' || value === 'instituicao' || value === 'aluno') {
    return value
  }
  return 'aluno'
}

export const perfilLabel: Record<Perfil, string> = {
  criador: 'Professor',
  aluno: 'Aluno',
  instituicao: 'Igreja ou instituição',
}
