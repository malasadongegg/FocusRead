import { expect, it } from 'vitest'
import { isSentenceEnd, prepareReadingText } from '../src/lib/preprocess'
import { defaults } from '../src/lib/defaults'
import { tokenDuration } from '../src/lib/readingTime'
import { tokenize } from '../src/lib/tokenizer'

it('cleans display copy while leaving the source untouched', () => {
  const source = '# Chapter One\r\n\r\nDr. Smith  reads\tcarefully.  '
  expect(prepareReadingText(source)).toBe('Chapter One\n\nDr. Smith reads carefully.')
  expect(source).toContain('# Chapter One')
})

it('does not treat familiar abbreviations as sentence ends', () => {
  expect(isSentenceEnd('Dr.')).toBe(false)
  expect(isSentenceEnd('carefully.”')).toBe(true)
  const tokens = tokenize('Dr. Smith reads.')
  expect(tokenDuration(tokens, 0, { ...defaults, punctuation: true })).toBe(200)
  expect(tokenDuration(tokens, 2, { ...defaults, punctuation: true })).toBe(500)
})
