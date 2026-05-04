import { describe, it, expect } from 'vitest'
import { ensureIdentityMatches, isAdminEmail } from './auth'

describe('ensureIdentityMatches', () => {
  it('passa quando subject confere', () => {
    expect(() => ensureIdentityMatches('user_abc', 'user_abc')).not.toThrow()
  })

  it('lança Não autorizado em mismatch', () => {
    expect(() => ensureIdentityMatches('user_abc', 'user_xyz')).toThrow('Não autorizado')
  })

  it('é case-sensitive', () => {
    expect(() => ensureIdentityMatches('User_ABC', 'user_abc')).toThrow('Não autorizado')
  })
})

describe('isAdminEmail', () => {
  it('aceita bootstrap admins case-insensitive', () => {
    expect(isAdminEmail('luizcdasilvajunior@gmail.com')).toBe(true)
    expect(isAdminEmail('LUIZCDASILVAJUNIOR@gmail.com')).toBe(true)
    expect(isAdminEmail('hello@resenhadoteologo.com')).toBe(true)
  })

  it('rejeita não-admins', () => {
    expect(isAdminEmail('aluno@example.com')).toBe(false)
    expect(isAdminEmail('admin@outro.com')).toBe(false)
  })

  it('rejeita null/undefined/vazio sem quebrar', () => {
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
    expect(isAdminEmail('')).toBe(false)
  })
})
