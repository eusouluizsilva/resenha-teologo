import { describe, expect, it } from 'vitest'
import { OFFICIAL_HANDLE, isOfficialHandle } from './verified'

describe('isOfficialHandle', () => {
  it('reconhece o handle oficial', () => {
    expect(isOfficialHandle(OFFICIAL_HANDLE)).toBe(true)
    expect(isOfficialHandle('resenhadoteologo')).toBe(true)
  })

  it('é case-insensitive', () => {
    expect(isOfficialHandle('ResenhaDoTeologo')).toBe(true)
    expect(isOfficialHandle('RESENHADOTEOLOGO')).toBe(true)
  })

  it('rejeita handles parecidos mas distintos', () => {
    expect(isOfficialHandle('resenhadoteologo2')).toBe(false)
    expect(isOfficialHandle('resenha-do-teologo')).toBe(false)
    expect(isOfficialHandle('teologo')).toBe(false)
  })

  it('rejeita null/undefined/vazio', () => {
    expect(isOfficialHandle(null)).toBe(false)
    expect(isOfficialHandle(undefined)).toBe(false)
    expect(isOfficialHandle('')).toBe(false)
  })
})
