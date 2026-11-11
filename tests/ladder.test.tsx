import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import SpeedLadder from '../src/components/Calibration/SpeedLadder'
import { isCleanPass, ladderPassages, ladderSummary, rungWpm } from '../src/lib/ladder'
import { defaults } from '../src/lib/defaults'

it('steps up 25 WPM per rung and suggests the last clean rung', () => {
  expect([0, 1, 2].map(rung => rungWpm(300, rung))).toEqual([300, 325, 350])
  expect(rungWpm(1490, 2)).toBe(1500)
  expect(isCleanPass({ wpm: 300, correct: 2, total: 2 })).toBe(true)
  expect(isCleanPass({ wpm: 300, correct: 1, total: 2 })).toBe(false)
  const clean = (wpm: number) => ({ wpm, correct: 2, total: 2 })
  expect(ladderSummary([clean(300), clean(325)])).toEqual({ topCleanWpm: 325, finished: false })
  expect(ladderSummary([clean(300), { wpm: 325, correct: 1, total: 2 }, clean(350)])).toEqual({ topCleanWpm: 300, finished: true })
  expect(ladderSummary([{ wpm: 300, correct: 0, total: 2 }])).toEqual({ topCleanWpm: null, finished: true })
  expect(ladderSummary(ladderPassages.map((_, i) => clean(300 + i * 25))).finished).toBe(true)
  expect(new Set(ladderPassages.map(p => p.id)).size).toBe(ladderPassages.length)
})

beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance', 'Date'] }))
afterEach(() => vi.useRealTimers())
const pick = (question: number, option: number) => fireEvent.click(screen.getAllByRole('radio').filter(radio => radio.getAttribute('name') === `ladder-${question}`)[option])
it('plays a rung, grades it, and offers the last clean pace', async () => {
  const onApply = vi.fn()
  render(<SpeedLadder settings={defaults} onApply={onApply} onClose={() => {}}/>)
  fireEvent.click(screen.getByText('Start first rung'))
  await act(async () => { await vi.advanceTimersByTimeAsync(30000) })
  ladderPassages[0].questions.forEach((question, index) => pick(index, question.answer))
  fireEvent.click(screen.getByText('Check answers'))
  expect(screen.getByText('Clean at 300 WPM')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Next rung'))
  await act(async () => { await vi.advanceTimersByTimeAsync(30000) })
  ladderPassages[1].questions.forEach((question, index) => pick(index, (question.answer + 1) % 3))
  fireEvent.click(screen.getByText('Check answers'))
  expect(screen.getByText('Missed 2 at 325 WPM')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Use 300 WPM'))
  expect(onApply).toHaveBeenCalledWith(300)
})
