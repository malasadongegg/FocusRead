import { expect, it } from 'vitest'
import { matchingSample, scoreSample } from '../src/lib/assessment'
import { calibrationPassages } from '../src/lib/calibration'

it('scores only curated questions for matching bundled text', () => {
  expect(matchingSample(calibrationPassages[0].text)?.id).toBe('garden')
  expect(matchingSample('My own reading')).toBeUndefined()
  expect(scoreSample('garden', [1, 0])).toEqual({ correct: 2, total: 2 })
  expect(scoreSample('garden', [0, 0])).toEqual({ correct: 1, total: 2 })
  expect(() => scoreSample('garden', [1])).toThrow()
})
