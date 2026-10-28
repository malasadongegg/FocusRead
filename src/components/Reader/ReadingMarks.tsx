import { useState } from 'react'
import { Bookmark, Highlighter, Trash2 } from 'lucide-react'
import type { DocumentMark } from '../../types'

export default function ReadingMarks({ marks, index, onSave, onAnnotate, onSeek, onDelete }: { marks: DocumentMark[]; index: number; onSave: () => void; onAnnotate: (note: string) => void; onSeek: (index: number) => void; onDelete: (id: string) => void }) {
  const [note, setNote] = useState('')
  const bookmarks = marks.filter(mark => mark.kind === 'bookmark')
  const annotations = marks.filter(mark => mark.kind === 'annotation')
  return <section className="reading-marks" aria-label="Reading bookmarks and annotations"><div className="reading-marks-head"><div><Bookmark size={18}/><strong>Bookmarks</strong><small>{bookmarks.length}</small></div><button type="button" onClick={onSave}>Save word {index + 1}</button></div>{bookmarks.length > 0 && <ul>{bookmarks.map(mark => <li key={mark.id}><button type="button" onClick={() => onSeek(mark.index)}>{mark.label} <small>Word {mark.index + 1}</small></button><button type="button" aria-label={`Delete bookmark ${mark.label}`} onClick={() => onDelete(mark.id)}><Trash2 size={15}/></button></li>)}</ul>}
    <div className="annotation-head"><Highlighter size={18}/><strong>Highlights and notes</strong><small>{annotations.length}</small></div><form className="annotation-form" onSubmit={event => { event.preventDefault(); onAnnotate(note.trim()); setNote('') }}><input aria-label="Note for current word" placeholder="Optional note for this word" value={note} onChange={event => setNote(event.target.value)}/><button type="submit">Highlight word {index + 1}</button></form>{annotations.length > 0 && <ul>{annotations.map(mark => <li key={mark.id}><button type="button" onClick={() => onSeek(mark.index)}>{mark.label} <small>Word {mark.index + 1}{mark.note ? ` · ${mark.note}` : ''}</small></button><button type="button" aria-label={`Delete highlight ${mark.label}`} onClick={() => onDelete(mark.id)}><Trash2 size={15}/></button></li>)}</ul>}
  </section>
}
