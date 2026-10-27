import { ArrowRight, AudioLines, BookOpen, Gauge, ScanEye, Settings2, WifiOff } from 'lucide-react'
import { SiteLink } from '../navigation'
import ModeShowcase from '../components/ModeShowcase'

const details = [
  { icon: ScanEye, title: 'A stable focal letter', body: 'FocusRead splits each word around a highlighted letter and anchors that letter in one place. Shift the focal point, change its color, or hide it.' },
  { icon: Gauge, title: 'A pace you control', body: 'Set 100–1500 words per minute. Deadline-based playback keeps time without accumulating interval drift. Punctuation pauses and warm-up pacing are optional.' },
  { icon: Settings2, title: 'A room of your own', body: 'Choose typography, color, width, guides, theme, and reduced motion. Focus mode clears the surrounding interface when you want fewer distractions.' },
  { icon: BookOpen, title: 'Your local library', body: 'Paste or import text files, save documents on this device, resume a session, and export a backup when you want to move your library.' },
  { icon: AudioLines, title: 'Optional ambient sound', body: 'Locally generated white, pink, brown, and rain-like sounds can accompany reading. Audio starts only when you turn it on.' },
  { icon: WifiOff, title: 'Read offline', body: 'After a successful first load and cache, install FocusRead and read your saved documents without a network connection.' },
]

export default function FeaturesPage() {
  return <><div className="page-container inner-page features-intro"><span className="overline">THE READING SPACE</span><h1>Built around <em>your attention.</em></h1><p className="page-lede">One word or a few. A steady pace or a gradual warm-up. The reader adapts to the way you want to move through text.</p><SiteLink to="/app" className="solid-cta">Open the reader <ArrowRight size={17}/></SiteLink></div><ModeShowcase/><section className="page-container feature-details"><div className="section-heading"><span className="overline">THE DETAILS MATTER</span><h2>Everything you need. <em>Nothing in your way.</em></h2></div><div className="feature-detail-grid">{details.map(({ icon: Icon, title, body }) => <article key={title}><Icon size={24}/><h3>{title}</h3><p>{body}</p></article>)}</div></section></>
}
