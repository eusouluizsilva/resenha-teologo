import { describe, it, expect } from 'vitest'
import { isValidCPF, isValidCNPJ, isValidEmail } from './validators'

describe('isValidCPF', () => {
  it('aceita CPF válido com e sem máscara', () => {
    expect(isValidCPF('390.533.447-05')).toBe(true)
    expect(isValidCPF('39053344705')).toBe(true)
  })

  it('rejeita CPF com checksum inválido', () => {
    expect(isValidCPF('390.533.447-04')).toBe(false)
    expect(isValidCPF('12345678900')).toBe(false)
  })

  it('rejeita sequências repetidas', () => {
    expect(isValidCPF('00000000000')).toBe(false)
    expect(isValidCPF('11111111111')).toBe(false)
  })

  it('rejeita comprimento errado', () => {
    expect(isValidCPF('1234567890')).toBe(false)
    expect(isValidCPF('123456789012')).toBe(false)
    expect(isValidCPF('')).toBe(false)
  })
})

describe('isValidCNPJ', () => {
  it('aceita CNPJ válido com e sem máscara', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true)
    expect(isValidCNPJ('11222333000181')).toBe(true)
  })

  it('rejeita checksum inválido e sequências repetidas', () => {
    expect(isValidCNPJ('11.222.333/0001-80')).toBe(false)
    expect(isValidCNPJ('00000000000000')).toBe(false)
    expect(isValidCNPJ('99999999999999')).toBe(false)
  })

  it('rejeita comprimento errado', () => {
    expect(isValidCNPJ('1234567890123')).toBe(false)
    expect(isValidCNPJ('')).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('aceita emails comuns', () => {
    expect(isValidEmail('foo@bar.com')).toBe(true)
    expect(isValidEmail('  hello@resenhadoteologo.com  ')).toBe(true)
    expect(isValidEmail('a.b+c@d.co.uk')).toBe(true)
  })

  it('rejeita formatos inválidos', () => {
    expect(isValidEmail('sem-arroba.com')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('a@@b.com')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})
