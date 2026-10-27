import { expect, it } from 'vitest'
import { focalFontSize } from '../src/lib/focalSizing'

it('reduces font size with word length while preserving a fixed center lane', () => {
  expect(focalFontSize('reading', 80, 900)).toBe('min(80px, 160.77px, 17.31vw)')
  expect(focalFontSize('a'.repeat(100), 80, 900)).toBe('min(80px, 12.86px, 1.38vw)')
})
