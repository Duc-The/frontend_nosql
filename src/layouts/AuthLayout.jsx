import { Link } from 'react-router-dom'
import { ArrowLeft, Sprout } from 'lucide-react'

export function AuthLayout({ children }) {
  return <main className="auth-layout">
    <div className="auth-photo" aria-hidden="true">
      <img src="/images/market-basket.png" alt="" />
    </div>
    <div className="auth-side">
      <Link to="/" className="wordmark" aria-label="Mùa Xanh, về cửa hàng">
        <Sprout size={25} aria-hidden="true" /> Mùa Xanh.
      </Link>
      <div className="auth-content">{children}</div>
      <Link className="auth-back" to="/"><ArrowLeft size={16} aria-hidden="true" /> Về cửa hàng</Link>
    </div>
  </main>
}
