import { describe, expect, it } from 'vitest'
import { deriveVerificationCode, formatCourseHours } from './certificate'

describe('formatCourseHours', () => {
  it('retorna null quando não há duração', () => {
    expect(formatCourseHours(undefined)).toBeNull()
    expect(formatCourseHours(0)).toBeNull()
    expect(formatCourseHours(-100)).toBeNull()
  })

  it('formata em minutos quando menor que 1 hora', () => {
    expect(formatCourseHours(45 * 60)).toBe('45 minutos')
    expect(formatCourseHours(59 * 60 + 29)).toBe('59 minutos')
  })

  it('formata em hora cheia no singular para 1h', () => {
    expect(formatCourseHours(60 * 60)).toBe('1 hora')
  })

  it('formata em horas no plural quando exato', () => {
    expect(formatCourseHours(3 * 60 * 60)).toBe('3 horas')
  })

  it('combina horas e minutos quando há resto', () => {
    expect(formatCourseHours(2 * 60 * 60 + 15 * 60)).toBe('2h 15min')
  })

  it('arredonda segundos pro minuto mais próximo', () => {
    expect(formatCourseHours(60 * 60 + 29)).toBe('1 hora')
    expect(formatCourseHours(60 * 60 + 31)).toBe('1h 1min')
  })
})

describe('deriveVerificationCode', () => {
  it('mantém apenas alfanuméricos e maiúsculas', () => {
    expect(deriveVerificationCode('abc-123_def')).toBe('ABC123DEF')
  })

  it('limita em 16 caracteres', () => {
    expect(deriveVerificationCode('a'.repeat(40))).toBe('A'.repeat(16))
  })

  it('lida com IDs do Convex (j97...)', () => {
    const code = deriveVerificationCode('j97a1b2c3d4e5f6g7h8i9j0k')
    expect(code).toHaveLength(16)
    expect(code).toBe(code.toUpperCase())
  })
})
