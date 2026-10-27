import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react'

export const routes = ['/', '/app', '/features', '/progress', '/privacy', '/docs'] as const
export type RoutePath = typeof routes[number]

export function usePathname() {
  const [path, setPath] = useState(() => location.pathname)
  useEffect(() => {
    const onPop = () => setPath(location.pathname)
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])
  return path
}

export function SiteLink({ to, onClick, ...props }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string }) {
  const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === '_blank') return
    event.preventDefault()
    if (`${location.pathname}${location.hash}` !== to) {
      history.pushState(null, '', to)
      dispatchEvent(new PopStateEvent('popstate'))
    }
    if (to.includes('#')) requestAnimationFrame(() => document.getElementById(to.split('#')[1])?.scrollIntoView())
  }
  return <a {...props} href={to} onClick={navigate}/>
}
