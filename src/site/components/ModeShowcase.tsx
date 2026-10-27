import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { SiteLink } from '../navigation'

const modes = [
  { name: 'RSVP', eyebrow: '01 / STAY CENTERED', title: 'One word. A steady point of focus.', description: 'Words appear one at a time. A highlighted letter stays in the same place, so your eyes can settle while the text moves.', sample: <span className="showcase-rsvp">rea<b>d</b>ing</span> },
  { name: 'Chunks', eyebrow: '02 / SEE MORE', title: 'A little context, at the same pace.', description: 'Choose two to five words per frame. Speed remains measured in words per minute, so the number you set still means what you expect.', sample: <span className="showcase-chunk">a quieter way <b>to read</b></span> },
  { name: 'Traditional', eyebrow: '03 / KEEP THE PAGE', title: 'The whole passage, in view.', description: 'Follow the complete text while the active word is highlighted. Switch modes whenever you want without losing your place.', sample: <span className="showcase-traditional">Find a rhythm that feels right. <b>Keep</b> the whole passage in view.</span> },
] as const

export default function ModeShowcase() {
  const [active, setActive] = useState(0)
  const mode = modes[active]
  return <section className="mode-section page-container" aria-labelledby="modes-title">
    <div className="section-heading"><span className="overline">THREE WAYS TO READ</span><h2 id="modes-title">Find your <em>reading rhythm.</em></h2><p>Change the view as your material or mood changes. Your place stays with you.</p></div>
    <div className="mode-showcase"><div className="mode-options" role="tablist" aria-label="Reading modes">{modes.map((item, index) => <button key={item.name} type="button" role="tab" id={`mode-tab-${index}`} aria-controls="mode-panel" aria-selected={active === index} onClick={() => setActive(index)}><span>0{index + 1}</span>{item.name}<ArrowRight size={17}/></button>)}</div><div className="mode-detail" id="mode-panel" role="tabpanel" aria-labelledby={`mode-tab-${active}`}><span className="overline">{mode.eyebrow}</span><div className="mode-sample" aria-label={`${mode.name} reading example`}>{mode.sample}</div><h3>{mode.title}</h3><p>{mode.description}</p><SiteLink to="/features" className="text-cta">Explore all features <ArrowRight size={16}/></SiteLink></div></div>
  </section>
}
