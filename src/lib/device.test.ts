import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectDevice } from './device'

function mockUserAgent(ua: string) {
  vi.stubGlobal('navigator', { userAgent: ua })
}

describe('detectDevice', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retorna desktop quando navigator não existe', () => {
    vi.stubGlobal('navigator', undefined)
    expect(detectDevice()).toBe('desktop')
  })

  it('detecta iPad como tablet', () => {
    mockUserAgent('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605')
    expect(detectDevice()).toBe('tablet')
  })

  it('detecta Nexus 7 como tablet', () => {
    mockUserAgent('Mozilla/5.0 (Linux; Android 6.0.1; Nexus 7) AppleWebKit/537.36')
    expect(detectDevice()).toBe('tablet')
  })

  it('detecta iPhone como mobile', () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605')
    expect(detectDevice()).toBe('mobile')
  })

  it('detecta Android phone como mobile', () => {
    mockUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36')
    expect(detectDevice()).toBe('mobile')
  })

  it('retorna desktop para Mac/Windows', () => {
    mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605')
    expect(detectDevice()).toBe('desktop')
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    expect(detectDevice()).toBe('desktop')
  })
})
