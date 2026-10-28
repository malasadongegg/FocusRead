import { expect, it } from 'vitest'
import { focusTimeLeft, nextFocusPhase } from '../src/lib/focusTimer'

it('uses deadlines and moves from work to break without negative time', () => {
  expect(focusTimeLeft(10000, 9001)).toBe(1)
  expect(focusTimeLeft(10000, 11000)).toBe(0)
  expect(nextFocusPhase('work')).toBe('break')
  expect(nextFocusPhase('break')).toBe('done')
})
