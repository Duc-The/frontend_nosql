import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { AccountPanel } from './AccountPanel'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { ActionMessage, Form, PageTitle, field, useAction } from '@/components/page-kit'
import { api } from '@/lib/api'
import { postLoginPath } from '@/lib/route-access'

const emailField = field('email', 'Email', { type: 'email', required: true, autoComplete: 'email' })
const passwordField = field('password', 'Mật khẩu', { type: 'password', required: true, minLength: 8, autoComplete: 'new-password' })
const titles = { login: 'Đăng nhập', register: 'Tạo tài khoản', forgot: 'Quên mật khẩu', activate: 'Xác minh tài khoản' }
const send = (path, body) => api('/auth' + path, { method: 'POST', body })

export function AuthPage({ mode, session, save }) {
  const navigate = useNavigate()
  const [step, setStep] = useState('form')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [grant, setGrant] = useState('')
  const action = useAction()
  const register = mode === 'register'
  const activate = mode === 'activate'
  const registrationOtp = register || activate
  function login(next) {
    save(next)
    const target = new URLSearchParams(location.search).get('next')
    navigate(postLoginPath(next, target), { replace: true })
  }
  if (mode === 'login') return <>
    <PageTitle title={titles.login} />
    <p className="auth-intro">Đăng nhập để lưu địa chỉ, xem đơn và tiếp tục mua hàng.</p>
    <section className="page-box"><AccountPanel session={session} onSignIn={login} onSignOut={() => save(null)} /></section>
  </>
  function start(body) {
    return action.run(async () => {
      if (!activate) {
        try {
          await send(register ? '/register' : '/forgot-password', body)
        } catch (error) {
          if (register && error.status === 409) {
            throw new Error('Email hoặc tên đăng nhập đã được dùng. Nếu đã đăng ký nhưng chưa xác minh, hãy chọn Xác minh tài khoản.')
          }
          throw error
        }
      }
      setEmail(body.email)
      setOtp('')
      setStep('otp')
    }, activate ? '' : 'Kiểm tra email để lấy mã xác minh.')
  }
  function verify(event) {
    event.preventDefault()
    return action.run(async () => {
      const data = await send(registrationOtp ? '/register/verify-otp' : '/forgot-password/verify-otp', { email, otp })
      if (registrationOtp) setStep('done')
      else {
        setGrant(data.resetToken)
        setStep('reset')
      }
    })
  }
  return <>
    <PageTitle title={titles[mode]} />
    <p className="auth-intro">{registrationOtp ? 'Dùng email đã đăng ký để xác minh tài khoản Mùa Xanh.' : 'Nhập email của bạn để nhận mã đặt lại mật khẩu.'}</p>
    <section className="page-box">
      <ActionMessage action={action} />
      {step === 'form' && <Form fields={register ? [
        field('fullName', 'Họ và tên', { required: true, maxLength: 100 }),
        field('username', 'Tên đăng nhập', { required: true, pattern: '[A-Za-z0-9_]{3,32}' }),
        emailField, passwordField,
      ] : [emailField]} values={{ email }} busy={action.busy} submit={start}
        label={register ? 'Đăng ký' : activate ? 'Tiếp tục' : 'Gửi mã xác minh'} />}
      {step === 'otp' && <form className="grid gap-4" onSubmit={verify}>
        <label htmlFor="verification-otp">Nhập mã 6 số cho {email}</label>
        <InputOTP id="verification-otp" maxLength={6} value={otp} onChange={setOtp} autoComplete="one-time-code" inputMode="numeric">
          <InputOTPGroup>{Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} />)}</InputOTPGroup>
        </InputOTP>
        <div className="page-actions">
          <Button type="submit" disabled={action.busy || !/^\d{6}$/.test(otp)}>Xác minh</Button>
          <Button type="button" variant="outline" disabled={action.busy} onClick={() =>
            action.run(() => send(registrationOtp ? '/register/resend-otp' : '/forgot-password', { email }), 'Vui lòng kiểm tra email để lấy mã.')}>Gửi lại mã</Button>
          {!register && <Button type="button" variant="ghost" disabled={action.busy} onClick={() => {
            setStep('form'); setOtp('')
          }}>Đổi email</Button>}
        </div>
      </form>}
      {step === 'reset' && <Form fields={[{ ...passwordField, name: 'newPassword', label: 'Mật khẩu mới' }]}
        busy={action.busy} label="Đặt lại mật khẩu" submit={({ newPassword }) => action.run(async () => {
          await send('/reset-password', { resetToken: grant, newPassword })
          setGrant('')
          setStep('done')
        })} />}
      {step === 'done' ? <div className="grid gap-3">
        <p role="status" className="page-message">{registrationOtp ? 'Tài khoản đã được xác minh.' : 'Đã đặt lại mật khẩu.'}</p>
        <Button asChild><Link to="/dang-nhap">Đăng nhập <ArrowRight size={16} aria-hidden="true" /></Link></Button>
      </div> : <nav aria-label="Tùy chọn tài khoản" className="auth-links">
        <div className="auth-link-row">
          {register && <span>Đã có tài khoản?</span>}
          <Link className="auth-link" to="/dang-nhap">{register ? 'Đăng nhập' : 'Về trang đăng nhập'} <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        {register && step === 'form' && <Link className="auth-link" to="/xac-minh-tai-khoan">Xác minh tài khoản</Link>}
      </nav>}
    </section>
  </>
}
