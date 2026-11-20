import { Link } from 'react-router-dom'
import { useRef, useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { StoreLayout } from '@/layouts/StoreLayout'
import { useSession } from '@/features/account/use-session'
import { useResource } from '@/components/page-kit'
import { CartPanel } from './CartPanel'
import './cart.css'

export function CartPage() {
  const { session, request } = useSession()
  const customer = Boolean(session?.roles?.includes('CUSTOMER'))
  const cart = useResource(request, customer ? '/cart' : null)
  const [latest, setLatest] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const changing = useRef(false)
  const data = latest || cart.data
  const count = data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  async function change(variantId, quantity) {
    if (changing.current) return
    changing.current = true
    setBusy(true)
    setError('')
    try {
      const path = '/cart/items/' + encodeURIComponent(variantId)
      if (quantity === 0) {
        await request(path, { method: 'DELETE' })
        setLatest(null)
        cart.reload()
      } else {
        setLatest(await request(path, { method: 'PUT', body: { quantity } }))
      }
    } catch (failure) {
      setError(failure.message)
    } finally {
      changing.current = false
      setBusy(false)
    }
  }

  return <StoreLayout cartCount={count}>
    <section className="store-shell cart-page">
      <nav className="cart-breadcrumb" aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Giỏ hàng</span>
      </nav>
      <header className="cart-heading">
        <div><h1>Giỏ hàng</h1>{data && count > 0 && <p>{count} sản phẩm trong giỏ</p>}</div>
        <Link className="cart-continue" to="/san-pham"><ArrowLeft size={16} aria-hidden="true" /> Tiếp tục mua sắm</Link>
      </header>
      <CartPanel cart={data} customer={customer} signedIn={Boolean(session)} busy={busy} error={error || cart.error}
        onRetry={cart.error ? cart.reload : undefined} onChange={change} />
    </section>
  </StoreLayout>
}
