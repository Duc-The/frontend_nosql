import { CircleCheck, CircleX, Clock, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { paymentLabel, price, statusLabel } from '@/lib/format'
import './payment.css'

export function PaymentCard({ title, tone = 'waiting', code, payment, children }) {
  const Icon = { success: CircleCheck, failure: CircleX, qr: QrCode }[tone] || Clock
  return <section className="page-box payment-card" data-tone={tone}>
    <span className="payment-card-icon"><Icon size={27} aria-hidden="true" /></span>
    <h1>{title}</h1>
    {payment && <p className="payment-card-amount">{price(payment.amount)}</p>}
    {payment && <p className="payment-card-method">{paymentLabel(payment.method)}</p>}
    {code && <p className="payment-card-code">Mã đơn <strong>{code}</strong></p>}
    {children}
  </section>
}

export function PaymentOutcome({ code, payment, reported, cancelled }) {
  const status = payment?.status
  const confirmed = status === 'PAID'
  const waiting = status === 'PENDING' && !cancelled && reported !== 'FAILED'
  const expired = waiting && payment.expiresAt && Date.parse(payment.expiresAt) <= Date.now()
  let title = 'Đang xác nhận thanh toán'
  let tone = 'waiting'
  let message = 'Cửa hàng đang chờ cổng thanh toán xác nhận giao dịch.'
  if (confirmed || (waiting && reported === 'PAID')) {
    title = 'Thanh toán thành công'
    tone = 'success'
    message = confirmed ? 'Cửa hàng đã ghi nhận khoản thanh toán.' : 'VNPAY đã xác nhận giao dịch. Trạng thái đơn sẽ cập nhật khi cửa hàng nhận thông báo.'
  } else if (status === 'FAILED' || reported === 'FAILED') {
    title = 'Thanh toán thất bại'
    tone = 'failure'
    message = 'Bạn có thể xem trạng thái mới nhất trong chi tiết đơn.'
  } else if (status === 'CANCELLED' || (waiting === false && cancelled && status === 'PENDING')) {
    title = 'Thanh toán đã hủy'
    tone = 'failure'
    message = 'Xem chi tiết đơn để kiểm tra trạng thái giao dịch.'
  } else if (expired || status === 'EXPIRED') {
    title = 'Thanh toán đã hết hạn'
    tone = 'failure'
    message = 'Xem chi tiết đơn để kiểm tra trạng thái giao dịch.'
  } else if (status && status !== 'PENDING') {
    title = statusLabel(status)
    message = 'Xem chi tiết đơn để kiểm tra trạng thái giao dịch.'
  }
  return <PaymentCard title={title} tone={tone} code={code} payment={payment}>
    <p role="status">{message}</p>
    <Button asChild><a href={'/don-hang/' + encodeURIComponent(code)}>Xem đơn hàng</a></Button>
  </PaymentCard>
}
