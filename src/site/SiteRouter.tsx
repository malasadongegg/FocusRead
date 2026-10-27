import { lazy, Suspense, useEffect } from 'react'
import SiteShell from './SiteShell'
import { usePathname } from './navigation'
import LandingPage from './pages/LandingPage'

const Workspace = lazy(() => import('../App'))
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'))
const ProgressPage = lazy(() => import('./pages/ProgressPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const DocsPage = lazy(() => import('./pages/DocsPage'))
const metadata: Record<string, [string, string]> = {
  '/': ['FocusRead — Read at your own pace', 'A private, offline-ready speed reader that keeps every word in focus.'],
  '/app': ['Reader — FocusRead', 'Paste text, choose your pace, and read one word at a time.'],
  '/features': ['Features — FocusRead', 'Explore FocusRead reading modes, pacing, customization, and local documents.'],
  '/progress': ['Progress — FocusRead', 'Your reading history and goals, stored only on this device.'],
  '/privacy': ['Privacy — FocusRead', 'Learn where FocusRead stores documents and how offline reading works.'],
  '/docs': ['Documentation — FocusRead', 'Local setup, library backups, offline use, and Vercel deployment.'],
}

export default function SiteRouter() {
  const path = usePathname()
  const route = path.replace(/\/$/, '') || '/'
  useEffect(() => {
    const [title, description] = metadata[route] ?? ['Page not found — FocusRead', 'Return to FocusRead.']
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView())
    else window.scrollTo(0, 0)
  }, [route])
  if (route === '/app') return <Suspense fallback={<div className="route-loading">Opening your reading space…</div>}><Workspace/></Suspense>
  const page = route === '/' ? <LandingPage/> : route === '/features' ? <FeaturesPage/> : route === '/progress' ? <ProgressPage/> : route === '/privacy' ? <PrivacyPage/> : route === '/docs' ? <DocsPage/> : <div className="page-container not-found"><span className="overline">404</span><h1>We couldn't find that page.</h1><p>The reader is still right where you left it.</p><a href="/app" className="solid-cta">Open reader</a></div>
  return <SiteShell><Suspense fallback={<div className="page-container inner-page" role="status">Opening page…</div>}>{page}</Suspense></SiteShell>
}
