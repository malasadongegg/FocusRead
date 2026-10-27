import { useState } from 'react'
import { X } from 'lucide-react'

export default function ComprehensionCheck({ onClose }: { onClose: () => void }) {
  const [summary, setSummary] = useState('')
  const [details, setDetails] = useState('')
  const [confidence, setConfidence] = useState('')
  const [reviewed, setReviewed] = useState(false)
  return <div className="settings-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><aside className="settings-panel" role="dialog" aria-modal="true" aria-label="Comprehension self-check"><div className="settings-head"><div><div className="eyebrow">OPTIONAL REFLECTION</div><h2>Comprehension self-check</h2></div><button className="icon-button" aria-label="Close self-check" onClick={onClose}><X size={20}/></button></div><div className="settings-body">
    <p className="setting-note">Recall the passage in your own words, then decide whether you want to reread. This is a private reflection, not a test of reading ability. Answers are discarded when you close this panel.</p>
    <label className="reflection-field">What was the main idea?<textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Write a short summary"/></label>
    <label className="reflection-field">Which details do you remember?<textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Write two or three details"/></label>
    <label className="setting-row">How clear was your recall?<select value={confidence} onChange={e => setConfidence(e.target.value)}><option value="">Choose one</option><option value="clear">Clear</option><option value="partial">Partial</option><option value="reread">I want to reread</option></select></label>
    <button className="primary-button practice-start" disabled={!summary.trim() || !confidence} onClick={() => setReviewed(true)}>Finish self-check</button>
    {reviewed && <p className="reflection-result" role="status">Reflection complete. Your answers were not scored or saved. {confidence === 'reread' ? 'Use Restart to revisit the passage.' : 'You can revisit any word with the progress slider.'}</p>}
  </div></aside></div>
}
