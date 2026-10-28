import { Bookmark, Trash2 } from 'lucide-react'
import type { DocumentMark } from '../../types'

export default function ReadingMarks({ marks, index, onSave, onSeek, onDelete }: { marks: DocumentMark[]; index: number; onSave: () => void; onSeek: (index: number) => void; onDelete: (id: string) => void }) {
  const bookmarks = marks.filter(mark => mark.kind === 'bookmark')
  return <section className="reading-marks" aria-label="Reading bookmarks"><div className="reading-marks-head"><div><Bookmark size={18}/><strong>Bookmarks</strong><small>{bookmarks.length}</small></div><button type="button" onClick={onSave}>Save word {index + 1}</button></div>{bookmarks.length > 0 && <ul>{bookmarks.map(mark => <li key={mark.id}><button type="button" onClick={() => onSeek(mark.index)}>{mark.label} <small>Word {mark.index + 1}</small></button><button type="button" aria-label={`Delete bookmark ${mark.label}`} onClick={() => onDelete(mark.id)}><Trash2 size={15}/></button></li>)}</ul>}</section>
}
