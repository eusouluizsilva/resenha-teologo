import { describe, expect, it } from 'vitest'
import { uuid } from './uuid'

describe('uuid', () => {
  it('retorna string no formato 8-4-4-4-12', () => {
    const id = uuid()
    expect(id).toMatch(/^[0-9a-f-]+$/)
    expect(id.length).toBeGreaterThanOrEqual(20)
  })

  it('gera valores distintos em chamadas consecutivas', () => {
    const ids = new Set(Array.from({ length: 50 }, () => uuid()))
    expect(ids.size).toBe(50)
  })
})
