export type FocusPhase = 'idle' | 'work' | 'break' | 'done'
export function focusTimeLeft(deadline: number, now: number) { return Math.max(0, Math.ceil((deadline - now) / 1000)) }
export function nextFocusPhase(phase: FocusPhase): FocusPhase { return phase === 'work' ? 'break' : phase === 'break' ? 'done' : 'idle' }
