import { Link } from 'react-router-dom'
import { ArrowRight, Leaf, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductPhoto } from '@/features/catalog/ProductPanel'
import { price } from '@/lib/format'

export function CartPanel({ cart, customer, signedIn, onChange, busy, error, onRetry }) {
  if (!customer) return <CartEmpty title={signedIn ? 'Giỏ hàng dành cho khách hàng' : 'Đăng nhập để xem giỏ hàng'}
    description={signedIn ? 'Dùng tài khoản khách hàng để đặt mua sản phẩm.' : 'Đăng nhập để xem sản phẩm bạn đã thêm và tiếp tục thanh toán.'}
    href={signedIn ? '/san-pham' : '/dang-nhap?next=%2Fgio-hang'} action={signedIn ? 'Xem sản phẩm' : 'Đăng nhập'} />

  return <>
    {error && <div className="page-error cart-error" role="alert">
      <p>{typeof error === 'string' ? error : error.message}</p>
      {onRetry && <Button type="button" variant="outline" onClick={onRetry}>Thử lại</Button>}
    </div>}
    {!cart && !error && <div className="cart-loading" role="status">Đang tải giỏ hàng…</div>}
    {cart && (cart.items.length ? <div className="cart-layout">
      <section className="cart-card cart-items" aria-labelledby="cart-items-title">
        <header><h2 id="cart-items-title">Sản phẩm đã chọn</h2><span>{cart.items.length} quy cách</span></header>
        <ul>{cart.items.map((item) => <CartLine key={item.variantId} item={item} busy={busy} onChange={onChange} />)}</ul>
      </section>
      <CartSummary cart={cart} busy={busy} />
    </div> : <CartEmpty title="Giỏ hàng đang trống" description="Khám phá cửa hàng và chọn sản phẩm bạn muốn mua."
      href="/san-pham" action="Khám phá sản phẩm" />)}
  </>
}

function CartLine({ item, busy, onChange }) {
  const name = item.productName || 'Sản phẩm đã ngừng bán'
  const href = item.slug ? '/san-pham/' + encodeURIComponent(item.slug) : null
  const stock = Math.min(99, Math.floor(Number(item.availableQuantity)))
  const canReduce = item.quantity > 1 && stock > 0
  const image = <ProductPhoto product={{ name, images: item.imageUrl ? [{ url: item.imageUrl }] : [] }} className="cart-thumbnail" />

  return <li className="cart-item">
    {href ? <Link to={href} className="cart-image-link" aria-label={name}>{image}</Link> : image}
    <div className="cart-item-info">
      <h3>{href ? <Link to={href}>{name}</Link> : name}</h3>
      <p>{[item.variantName, item.unitPrice != null ? price(item.unitPrice) + ' / gói' : null].filter(Boolean).join(' · ')}</p>
      {!item.available && <p className="cart-item-warning">{stock > 0 ? `Chỉ còn ${stock} sản phẩm` : 'Hiện không có hàng'}</p>}
      <div className="cart-item-actions">
        <div className="cart-stepper" aria-label={`Số lượng ${name}`}>
          <button type="button" disabled={busy || !canReduce}
            onClick={() => onChange(item.variantId, Math.min(item.quantity - 1, stock))}
            aria-label={`Giảm số lượng ${name}`}><Minus size={16} aria-hidden="true" /></button>
          <span aria-live="polite">{item.quantity}</span>
          <button type="button" disabled={busy || !item.available || item.quantity >= stock}
            onClick={() => onChange(item.variantId, item.quantity + 1)}
            aria-label={`Tăng số lượng ${name}`}><Plus size={16} aria-hidden="true" /></button>
        </div>
        <button type="button" className="cart-remove" disabled={busy} onClick={() => onChange(item.variantId, 0)}
          aria-label={`Xóa ${name} khỏi giỏ`}><Trash2 size={16} aria-hidden="true" /> Xóa</button>
      </div>
    </div>
    <strong className="cart-line-total">{price(item.lineTotal)}</strong>
  </li>
}

function CartSummary({ cart, busy }) {
  const blocked = cart.items.some((item) => !item.available)
  return <section className="cart-card cart-summary" aria-labelledby="cart-summary-title">
    <h2 id="cart-summary-title"><ShoppingBag size={20} aria-hidden="true" /> Tóm tắt đơn hàng</h2>
    <dl>
      <dt>Tiền hàng</dt><dd>{price(cart.subtotalAmount)}</dd>
      {Number(cart.promotionDiscount) > 0 && <><dt>Giảm giá</dt><dd>−{price(cart.promotionDiscount)}</dd></>}
      <dt>Phí giao hàng</dt><dd>{cart.addressId ? price(cart.shippingFee) : 'Chọn địa chỉ khi thanh toán'}</dd>
      <dt>Tổng tạm tính</dt><dd>{price(cart.totalAmount ?? cart.subtotalAmount)}</dd>
    </dl>
    {blocked && <p className="cart-item-warning" role="status">Điều chỉnh hoặc xóa sản phẩm thiếu hàng để tiếp tục.</p>}
    {busy || blocked ? <Button disabled>Tiếp tục thanh toán <ArrowRight size={18} aria-hidden="true" /></Button>
      : <Button asChild><Link to="/thanh-toan">Tiếp tục thanh toán <ArrowRight size={18} aria-hidden="true" /></Link></Button>}
  </section>
}

function CartEmpty({ title, description, href, action }) {
  return <div className="cart-card cart-empty">
    <span className="cart-empty-icon"><Leaf size={27} aria-hidden="true" /></span>
    <h2>{title}</h2><p>{description}</p>
    <Button asChild><Link to={href}>{action}<ArrowRight size={16} aria-hidden="true" /></Link></Button>
  </div>
}
