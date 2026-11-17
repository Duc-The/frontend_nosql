import { useSeo } from '@/hooks/use-seo'
import { Storefront } from '@/features/catalog/Storefront'
import { WriteReviewPage } from '@/features/reviews/WriteReviewPage'
import { ProductPage } from '@/features/catalog/ProductPage'
import { CartPage } from '@/features/cart/CartPage'
import { AuthLayout } from '@/layouts/AuthLayout'
import { OperationsLayout } from '@/layouts/OperationsLayout'
import { CheckoutLayout } from '@/layouts/CheckoutLayout'
import { CustomerLayout } from '@/layouts/CustomerLayout'
import { WorkspaceLayout } from '@/layouts/WorkspaceLayout'
import { AuthPage } from '@/features/account/AuthPage'
import { AddressesPage, LoyaltyPage, ProfilePage } from '@/features/account/CustomerPages'
import { useSession } from '@/features/account/use-session'
import { CheckoutPage } from '@/features/checkout/CheckoutPage'
import { OnlinePaymentPage } from '@/features/orders/OnlinePaymentPage'
import { PaymentResultPage } from '@/features/orders/PaymentResultPage'
import { OrderConfirmation } from '@/features/orders/OrderConfirmation'
import { OrderPage, OrdersPage } from '@/features/orders/OrdersPage'
import { SalesDetail, SalesList } from '@/features/operations/SalesPages'
import { InventoryBatchPage, InventoryPage, IssueDetailPage, IssuePage, ReceiptsPage, SuppliersPage, TracePage } from '@/features/operations/WarehousePages'
import { CategoriesPage, CustomersPage, EmployeesPage, ProductAssetsPage, ProductsPage, PromotionEditor, PromotionsPage } from '@/features/operations/AdminPages'
import { InventoryReportsPage } from '@/features/operations/InventoryReportsPage'
import { ReportsPage } from '@/features/operations/ReportsPage'
import { Button } from '@/components/ui/button'
import { PageTitle } from '@/components/page-kit'
import '@/layouts/workspace.css'
import '@/layouts/store-pages.css'

const customers = [
  ['/tai-khoan', 'Hồ sơ', ProfilePage], ['/tai-khoan/dia-chi', 'Sổ địa chỉ', AddressesPage],
  ['/tai-khoan/uu-dai', 'Điểm và voucher', LoyaltyPage], ['/don-hang', 'Đơn hàng', OrdersPage],
]
const admin = 'ADMIN'
const operations = [
  ['bao-cao', 'Tổng quan', ReportsPage, [admin]],
  ['bao-cao-kho', 'Báo cáo kho', InventoryReportsPage, [admin]],
  ['don-hang', 'Đơn bán hàng', SalesList, [admin, 'SALES_STAFF']],
  ['xuat-kho', 'Xuất kho', IssuePage, [admin, 'WAREHOUSE_STAFF']],
  ['ton-kho', 'Tồn kho', InventoryPage, [admin, 'WAREHOUSE_STAFF']],
  ['truy-xuat', 'Truy xuất lô', TracePage, [admin, 'WAREHOUSE_STAFF']],
  ['nha-cung-cap', 'Nhà cung cấp', SuppliersPage, [admin, 'WAREHOUSE_STAFF']],
  ['phieu-nhap', 'Phiếu nhập', ReceiptsPage, [admin, 'WAREHOUSE_STAFF']],
  ['nhan-vien', 'Nhân viên', EmployeesPage, [admin]],
  ['khach-hang', 'Khách hàng', CustomersPage, [admin]],
  ['danh-muc', 'Danh mục', CategoriesPage, [admin]],
  ['san-pham', 'Sản phẩm', ProductsPage, [admin]],
  ['khuyen-mai', 'Khuyến mãi', PromotionsPage, [admin]],
]
const auth = { '/dang-nhap': 'login', '/dang-ky': 'register', '/quen-mat-khau': 'forgot', '/xac-minh-tai-khoan': 'activate' }
const paymentReturn = new Set(['/payment/result', '/payment/cancel'])

function decoded(value) {
  try { return decodeURIComponent(value) } catch { return '' }
}

export default function App() {
  const pathname = location.pathname.replace(/\/+$/, '') || '/'
  const slug = pathname.match(/^\/san-pham\/([^/]+)$/)?.[1]
  if (slug) return <ProductPage slug={decoded(slug)} />
  const confirmationCode = pathname.match(/^\/thanh-toan\/xac-nhan\/([^/]+)$/)?.[1]
  const transactionCode = pathname.match(/^\/thanh-toan\/giao-dich\/([^/]+)$/)?.[1]
  if (pathname === '/thanh-toan' || confirmationCode || transactionCode || paymentReturn.has(pathname)) {
    return <CheckoutFlow pathname={pathname} confirmationCode={confirmationCode} transactionCode={transactionCode} />
  }
  if (pathname === '/gio-hang') return <PrivateCart />
  if (pathname === '/san-pham') return <Storefront catalogOnly />
  return pathname === '/' ? <Storefront /> : <Workspace pathname={pathname} />
}

function PrivateCart() {
  useSeo({ title: 'Giỏ hàng | Mùa Xanh', noindex: true })
  return <CartPage />
}

function CheckoutFlow({ pathname, confirmationCode, transactionCode }) {
  const { session, request } = useSession()
  const stage = confirmationCode ? 'confirmation' : transactionCode ? 'transaction' : paymentReturn.has(pathname) ? 'result' : 'checkout'
  const title = stage === 'confirmation' ? 'Xác nhận đơn hàng' : stage === 'result' ? 'Kết quả thanh toán' : 'Thanh toán'
  useSeo({ title: title + ' | Mùa Xanh', noindex: true })
  const next = pathname + (stage === 'result' ? location.search : '')
  let content
  if (!session) {
    content = <section className="page-box">
      <PageTitle title="Đăng nhập để tiếp tục" />
      <Button asChild className="justify-self-start"><a href={'/dang-nhap?next=' + encodeURIComponent(next)}>Đăng nhập</a></Button>
    </section>
  } else if (!session.roles?.includes('CUSTOMER')) {
    content = <><PageTitle title="Thanh toán dành cho khách hàng" /><a className="customer-text-link" href="/san-pham">Về cửa hàng</a></>
  } else if (stage === 'checkout') {
    content = <CheckoutPage request={request} session={session} />
  } else if (stage === 'confirmation') {
    content = <OrderConfirmation request={request} code={decoded(confirmationCode)} />
  } else if (stage === 'transaction') {
    content = <OnlinePaymentPage request={request} code={decoded(transactionCode)} />
  } else {
    const code = new URLSearchParams(location.search).get('merchantOrderCode')
    content = <PaymentResultPage request={request} code={code} cancelled={pathname === '/payment/cancel'} />
  }
  return <CheckoutLayout stage={stage}>{content}</CheckoutLayout>
}

function Workspace({ pathname }) {
  useSeo({ title: 'Tài khoản và vận hành | Mùa Xanh', noindex: true })
  const { session, save, request } = useSession()
  const roleList = session?.roles || []
  const signOut = session ? () => { save(null); location.assign('/') } : undefined
  if (auth[pathname]) return <AuthLayout>
    <AuthPage mode={auth[pathname]} session={session} save={save} />
  </AuthLayout>

  const review = pathname.match(/^\/don-hang\/([^/]+)\/danh-gia\/([^/]+)$/)
  const known = review || customers.some(([path]) => path === pathname) || /^\/don-hang\/[^/]+$/.test(pathname)
    || /^\/van-hanh(?:\/[^/]+){0,2}$/.test(pathname)
  if (!known) return <WorkspaceLayout onSignOut={signOut}>
    <PageTitle title="Không tìm thấy trang" />
    <a className="page-link" href="/san-pham">Quay lại cửa hàng</a>
  </WorkspaceLayout>

  if (!session) {
    const next = pathname
    return <WorkspaceLayout><PageTitle title="Đăng nhập để tiếp tục" />
      <Button asChild className="justify-self-start"><a href={'/dang-nhap?next=' + encodeURIComponent(next)}>Đăng nhập</a></Button>
    </WorkspaceLayout>
  }
  if (pathname === '/van-hanh' || pathname.startsWith('/van-hanh/')) {
    const [, , segment, value] = pathname.split('/')
    const routes = operations.filter(([, , , roles]) => roles.some((role) => roleList.includes(role)))
    const match = segment ? routes.find(([slug]) => slug === segment) : routes[0]
    const links = routes.map(([slug, label]) => [slug, label])
    let page = null
    if (match) {
      const Component = match[2]
      if (value && segment === 'don-hang') page = <SalesDetail request={request} session={session} code={decoded(value)} />
      else if (value && segment === 'ton-kho') page = <InventoryBatchPage request={request} id={decoded(value)} />
      else if (value && segment === 'xuat-kho') page = <IssueDetailPage request={request} code={decoded(value)} />
      else if (value && segment === 'san-pham') page = <ProductAssetsPage request={request} id={decoded(value)} />
      else if (value && segment === 'khuyen-mai') page = <PromotionEditor request={request} id={value === 'tao-moi' ? null : decoded(value)} />
      else if (!value) page = <>{segment === 'khuyen-mai' && <a className="page-link" href="/van-hanh/khuyen-mai/tao-moi">Tạo khuyến mãi</a>}
        <Component request={request} session={session} /></>
    }
    return <OperationsLayout links={links} activeSlug={match?.[0]} roles={roleList} onSignOut={signOut}>
      {page || <Unavailable />}
    </OperationsLayout>
  }

  if (!roleList.includes('CUSTOMER')) return <WorkspaceLayout onSignOut={signOut}><Unavailable /></WorkspaceLayout>

  const links = customers.map(([path, label]) => [path, label])
  const orderCode = pathname.match(/^\/don-hang\/([^/]+)$/)?.[1]
  const customerPage = customers.find(([path]) => path === pathname)?.[2]
  const CustomerPage = customerPage
  return <CustomerLayout links={links} pathname={pathname} onSignOut={signOut}>
    {review ? <WriteReviewPage request={request} orderCode={decoded(review[1])} productId={decoded(review[2])} />
      : CustomerPage ? <CustomerPage request={request} save={save} session={session} />
      : orderCode ? <OrderPage request={request} code={decoded(orderCode)} /> : <Unavailable />}
  </CustomerLayout>
}

function Unavailable() {
  return <><PageTitle title="Trang không khả dụng" /><a className="page-link" href="/">Về cửa hàng</a></>
}
