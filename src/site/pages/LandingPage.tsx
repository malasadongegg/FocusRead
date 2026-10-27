import { ArrowRight, ArrowUpRight, LockKeyhole } from 'lucide-react'
import { SiteLink } from '../navigation'

export default function LandingPage() {
  return <>
    <section className="landing-hero page-container"><div className="hero-copy"><div className="overline"><span className="signal-dot"/> YOUR WORDS. YOUR RHYTHM.</div><h1>Read at your own pace. <em>Focus on every word.</em></h1><p>Make room for deeper attention. FocusRead brings each word to a steady focal point, at a speed you control.</p><div className="hero-actions"><SiteLink to="/app" className="solid-cta">Start reading <ArrowRight size={18}/></SiteLink><SiteLink to="/features" className="text-cta">Explore the reader <ArrowUpRight size={16}/></SiteLink></div><div className="hero-assurance"><LockKeyhole size={15}/> Your reading stays on this device. No account needed.</div></div><div className="hero-preview" aria-label="FocusRead reader preview"><div className="preview-top"><span className="preview-live"><i/> FOCUSREAD READER</span><span>300 WPM</span></div><div className="preview-word"><span>focu</span><b>s</b></div><div className="preview-axis"><i/><i/></div><div className="preview-bottom"><span>ONE WORD AT A TIME</span><span>01 / 09</span></div></div></section>
  </>
}
