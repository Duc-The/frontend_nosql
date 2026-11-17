import { ArrowLeft, Sprout } from 'lucide-react'
import './customer.css'

export function CheckoutLayout({ stage, children }) {
  const reviewing = stage === 'checkout'
  const confirming = stage === 'confirmation'

  return <div className="checkout-flow">
    <header className="checkout-flow-header">
      <div className="store-shell">
        <a className="wordmark" href="/" aria-label="Mùa Xanh, trang chủ"><Sprout size={23} aria-hidden="true" /> Mùa Xanh.</a>
        <a className="customer-text-link" href={reviewing ? '/gio-hang' : '/don-hang'}>
          <ArrowLeft size={16} aria-hidden="true" />{reviewing ? 'Về giỏ hàng' : 'Xem đơn hàng'}
        </a>
      </div>
    </header>
    <main className="store-shell workspace-main customer-main checkout-flow-main">
      {(reviewing || confirming) && <ol className="checkout-steps" aria-label="Tiến trình đặt hàng">
        <li data-completed="true">Giỏ hàng</li>
        <li data-completed={confirming || undefined} aria-current={reviewing ? 'step' : undefined}>Thanh toán</li>
        <li aria-current={confirming ? 'step' : undefined}>Xác nhận đơn</li>
      </ol>}
      {children}
    </main>
  </div>
}
