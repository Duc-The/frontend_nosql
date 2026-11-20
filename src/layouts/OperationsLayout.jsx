import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowUpRight, Boxes, ChartNoAxesCombined, ChevronDown, LogOut, Menu, ShoppingBag, Sprout, Tags, Users, X } from 'lucide-react'
import './operations.css'

const groups = [
  { title: 'Bán hàng', icon: ShoppingBag, slugs: ['don-hang', 'khuyen-mai'] },
  { title: 'Danh mục hàng hóa', icon: Tags, slugs: ['san-pham', 'danh-muc'] },
  { title: 'Kho và cung ứng', icon: Boxes, slugs: ['bao-cao-kho', 'ton-kho', 'phieu-nhap', 'xuat-kho', 'truy-xuat', 'nha-cung-cap'] },
  { title: 'Người dùng', icon: Users, slugs: ['khach-hang', 'nhan-vien'] },
]

const roleLabels = { ADMIN: 'Quản trị viên', SALES_STAFF: 'Nhân viên bán hàng', WAREHOUSE_STAFF: 'Nhân viên kho' }
const route = (slug) => '/van-hanh/' + slug

export function OperationsLayout({ children, links, activeSlug, roles, onSignOut }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const current = links.find(([slug]) => slug === activeSlug)
  const role = Object.keys(roleLabels).find((item) => roles.includes(item))

  return <div className="ops-layout">
    <aside id="operations-sidebar" className="ops-sidebar" data-mobile-open={mobileOpen}>
      <Link to="/van-hanh" className="ops-brand">
        <span><Sprout size={23} aria-hidden="true" /></span>
        <div><strong>Mùa Xanh</strong><small>Vận hành cửa hàng</small></div>
      </Link>
      <nav className="ops-navigation" aria-label="Điều hướng vận hành">
        {links.some(([slug]) => slug === 'bao-cao') && <Link className="ops-nav-root" to={route('bao-cao')}
          aria-current={activeSlug === 'bao-cao' ? 'page' : undefined}>
          <ChartNoAxesCombined size={19} aria-hidden="true" /> Tổng quan
        </Link>}
        {groups.map(({ title, icon, slugs }) => {
          const items = slugs.map((slug) => links.find(([key]) => key === slug)).filter(Boolean)
          if (!items.length) return null
          const Icon = icon
          return <details key={title} open={items.some(([slug]) => slug === activeSlug)}>
            <summary><Icon size={19} aria-hidden="true" /><span>{title}</span><ChevronDown size={15} aria-hidden="true" /></summary>
            <ul>{items.map(([slug, label]) => <li key={slug}>
              <Link to={route(slug)} aria-current={activeSlug === slug ? 'page' : undefined}>{label}</Link>
            </li>)}</ul>
          </details>
        })}
      </nav>
      <div className="ops-sidebar-footer">
        <span className="ops-avatar" aria-hidden="true">MX</span>
        <span>{roleLabels[role] || 'Tài khoản'}</span>
        <button type="button" onClick={onSignOut} aria-label="Đăng xuất" title="Đăng xuất"><LogOut size={17} aria-hidden="true" /></button>
      </div>
    </aside>
    <div className="ops-body">
      <header className="ops-topbar">
        <button className="ops-mobile-toggle" type="button" aria-label={mobileOpen ? 'Đóng điều hướng' : 'Mở điều hướng'}
          aria-expanded={mobileOpen} aria-controls="operations-sidebar" onClick={() => setMobileOpen((value) => !value)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <p><span>Vận hành</span><span aria-hidden="true">/</span><strong>{current?.[1] || 'Tài khoản'}</strong></p>
        <Link to="/">Xem cửa hàng <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </header>
      <main className="workspace-main ops-main">{children}</main>
    </div>
  </div>
}
