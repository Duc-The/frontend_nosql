import { useNavigate, Link } from 'react-router-dom'
import { CreditCard, MapPin, ReceiptText, ShoppingBag, Ticket } from 'lucide-react'
import { CustomerEmpty, CustomerTitle, PanelTitle } from '@/features/account/customer-ui'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ActionMessage, DataState, Form, field, useAction, useResource } from '@/components/page-kit'
import { price, paymentLabel } from '@/lib/format'

const orderMethods = ['COD', 'VIETQR', 'VNPAY']

function attemptKey(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return 'mua-xanh-checkout:' + payload.sub
  } catch {
    return 'mua-xanh-checkout'
  }
}

export function CheckoutPage({ request, session }) {
  const navigate = useNavigate()
  const cart = useResource(request, '/cart')
  const addresses = useResource(request, '/customers/me/addresses')
  const action = useAction()
  const [step, setStep] = useState('delivery')
  const [method, setMethod] = useState('COD')
  const [note, setNote] = useState('')
  const placing = useRef(false)
  const storageKey = attemptKey(session.accessToken)
  const [attempt, setAttempt] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null') } catch { return null }
  })

  function updateCart(path, method, body, afterUpdate) {
    return action.run(async () => {
      await request('/cart' + path, { method, body })
      cart.reload()
      afterUpdate?.()
    })
  }

  async function place(body) {
    if (placing.current) return
    placing.current = true
    await action.run(async () => {
      const key = attempt?.key || crypto.randomUUID()
      const payload = attempt?.body || body
      const next = { key, body: payload }
      sessionStorage.setItem(storageKey, JSON.stringify(next))
      setAttempt(next)
      let order
      try {
        order = await request('/orders', { method: 'POST', body: payload, headers: { 'Idempotency-Key': key } })
      } catch (error) {
        if (error.code === 'ORDER_STORAGE_UNAVAILABLE' || (error.status && error.status < 500)) {
          sessionStorage.removeItem(storageKey)
          setAttempt(null)
        }
        if (error.code === 'ORDER_STORAGE_UNAVAILABLE') {
          throw new Error('Đơn chưa được tạo vì hệ thống đặt hàng tạm thời không khả dụng. Bạn có thể thử lại sau.')
        }
        throw error
      }
      sessionStorage.removeItem(storageKey)
      const route = payload.paymentMethod === 'COD' ? 'xac-nhan' : 'giao-dich'
      navigate('/thanh-toan/' + route + '/' + encodeURIComponent(order.order.orderCode))
    })
    placing.current = false
  }

  return <>
    <CustomerTitle title="Thanh toán" description="Kiểm tra địa chỉ, sản phẩm và phương thức thanh toán trước khi đặt hàng." />
    <ActionMessage action={action} />
    {attempt && <section className="page-box"><PanelTitle title="Đơn đang chờ xác nhận" icon={ReceiptText} />
      <p>Kiểm tra lại yêu cầu trước để tránh tạo hai đơn.</p>
      <Button className="justify-self-start" disabled={action.busy} onClick={() => place(attempt.body)}>Kiểm tra đơn</Button>
    </section>}
    {!attempt && <DataState resource={cart}>{(data) => data.items.length ? <div className="customer-checkout">
      <div className="customer-checkout-fields">
        {step === 'delivery' ? <section className="page-box"><PanelTitle title="Địa chỉ giao hàng" icon={MapPin} />
          <DataState resource={addresses}>{(rows) => rows.length ? <Form
            fields={[field('addressId', 'Địa chỉ nhận hàng', { required: true, options: rows.map((row) => ({
              value: row.id, label: [row.label, row.receiverName, row.streetAddress, row.ward, row.province].filter(Boolean).join(', '),
            })) })]} values={{ addressId: data.addressId || rows.find((row) => row.defaultAddress)?.id }}
            label="Tiếp tục đến thanh toán" busy={action.busy} submit={(body) => updateCart('/delivery-address', 'PUT', body, () => setStep('payment'))} />
            : <p>Bạn chưa có địa chỉ giao hàng.</p>}</DataState>
          <Link to="/tai-khoan/dia-chi" className="customer-text-link">Quản lý địa chỉ</Link>
        </section> : <>
        <section className="page-box">
          <div className="customer-card-top"><PanelTitle title="Phương thức thanh toán" icon={CreditCard} />
            <Button type="button" variant="ghost" disabled={action.busy} onClick={() => setStep('delivery')}>Đổi địa chỉ</Button>
          </div>
          <form id="customer-order-form" className="customer-pay-form" onSubmit={(event) => {
            event.preventDefault()
            if (!attempt && data.canCheckout) place({ paymentMethod: method, note: note || null })
          }}>
            <fieldset disabled={action.busy || Boolean(attempt)} className="customer-methods">
              <legend className="sr-only">Chọn phương thức thanh toán</legend>
              {orderMethods.map((value) => <label key={value}>
                <input type="radio" name="paymentMethod" value={value} checked={method === value} onChange={() => setMethod(value)} />
                <span>{paymentLabel(value)}</span>
              </label>)}
            </fieldset>
            <details className="checkout-optional" open={note ? true : undefined}>
              <summary>Thêm ghi chú</summary>
              <label className="customer-note"><span className="sr-only">Ghi chú đơn hàng</span>
                <textarea maxLength={500} rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
            </details>
          </form>
        </section>
        <details className="page-box checkout-optional" open={data.promotionCode ? true : undefined}>
          <summary><Ticket size={18} aria-hidden="true" /> Mã giảm giá{data.promotionCode ? ' · ' + data.promotionCode : ''}</summary>
          <Form fields={[field('code', 'Mã ưu đãi', { required: true, maxLength: 64 })]} label="Áp dụng"
            values={{ code: data.promotionCode }} busy={action.busy || Boolean(attempt)} submit={(body) => updateCart('/promotion', 'PUT', body)} />
          {data.promotionCode && <Button className="justify-self-start" variant="outline" disabled={action.busy || Boolean(attempt)}
            onClick={() => updateCart('/promotion', 'DELETE')}>Gỡ mã {data.promotionCode}</Button>}
          {data.promotionError && <p className="text-destructive">Mã đã chọn không còn phù hợp với giỏ hàng.</p>}
        </details></>}
      </div>
      <section className="page-box customer-checkout-summary"><PanelTitle title="Tóm tắt đơn hàng" icon={ShoppingBag} />
        <ul className="customer-checkout-items">{data.items.map((item) => <li key={item.variantId}>
          <div><strong>{item.productName || 'Đã ngừng bán'}</strong><small>{item.variantName} × {item.quantity}</small>
            {!item.available && <small className="text-destructive">Cần chỉnh giỏ hàng</small>}</div>
          <strong>{price(item.lineTotal)}</strong>
        </li>)}</ul>
        <dl className="order-totals">
          <dt>Tiền hàng</dt><dd>{price(data.subtotalAmount)}</dd>
          <dt>Giảm giá</dt><dd>{price(data.promotionDiscount || 0)}</dd>
          <dt>Phí giao hàng</dt><dd>{price(data.shippingFee)}</dd>
          <dt>Tổng cộng</dt><dd>{price(data.totalAmount)}</dd>
        </dl>
        {step === 'payment' && <Button type="submit" form="customer-order-form" disabled={action.busy || Boolean(attempt) || !data.canCheckout}>
          {action.busy ? 'Đang xử lý…' : ({ COD: 'Đặt hàng', VIETQR: 'Hiện mã VietQR', VNPAY: 'Thanh toán qua VNPAY' })[method]}
        </Button>}
        {step === 'payment' && !data.canCheckout && <small>Kiểm tra địa chỉ, mã giảm giá và giỏ hàng trước khi đặt.</small>}
      </section>
    </div> : <CustomerEmpty icon={ShoppingBag} title="Giỏ hàng đang trống">
      <Button asChild><Link to="/san-pham">Tiếp tục mua sắm</Link></Button>
    </CustomerEmpty>}</DataState>}
  </>
}
