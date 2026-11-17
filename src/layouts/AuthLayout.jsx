import { ArrowLeft, Sprout } from 'lucide-react'

export function AuthLayout({ children }) {
  return <main className="auth-layout">
    <div className="auth-photo" aria-hidden="true">
      <img src="/images/market-basket.png" alt="" />
    </div>
    <div className="auth-side">
      <a href="/" className="wordmark" aria-label="Mùa Xanh, về cửa hàng">
        <Sprout size={25} aria-hidden="true" /> Mùa Xanh.
      </a>
      <div className="auth-content">{children}</div>
      <a className="auth-back" href="/"><ArrowLeft size={16} aria-hidden="true" /> Về cửa hàng</a>
    </div>
  </main>
}
