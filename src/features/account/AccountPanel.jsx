import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { PasswordInput } from '@/components/ui/password-input'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { GoogleSignIn } from './GoogleSignIn'

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập hoặc email.').max(254, 'Tối đa 254 ký tự.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.').max(72, 'Mật khẩu quá dài.'),
})

export function AccountPanel({ session, onSignIn, onSignOut }) {
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting: pending } } = useForm({
    resolver: zodResolver(loginSchema), mode: 'onTouched',
  })
  const signIn = handleSubmit(async (body) => {
    setError('')
    try {
      onSignIn(await api('/auth/login', { method: 'POST', body }))
    } catch (failure) {
      setError(failure.message)
    }
  })
  if (session) return <div className="grid gap-3">
    {session.roles?.includes('CUSTOMER') && <Link className="page-link" to="/tai-khoan">Hồ sơ của tôi</Link>}
    {session.roles?.includes('CUSTOMER') && <Link className="page-link" to="/don-hang">Đơn hàng của tôi</Link>}
    {session.roles?.some((role) => role !== 'CUSTOMER') && <Link className="page-link" to="/van-hanh">Trang vận hành</Link>}
    <Button variant="outline" onClick={onSignOut}>Đăng xuất</Button>
  </div>
  return (
    <div className="grid gap-5">
      <form noValidate onSubmit={signIn} className="grid gap-4">
        <div className="auth-field">
          <label htmlFor="identifier">Tên đăng nhập hoặc email</label>
          <Input id="identifier" {...register('identifier')} autoComplete="username" required
            aria-invalid={Boolean(errors.identifier)} aria-describedby={errors.identifier ? 'identifier-error' : undefined} />
          {errors.identifier && <p id="identifier-error" role="alert" className="field-error">{errors.identifier.message}</p>}
        </div>
        <div className="auth-field">
          <label htmlFor="password">Mật khẩu</label>
          <PasswordInput id="password" {...register('password')} autoComplete="current-password" required
            aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} />
          {errors.password && <p id="password-error" role="alert" className="field-error">{errors.password.message}</p>}
          <Link className="auth-link auth-forgot" to="/quen-mat-khau">Quên mật khẩu?</Link>
        </div>
        {error && <p className="page-error" role="alert">{error}</p>}
        <Button type="submit" disabled={pending}>{pending ? 'Đang đăng nhập…' : 'Đăng nhập'}</Button>
      </form>
      <GoogleSignIn onSignIn={onSignIn} />
      <nav aria-label="Tùy chọn tài khoản" className="auth-links">
        <div className="auth-link-row">
          <span>Bạn mới đến Mùa Xanh?</span>
          <Link className="auth-link" to="/dang-ky">Tạo tài khoản <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <Link className="auth-link" to="/xac-minh-tai-khoan">Xác minh tài khoản</Link>
      </nav>
    </div>
  )
}
