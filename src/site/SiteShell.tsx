import { ArrowUpRight, Menu, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { SiteLink } from './navigation'

const menu = [
  { to: '/features', label: 'Features' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/privacy', label: 'Privacy' },
]

export default function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <div className="product-site">
    <header className="product-header"><div className="product-nav">
      <SiteLink to="/" className="product-brand" aria-label="FocusRead home"><span className="product-brand-mark" aria-hidden="true">F<span>·</span></span><span>Focus<span>Read</span></span></SiteLink>
      <nav className={open ? 'product-links is-open' : 'product-links'} aria-label="Main navigation">
        {menu.map(item => <SiteLink key={item.to} to={item.to} onClick={() => setOpen(false)}>{item.label}</SiteLink>)}
        <SiteLink to="/progress" onClick={() => setOpen(false)}>Progress</SiteLink>
        <SiteLink to="/docs" onClick={() => setOpen(false)}>Docs</SiteLink>
      </nav>
      <SiteLink to="/app" className="product-nav-cta">Start reading <ArrowUpRight size={15}/></SiteLink>
      <button className="product-menu" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <X size={22}/> : <Menu size={22}/>}</button>
    </div></header>
    <main id="main-content">{children}</main>
    <footer className="product-footer"><div><SiteLink to="/" className="product-brand"><span className="product-brand-mark" aria-hidden="true">F<span>·</span></span><span>Focus<span>Read</span></span></SiteLink><p>A quieter way to move through words.</p></div><nav aria-label="Footer navigation"><SiteLink to="/features">Features</SiteLink><SiteLink to="/progress">Progress</SiteLink><SiteLink to="/privacy">Privacy</SiteLink><SiteLink to="/docs">Docs</SiteLink><SiteLink to="/app">Open reader</SiteLink></nav><small>Private by design. Made for the moments that matter.</small></footer>
  </div>
}
