import { ArrowRight } from 'lucide-react'
import { SiteLink } from '../navigation'

export default function FeaturesPage() {
  return <div className="page-container inner-page"><span className="overline">THE READING SPACE</span><h1>Built around <em>your attention.</em></h1><p className="page-lede">One word or a few. A steady pace or a gradual warm-up. The reader adapts to the way you want to move through text.</p><div className="feature-grid"><article><span>01 / RSVP</span><h2>One word, one focal point.</h2><p>Words replace each other at your selected pace. The highlighted letter stays anchored, so your eyes have a reliable place to rest.</p></article><article><span>02 / CHUNKS</span><h2>See a little more.</h2><p>Read 2–5 words at a time while the speed still counts words per minute, not chunks per minute.</p></article><article><span>03 / TRADITIONAL</span><h2>Keep the full context.</h2><p>Read the complete passage with the current word highlighted as playback advances.</p></article></div><SiteLink to="/app" className="solid-cta">Try the reader <ArrowRight size={17}/></SiteLink></div>
}
