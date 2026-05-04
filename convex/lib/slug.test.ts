import { describe, it, expect } from 'vitest'
import { toSlug } from './slug'

describe('toSlug', () => {
  it('normaliza acentos PT-BR', () => {
    expect(toSlug('Teologia Sistemática')).toBe('teologia-sistematica')
    expect(toSlug('Pão da Vida')).toBe('pao-da-vida')
    expect(toSlug('Coração Quebrantado')).toBe('coracao-quebrantado')
  })

  it('colapsa espaços e símbolos em hífen', () => {
    expect(toSlug('Hello   World!!!')).toBe('hello-world')
    expect(toSlug('---já---publicado---')).toBe('ja-publicado')
  })

  it('remove hífens das pontas', () => {
    expect(toSlug('  título  ')).toBe('titulo')
    expect(toSlug('!!! cristo !!!')).toBe('cristo')
  })

  it('trunca em 80 chars', () => {
    const longo = 'a'.repeat(200)
    expect(toSlug(longo).length).toBe(80)
  })

  it('lida com input vazio sem quebrar', () => {
    expect(toSlug('')).toBe('')
    expect(toSlug('!!!')).toBe('')
  })
})
