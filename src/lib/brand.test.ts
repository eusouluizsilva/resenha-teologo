import { describe, expect, it } from 'vitest'
import { brandStatusPillClass, cn } from './brand'

describe('cn', () => {
  it('junta classes válidas com espaço', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('descarta valores falsy (false, null, undefined)', () => {
    expect(cn('a', false, 'b', null, 'c', undefined)).toBe('a b c')
  })

  it('aceita ternários para classes condicionais', () => {
    const isActive = true
    const isMuted = false
    expect(cn('base', isActive && 'active', isMuted && 'muted')).toBe('base active')
  })

  it('retorna string vazia quando tudo é falsy', () => {
    expect(cn(false, null, undefined)).toBe('')
  })
})

describe('brandStatusPillClass', () => {
  it('retorna estilos diferentes por tone', () => {
    const success = brandStatusPillClass('success')
    const accent = brandStatusPillClass('accent')
    const neutral = brandStatusPillClass('neutral')
    const info = brandStatusPillClass('info')

    expect(success).toContain('emerald')
    expect(accent).toContain('F37E20')
    expect(info).toContain('sky')
    expect(neutral).not.toContain('emerald')
    expect(neutral).not.toContain('sky')
  })

  it('default é neutral quando tone não passado', () => {
    expect(brandStatusPillClass()).toBe(brandStatusPillClass('neutral'))
  })
})
