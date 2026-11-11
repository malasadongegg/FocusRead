import { describe, expect, it } from 'vitest'
import { calibrationPassages, calibrationResult } from '../src/lib/calibration'
import { tokenize } from '../src/lib/tokenizer'

describe('calibration', () => {
  it('uses observed duration and answers for a cautious starting recommendation', () => {
    const words = tokenize(calibrationPassages[0].text).length
    const result = calibrationResult(words, words * 200, 2, 2)
    expect(result.observedWpm).toBe(300)
    expect(result.recommendedWpm).toBe(270)
    expect(calibrationResult(words, words * 200, 0, 2).recommendedWpm).toBe(210)
  })
  it('rejects an unobserved passage', () => expect(() => calibrationResult(40, 0, 0, 2)).toThrow())
})
