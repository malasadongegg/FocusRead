import { useCallback, useEffect, useRef, useState } from 'react'

/** Countdown uses a wall-clock deadline so throttled callbacks cannot extend it. */
export function usePlaybackCountdown(onDone: () => void) {
  const [remaining, setRemaining] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const done = useRef(onDone)
  done.current = onDone
  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = null
    setRemaining(null)
  }, [])
  const start = useCallback((seconds: number) => {
    cancel()
    if (seconds <= 0) { done.current(); return }
    const deadline = performance.now() + seconds * 1000
    const tick = () => {
      const ms = deadline - performance.now()
      if (ms <= 0) { timer.current = null; setRemaining(null); done.current(); return }
      setRemaining(Math.ceil(ms / 1000))
      timer.current = setTimeout(tick, Math.min(250, ms))
    }
    tick()
  }, [cancel])
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current) }, [])
  return { remaining, start, cancel }
}
