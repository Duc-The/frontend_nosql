import { Suspense, lazy, useEffect } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSeo } from '@/hooks/use-seo'
import { operationRoles } from '@/lib/route-access'
import { Storefront } from '@/features/catalog/Storefront'

import { AuthLayout } from '@/layouts/AuthLayout'
import { OperationsLayout } from '@/layouts/OperationsLayout'
import { CheckoutLayout } from '@/layouts/CheckoutLayout'
import { CustomerLayout } from '@/layouts/CustomerLayout'
import { WorkspaceLayout } from '@/layouts/WorkspaceLayout'

import { useSession } from '@/features/account/use-session'

import { PageTitle } from '@/components/page-kit'
import '@/layouts/workspace.css'
import '@/layouts/store-pages.css'

function lazyPage(load, name) {
  return lazy(async () => ({ default: (await load())[name] }))
}

const WriteReviewPage = lazyPage(() => import('@/features/reviews/WriteReviewPage'), 'WriteReviewPage')
const ProductPage = lazyPage(() => import('@/features/catalog/ProductPage'), 'ProductPage')
const CartPage = lazyPage(() => import('@/features/cart/CartPage'), 'CartPage')
const AuthPage = lazyPage(() => import('@/features/account/AuthPage'), 'AuthPage')
const AddressesPage = lazyPage(() => import('@/features/account/CustomerPages'), 'AddressesPage')
const LoyaltyPage = lazyPage(() => import('@/features/account/CustomerPages'), 'LoyaltyPage')
const ProfilePage = lazyPage(() => import('@/features/account/CustomerPages'), 'ProfilePage')
const CheckoutPage = lazyPage(() => import('@/features/checkout/CheckoutPage'), 'CheckoutPage')
const OnlinePaymentPage = lazyPage(() => import('@/features/orders/OnlinePaymentPage'), 'OnlinePaymentPage')
const PaymentResultPage = lazyPage(() => import('@/features/orders/PaymentResultPage'), 'PaymentResultPage')
const OrderConfirmation = lazyPage(() => import('@/features/orders/OrderConfirmation'), 'OrderConfirmation')
const OrderPage = lazyPage(() => import('@/features/orders/OrdersPage'), 'OrderPage')
const OrdersPage = lazyPage(() => import('@/features/orders/OrdersPage'), 'OrdersPage')
const SalesDetail = lazyPage(() => import('@/features/operations/SalesPages'), 'SalesDetail')
const SalesList = lazyPage(() => import('@/features/operations/SalesPages'), 'SalesList')
const InventoryBatchPage = lazyPage(() => import('@/features/operations/WarehousePages'), 'InventoryBatchPage')
const InventoryPage = lazyPage(() => import('@/features/operations/WarehousePages'), 'InventoryPage')
const IssueDetailPage = lazyPage(() => import('@/features/operations/WarehousePages'), 'IssueDetailPage')
const IssuePage = lazyPage(() => import('@/features/operations/WarehousePages'), 'IssuePage')
const ReceiptsPage = lazyPage(() => import('@/features/operations/WarehousePages'), 'ReceiptsPage')
const SuppliersPage = lazyPage(() => import('@/features/operations/WarehousePages'), 'SuppliersPage')
const TracePage = lazyPage(() => import('@/features/operations/WarehousePages'), 'TracePage')
const CategoriesPage = lazyPage(() => import('@/features/operations/AdminPages'), 'CategoriesPage')
const CustomersPage = lazyPage(() => import('@/features/operations/AdminPages'), 'CustomersPage')
const EmployeesPage = lazyPage(() => import('@/features/operations/AdminPages'), 'EmployeesPage')
const ProductAssetsPage = lazyPage(() => import('@/features/operations/AdminPages'), 'ProductAssetsPage')
const ProductsPage = lazyPage(() => import('@/features/operations/AdminPages'), 'ProductsPage')
const PromotionEditor = lazyPage(() => import('@/features/operations/AdminPages'), 'PromotionEditor')
const PromotionsPage = lazyPage(() => import('@/features/operations/AdminPages'), 'PromotionsPage')
const InventoryReportsPage = lazyPage(() => import('@/features/operations/InventoryReportsPage'), 'InventoryReportsPage')
const ReportsPage = lazyPage(() => import('@/features/operations/ReportsPage'), 'ReportsPage')

const customers = [
  ['/tai-khoan', 'Hồ sơ', ProfilePage], ['/tai-khoan/dia-chi', 'Sổ địa chỉ', AddressesPage],
  ['/tai-khoan/uu-dai', 'Điểm và voucher', LoyaltyPage], ['/don-hang', 'Đơn hàng', OrdersPage],
]
const operations = [
  ['bao-cao', 'Tổng quan', ReportsPage],
  ['bao-cao-kho', 'Báo cáo kho', InventoryReportsPage],
  ['don-hang', 'Đơn bán hàng', SalesList],
  ['xuat-kho', 'Xuất kho', IssuePage],
  ['ton-kho', 'Tồn kho', InventoryPage],
  ['truy-xuat', 'Truy xuất lô', TracePage],
  ['nha-cung-cap', 'Nhà cung cấp', SuppliersPage],
  ['phieu-nhap', 'Phiếu nhập', ReceiptsPage],
  ['nhan-vien', 'Nhân viên', EmployeesPage],
  ['khach-hang', 'Khách hàng', CustomersPage],
  ['danh-muc', 'Danh mục', CategoriesPage],
  ['san-pham', 'Sản phẩm', ProductsPage],
  ['khuyen-mai', 'Khuyến mãi', PromotionsPage],
].map(([slug, label, Component]) => [slug, label, Component, operationRoles[slug]])

const auth = { '/dang-nhap': 'login', '/dang-ky': 'register', '/quen-mat-khau': 'forgot', '/xac-minh-tai-khoan': 'activate' }
const paymentReturn = new Set(['/payment/result', '/payment/cancel'])

export default function App() {
  const location = useLocation()
  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView())
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [location.pathname, location.hash])

  return <Suspense fallback={<div className="route-loading" role="status">Đang mở trang…</div>}><Routes key={location.pathname + location.search}>
    <Route index element={<Storefront />} />
    <Route path="san-pham" element={<Storefront catalogOnly />} />
    <Route path="san-pham/:slug" element={<ProductRoute />} />
    {Object.entries(auth).map(([path, mode]) => <Route key={path} path={path} element={<AuthRoute mode={mode} />} />)}
    <Route element={<RequireSession roles={['CUSTOMER']} />}>
      <Route path="gio-hang" element={<PrivateCart />} />
      <Route element={<CheckoutRoute />}>
        <Route path="thanh-toan" element={<CheckoutContent stage="checkout" />} />
        <Route path="thanh-toan/xac-nhan/:code" element={<CheckoutContent stage="confirmation" />} />
        <Route path="thanh-toan/giao-dich/:code" element={<CheckoutContent stage="transaction" />} />
        <Route path="payment/result" element={<CheckoutContent stage="result" />} />
        <Route path="payment/cancel" element={<CheckoutContent stage="result" />} />
      </Route>
      <Route element={<CustomerRoute />}>
        {customers.map(([path, , Component]) => <Route key={path} path={path} element={<CustomerContent Component={Component} />} />)}
        <Route path="don-hang/:code" element={<CustomerOrder />} />
        <Route path="don-hang/:code/danh-gia/:productId" element={<CustomerReview />} />
      </Route>
    </Route>
    <Route element={<RequireSession roles={['ADMIN', 'SALES_STAFF', 'WAREHOUSE_STAFF']} />}>
      <Route path="van-hanh" element={<OperationsRoute />}>
        <Route index element={<OperationsIndex />} />
        {operations.map(([slug, , Component, roles]) => <Route key={slug} element={<RequireSession roles={roles} />}>
          <Route path={slug} element={<OperationContent Component={Component} slug={slug} />} />
          {['don-hang', 'ton-kho', 'xuat-kho', 'san-pham', 'khuyen-mai'].includes(slug) &&
            <Route path={slug + '/:value'} element={<OperationDetail slug={slug} />} />}
        </Route>)}
        <Route path="*" element={<Unavailable />} />
      </Route>
    </Route>
    <Route path="*" element={<WorkspaceLayout><PageTitle title="Không tìm thấy trang" />
      <Link className="page-link" to="/san-pham">Quay lại cửa hàng</Link></WorkspaceLayout>} />
  </Routes></Suspense>
}

function RequireSession({ roles }) {
  const { session } = useSession()
  const location = useLocation()
  if (!session) return <Navigate to={'/dang-nhap?next=' + encodeURIComponent(location.pathname + location.search)} replace />
  if (!roles.some((role) => session.roles?.includes(role))) {
    return <WorkspaceLayout><Unavailable /></WorkspaceLayout>
  }
  return <Outlet />
}

function ProductRoute() {
  return <ProductPage slug={useParams().slug} />
}

function PrivateCart() {
  useSeo({ title: 'Giỏ hàng | Mùa Xanh', noindex: true })
  return <CartPage />
}

function AuthRoute({ mode }) {
  const { session, save } = useSession()
  useSeo({ title: ({ login: 'Đăng nhập', register: 'Tạo tài khoản', forgot: 'Quên mật khẩu', activate: 'Xác minh tài khoản' })[mode] + ' | Mùa Xanh', noindex: true })
  return <AuthLayout><AuthPage mode={mode} session={session} save={save} /></AuthLayout>
}

function useSignOut() {
  const { save } = useSession()
  const navigate = useNavigate()
  return () => { save(null); navigate('/', { replace: true }) }
}

function CheckoutRoute() {
  const { pathname } = useLocation()
  const stage = pathname.includes('/xac-nhan/') ? 'confirmation' : pathname.includes('/giao-dich/') ? 'transaction'
    : paymentReturn.has(pathname) ? 'result' : 'checkout'
  useSeo({ title: 'Thanh toán | Mùa Xanh', noindex: true })
  return <CheckoutLayout stage={stage}><Outlet /></CheckoutLayout>
}

function CheckoutContent({ stage }) {
  const { session, request } = useSession()
  const { code } = useParams()
  const location = useLocation()
  if (stage === 'checkout') return <CheckoutPage request={request} session={session} />
  if (stage === 'confirmation') return <OrderConfirmation request={request} code={code} />
  if (stage === 'transaction') return <OnlinePaymentPage request={request} code={code} />
  return <PaymentResultPage request={request} code={new URLSearchParams(location.search).get('merchantOrderCode')}
    cancelled={location.pathname === '/payment/cancel'} />
}

function CustomerRoute() {
  const { pathname } = useLocation()
  const signOut = useSignOut()
  useSeo({ title: 'Tài khoản | Mùa Xanh', noindex: true })
  return <CustomerLayout links={customers.map(([path, label]) => [path, label])} pathname={pathname} onSignOut={signOut}>
    <Outlet />
  </CustomerLayout>
}

function CustomerContent({ Component: component }) {
  const Page = component
  const props = useSession()
  return <Page {...props} />
}

function CustomerOrder() {
  const { request } = useSession()
  return <OrderPage request={request} code={useParams().code} />
}

function CustomerReview() {
  const { request } = useSession()
  const { code, productId } = useParams()
  return <WriteReviewPage request={request} orderCode={code} productId={productId} />
}

function useOperationRoutes() {
  const { session } = useSession()
  return operations.filter(([, , , roles]) => roles.some((role) => session?.roles?.includes(role)))
}

function OperationsRoute() {
  const { session } = useSession()
  const location = useLocation()
  const signOut = useSignOut()
  const routes = useOperationRoutes()
  const activeSlug = location.pathname.split('/')[2]
  useSeo({ title: (routes.find(([slug]) => slug === activeSlug)?.[1] || 'Vận hành') + ' | Mùa Xanh', noindex: true })
  return <OperationsLayout links={routes.map(([slug, label]) => [slug, label])} activeSlug={activeSlug}
    roles={session.roles} onSignOut={signOut}><Outlet /></OperationsLayout>
}

function OperationsIndex() {
  const routes = useOperationRoutes()
  return routes.length ? <Navigate to={routes[0][0]} replace /> : <Unavailable />
}

function OperationContent({ Component: component, slug }) {
  const Page = component
  const props = useSession()
  return <>{slug === 'khuyen-mai' && <Link className="page-link" to="/van-hanh/khuyen-mai/tao-moi">Tạo khuyến mãi</Link>}
    <Page {...props} /></>
}

function OperationDetail({ slug }) {
  const { value } = useParams()
  const { request, session } = useSession()
  switch (slug) {
    case 'don-hang': return <SalesDetail request={request} session={session} code={value} />
    case 'ton-kho': return <InventoryBatchPage request={request} id={value} />
    case 'xuat-kho': return <IssueDetailPage request={request} code={value} />
    case 'san-pham': return <ProductAssetsPage request={request} id={value} />
    case 'khuyen-mai': return <PromotionEditor request={request} id={value === 'tao-moi' ? null : value} />
    default: return <Unavailable />
  }
}

function Unavailable() {
  return <><PageTitle title="Trang không khả dụng" /><Link className="page-link" to="/">Về cửa hàng</Link></>
}
