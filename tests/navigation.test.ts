import { describe, expect, it } from 'vitest'
import { tokenize } from '../src/lib/tokenizer'
import { nextSentenceStart, previousSentenceStart } from '../src/lib/navigation'

const tokens = tokenize('Dr. Smith left. He said "go!" Then\n\nA new paragraph here')
// 0 Dr. 1 Smith 2 left. 3 He 4 said 5 "go!" 6 Then 7 A 8 new 9 paragraph 10 here
describe('sentence navigation', () => {
  it('replays the current sentence, then walks to earlier ones', () => {
    expect(previousSentenceStart(tokens, 5)).toBe(3)
    expect(previousSentenceStart(tokens, 3)).toBe(0)
    expect(previousSentenceStart(tokens, 0)).toBe(0)
  })
  it('jumps forward and treats abbreviations and paragraphs correctly', () => {
    expect(nextSentenceStart(tokens, 0)).toBe(3)
    expect(nextSentenceStart(tokens, 3)).toBe(6)
    expect(nextSentenceStart(tokens, 6)).toBe(7)
    expect(nextSentenceStart(tokens, 10)).toBe(10)
  })
})
