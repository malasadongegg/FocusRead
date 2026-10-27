import { afterEach, expect, it, vi } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { usePlaybackCountdown } from '../src/hooks/usePlaybackCountdown'

function Harness({ done }: { done: () => void }) {
  const countdown = usePlaybackCountdown(done)
  return <><button onClick={() => countdown.start(3)}>Start</button><button onClick={countdown.cancel}>Cancel</button><span>{countdown.remaining ?? 'ready'}</span></>
}

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })
it('counts down, can be cancelled, and starts playback once', () => {
  vi.useFakeTimers()
  vi.spyOn(performance, 'now').mockImplementation(() => Date.now())
  const done = vi.fn()
  const { unmount } = render(<Harness done={done}/>)
  fireEvent.click(screen.getByText('Start'))
  expect(screen.getByText('3')).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(1100))
  expect(screen.getByText('2')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Cancel'))
  act(() => vi.advanceTimersByTime(5000))
  expect(done).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('Start'))
  act(() => vi.advanceTimersByTime(3000))
  expect(done).toHaveBeenCalledTimes(1)
  unmount()
})
