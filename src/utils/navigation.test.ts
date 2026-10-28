import { describe, expect, it } from 'vitest'
import { loginRedirect, safeRedirect } from '@/utils/navigation'

describe('safeRedirect', () => {
  it('allows internal paths including query strings', () => {
    expect(safeRedirect('/rooms/abc?join=1')).toBe('/rooms/abc?join=1')
  })

  it('falls back for missing or external targets', () => {
    expect(safeRedirect(null)).toBe('/rooms')
    expect(safeRedirect('')).toBe('/rooms')
    expect(safeRedirect('https://evil.example')).toBe('/rooms')
    expect(safeRedirect('//evil.example')).toBe('/rooms')
    expect(safeRedirect('/\\evil.example')).toBe('/rooms')
  })

  it('builds a login URL with an encoded target', () => {
    expect(loginRedirect('/rooms/a b')).toBe('/login?redirect=%2Frooms%2Fa%20b')
  })
})
