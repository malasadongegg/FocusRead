import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { extractEpub, importDocument } from '../src/lib/documentImport'

it('imports TXT and Markdown without rewriting original content', async () => {
  const source = '# Heading\n\nA paragraph.\n'
  const markdown = { name: 'chapter.md', size: source.length, text: async () => source } as File
  expect(await importDocument(markdown)).toEqual({ title: 'chapter', text: source })
  const plain = { name: 'notes.txt', size: 7, text: async () => 'One\nTwo' } as File
  expect((await importDocument(plain)).text).toBe('One\nTwo')
})

it('reads EPUB spine order and preserves chapter and paragraph breaks', () => {
  const epub = readFileSync('tests/fixtures/sample.epub')
  expect(extractEpub(epub)).toBe('Second\n\nEarlier chapter.\n\n\nFirst\n\nLater chapter.')
  expect(() => extractEpub(new Uint8Array())).toThrow()
})
