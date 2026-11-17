import { Check, CircleCheck, ClipboardCheck, MapPin, Package, PackageCheck, ShoppingBag, Truck, X } from 'lucide-react'
import { dateTime, statusLabel } from '@/lib/format'
import './order-tracking.css'

export function OrderTimeline({ data }) {
  const { order, tracking, completedAt, cancelledAt, cancellationReason } = data
  const cancelled = order.status === 'CANCELLED'
  const steps = [
    { status: 'PENDING', label: 'Đã đặt hàng', date: order.orderedAt, icon: ShoppingBag },
    { status: 'CONFIRMED', label: 'Đã xác nhận', date: tracking?.confirmedAt, icon: ClipboardCheck },
    { status: 'PACKING', label: 'Đang đóng gói', date: tracking?.packingStartedAt, icon: Package },
    { status: 'PACKED', label: 'Đã xuất kho', date: tracking?.packedAt, icon: PackageCheck },
    { status: 'SHIPPING', label: 'Đang giao hàng', date: tracking?.shippedAt, icon: Truck },
    { status: 'DELIVERED', label: 'Đã giao hàng', date: tracking?.deliveredAt, icon: MapPin },
    { status: 'COMPLETED', label: 'Hoàn tất', date: completedAt, icon: CircleCheck },
  ]
  const visible = cancelled ? [
    ...steps.filter((step) => step.status === 'PENDING' || step.date),
    { status: 'CANCELLED', label: 'Đơn đã hủy', date: cancelledAt, icon: X, detail: cancellationReason },
  ] : steps
  const current = visible.findIndex((step) => step.status === order.status)

  return <section className="page-box order-tracking">
    <header className="order-tracking-heading">
      <div><h2>Tiến trình đơn hàng</h2><p>{order.orderCode}</p></div>
      <span className="customer-badge" data-status={order.status}>{statusLabel(order.status)}</span>
    </header>
    {(tracking?.carrierName || tracking?.trackingCode) && <dl className="order-shipment">
      {tracking.carrierName && <div><dt>Đơn vị giao hàng</dt><dd>{tracking.carrierName}</dd></div>}
      {tracking.trackingCode && <div><dt>Mã vận đơn</dt><dd>{tracking.trackingCode}</dd></div>}
    </dl>}
    <ol className="order-timeline" aria-label="Các mốc xử lý đơn hàng">
      {visible.map((step, index) => {
        const active = index === current
        const done = !active && (Boolean(step.date) || (current >= 0 && index < current))
        const state = active ? (cancelled ? 'cancelled' : 'current') : done ? 'done' : 'upcoming'
        const Icon = done ? Check : step.icon
        return <li key={step.status} data-state={state} aria-current={active ? 'step' : undefined}>
          <span className="order-timeline-marker"><Icon size={17} aria-hidden="true" /></span>
          <div className="order-timeline-event">
            <div className="order-timeline-label"><strong>{step.label}</strong>
              {active && <small>Hiện tại</small>}</div>
            {step.date && <time dateTime={step.date}>{dateTime(step.date)}</time>}
            {step.detail && <p>{step.detail}</p>}
          </div>
        </li>
      })}
    </ol>
  </section>
}
