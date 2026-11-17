import { ArrowRight } from 'lucide-react'
import { PasswordInput } from '@/components/ui/password-input'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { GoogleSignIn } from './GoogleSignIn'

export function AccountPanel({ session, onSignIn, onSignOut }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function signIn(event) {
    event.preventDefault()
    setPending(true)
    setError('')
    const { identifier, password } = Object.fromEntries(new FormData(event.currentTarget))
    try {
      onSignIn(await api('/auth/login', { method: 'POST', body: { identifier, password } }))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setPending(false)
    }
  }
  if (session) return <div className="grid gap-3">
    {session.roles?.includes('CUSTOMER') && <a className="page-link" href="/tai-khoan">Hồ sơ của tôi</a>}
    {session.roles?.includes('CUSTOMER') && <a className="page-link" href="/don-hang">Đơn hàng của tôi</a>}
    {session.roles?.some((role) => role !== 'CUSTOMER') && <a className="page-link" href="/van-hanh">Trang vận hành</a>}
    <Button variant="outline" onClick={onSignOut}>Đăng xuất</Button>
  </div>
  return (
    <div className="grid gap-5">
      <form onSubmit={signIn} className="grid gap-4">
        <div className="auth-field">
          <label htmlFor="identifier">Tên đăng nhập hoặc email</label>
          <Input id="identifier" name="identifier" autoComplete="username" required />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Mật khẩu</label>
          <PasswordInput id="password" name="password" autoComplete="current-password" required />
          <a className="auth-link auth-forgot" href="/quen-mat-khau">Quên mật khẩu?</a>
        </div>
        {error && <p className="page-error" role="alert">{error}</p>}
        <Button type="submit" disabled={pending}>{pending ? 'Đang đăng nhập…' : 'Đăng nhập'}</Button>
      </form>
      <GoogleSignIn onSignIn={onSignIn} />
      <nav aria-label="Tùy chọn tài khoản" className="auth-links">
        <div className="auth-link-row">
          <span>Bạn mới đến Mùa Xanh?</span>
          <a className="auth-link" href="/dang-ky">Tạo tài khoản <ArrowRight size={16} aria-hidden="true" /></a>
        </div>
        <a className="auth-link" href="/xac-minh-tai-khoan">Xác minh tài khoản</a>
      </nav>
    </div>
  )
}
