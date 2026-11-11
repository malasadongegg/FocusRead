import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import Reader from '../Reader/Reader'
import { useModalFocus } from '../../hooks/useModalFocus'
import { PlaybackEngine, type PlaybackState } from '../../lib/playbackEngine'
import { isCleanPass, ladderPassages, ladderSummary, LADDER_STEP, rungWpm, type RungResult } from '../../lib/ladder'
import { tokenize } from '../../lib/tokenizer'
import type { Preferences } from '../../types'

/** A short drill: each rung shows a new passage one word at a time, 25 WPM faster than the last. It ends at the first missed question. */
export default function SpeedLadder({ settings, onApply, onClose }: { settings: Preferences; onApply: (wpm: number) => void; onClose: () => void }) {
  const dialogRef = useModalFocus(onClose)
  const [stage, setStage] = useState<'intro' | 'reading' | 'questions' | 'feedback'>('intro')
  const [startWpm, setStartWpm] = useState(Math.min(settings.wpm, 600))
  const [results, setResults] = useState<RungResult[]>([])
  const [answers, setAnswers] = useState<number[]>([])
  const [playback, setPlayback] = useState<PlaybackState>({ index: 0, playing: false, complete: false, elapsedMs: 0 })
  const engineRef = useRef<PlaybackEngine | null>(null)
  const rung = results.length
  const passage = ladderPassages[Math.min(rung, ladderPassages.length - 1)]
  const wpm = rungWpm(startWpm, rung)
  const tokens = tokenize(passage.text)
  const summary = ladderSummary(results)
  useEffect(() => () => engineRef.current?.destroy(), [])
  useEffect(() => { if (stage === 'reading' && playback.complete) setStage('questions') }, [stage, playback.complete])
  const begin = () => {
    engineRef.current?.destroy()
    const engine = new PlaybackEngine({ ...settings, mode: 'rsvp', paceMode: 'fixed', punctuation: false, wpm }, setPlayback)
    engineRef.current = engine
    engine.load(tokens); setAnswers([]); setStage('reading'); engine.play()
  }
  const submit = () => {
    const correct = answers.filter((answer, index) => answer === passage.questions[index].answer).length
    setResults(previous => [...previous, { wpm, correct, total: passage.questions.length }]); setStage('feedback')
  }
  const last = results[results.length - 1]
  return <div className="settings-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><aside ref={dialogRef} className="settings-panel" role="dialog" aria-modal="true" aria-label="Speed ladder"><div className="settings-head"><div><div className="eyebrow">OPTIONAL DRILL</div><h2>Speed ladder</h2></div><button className="icon-button" aria-label="Close speed ladder" onClick={onClose}><X size={20}/></button></div><div className="settings-body">
    {stage === 'intro' && <><p>Read a short passage one word at a time, answer two questions, then step up {LADDER_STEP} WPM. The drill stops at the first rung where you miss a question, so you finish on a pace you handled well. It is practice, not a measure of reading ability.</p><label className="setting-row">Starting WPM <b>{startWpm}</b><input aria-label="Ladder starting WPM" type="range" min="100" max="600" step="25" value={startWpm} onChange={event => setStartWpm(+event.target.value)}/></label><button className="primary-button" onClick={begin}>Start first rung</button></>}
    {stage === 'reading' && <><p className="setting-note" role="status">Rung {rung + 1} of {ladderPassages.length} · {wpm} WPM</p><div className="ladder-stage"><Reader tokens={tokens} index={playback.index} mode="rsvp" settings={{ ...settings, fontSize: 56 }}/></div></>}
    {stage === 'questions' && <>{passage.questions.map((question, index) => <fieldset className="calibration-question" key={question.prompt}><legend>{question.prompt}</legend>{question.choices.map((choice, option) => <label key={choice}><input type="radio" name={`ladder-${index}`} checked={answers[index] === option} onChange={() => setAnswers(previous => { const next = [...previous]; next[index] = option; return next })}/>{choice}</label>)}</fieldset>)}<button className="primary-button" disabled={passage.questions.some((_, index) => answers[index] === undefined)} onClick={submit}>Check answers</button></>}
    {stage === 'feedback' && last && <><h3>{isCleanPass(last) ? `Clean at ${last.wpm} WPM` : `Missed ${last.total - last.correct} at ${last.wpm} WPM`}</h3>{summary.finished ? <><p>{summary.topCleanWpm ? `Your highest clean rung was ${summary.topCleanWpm} WPM. Treat it as a comfortable practice pace, not a limit.` : 'No rung was clean this time. Try again from a lower starting pace.'}</p>{summary.topCleanWpm && <button className="primary-button" onClick={() => { onApply(summary.topCleanWpm!); onClose() }}>Use {summary.topCleanWpm} WPM</button>}<button className="secondary-button" onClick={() => { setResults([]); setStage('intro') }}>Start over</button></> : <><p>Next rung: {rungWpm(startWpm, results.length)} WPM with a new passage.</p><button className="primary-button" onClick={begin}>Next rung</button></>}</>}
  </div></aside></div>
}
