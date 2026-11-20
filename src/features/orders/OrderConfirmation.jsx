import { Link } from 'react-router-dom'
import { ArrowRight, CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataState, useResource } from '@/components/page-kit'
import { paymentLabel, price, statusLabel } from '@/lib/format'

export function OrderConfirmation({ request, code }) {
  const order = useResource(request, '/orders/' + encodeURIComponent(code))
  return <DataState resource={order}>{({ order: details }) => {
    const needsPayment = ['VIETQR', 'VNPAY'].includes(details.paymentMethod) && details.paymentStatus === 'PENDING'
      && details.status !== 'CANCELLED'
    const orderUrl = '/don-hang/' + encodeURIComponent(details.orderCode)
    return <section className="page-box order-confirmation">
      <span className="order-confirmation-icon"><CircleCheck size={32} aria-hidden="true" /></span>
      <h1>Đã đặt hàng</h1>
      <p>Mã đơn <strong>{details.orderCode}</strong></p>
      <dl>
        <dt>Tổng tiền</dt><dd>{price(details.totalAmount)}</dd>
        <dt>Phương thức</dt><dd>{paymentLabel(details.paymentMethod)}</dd>
        <dt>Thanh toán</dt><dd>{statusLabel(details.paymentStatus)}</dd>
      </dl>
      <div className="page-actions">
        <Button asChild><Link to={needsPayment ? '/thanh-toan/giao-dich/' + encodeURIComponent(details.orderCode) : orderUrl}>
          {needsPayment ? 'Tiếp tục thanh toán' : 'Xem chi tiết đơn'} <ArrowRight size={17} aria-hidden="true" />
        </Link></Button>
        <Button asChild variant="outline"><Link to="/san-pham">Tiếp tục mua sắm</Link></Button>
      </div>
    </section>
  }}</DataState>
}
