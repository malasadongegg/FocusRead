import { describe, expect, it } from 'vitest'
import { buildOutline } from '../src/lib/outline'
import { prepareReadingText } from '../src/lib/preprocess'
import { tokenize } from '../src/lib/tokenizer'
import { extractEpub } from '../src/lib/documentImport'
import { readFileSync } from 'node:fs'

const markdown = '# Title\n\nIntro words here.\n\n## Part One\n\nSome body text.\n\n### Deep\n\nMore.'
describe('outline', () => {
  it('maps Markdown headings to word indexes in both raw and cleaned copies', () => {
    const raw = buildOutline(markdown, false)
    expect(raw.map(item => item.label)).toEqual(['Title', 'Part One', 'Deep'])
    expect(raw.map(item => item.level)).toEqual([1, 2, 3])
    expect(tokenize(markdown)[raw[1].index].text).toBe('##')
    const cleaned = buildOutline(markdown, true)
    expect(cleaned.map(item => item.index)).toEqual([0, 4, 9])
    expect(tokenize(prepareReadingText(markdown))[cleaned[2].index].text).toBe('Deep')
  })
  it('detects EPUB chapter titles after triple breaks but not ordinary sentences', () => {
    const items = buildOutline(extractEpub(readFileSync('tests/fixtures/sample.epub')), false)
    expect(items.map(item => item.label)).toEqual(['First'])
    expect(buildOutline('Plain text.\n\n\nAnother paragraph that ends well.', false)).toEqual([])
  })
})
