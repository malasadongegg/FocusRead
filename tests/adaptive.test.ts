import { expect, it } from 'vitest'
import { defaults } from '../src/lib/defaults'
import { paceWpmAt, tokenDuration } from '../src/lib/readingTime'
import { tokenize } from '../src/lib/tokenizer'

it('adjusts only enabled text characteristics and preserves fixed timing', () => {
  const tokens = tokenize('cat extraordinary. next')
  const fixed = { ...defaults, paceMode: 'fixed' as const }
  expect(tokenDuration(tokens, 0, fixed)).toBe(200)
  expect(tokenDuration(tokens, 1, fixed)).toBe(200)
  const adaptive = { ...defaults, paceMode: 'adaptive' as const }
  expect(paceWpmAt(tokens, 1, adaptive)).toBeLessThan(paceWpmAt(tokens, 0, adaptive))
  expect(paceWpmAt(tokens, 1, { ...adaptive, adaptiveLength: false, adaptiveBoundaries: false })).toBe(300)
  expect(paceWpmAt(tokens, 1, { ...adaptive, adaptiveLength: false })).toBeLessThan(300)
})
