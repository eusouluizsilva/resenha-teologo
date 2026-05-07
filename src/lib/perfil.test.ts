import { describe, expect, it } from 'vitest'
import { normalizePerfil } from './perfil'

describe('normalizePerfil', () => {
  it('aceita os três perfis válidos', () => {
    expect(normalizePerfil('aluno')).toBe('aluno')
    expect(normalizePerfil('criador')).toBe('criador')
    expect(normalizePerfil('instituicao')).toBe('instituicao')
  })

  it('retorna aluno como fallback seguro', () => {
    expect(normalizePerfil('admin')).toBe('aluno')
    expect(normalizePerfil('')).toBe('aluno')
    expect(normalizePerfil(null)).toBe('aluno')
    expect(normalizePerfil(undefined)).toBe('aluno')
    expect(normalizePerfil(42)).toBe('aluno')
    expect(normalizePerfil({})).toBe('aluno')
  })
})
