import { Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WorkspaceLayout({ children, links, onSignOut }) {
  return <>
    <header className="workspace-header"><div className="workspace-shell">
      <a href="/" className="wordmark"><Sprout size={22} aria-hidden="true" /> Mùa Xanh.</a>
      <div><a href="/">Cửa hàng</a>{onSignOut && <Button variant="outline" onClick={onSignOut}>Đăng xuất</Button>}</div>
    </div></header>
    <div className={links?.length ? 'workspace-shell workspace-grid' : 'workspace-shell workspace-single'}>
      {links?.length > 0 && <nav className="workspace-nav" aria-label="Điều hướng trang">
        {links.map(([href, name]) => <a key={href} href={href} aria-current={window.location.pathname === href ? 'page' : undefined}>{name}</a>)}
      </nav>}
      <main className="workspace-main">{children}</main>
    </div>
  </>
}
