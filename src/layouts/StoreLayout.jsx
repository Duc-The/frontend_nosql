import { useNavigate, Link } from 'react-router-dom'
import { SearchForm } from '@/components/SearchForm'
import { ArrowUp, ArrowUpRight, Grid2X2, Search, ShoppingBag, Sprout } from 'lucide-react'
import { AccountMenu } from '@/features/account/AccountMenu'
import { useSession } from '@/features/account/use-session'
import { useResource } from '@/components/page-kit'

export function StoreLayout({ children, search, cartCount }) {
  const navigate = useNavigate()
  const { session, request, save } = useSession()
  const isCustomer = session?.roles?.includes('CUSTOMER')
  const cart = useResource(request, isCustomer && cartCount == null ? '/cart' : null)
  const count = cartCount ?? cart.data?.items.reduce((total, item) => total + item.quantity, 0) ?? 0
  const pathname = location.pathname
  const inCatalog = pathname === '/san-pham' || pathname.startsWith('/san-pham/')
  const account = isCustomer ? '/tai-khoan' : session ? '/van-hanh' : '/dang-nhap'
  return (
    <>
      <a className="skip-link" href="#noi-dung">Đến nội dung</a>
      <header className="store-header">
        <div className="store-shell header-inner">
          <Link className="wordmark" to="/" aria-label="Mùa Xanh, trang chủ">
            <span className="wordmark-icon"><Sprout size={22} aria-hidden="true" /></span>
            Mùa Xanh<span className="wordmark-dot">.</span>
          </Link>
          <SearchForm action="/san-pham" className="header-search" role="search">
            <label htmlFor="search" className="sr-only">Tìm sản phẩm</label>
            <input id="search" type="search" name="q" defaultValue={search} placeholder="Tìm rau, trái cây, gạo…" maxLength={100} />
            <button type="submit" aria-label="Tìm kiếm"><Search size={19} aria-hidden="true" /></button>
          </SearchForm>
          <div className="header-actions">
            <AccountMenu session={session} onSignOut={() => { save(null); navigate('/') }} />
            <Link className="icon-button bag-button" to="/gio-hang" aria-label={`Giỏ hàng, ${count} sản phẩm`}>
              <ShoppingBag size={20} aria-hidden="true" />
              <span className="bag-label" aria-hidden="true">Giỏ hàng</span>
              <span className="bag-count" aria-hidden="true">{count}</span>
            </Link>
          </div>
        </div>
        <div className="header-navigation">
          <nav className="store-shell main-nav" aria-label="Điều hướng chính">
            <Link to="/" aria-current={pathname === '/' ? 'page' : undefined}>Trang chủ</Link>
            <Link to="/san-pham" aria-current={inCatalog ? (pathname === '/san-pham' ? 'page' : 'location') : undefined}>Cửa hàng</Link>
            <Link to="/san-pham#danh-muc"><Grid2X2 size={16} aria-hidden="true" /> Danh mục</Link>
          </nav>
        </div>
      </header>
      <main id="noi-dung">{children}</main>
      <footer className="store-footer">
        <div className="store-shell">
          <div className="footer-inner">
            <div className="footer-brand">
              <Link to="/" className="wordmark" aria-label="Mùa Xanh, trang chủ"><Sprout size={24} aria-hidden="true" /> Mùa Xanh.</Link>
              <p>Thực phẩm hữu cơ cho bữa ăn hằng ngày.</p>
              <Link to="/san-pham" className="footer-shop">Khám phá cửa hàng <ArrowUpRight size={16} aria-hidden="true" /></Link>
            </div>
            <nav aria-label="Mua sắm" className="footer-nav">
              <h2>Mua sắm</h2>
              <ul>
                <li><Link to="/san-pham">Tất cả sản phẩm</Link></li>
                <li><Link to="/san-pham#danh-muc">Danh mục</Link></li>
                <li><Link to="/gio-hang">Giỏ hàng</Link></li>
              </ul>
            </nav>
            <nav aria-label="Tài khoản" className="footer-nav">
              <h2>Tài khoản</h2>
              <ul>
                <li><Link to={account}>{isCustomer ? 'Hồ sơ của tôi' : session ? 'Trang vận hành' : 'Đăng nhập'}</Link></li>
                <li><Link to="/don-hang">Theo dõi đơn hàng</Link></li>
                <li><Link to="/tai-khoan/uu-dai">Điểm và voucher</Link></li>
              </ul>
            </nav>
            <div className="footer-payment">
              <h2>Thanh toán</h2>
              <ul aria-label="Phương thức thanh toán">
                <li>COD</li><li>VietQR</li><li>VNPAY</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <small>© {new Date().getFullYear()} Mùa Xanh</small>
            <a href="#noi-dung">Về đầu nội dung <ArrowUp size={16} aria-hidden="true" /></a>
          </div>
        </div>
      </footer>
    </>
  )
}
