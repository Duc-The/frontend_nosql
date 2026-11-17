import { ArrowUpRight, LogOut, MapPin, Package, Ticket, UserRound } from 'lucide-react'
import { StoreLayout } from './StoreLayout'
import './customer.css'

const icons = {
  '/tai-khoan': UserRound, '/tai-khoan/dia-chi': MapPin, '/tai-khoan/uu-dai': Ticket,
  '/don-hang': Package,
}

export function CustomerLayout({ links, pathname, onSignOut, children }) {
  return <StoreLayout>
    <div className="store-shell customer-shell">
      <aside className="customer-sidebar">
        <div className="customer-sidebar-title"><span className="customer-icon"><UserRound size={21} aria-hidden="true" /></span>
          <strong>Tài khoản của tôi</strong></div>
        <nav aria-label="Tài khoản khách hàng">
          {links.map(([href, label]) => {
            const Icon = icons[href]
            const current = href === pathname || (href === '/don-hang' && pathname.startsWith('/don-hang/'))
            return <a key={href} href={href} aria-current={current ? (href === pathname ? 'page' : 'location') : undefined}>
              <Icon size={19} aria-hidden="true" />{label}
            </a>
          })}
        </nav>
        <div className="customer-sidebar-actions">
          <a href="/san-pham">Xem cửa hàng <ArrowUpRight size={16} aria-hidden="true" /></a>
          <button type="button" onClick={onSignOut}>Đăng xuất <LogOut size={16} aria-hidden="true" /></button>
        </div>
      </aside>
      <div className="workspace-main customer-main">{children}</div>
    </div>
  </StoreLayout>
}
