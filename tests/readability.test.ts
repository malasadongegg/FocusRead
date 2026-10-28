import { expect, it } from 'vitest'
import { analyzeReadability } from '../src/lib/readability'

it('counts sentence length and long words without changing text', () => {
  const text = 'A short line. An extraordinarily complicated explanation follows.'
  const result = analyzeReadability(text)
  expect(result.words).toBe(8)
  expect(result.sentences).toBe(2)
  expect(result.averageSentenceWords).toBe(4)
  expect(result.complexWords).toBe(3)
  expect(text).toContain('extraordinarily')
  expect(analyzeReadability('').words).toBe(0)
})
