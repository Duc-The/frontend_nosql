import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CreditCard, Package } from 'lucide-react'
import { CustomerEmpty, CustomerSections, CustomerTitle, PanelTitle } from '@/features/account/customer-ui'
import { OrderTimeline } from './OrderTimeline'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ActionMessage, DataState, Form, Grid, Pager, column, field, useAction, useResource } from '@/components/page-kit'
import { dateTime, paymentLabel, price, statusLabel } from '@/lib/format'

export function OrdersPage({ request }) {
  const [page, setPage] = useState(1)
  const orders = useResource(request, '/orders?page=' + page)
  return <>
    <CustomerTitle title="Đơn hàng của tôi" description="Xem lịch sử mua hàng và theo dõi giao hàng." />
    <DataState resource={orders}>{(data) => <>
      {data.items.length ? <div className="customer-order-list">
        {data.items.map((row) => <article className="page-box customer-order" key={row.orderCode}>
          <div className="customer-card-top">
            <PanelTitle title={row.orderCode} icon={Package}><p>{dateTime(row.orderedAt)}</p></PanelTitle>
            <span className="customer-badge" data-status={row.status}>{statusLabel(row.status)}</span>
          </div>
          <div className="customer-order-footer"><div><strong>{price(row.totalAmount)}</strong><p>{statusLabel(row.paymentStatus)}</p></div>
            <Link className="customer-text-link" to={'/don-hang/' + encodeURIComponent(row.orderCode)}>Xem chi tiết <ArrowRight size={16} /></Link>
          </div>
        </article>)}
      </div> : <CustomerEmpty icon={Package} title="Bạn chưa có đơn hàng">
        <Button asChild><Link to="/san-pham">Khám phá sản phẩm</Link></Button>
      </CustomerEmpty>}
      <Pager pagination={data.pagination} setPage={setPage} />
    </>}</DataState>
  </>
}

export function OrderPage({ request, code }) {
  const path = '/orders/' + encodeURIComponent(code)
  const order = useResource(request, path)
  const [selected, setSelected] = useState('overview')
  const action = useAction()
  return <>
    <CustomerTitle title="Chi tiết đơn hàng" description={code}>
      <Link className="customer-text-link" to="/don-hang"><ArrowLeft size={16} aria-hidden="true" /> Tất cả đơn hàng</Link>
    </CustomerTitle>
    <ActionMessage action={action} />
    <DataState resource={order}>{(data) => <>
      <CustomerSections label="Thông tin đơn hàng" items={[
        ['overview', 'Tổng quan'], ['tracking', 'Theo dõi giao hàng'], ['payment', 'Thanh toán'],
        ...(data.order.canCancel ? [['cancel', 'Hủy đơn']] : []),
      ]} active={selected} onChange={setSelected} />
      {['overview', 'tracking'].includes(selected) && <OrderDetails data={data} section={selected} />}
      {selected === 'cancel' && data.order.canCancel && <section className="page-box"><h2>Hủy đơn</h2>
        <p>Có thể hủy đến {dateTime(data.order.cancelUntil)}.</p>
        <Form fields={[field('reason', 'Lý do hủy', { required: true, maxLength: 500 })]} busy={action.busy} label="Hủy đơn"
          submit={(body) => {
            if (window.confirm('Bạn muốn hủy đơn này?')) action.run(async () => {
              await request(path + '/cancel', { method: 'POST', body })
              setSelected('overview'); order.reload()
            }, 'Đã hủy đơn hàng.')
          }} />
      </section>}
    </>}</DataState>
    {selected === 'payment' && order.data && <OrderPayment request={request} code={code} />}
  </>
}

function OrderPayment({ request, code }) {
  const path = '/orders/' + encodeURIComponent(code) + '/payment'
  const payment = useResource(request, path)
  return <section className="page-box"><PanelTitle title="Thanh toán" icon={CreditCard} />
    <DataState resource={payment}>{(data) => <>
      <p>{paymentLabel(data.method)} · {statusLabel(data.status)} · {price(data.amount)}</p>
      {data.paidAt && <p>Đã thu lúc {dateTime(data.paidAt)}</p>}
      {data.method !== 'COD' && data.status === 'PENDING' && (!data.expiresAt || Date.parse(data.expiresAt) > Date.now())
        && <Button asChild className="justify-self-start"><Link to={'/thanh-toan/giao-dich/' + encodeURIComponent(code)}>
          {data.method === 'VIETQR' ? 'Hiện mã VietQR' : 'Thanh toán qua VNPAY'}
        </Link></Button>}
    </>}</DataState>
  </section>
}

export function OrderDetails({ data, section }) {
  const address = data.shippingAddress
  const canReview = section === 'overview' && data.order.status === 'COMPLETED' && data.order.paymentStatus === 'PAID'
  return <>
    {section !== 'tracking' && <section className="page-box"><h2>{data.order.orderCode}</h2>
      <p className="status-text">{statusLabel(data.order.status)}</p>
      {address && <p>{address.receiverName} · {address.receiverPhone}<br />
        {[address.streetAddress, address.ward, address.district, address.province].filter(Boolean).join(', ')}</p>}
      {data.note && <p>Ghi chú: {data.note}</p>}
      {data.cancellationReason && <p>Lý do hủy: {data.cancellationReason}</p>}
      <Grid items={data.items} rowKey={(row) => row.variantId} columns={[column('Sản phẩm', (row) => <span className="order-review-item">{row.productName}
        {canReview && row.productId && <Link className="customer-text-link"
          to={'/don-hang/' + encodeURIComponent(data.order.orderCode) + '/danh-gia/' + encodeURIComponent(row.productId)}>Đánh giá sản phẩm</Link>}
      </span>),
        column('SKU', 'sku'), column('Số lượng', 'quantity'), column('Thành tiền', (row) => price(row.lineTotal))]} />
      <dl className="order-totals"><dt>Tiền hàng</dt><dd>{price(data.subtotalAmount)}</dd>
        <dt>Giảm giá {data.promotionCode || ''}</dt><dd>{price(data.promotionDiscount || 0)}</dd>
        <dt>Phí giao</dt><dd>{price(data.shippingFee)}</dd><dt>Tổng cộng</dt><dd>{price(data.order.totalAmount)}</dd></dl>
    </section>}
    {section !== 'overview' && <OrderTimeline data={data} />}
  </>
}
