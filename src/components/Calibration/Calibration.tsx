import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { calibrationPassages, calibrationResult } from '../../lib/calibration'
import { tokenize } from '../../lib/tokenizer'
import { useModalFocus } from '../../hooks/useModalFocus'

export default function Calibration({ onClose, onApply }: { onClose: () => void; onApply: (wpm: number) => void }) {
  const dialogRef = useModalFocus(onClose)
  const [passageIndex, setPassageIndex] = useState(0)
  const [stage, setStage] = useState<'intro' | 'reading' | 'questions' | 'result'>('intro')
  const [answers, setAnswers] = useState<number[]>([])
  const started = useRef(0)
  const elapsed = useRef(0)
  const passage = calibrationPassages[passageIndex]
  const result = stage === 'result' ? calibrationResult(tokenize(passage.text).length, elapsed.current, answers.filter((answer, index) => answer === passage.questions[index].answer).length, passage.questions.length) : null
  const begin = () => { started.current = performance.now(); setAnswers([]); setStage('reading') }
  const finish = () => { elapsed.current = Math.max(1, performance.now() - started.current); setStage('questions') }
  return <div className="settings-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><aside ref={dialogRef} className="settings-panel" role="dialog" aria-modal="true" aria-label="Reading speed calibration"><div className="settings-head"><div><div className="eyebrow">OPTIONAL EXERCISE</div><h2>Find a starting pace</h2></div><button className="icon-button" aria-label="Close calibration" onClick={onClose}><X size={20}/></button></div><div className="settings-body">
    {stage === 'intro' && <><p>Read a short passage at your normal pace, then answer two questions. The result is a starting suggestion based only on this exercise.</p><label className="setting-row">Sample passage<select value={passageIndex} onChange={event => setPassageIndex(+event.target.value)}>{calibrationPassages.map((item, index) => <option key={item.id} value={index}>{item.title}</option>)}</select></label><button className="primary-button" onClick={begin}>Begin passage</button></>}
    {stage === 'reading' && <><h3>{passage.title}</h3><p className="calibration-passage">{passage.text}</p><button className="primary-button" onClick={finish}>I finished reading</button></>}
    {stage === 'questions' && <>{passage.questions.map((question, index) => <fieldset className="calibration-question" key={question.prompt}><legend>{question.prompt}</legend>{question.choices.map((choice, option) => <label key={choice}><input type="radio" name={`question-${index}`} checked={answers[index] === option} onChange={() => setAnswers(previous => { const next = [...previous]; next[index] = option; return next })}/>{choice}</label>)}</fieldset>)}<button className="primary-button" disabled={answers.length !== passage.questions.length || answers.some(answer => answer === undefined)} onClick={() => setStage('result')}>See result</button></>}
    {result && <><h3>{result.recommendedWpm} WPM suggested starting pace</h3><p>You read this {tokenize(passage.text).length}-word sample at {result.observedWpm} observed WPM and answered {Math.round(result.accuracy * passage.questions.length)} of {passage.questions.length} questions correctly. The suggestion is intentionally below the observed pace. It is not a validated reading ability measurement.</p><button className="primary-button" onClick={() => { onApply(result.recommendedWpm); onClose() }}>Use this pace</button><button className="secondary-button" onClick={() => setStage('intro')}>Try another passage</button></>}
  </div></aside></div>
}
