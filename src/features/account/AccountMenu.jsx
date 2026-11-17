import { createElement, useEffect, useId, useRef, useState } from 'react'
import {
  Boxes, ClipboardList, LayoutDashboard, LogIn, LogOut, MapPin, ShieldCheck,
  Ticket, UserRound, UserRoundPlus,
} from 'lucide-react'

const guestLinks = [
  ['/dang-nhap', 'Đăng nhập', LogIn],
  ['/dang-ky', 'Tạo tài khoản', UserRoundPlus],
  ['/xac-minh-tai-khoan', 'Xác minh tài khoản', ShieldCheck],
]

const customerLinks = [
  ['/tai-khoan', 'Hồ sơ của tôi', UserRound],
  ['/don-hang', 'Đơn hàng của tôi', ClipboardList],
  ['/tai-khoan/dia-chi', 'Sổ địa chỉ', MapPin],
  ['/tai-khoan/uu-dai', 'Điểm và voucher', Ticket],
]

const staffLinks = [
  ['ADMIN', '/van-hanh/bao-cao', 'Quản trị cửa hàng', LayoutDashboard],
  ['SALES_STAFF', '/van-hanh/don-hang', 'Quản lý đơn bán hàng', ClipboardList],
  ['WAREHOUSE_STAFF', '/van-hanh/ton-kho', 'Quản lý tồn kho', Boxes],
]

export function AccountMenu({ session, onSignOut }) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const root = useRef(null)
  const trigger = useRef(null)
  const roles = session?.roles || []
  const links = session ? [
    ...(roles.includes('CUSTOMER') ? customerLinks : []),
    ...staffLinks.filter(([role]) => roles.includes(role)).map(([, ...link]) => link),
  ] : guestLinks

  useEffect(() => {
    if (!open) return
    function closeOutside(event) {
      if (!root.current.contains(event.target)) setOpen(false)
    }
    function closeOnEscape(event) {
      if (event.key !== 'Escape') return
      if (root.current.contains(document.activeElement)) trigger.current.focus()
      setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return <div className="account-menu" ref={root}
    onPointerEnter={(event) => { if (event.pointerType === 'mouse') setOpen(true) }}
    onPointerLeave={(event) => {
      if (event.pointerType === 'mouse' && !root.current.contains(document.activeElement)) setOpen(false)
    }}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <button ref={trigger} className="icon-button account-menu-trigger" type="button"
      aria-label="Tài khoản" aria-expanded={open} aria-controls={menuId}
      onClick={() => setOpen((value) => !value)}>
      <UserRound size={21} aria-hidden="true" />
    </button>
    <nav id={menuId} className="account-menu-panel" aria-label="Tùy chọn tài khoản" hidden={!open}>
      <ul>
        {links.map(([href, label, Icon]) => <li key={href}>
          <a href={href}>{createElement(Icon, { size: 17, 'aria-hidden': true })}{label}</a>
        </li>)}
        {session && <li className="account-menu-signout">
          <button type="button" onClick={onSignOut}><LogOut size={17} aria-hidden="true" />Đăng xuất</button>
        </li>}
      </ul>
    </nav>
  </div>
}
