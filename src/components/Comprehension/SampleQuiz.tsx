import { useState } from 'react'
import { X } from 'lucide-react'
import type { CalibrationPassage } from '../../lib/calibration'
import { scoreSample } from '../../lib/assessment'
import { useModalFocus } from '../../hooks/useModalFocus'

export default function SampleQuiz({ passage, onClose, onResult }: { passage: CalibrationPassage; onClose: () => void; onResult: (correct: number, total: number) => void }) {
  const dialogRef = useModalFocus(onClose)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null)
  return <div className="settings-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><aside ref={dialogRef} className="settings-panel" role="dialog" aria-modal="true" aria-label="Sample passage quiz"><div className="settings-head"><div><div className="eyebrow">BUNDLED PASSAGE</div><h2>Check what you recall</h2></div><button className="icon-button" aria-label="Close quiz" onClick={onClose}><X size={20}/></button></div><div className="settings-body"><p>These questions were written for this bundled sample. The score describes these answers only.</p>{passage.questions.map((question, index) => <fieldset className="calibration-question" key={question.prompt}><legend>{question.prompt}</legend>{question.choices.map((choice, option) => <label key={choice}><input type="radio" name={`sample-${index}`} disabled={Boolean(result)} checked={answers[index] === option} onChange={() => setAnswers(previous => { const next = [...previous]; next[index] = option; return next })}/>{choice}</label>)}</fieldset>)}{result ? <p role="status">{result.correct} of {result.total} correct. This is a recall check for one short passage, not a general reading ability score.</p> : <button className="primary-button" disabled={answers.length !== passage.questions.length || answers.some(answer => answer === undefined)} onClick={() => { const score = scoreSample(passage.id, answers); setResult(score); onResult(score.correct, score.total) }}>Check answers</button>}</div></aside></div>
}
