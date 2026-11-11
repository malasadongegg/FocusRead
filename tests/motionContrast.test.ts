import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { defaults } from '../src/lib/defaults'
import { readInitialPreferences, writeLocal } from '../src/lib/storage'

beforeEach(() => localStorage.clear())
describe('reduced motion default', () => {
  it('follows the system setting until the reader saves their own preference', () => {
    expect(readInitialPreferences(defaults, true).reducedMotion).toBe(true)
    expect(readInitialPreferences(defaults, false).reducedMotion).toBe(false)
    writeLocal('preferences', { ...defaults, reducedMotion: false })
    expect(readInitialPreferences(defaults, true).reducedMotion).toBe(false)
  })
})
describe('stylesheet guards', () => {
  const css = readFileSync('src/styles/index.css', 'utf8')
  it('keeps the high-contrast, forced-colors, and reduced-motion rules', () => {
    expect(css).toContain('@media(prefers-contrast:more)')
    expect(css).toContain('@media(forced-colors:active)')
    expect(css).toContain('@media(prefers-reduced-motion:reduce)')
    expect(css).toMatch(/prefers-contrast:more\)\{[^@]*--muted:var\(--text\)/)
  })
})
