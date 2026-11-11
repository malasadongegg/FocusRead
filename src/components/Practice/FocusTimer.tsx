import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'
import { focusTimeLeft, nextFocusPhase, type FocusPhase } from '../../lib/focusTimer'

export default function FocusTimer({ onWorkEnd }: { onWorkEnd: () => void }) {
  const [workMinutes, setWorkMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [phase, setPhase] = useState<FocusPhase>('idle')
  const [deadline, setDeadline] = useState(0)
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (phase !== 'work' && phase !== 'break') return
    const tick = () => {
      const left = focusTimeLeft(deadline, Date.now())
      setSeconds(left)
      if (left === 0) {
        const next = nextFocusPhase(phase)
        if (phase === 'work') onWorkEnd()
        setPhase(next)
        if (next === 'break') { setDeadline(Date.now() + breakMinutes * 60000); setSeconds(breakMinutes * 60) }
      }
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [phase, deadline, breakMinutes, onWorkEnd])
  const start = () => { setPhase('work'); setDeadline(Date.now() + workMinutes * 60000); setSeconds(workMinutes * 60) }
  const reset = () => { setPhase('idle'); setDeadline(0); setSeconds(0) }
  return <section className="focus-timer" aria-label="Focus session"><div><Timer size={18}/><strong>Focus session</strong><span role="status">{phase === 'idle' ? 'Set a work and break window' : phase === 'done' ? 'Session complete' : `${phase === 'work' ? 'Read' : 'Break'} · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} left`}</span></div><label>Read <select aria-label="Focus work minutes" value={workMinutes} disabled={phase === 'work' || phase === 'break'} onChange={event => setWorkMinutes(+event.target.value)}>{[5,15,25,45].map(n => <option key={n} value={n}>{n} min</option>)}</select></label><label>Break <select aria-label="Focus break minutes" value={breakMinutes} disabled={phase === 'work' || phase === 'break'} onChange={event => setBreakMinutes(+event.target.value)}>{[2,5,10].map(n => <option key={n} value={n}>{n} min</option>)}</select></label><button type="button" onClick={phase === 'idle' || phase === 'done' ? start : reset}>{phase === 'idle' || phase === 'done' ? 'Start timer' : 'End timer'}</button></section>
}
